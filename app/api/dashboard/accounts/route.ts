
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";

const createAccountSchema = z.object({
    accountName: z.string().trim().min(2).max(100),
    accountType: z.enum(["CASH", "BANK", "EWALLET"]),
    accountNumber: z.string().trim().max(100).optional().nullable(),
    provider: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
    employeeId: z.string().uuid().optional().nullable(),
});

function errorResponse(message: string, status = 400) {
    return NextResponse.json(
        { success: false, message },
        { status }
    );
}

export async function GET() {
    try {
        const session = await getEmployeeSession();

        if (!session) {
            return errorResponse("Unauthorized.", 401);
        }

        if (session.mustChangePassword) {
            return errorResponse("Please change your password first.", 403);
        }

        const result = await pool.query(
            `SELECT
                a.id,
                a.business_id,
                a.employee_id,
                a.account_name,
                a.account_type,
                a.account_number,
                a.provider,
                a.description,
                a.is_active,
                a.created_at,
                a.updated_at,
                COALESCE(bal.balance, 0) AS balance,
                e.employee_code,
                e.first_name,
                e.last_name
             FROM cash_accounts a
             LEFT JOIN cash_account_balances bal
                ON bal.account_id = a.id
               AND bal.business_id = a.business_id
             LEFT JOIN employees e
                ON e.id = a.employee_id
               AND e.business_id = a.business_id
             WHERE a.business_id = $1
             ORDER BY a.is_active DESC, a.created_at DESC`,
            [session.businessId]
        );

        return NextResponse.json({
            success: true,
            accounts: result.rows,
        });
    } catch (error) {
        console.error("GET CASH ACCOUNTS ERROR:", error);
        return errorResponse("Unable to load cash accounts.", 500);
    }
}

export async function POST(request: NextRequest) {
    const session = await getEmployeeSession();

    if (!session) {
        return errorResponse("Unauthorized.", 401);
    }

    if (session.mustChangePassword) {
        return errorResponse("Please change your password first.", 403);
    }

    if (session.role !== "OWNER") {
        return errorResponse("Only the business Owner can create cash accounts.", 403);
    }

    const parsed = createAccountSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
        return errorResponse(
            parsed.error.issues[0]?.message ?? "Invalid account information."
        );
    }

    const data = parsed.data;

    const accountNumber = data.accountNumber?.trim() || null;
    const provider = data.provider?.trim() || null;
    const description = data.description?.trim() || null;
    const employeeId = data.employeeId || null;

    if (data.accountType === "BANK" && !accountNumber) {
        return errorResponse("Bank account number is required.");
    }

    if (data.accountType === "EWALLET" && !provider) {
        return errorResponse("E-wallet provider is required.");
    }

    if (employeeId) {
        const employeeResult = await pool.query(
            `SELECT id
             FROM employees
             WHERE id = $1
               AND business_id = $2
               AND role = 'EMPLOYEE'
               AND is_active = TRUE
               AND account_status = 'ACTIVE'
             LIMIT 1`,
            [employeeId, session.businessId]
        );

        if (employeeResult.rowCount !== 1) {
            return errorResponse("Selected employee is invalid or inactive.");
        }
    }

    try {
        const result = await pool.query(
            `INSERT INTO cash_accounts (
                business_id,
                employee_id,
                account_name,
                account_type,
                account_number,
                provider,
                description,
                is_active,
                created_at,
                updated_at
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(), NOW())
             RETURNING
                id,
                business_id,
                employee_id,
                account_name,
                account_type,
                account_number,
                provider,
                description,
                is_active,
                created_at`,
            [
                session.businessId,
                employeeId,
                data.accountName,
                data.accountType,
                accountNumber,
                provider,
                description,
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Cash account created successfully.",
            account: {
                ...result.rows[0],
                balance: "0",
            },
        }, { status: 201 });
    } catch (error) {
        console.error("CREATE CASH ACCOUNT ERROR:", error);
        return errorResponse("Unable to create cash account.", 500);
    }
}
