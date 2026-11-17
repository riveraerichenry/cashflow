
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";
import { createAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const actionSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("APPROVE"),
    }),
    z.object({
        action: z.literal("REJECT"),
        rejectionReason: z.string().trim().min(3).max(1000),
    }),
    z.object({
        action: z.literal("RELEASE"),
    }),
]);

function errorResponse(message: string, status = 400) {
    return NextResponse.json(
        { success: false, message },
        { status }
    );
}

function generateTransactionNo() {
    const date = new Date();

    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("");

    return `CO-${datePart}-${randomUUID()
        .replace(/-/g, "")
        .slice(0, 8)
        .toUpperCase()}`;
}

function getClientIp(request: NextRequest): string | null {
    const forwardedFor = request.headers.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() || null;
    }

    return request.headers.get("x-real-ip")?.trim() || null;
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getEmployeeSession();

    if (!session) {
        return errorResponse("Unauthorized.", 401);
    }

    if (session.mustChangePassword) {
        return errorResponse("Please change your password first.", 403);
    }

    if (session.role !== "OWNER") {
        return errorResponse(
            "Only the business Owner can process withdrawals.",
            403
        );
    }

    const { id } = await context.params;

    if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
        return errorResponse("Invalid withdrawal request ID.");
    }

    const body = await request.json().catch(() => null);
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
        return errorResponse(
            parsed.error.issues[0]?.message || "Invalid action."
        );
    }

    const { action } = parsed.data;
    const ipAddress = getClientIp(request);

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        // =========================================================
        // LOCK WITHDRAWAL REQUEST
        // =========================================================

        const requestResult = await client.query(
            `
            SELECT
                id,
                business_id,
                request_no,
                employee_id,
                account_id,
                amount,
                purpose,
                status,
                approved_by,
                approved_at,
                rejection_reason,
                released_transaction_id
            FROM withdrawal_requests
            WHERE
                id = $1
                AND business_id = $2
            FOR UPDATE
            `,
            [id, session.businessId]
        );

        if (requestResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return errorResponse(
                "Withdrawal request not found.",
                404
            );
        }

        const withdrawal = requestResult.rows[0];

        // =========================================================
        // APPROVE WITHDRAWAL
        // =========================================================

        if (action === "APPROVE") {
            if (withdrawal.status !== "PENDING") {
                await client.query("ROLLBACK");

                return errorResponse(
                    "Only pending requests can be approved."
                );
            }

            // Do not allow an Owner to approve their own request.
            if (withdrawal.employee_id === session.employeeId) {
                await client.query("ROLLBACK");

                return errorResponse(
                    "You cannot approve your own withdrawal request.",
                    403
                );
            }

            // =====================================================
            // VERIFY WITHDRAWAL ACCOUNT STATUS
            // =====================================================

            const accountResult = await client.query(
                `
                SELECT
                    id,
                    account_name,
                    is_active
                FROM cash_accounts
                WHERE
                    id = $1
                    AND business_id = $2
                FOR UPDATE
                `,
                [
                    withdrawal.account_id,
                    session.businessId,
                ]
            );

            if (accountResult.rowCount !== 1) {
                await client.query("ROLLBACK");

                return errorResponse(
                    "The withdrawal account no longer exists.",
                    404
                );
            }

            const withdrawalAccount = accountResult.rows[0];

            if (!withdrawalAccount.is_active) {
                await client.query("ROLLBACK");

                return errorResponse(
                    `Cannot approve this withdrawal because "${withdrawalAccount.account_name}" is inactive. Reactivate the account first.`,
                    409
                );
            }

            // =====================================================
            // UPDATE WITHDRAWAL REQUEST
            // =====================================================

            const updateResult = await client.query(
                `
                UPDATE withdrawal_requests
                SET
                    status = 'APPROVED',
                    approved_by = $1,
                    approved_at = NOW(),
                    rejection_reason = NULL,
                    updated_at = NOW()
                WHERE
                    id = $2
                    AND business_id = $3
                    AND status = 'PENDING'
                `,
                [
                    session.employeeId,
                    id,
                    session.businessId,
                ]
            );

            if (updateResult.rowCount !== 1) {
                throw new Error(
                    "Withdrawal request could not be approved."
                );
            }

            // =====================================================
            // AUDIT LOG: WITHDRAWAL APPROVED
            // =====================================================

            await createAuditLog(client, {
                businessId: session.businessId,
                employeeId: session.employeeId,
                action: "CASH_OUT_APPROVED",
                tableName: "withdrawal_requests",
                recordId: withdrawal.id,

                oldValues: {
                    status: "PENDING",
                },

                newValues: {
                    requestId: withdrawal.id,
                    requestNo: withdrawal.request_no,
                    employeeId: withdrawal.employee_id,
                    accountId: withdrawal.account_id,
                    accountName: withdrawalAccount.account_name,
                    amount: Number(withdrawal.amount).toFixed(2),
                    purpose: withdrawal.purpose,
                    status: "APPROVED",
                    approvedBy: session.employeeId,
                },

                ipAddress,
            });

            await client.query("COMMIT");

            return NextResponse.json({
                success: true,
                message:
                    "Withdrawal request approved. No balance has been deducted yet.",
            });
        }

        // =========================================================
        // REJECT WITHDRAWAL
        // =========================================================

        if (action === "REJECT") {
            if (withdrawal.status !== "PENDING") {
                await client.query("ROLLBACK");

                return errorResponse(
                    "Only pending requests can be rejected."
                );
            }

            if (withdrawal.employee_id === session.employeeId) {
                await client.query("ROLLBACK");

                return errorResponse(
                    "You cannot reject your own withdrawal request.",
                    403
                );
            }

            const rejectionReason = parsed.data.rejectionReason;

            const updateResult = await client.query(
                `
                UPDATE withdrawal_requests
                SET
                    status = 'REJECTED',
                    approved_by = $1,
                    approved_at = NOW(),
                    rejection_reason = $2,
                    updated_at = NOW()
                WHERE
                    id = $3
                    AND business_id = $4
                    AND status = 'PENDING'
                `,
                [
                    session.employeeId,
                    rejectionReason,
                    id,
                    session.businessId,
                ]
            );

            if (updateResult.rowCount !== 1) {
                throw new Error(
                    "Withdrawal request could not be rejected."
                );
            }

            // =====================================================
            // AUDIT LOG: WITHDRAWAL REJECTED
            // =====================================================

            await createAuditLog(client, {
                businessId: session.businessId,
                employeeId: session.employeeId,
                action: "CASH_OUT_REJECTED",
                tableName: "withdrawal_requests",
                recordId: withdrawal.id,

                oldValues: {
                    status: "PENDING",
                },

                newValues: {
                    requestId: withdrawal.id,
                    requestNo: withdrawal.request_no,
                    employeeId: withdrawal.employee_id,
                    accountId: withdrawal.account_id,
                    amount: Number(withdrawal.amount).toFixed(2),
                    purpose: withdrawal.purpose,
                    status: "REJECTED",
                    rejectionReason,
                    rejectedBy: session.employeeId,
                },

                ipAddress,
            });

            await client.query("COMMIT");

            return NextResponse.json({
                success: true,
                message: "Withdrawal request rejected.",
            });
        }

        // =========================================================
        // RELEASE WITHDRAWAL
        // =========================================================

        if (action === "RELEASE") {
            if (withdrawal.status !== "APPROVED") {
                await client.query("ROLLBACK");

                return errorResponse(
                    "Only approved requests can be released."
                );
            }

            if (withdrawal.released_transaction_id) {
                await client.query("ROLLBACK");

                return errorResponse(
                    "This withdrawal has already been released."
                );
            }

            // =====================================================
            // LOCK AND VERIFY ACTIVE CASH ACCOUNT
            // =====================================================

            const accountResult = await client.query(
                `
                SELECT
                    id,
                    account_name,
                    account_type
                FROM cash_accounts
                WHERE
                    id = $1
                    AND business_id = $2
                    AND is_active = TRUE
                FOR UPDATE
                `,
                [
                    withdrawal.account_id,
                    session.businessId,
                ]
            );

            if (accountResult.rowCount === 0) {
                await client.query("ROLLBACK");

                return errorResponse(
                    "The withdrawal account is unavailable or inactive. Reactivate it before releasing this withdrawal.",
                    409
                );
            }

            const account = accountResult.rows[0];

            // =====================================================
            // CHECK ACCOUNT BALANCE
            // =====================================================

            const balanceResult = await client.query(
                `
                SELECT balance
                FROM cash_account_balances
                WHERE
                    account_id = $1
                    AND business_id = $2
                `,
                [
                    withdrawal.account_id,
                    session.businessId,
                ]
            );

            const currentBalance = Number(
                balanceResult.rows[0]?.balance ?? 0
            );

            const withdrawalAmount = Number(withdrawal.amount);

            if (currentBalance < withdrawalAmount) {
                await client.query("ROLLBACK");

                return errorResponse(
                    `Insufficient balance. Available balance: ₱${currentBalance.toFixed(2)}.`
                );
            }

            // =====================================================
            // GENERATE TRANSACTION NUMBER
            // =====================================================

            const transactionNo = generateTransactionNo();

            // =====================================================
            // CREATE POSTED WITHDRAWAL TRANSACTION
            // =====================================================

            const transactionResult = await client.query(
                `
                INSERT INTO cash_transactions (
                    business_id,
                    transaction_no,
                    transaction_type,
                    transaction_date,
                    amount,
                    description,
                    reference_no,
                    status,
                    employee_id,
                    created_by,
                    approved_by,
                    posted_at,
                    created_at,
                    updated_at
                )
                VALUES (
                    $1, $2, 'WITHDRAWAL', NOW(), $3,
                    $4, $5, 'POSTED', $6, $7, $7,
                    NOW(), NOW(), NOW()
                )
                RETURNING
                    id,
                    transaction_no,
                    amount,
                    status,
                    posted_at
                `,
                [
                    session.businessId,
                    transactionNo,
                    withdrawal.amount,
                    withdrawal.purpose,
                    withdrawal.request_no,
                    withdrawal.employee_id,
                    session.employeeId,
                ]
            );

            const transaction = transactionResult.rows[0];

            // =====================================================
            // CREATE OUT LEDGER ENTRY
            // =====================================================

            await client.query(
                `
                INSERT INTO cash_ledger_entries (
                    business_id,
                    transaction_id,
                    account_id,
                    direction,
                    amount,
                    description,
                    created_at
                )
                VALUES (
                    $1, $2, $3, 'OUT', $4, $5, NOW()
                )
                `,
                [
                    session.businessId,
                    transaction.id,
                    withdrawal.account_id,
                    withdrawal.amount,
                    `Withdrawal released: ${withdrawal.request_no}`,
                ]
            );

            // =====================================================
            // UPDATE WITHDRAWAL REQUEST
            // =====================================================

            const updateResult = await client.query(
                `
                UPDATE withdrawal_requests
                SET
                    status = 'RELEASED',
                    released_transaction_id = $1,
                    updated_at = NOW()
                WHERE
                    id = $2
                    AND business_id = $3
                    AND status = 'APPROVED'
                    AND released_transaction_id IS NULL
                `,
                [
                    transaction.id,
                    id,
                    session.businessId,
                ]
            );

            if (updateResult.rowCount !== 1) {
                throw new Error(
                    "Withdrawal request could not be marked as released."
                );
            }

            // =====================================================
            // AUDIT LOG: WITHDRAWAL RELEASED
            // =====================================================

            await createAuditLog(client, {
                businessId: session.businessId,
                employeeId: session.employeeId,
                action: "CASH_OUT_RELEASED",
                tableName: "withdrawal_requests",
                recordId: withdrawal.id,

                oldValues: {
                    status: "APPROVED",
                    releasedTransactionId: null,
                },

                newValues: {
                    requestId: withdrawal.id,
                    requestNo: withdrawal.request_no,
                    employeeId: withdrawal.employee_id,
                    accountId: withdrawal.account_id,
                    accountName: account.account_name,
                    accountType: account.account_type,
                    amount: Number(withdrawal.amount).toFixed(2),
                    purpose: withdrawal.purpose,
                    status: "RELEASED",
                    releasedTransactionId: transaction.id,
                    transactionNo: transaction.transaction_no,
                    transactionType: "WITHDRAWAL",
                    transactionStatus: "POSTED",
                    releasedBy: session.employeeId,
                },

                ipAddress,
            });

            await client.query("COMMIT");

            return NextResponse.json({
                success: true,
                message: "Withdrawal released and posted successfully.",
                transaction: {
                    ...transaction,
                    account_name: account.account_name,
                },
            });
        }

        await client.query("ROLLBACK");

        return errorResponse("Unsupported action.");
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => undefined);
        }

        console.error("Cash Out action error:", error);

        return errorResponse(
            "Failed to process withdrawal. No balance was changed.",
            500
        );
    } finally {
        client?.release();
    }
}
