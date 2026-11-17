
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";
import { createAuditLog } from "@/lib/audit-log";

function errorResponse(message: string, status = 400) {
    return NextResponse.json(
        { success: false, message },
        { status }
    );
}

function getClientIp(request: NextRequest): string | null {
    const forwardedFor = request.headers.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim() || null;
    }

    return request.headers.get("x-real-ip") || null;
}

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    const session = await getEmployeeSession();

    if (!session) {
        return errorResponse("Unauthorized.", 401);
    }

    if (session.mustChangePassword) {
        return errorResponse(
            "Please change your password first.",
            403
        );
    }

    if (session.role !== "OWNER") {
        return errorResponse(
            "Only the business Owner can process remittances.",
            403
        );
    }

    const { id } = await context.params;

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
        return errorResponse("Invalid remittance request ID.");
    }

    let body: {
        action?: string;
        rejectionReason?: string;
    };

    try {
        body = await request.json();
    } catch {
        return errorResponse("Invalid request body.");
    }

    const action = String(body.action || "").toUpperCase();

    if (!["CONFIRM", "REJECT"].includes(action)) {
        return errorResponse("Invalid remittance action.");
    }

    const rejectionReason = String(
        body.rejectionReason || ""
    ).trim();

    if (action === "REJECT" && !rejectionReason) {
        return errorResponse(
            "Please provide a rejection reason."
        );
    }

    if (rejectionReason.length > 500) {
        return errorResponse(
            "Rejection reason cannot exceed 500 characters."
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // =====================================================
        // LOCK REMITTANCE REQUEST
        // =====================================================

        const requestResult = await client.query(
            `
            SELECT *
            FROM remittance_requests
            WHERE
                id = $1
                AND business_id = $2
            FOR UPDATE
            `,
            [id, session.businessId]
        );

        if (requestResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return errorResponse(
                "Remittance request not found.",
                404
            );
        }

        const remittance = requestResult.rows[0];

        if (remittance.status !== "PENDING") {
            await client.query("ROLLBACK");

            return errorResponse(
                `This request has already been processed. Current status: ${remittance.status}.`
            );
        }

        const ipAddress = getClientIp(request);

        // =====================================================
        // REJECT REMITTANCE
        // =====================================================

        if (action === "REJECT") {
            await client.query(
                `
                UPDATE remittance_requests
                SET
                    status = 'REJECTED',
                    confirmed_by = $1,
                    confirmed_at = NOW(),
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

            // AUDIT LOG: REMITTANCE REJECTED

            await createAuditLog(client, {
                businessId: session.businessId,
                employeeId: session.employeeId,
                action: "REMITTANCE_REJECTED",
                tableName: "remittance_requests",
                recordId: remittance.id,

                oldValues: {
                    requestId: remittance.id,
                    requestNo: remittance.request_no,
                    status: "PENDING",
                    amount: remittance.amount,
                    employeeId: remittance.employee_id,
                    sourceAccountId: remittance.source_account_id,
                    destinationAccountId:
                        remittance.destination_account_id,
                },

                newValues: {
                    requestId: remittance.id,
                    requestNo: remittance.request_no,
                    status: "REJECTED",
                    amount: remittance.amount,
                    employeeId: remittance.employee_id,
                    rejectedBy: session.employeeId,
                    rejectionReason,
                },

                ipAddress,
            });

            await client.query("COMMIT");

            return NextResponse.json({
                success: true,
                message: "Remittance request rejected.",
            });
        }

        // =====================================================
        // LOCK BOTH CASH ACCOUNTS
        // =====================================================

        const accountResult = await client.query(
            `
            SELECT
                id,
                account_name,
                account_type,
                employee_id,
                is_active
            FROM cash_accounts
            WHERE
                business_id = $1
                AND id = ANY($2::uuid[])
            ORDER BY id
            FOR UPDATE
            `,
            [
                session.businessId,
                [
                    remittance.source_account_id,
                    remittance.destination_account_id,
                ],
            ]
        );

        if (accountResult.rows.length !== 2) {
            await client.query("ROLLBACK");

            return errorResponse(
                "Source or destination account no longer exists."
            );
        }

        const source = accountResult.rows.find(
            (account: any) =>
                account.id === remittance.source_account_id
        );

        const destination = accountResult.rows.find(
            (account: any) =>
                account.id === remittance.destination_account_id
        );

        if (!source || !destination) {
            await client.query("ROLLBACK");

            return errorResponse("Invalid remittance accounts.");
        }

        if (!source.is_active || !destination.is_active) {
            await client.query("ROLLBACK");

            return errorResponse(
                "Both accounts must be active to confirm this remittance."
            );
        }

        if (source.employee_id !== remittance.employee_id) {
            await client.query("ROLLBACK");

            return errorResponse(
                "The source account is no longer assigned to the requesting employee."
            );
        }

        if (destination.employee_id !== null) {
            await client.query("ROLLBACK");

            return errorResponse(
                "The destination account must remain a shared business account."
            );
        }

        // =====================================================
        // GET SOURCE AND DESTINATION BALANCES
        // =====================================================

        const balanceResult = await client.query(
            `
            SELECT
                account_id,
                balance
            FROM cash_account_balances
            WHERE
                business_id = $1
                AND account_id = ANY($2::uuid[])
            `,
            [
                session.businessId,
                [
                    remittance.source_account_id,
                    remittance.destination_account_id,
                ],
            ]
        );

        const sourceBalance = Number(
            balanceResult.rows.find(
                (row: any) =>
                    row.account_id === remittance.source_account_id
            )?.balance || 0
        );

        const destinationBalance = Number(
            balanceResult.rows.find(
                (row: any) =>
                    row.account_id === remittance.destination_account_id
            )?.balance || 0
        );

        const amount = Number(remittance.amount);

        if (sourceBalance < amount) {
            await client.query("ROLLBACK");

            return errorResponse(
                `Insufficient source balance. Available: ${sourceBalance.toFixed(2)}. Required: ${amount.toFixed(2)}.`
            );
        }

        // =====================================================
        // CREATE POSTED REMITTANCE TRANSACTION
        // =====================================================

        const transactionNo =
            `RM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID()
                .replace(/-/g, "")
                .slice(0, 8)
                .toUpperCase()}`;

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
                posted_at
            )
            VALUES (
                $1,
                $2,
                'REMITTANCE',
                NOW(),
                $3,
                $4,
                $5,
                'POSTED',
                $6,
                $7,
                $7,
                NOW()
            )
            RETURNING id, transaction_no
            `,
            [
                session.businessId,
                transactionNo,
                amount,
                `Employee remittance: ${remittance.request_no}`,
                remittance.reference_no,
                remittance.employee_id,
                session.employeeId,
            ]
        );

        const transactionId = transactionResult.rows[0].id;

        // =====================================================
        // SOURCE ACCOUNT: OUT
        // =====================================================

        await client.query(
            `
            INSERT INTO cash_ledger_entries (
                business_id,
                transaction_id,
                account_id,
                direction,
                amount,
                description
            )
            VALUES ($1, $2, $3, 'OUT', $4, $5)
            `,
            [
                session.businessId,
                transactionId,
                remittance.source_account_id,
                amount,
                `Remittance received by ${destination.account_name}`,
            ]
        );

        // =====================================================
        // DESTINATION ACCOUNT: IN
        // =====================================================

        await client.query(
            `
            INSERT INTO cash_ledger_entries (
                business_id,
                transaction_id,
                account_id,
                direction,
                amount,
                description
            )
            VALUES ($1, $2, $3, 'IN', $4, $5)
            `,
            [
                session.businessId,
                transactionId,
                remittance.destination_account_id,
                amount,
                `Remittance from ${source.account_name}`,
            ]
        );

        // =====================================================
        // MARK REQUEST AS RECEIVED
        // =====================================================

        const updateResult = await client.query(
            `
            UPDATE remittance_requests
            SET
                status = 'RECEIVED',
                confirmed_by = $1,
                confirmed_at = NOW(),
                transaction_id = $2,
                updated_at = NOW()
            WHERE
                id = $3
                AND business_id = $4
                AND status = 'PENDING'
            RETURNING id
            `,
            [
                session.employeeId,
                transactionId,
                id,
                session.businessId,
            ]
        );

        if (updateResult.rows.length === 0) {
            throw new Error(
                "Remittance request could not be updated."
            );
        }

        // =====================================================
        // AUDIT LOG: REMITTANCE CONFIRMED
        // =====================================================

        await createAuditLog(client, {
            businessId: session.businessId,
            employeeId: session.employeeId,
            action: "REMITTANCE_CONFIRMED",
            tableName: "remittance_requests",
            recordId: remittance.id,

            oldValues: {
                requestId: remittance.id,
                requestNo: remittance.request_no,
                status: "PENDING",
                amount: remittance.amount,
                employeeId: remittance.employee_id,

                sourceAccountId: source.id,
                sourceAccountName: source.account_name,
                sourceAccountType: source.account_type,
                sourceBalance: sourceBalance.toFixed(2),

                destinationAccountId: destination.id,
                destinationAccountName: destination.account_name,
                destinationAccountType: destination.account_type,
                destinationBalance:
                    destinationBalance.toFixed(2),
            },

            newValues: {
                requestId: remittance.id,
                requestNo: remittance.request_no,
                status: "RECEIVED",
                amount: amount.toFixed(2),

                transactionId,
                transactionNo:
                    transactionResult.rows[0].transaction_no,
                transactionType: "REMITTANCE",
                transactionStatus: "POSTED",

                employeeId: remittance.employee_id,
                confirmedBy: session.employeeId,

                sourceAccountId: source.id,
                sourceAccountName: source.account_name,
                sourceAccountType: source.account_type,
                sourceBalanceBefore: sourceBalance.toFixed(2),
                sourceBalanceAfter:
                    (sourceBalance - amount).toFixed(2),

                destinationAccountId: destination.id,
                destinationAccountName: destination.account_name,
                destinationAccountType: destination.account_type,
                destinationBalanceBefore:
                    destinationBalance.toFixed(2),
                destinationBalanceAfter:
                    (destinationBalance + amount).toFixed(2),
            },

            ipAddress,
        });

        // =====================================================
        // COMMIT
        // =====================================================

        await client.query("COMMIT");

        return NextResponse.json({
            success: true,
            message: "Remittance confirmed and posted successfully.",
            transaction: {
                id: transactionId,
                transactionNo:
                    transactionResult.rows[0].transaction_no,
                amount,
                status: "POSTED",
            },
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "PROCESS REMITTANCE ERROR:",
            error
        );

        return errorResponse(
            "Failed to process remittance request.",
            500
        );

    } finally {
        client.release();
    }
}
