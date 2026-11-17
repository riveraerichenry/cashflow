
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";
import { createAuditLog } from "@/lib/audit-log";
import { z } from "zod";

// ============================================================
// VALIDATION
// ============================================================

const cashInSchema = z.object({
    accountId: z.string().uuid("Invalid cash account."),
    sourceName: z.string().trim().min(1, "Source name is required.").max(150),
    amount: z.coerce.number().positive("Amount must be greater than zero.").max(999999999999),
    referenceNo: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().max(1000).optional().nullable(),
    transactionDate: z.string().optional().nullable(),
});

// ============================================================
// RESPONSE
// ============================================================

function errorResponse(message: string, status = 400) {
    return NextResponse.json(
        { success: false, message },
        { status }
    );
}

// ============================================================
// TRANSACTION NUMBER
// ============================================================

function generateTransactionNo() {
    const date = new Date();

    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("");

    const randomPart = randomUUID()
        .replace(/-/g, "")
        .slice(0, 8)
        .toUpperCase();

    return `CI-${datePart}-${randomPart}`;
}

// ============================================================
// GET CASH IN TRANSACTIONS
// ============================================================

export async function GET() {
    let session;

    try {
        session = await getEmployeeSession();
    } catch (error) {
        console.error("Cash In session error:", error);

        return errorResponse(
            "Unable to verify your session.",
            500
        );
    }

    if (!session) {
        return errorResponse(
            "Unauthorized. Please log in.",
            401
        );
    }

    if (session.mustChangePassword) {
        return errorResponse(
            "Please change your password first.",
            403
        );
    }

    try {
        const result = await pool.query(
            `
            SELECT
                ct.id,
                ct.transaction_no,
                ct.transaction_date,
                ct.transaction_type,
                ct.source_name,
                ct.amount,
                ct.reference_no,
                ct.description,
                ct.status,
                ct.posted_at,
                ca.account_name,
                ca.account_type,
                e.first_name,
                e.last_name
            FROM cash_transactions ct

            LEFT JOIN cash_ledger_entries cle
                ON cle.transaction_id = ct.id
                AND cle.business_id = ct.business_id

            LEFT JOIN cash_accounts ca
                ON ca.id = cle.account_id
                AND ca.business_id = ct.business_id

            LEFT JOIN employees e
                ON e.id = ct.employee_id
                AND e.business_id = ct.business_id

            WHERE
                ct.business_id = $1
                AND ct.transaction_type = 'CASH_IN'

            ORDER BY ct.created_at DESC

            LIMIT 100
            `,
            [session.businessId]
        );

        return NextResponse.json({
            success: true,
            transactions: result.rows,
        });

    } catch (error) {
        console.error("Cash In GET error:", error);

        return errorResponse(
            "Failed to retrieve Cash In transactions.",
            500
        );
    }
}

// ============================================================
// POST CASH IN
// ============================================================

export async function POST(request: NextRequest) {

    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    let session;

    try {
        session = await getEmployeeSession();
    } catch (error) {
        console.error("Cash In session error:", error);

        return errorResponse(
            "Unable to verify your session.",
            500
        );
    }

    if (!session) {
        return errorResponse(
            "Unauthorized. Please log in.",
            401
        );
    }

    if (session.mustChangePassword) {
        return errorResponse(
            "Please change your password first.",
            403
        );
    }

    // --------------------------------------------------------
    // VALIDATE REQUEST
    // --------------------------------------------------------

    const body = await request.json().catch(() => null);

    const parsed = cashInSchema.safeParse(body);

    if (!parsed.success) {
        return errorResponse(
            parsed.error.issues[0]?.message ||
            "Invalid Cash In details."
        );
    }

    const {
        accountId,
        sourceName,
        amount,
        referenceNo,
        description,
        transactionDate,
    } = parsed.data;

    if (
        !Number.isFinite(amount) ||
        Math.round(amount * 100) !== amount * 100
    ) {
        return errorResponse(
            "Amount must have no more than two decimal places."
        );
    }

    // --------------------------------------------------------
    // CLIENT IP
    // --------------------------------------------------------

    const forwardedFor =
        request.headers.get("x-forwarded-for");

    const ipAddress =
        forwardedFor?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        null;

    // --------------------------------------------------------
    // DATABASE TRANSACTION
    // --------------------------------------------------------

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        // ----------------------------------------------------
        // VERIFY CASH ACCOUNT
        // ----------------------------------------------------

        const accountResult = await client.query(
            `
            SELECT
                id,
                account_name,
                account_type,
                employee_id
            FROM cash_accounts
            WHERE
                id = $1
                AND business_id = $2
                AND is_active = TRUE
            FOR UPDATE
            `,
            [
                accountId,
                session.businessId,
            ]
        );

        if (accountResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return errorResponse(
                "The selected cash account is unavailable."
            );
        }

        const account = accountResult.rows[0];

        // ----------------------------------------------------
        // VERIFY ACCOUNT PERMISSION
        // ----------------------------------------------------

        if (
            account.employee_id &&
            account.employee_id !== session.employeeId &&
            !["OWNER", "ADMIN"].includes(session.role)
        ) {
            await client.query("ROLLBACK");

            return errorResponse(
                "You are not authorized to use this employee cash account.",
                403
            );
        }

        // ----------------------------------------------------
        // GENERATE TRANSACTION NUMBER
        // ----------------------------------------------------

        const transactionNo = generateTransactionNo();

        // ----------------------------------------------------
        // CREATE CASH TRANSACTION
        // ----------------------------------------------------

        const transactionResult = await client.query(
            `
            INSERT INTO cash_transactions (
                business_id,
                transaction_no,
                transaction_type,
                transaction_date,
                amount,
                source_name,
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
                'CASH_IN',
                COALESCE($3::date, CURRENT_DATE),
                $4,
                $5,
                $6,
                $7,
                'POSTED',
                $8,
                $8,
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
                status,
                posted_at
            `,
            [
                session.businessId,
                transactionNo,
                transactionDate || null,
                amount.toFixed(2),
                sourceName,
                description || null,
                referenceNo || null,
                session.employeeId,
            ]
        );

        const transaction = transactionResult.rows[0];

        // ----------------------------------------------------
        // CREATE CASH LEDGER ENTRY
        // ----------------------------------------------------

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
                transaction.id,
                accountId,
                amount.toFixed(2),
                `Cash In from ${sourceName}`,
            ]
        );

        // ====================================================
        // AUDIT LOG
        // ====================================================

        await createAuditLog(client, {
            businessId: session.businessId,
            employeeId: session.employeeId,

            action: "CASH_IN_POSTED",

            tableName: "cash_transactions",

            recordId: transaction.id,

            oldValues: null,

            newValues: {
                transactionId: transaction.id,
                transactionNo: transaction.transaction_no,
                transactionType: "CASH_IN",
                amount: amount.toFixed(2),
                sourceName,
                referenceNo: referenceNo || null,
                description: description || null,
                accountId,
                accountName: account.account_name,
                accountType: account.account_type,
                status: "POSTED",
            },

            ipAddress,
        });

        // ----------------------------------------------------
        // COMMIT
        // ----------------------------------------------------

        await client.query("COMMIT");

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return NextResponse.json(
            {
                success: true,

                message:
                    "Cash In transaction posted successfully.",

                transaction: {
                    ...transaction,
                    source_name: sourceName,
                    account_id: accountId,
                    account_name: account.account_name,
                },
            },
            { status: 201 }
        );

    } catch (error) {

        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Cash In rollback error:",
                    rollbackError
                );
            }
        }

        console.error("Cash In POST error:", error);

        return errorResponse(
            "Failed to post Cash In transaction. No balance was changed.",
            500
        );

    } finally {
        client?.release();
    }
}
