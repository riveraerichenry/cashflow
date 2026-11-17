
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";
import { createAuditLog } from "@/lib/audit-log";

const transferSchema = z.object({
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.coerce.number().positive().finite(),
    transactionDate: z.string().optional(),
    referenceNo: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
});

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

    const randomPart = randomBytes(4)
        .toString("hex")
        .toUpperCase();

    return `TR-${datePart}-${randomPart}`;
}

function getClientIp(request: NextRequest): string | null {
    const forwardedFor = request.headers.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() || null;
    }

    return request.headers.get("x-real-ip")?.trim() || null;
}

// ================================================================
// GET TRANSFERS
// ================================================================

export async function GET(request: NextRequest) {
    try {
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

        const result = await pool.query(
            `
            SELECT
                t.id,
                t.transaction_no,
                t.transaction_date,
                t.amount,
                t.reference_no,
                t.description,
                t.status,
                t.created_at,

                source.id AS from_account_id,
                source.account_name AS from_account_name,
                source.account_type AS from_account_type,

                destination.id AS to_account_id,
                destination.account_name AS to_account_name,
                destination.account_type AS to_account_type,

                e.first_name || ' ' || e.last_name AS created_by_name

            FROM cash_transactions t

            INNER JOIN cash_ledger_entries source_entry
                ON source_entry.transaction_id = t.id
                AND source_entry.business_id = t.business_id
                AND UPPER(source_entry.direction) = 'OUT'

            INNER JOIN cash_ledger_entries destination_entry
                ON destination_entry.transaction_id = t.id
                AND destination_entry.business_id = t.business_id
                AND UPPER(destination_entry.direction) = 'IN'

            INNER JOIN cash_accounts source
                ON source.id = source_entry.account_id
                AND source.business_id = t.business_id

            INNER JOIN cash_accounts destination
                ON destination.id = destination_entry.account_id
                AND destination.business_id = t.business_id

            LEFT JOIN employees e
                ON e.id = t.created_by
                AND e.business_id = t.business_id

            WHERE
                t.business_id = $1
                AND t.transaction_type = 'TRANSFER'
                AND t.status = 'POSTED'

            ORDER BY
                t.transaction_date DESC,
                t.created_at DESC

            LIMIT 200
            `,
            [session.businessId]
        );

        return NextResponse.json({
            success: true,
            transfers: result.rows.map((row) => ({
                id: row.id,
                transactionNo: row.transaction_no,
                transactionDate: row.transaction_date,
                amount: Number(row.amount),
                referenceNo: row.reference_no,
                description: row.description,
                status: row.status,
                createdAt: row.created_at,
                fromAccountId: row.from_account_id,
                fromAccountName: row.from_account_name,
                fromAccountType: row.from_account_type,
                toAccountId: row.to_account_id,
                toAccountName: row.to_account_name,
                toAccountType: row.to_account_type,
                createdByName: row.created_by_name || "System",
            })),
        });

    } catch (error) {
        console.error("GET TRANSFERS ERROR:", error);

        return errorResponse(
            "Failed to retrieve transfers.",
            500
        );
    }
}

// ================================================================
// POST TRANSFER
// ================================================================

export async function POST(request: NextRequest) {
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

    // Only the business Owner can transfer funds.
    if (session.role !== "OWNER") {
        return errorResponse(
            "Only the business Owner can perform account transfers.",
            403
        );
    }

    const body = await request.json().catch(() => null);

    const parsed = transferSchema.safeParse(body);

    if (!parsed.success) {
        return errorResponse(
            parsed.error.issues[0]?.message ||
            "Invalid transfer information."
        );
    }

    const {
        fromAccountId,
        toAccountId,
        amount,
        transactionDate,
        referenceNo,
        description,
    } = parsed.data;

    if (fromAccountId === toAccountId) {
        return errorResponse(
            "Source and destination accounts must be different."
        );
    }

    if (
        !Number.isFinite(amount) ||
        Math.round(amount * 100) !== amount * 100
    ) {
        return errorResponse(
            "Transfer amount must have no more than two decimal places."
        );
    }

    if (
        transactionDate &&
        !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)
    ) {
        return errorResponse("Invalid transaction date.");
    }

    const ipAddress = getClientIp(request);

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        /*
        ================================================================
        LOCK BOTH ACCOUNTS

        Consistent ordering reduces deadlock risk when two transfers
        involve the same accounts.
        ================================================================
        */

        const accountIds = [
            fromAccountId,
            toAccountId,
        ].sort();

        const accountResult = await client.query(
            `
            SELECT
                id,
                account_name,
                account_type,
                is_active,
                employee_id

            FROM cash_accounts

            WHERE
                business_id = $1
                AND id = ANY($2::uuid[])

            ORDER BY id

            FOR UPDATE
            `,
            [
                session.businessId,
                accountIds,
            ]
        );

        if (accountResult.rows.length !== 2) {
            await client.query("ROLLBACK");

            return errorResponse(
                "One or both selected accounts do not exist in your business."
            );
        }

        const sourceAccount = accountResult.rows.find(
            (account) => account.id === fromAccountId
        );

        const destinationAccount = accountResult.rows.find(
            (account) => account.id === toAccountId
        );

        if (!sourceAccount || !destinationAccount) {
            await client.query("ROLLBACK");

            return errorResponse(
                "Invalid source or destination account."
            );
        }

        if (
            !sourceAccount.is_active ||
            !destinationAccount.is_active
        ) {
            await client.query("ROLLBACK");

            return errorResponse(
                "Both accounts must be active."
            );
        }

        /*
        ================================================================
        CHECK SOURCE BALANCE

        Both account rows are locked before checking the balance.
        ================================================================
        */

        const balanceResult = await client.query(
            `
            SELECT balance

            FROM cash_account_balances

            WHERE
                business_id = $1
                AND account_id = $2
            `,
            [
                session.businessId,
                fromAccountId,
            ]
        );

        const availableBalance = Number(
            balanceResult.rows[0]?.balance || 0
        );

        if (availableBalance < amount) {
            await client.query("ROLLBACK");

            return errorResponse(
                `Insufficient balance. Available balance is ₱${availableBalance.toLocaleString(
                    "en-PH",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                )}.`
            );
        }

        /*
        ================================================================
        CREATE TRANSFER TRANSACTION
        ================================================================
        */

        const transactionNo = generateTransactionNo();

        const transactionDescription =
            description?.trim() ||
            `Transfer from ${sourceAccount.account_name} to ${destinationAccount.account_name}`;

        const cleanReferenceNo = referenceNo?.trim() || null;

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
                $1,
                $2,
                'TRANSFER',
                COALESCE($3::date::timestamptz, NOW()),
                $4,
                $5,
                $6,
                'POSTED',
                $7,
                $7,
                NULL,
                NOW(),
                NOW(),
                NOW()
            )
            RETURNING
                id,
                transaction_no,
                transaction_date,
                amount,
                status
            `,
            [
                session.businessId,
                transactionNo,
                transactionDate || null,
                amount.toFixed(2),
                transactionDescription,
                cleanReferenceNo,
                session.employeeId,
            ]
        );

        const transaction = transactionResult.rows[0];
        const transactionId = transaction.id;

        /*
        ================================================================
        LEDGER ENTRY 1: SOURCE ACCOUNT OUT
        ================================================================
        */

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
                $1,
                $2,
                $3,
                'OUT',
                $4,
                $5,
                NOW()
            )
            `,
            [
                session.businessId,
                transactionId,
                fromAccountId,
                amount.toFixed(2),
                `Transfer to ${destinationAccount.account_name}`,
            ]
        );

        /*
        ================================================================
        LEDGER ENTRY 2: DESTINATION ACCOUNT IN
        ================================================================
        */

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
                $1,
                $2,
                $3,
                'IN',
                $4,
                $5,
                NOW()
            )
            `,
            [
                session.businessId,
                transactionId,
                toAccountId,
                amount.toFixed(2),
                `Transfer from ${sourceAccount.account_name}`,
            ]
        );

        /*
        ================================================================
        AUDIT LOG: TRANSFER POSTED

        This audit entry is part of the same transaction.
        If audit logging fails, the transfer is rolled back.
        ================================================================
        */

        await createAuditLog(client, {
            businessId: session.businessId,
            employeeId: session.employeeId,
            action: "TRANSFER_POSTED",
            tableName: "cash_transactions",
            recordId: transactionId,

            oldValues: {
                sourceAccountId: fromAccountId,
                sourceAccountName: sourceAccount.account_name,
                sourceAccountType: sourceAccount.account_type,
                sourceBalanceBefore: availableBalance.toFixed(2),
                destinationAccountId: toAccountId,
                destinationAccountName: destinationAccount.account_name,
                destinationAccountType: destinationAccount.account_type,
                transactionStatus: null,
            },

            newValues: {
                transactionId,
                transactionNo,
                transactionType: "TRANSFER",
                transactionDate: transaction.transaction_date,
                amount: amount.toFixed(2),

                sourceAccountId: fromAccountId,
                sourceAccountName: sourceAccount.account_name,
                sourceAccountType: sourceAccount.account_type,

                destinationAccountId: toAccountId,
                destinationAccountName: destinationAccount.account_name,
                destinationAccountType: destinationAccount.account_type,

                referenceNo: cleanReferenceNo,
                description: transactionDescription,

                status: "POSTED",
                createdBy: session.employeeId,
            },

            ipAddress,
        });

        /*
        ================================================================
        COMMIT
        ================================================================
        */

        await client.query("COMMIT");

        return NextResponse.json({
            success: true,
            message: "Account transfer completed successfully.",
            transfer: {
                id: transactionId,
                transactionNo,
                amount,
                fromAccountId,
                fromAccountName: sourceAccount.account_name,
                toAccountId,
                toAccountName: destinationAccount.account_name,
                status: "POSTED",
            },
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => undefined);
        }

        console.error("POST TRANSFER ERROR:", error);

        const dbError = error as {
            code?: string;
            constraint?: string;
        };

        if (dbError.code === "23505") {
            return errorResponse(
                "Duplicate transaction number. Please try again.",
                409
            );
        }

        return errorResponse(
            "Failed to process account transfer.",
            500
        );

    } finally {
        client?.release();
    }
}
