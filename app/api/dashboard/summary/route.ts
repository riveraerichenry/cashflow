
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";

export async function GET() {
    try {
        const session = await getEmployeeSession();

        if (!session) {
            return NextResponse.json(
                { success: false, message: "Unauthorized." },
                { status: 401 }
            );
        }

        if (session.mustChangePassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You must change your password first.",
                },
                { status: 403 }
            );
        }

        const businessId = session.businessId;

        // 1. Business summary
        const summaryResult = await pool.query(
            `SELECT
                COALESCE((
                    SELECT SUM(balance)
                    FROM cash_account_balances
                    WHERE business_id = $1
                      AND is_active = TRUE
                ), 0) AS total_balance,

                COALESCE((
                    SELECT SUM(amount)
                    FROM cash_transactions
                    WHERE business_id = $1
                      AND status = 'POSTED'
                      AND transaction_type = 'CASH_IN'
                ), 0) AS total_cash_in,

                COALESCE((
                    SELECT SUM(amount)
                    FROM cash_transactions
                    WHERE business_id = $1
                      AND status = 'POSTED'
                      AND transaction_type = 'WITHDRAWAL'
                ), 0) AS total_cash_out,

                (
                    SELECT COUNT(*)
                    FROM employees
                    WHERE business_id = $1
                      AND role = 'EMPLOYEE'
                      AND is_active = TRUE
                      AND account_status = 'ACTIVE'
                ) AS active_employees`,
            [businessId]
        );

        // 2. Recent posted transactions
        const transactionsResult = await pool.query(
            `SELECT
                t.id,
                t.transaction_no,
                t.transaction_type,
                t.transaction_date,
                t.amount,
                t.description,
                t.reference_no,
                t.status,
                e.first_name,
                e.last_name
             FROM cash_transactions t
             LEFT JOIN employees e
                ON e.id = t.employee_id
               AND e.business_id = t.business_id
             WHERE t.business_id = $1
               AND t.status = 'POSTED'
             ORDER BY
                COALESCE(t.posted_at, t.transaction_date, t.created_at) DESC
             LIMIT 10`,
            [businessId]
        );

        // 3. Employee cash balances
        const employeeBalancesResult = await pool.query(
            `SELECT
                e.id AS employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                COALESCE(SUM(b.balance), 0) AS balance
             FROM employees e
             LEFT JOIN cash_account_balances b
                ON b.employee_id = e.id
               AND b.business_id = e.business_id
               AND b.is_active = TRUE
             WHERE e.business_id = $1
               AND e.role = 'EMPLOYEE'
               AND e.is_active = TRUE
               AND e.account_status = 'ACTIVE'
             GROUP BY
                e.id,
                e.employee_code,
                e.first_name,
                e.last_name
             ORDER BY e.first_name, e.last_name
             LIMIT 10`,
            [businessId]
        );

        return NextResponse.json({
            success: true,
            summary: summaryResult.rows[0],
            transactions: transactionsResult.rows,
            employeeBalances: employeeBalancesResult.rows,
        });
    } catch (error) {
        console.error("DASHBOARD SUMMARY ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to load dashboard information.",
            },
            { status: 500 }
        );
    }
}
