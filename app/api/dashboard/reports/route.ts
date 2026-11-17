
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";

function errorResponse(message: string, status = 400) {
    return NextResponse.json(
        { success: false, message },
        { status }
    );
}

function isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

function getDefaultDates() {
    const now = new Date();

    const dateTo = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const dateFrom = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        "01",
    ].join("-");

    return { dateFrom, dateTo };
}

export async function GET(request: NextRequest) {
    const session = await getEmployeeSession();

    if (!session) {
        return errorResponse("Unauthorized.", 401);
    }

    if (session.mustChangePassword) {
        return errorResponse("Please change your password first.", 403);
    }

    if (session.role !== "OWNER") {
        return errorResponse(
            "Only the business Owner can access financial reports.",
            403
        );
    }

    const defaults = getDefaultDates();

    const dateFrom =
        request.nextUrl.searchParams.get("dateFrom") ||
        defaults.dateFrom;

    const dateTo =
        request.nextUrl.searchParams.get("dateTo") ||
        defaults.dateTo;

    if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
        return errorResponse("Invalid report date. Use YYYY-MM-DD.");
    }

    if (dateFrom > dateTo) {
        return errorResponse(
            "Start date cannot be later than end date."
        );
    }

    const businessId = session.businessId;

    try {
        const [
            summaryResult,
            dailyResult,
            transactionTypesResult,
            accountBalancesResult,
            employeeBalancesResult,
        ] = await Promise.all([
            // Period summary
            pool.query(
                `
                SELECT
                    COUNT(*)::int AS transaction_count,

                    COALESCE(
                        SUM(amount) FILTER (
                            WHERE transaction_type = 'CASH_IN'
                        ),
                        0
                    ) AS total_cash_in,

                    COALESCE(
                        SUM(amount) FILTER (
                            WHERE transaction_type = 'WITHDRAWAL'
                        ),
                        0
                    ) AS total_cash_out,

                    COALESCE(
                        SUM(amount) FILTER (
                            WHERE transaction_type = 'TRANSFER'
                        ),
                        0
                    ) AS total_transfers,

                    COUNT(*) FILTER (
                        WHERE transaction_type = 'CASH_IN'
                    )::int AS cash_in_count,

                    COUNT(*) FILTER (
                        WHERE transaction_type = 'WITHDRAWAL'
                    )::int AS cash_out_count,

                    COUNT(*) FILTER (
                        WHERE transaction_type = 'TRANSFER'
                    )::int AS transfer_count

                FROM cash_transactions

                WHERE
                    business_id = $1
                    AND status = 'POSTED'
                    AND transaction_date::date BETWEEN $2::date AND $3::date
                `,
                [businessId, dateFrom, dateTo]
            ),

            // Daily cash movement
            pool.query(
                `
                SELECT
                    TO_CHAR(transaction_date::date, 'YYYY-MM-DD') AS report_date,

                    COALESCE(
                        SUM(amount) FILTER (
                            WHERE transaction_type = 'CASH_IN'
                        ),
                        0
                    ) AS cash_in,

                    COALESCE(
                        SUM(amount) FILTER (
                            WHERE transaction_type = 'WITHDRAWAL'
                        ),
                        0
                    ) AS cash_out,

                    COALESCE(
                        SUM(amount) FILTER (
                            WHERE transaction_type = 'TRANSFER'
                        ),
                        0
                    ) AS transfers,

                    COUNT(*)::int AS transaction_count

                FROM cash_transactions

                WHERE
                    business_id = $1
                    AND status = 'POSTED'
                    AND transaction_date::date BETWEEN $2::date AND $3::date

                GROUP BY transaction_date::date
                ORDER BY transaction_date::date ASC
                `,
                [businessId, dateFrom, dateTo]
            ),

            // Transaction type breakdown
            pool.query(
                `
                SELECT
                    transaction_type,
                    COUNT(*)::int AS transaction_count,
                    COALESCE(SUM(amount), 0) AS total_amount

                FROM cash_transactions

                WHERE
                    business_id = $1
                    AND status = 'POSTED'
                    AND transaction_date::date BETWEEN $2::date AND $3::date

                GROUP BY transaction_type
                ORDER BY transaction_type
                `,
                [businessId, dateFrom, dateTo]
            ),

            // Current account balances, regardless of selected report dates
            pool.query(
                `
                SELECT
                    cab.account_id,
                    cab.account_name,
                    cab.account_type,
                    cab.employee_id,
                    cab.balance,

                    e.first_name AS employee_first_name,
                    e.last_name AS employee_last_name

                FROM cash_account_balances cab

                LEFT JOIN employees e
                    ON e.id = cab.employee_id
                    AND e.business_id = cab.business_id

                WHERE
                    cab.business_id = $1
                    AND cab.is_active = TRUE

                ORDER BY cab.account_name ASC
                `,
                [businessId]
            ),

            // Current balances of employee-assigned accounts
            pool.query(
                `
                SELECT
                    e.id AS employee_id,
                    e.employee_code,
                    e.first_name,
                    e.last_name,

                    COUNT(cab.account_id)::int AS account_count,
                    COALESCE(SUM(cab.balance), 0) AS total_balance

                FROM employees e

                LEFT JOIN cash_account_balances cab
                    ON cab.employee_id = e.id
                    AND cab.business_id = e.business_id
                    AND cab.is_active = TRUE

                WHERE
                    e.business_id = $1
                    AND e.role = 'EMPLOYEE'
                    AND e.is_active = TRUE

                GROUP BY
                    e.id,
                    e.employee_code,
                    e.first_name,
                    e.last_name

                ORDER BY e.first_name, e.last_name
                `,
                [businessId]
            ),
        ]);

        const summaryRow = summaryResult.rows[0];

        const totalCashIn = Number(summaryRow.total_cash_in || 0);
        const totalCashOut = Number(summaryRow.total_cash_out || 0);
        const totalTransfers = Number(summaryRow.total_transfers || 0);

        return NextResponse.json({
            success: true,

            period: {
                dateFrom,
                dateTo,
            },

            summary: {
                transactionCount: Number(
                    summaryRow.transaction_count || 0
                ),

                cashInCount: Number(
                    summaryRow.cash_in_count || 0
                ),

                cashOutCount: Number(
                    summaryRow.cash_out_count || 0
                ),

                transferCount: Number(
                    summaryRow.transfer_count || 0
                ),

                totalCashIn,
                totalCashOut,
                totalTransfers,

                // Internal transfers are excluded from net movement.
                netMovement: totalCashIn - totalCashOut,
            },

            daily: dailyResult.rows.map((row) => ({
                date: row.report_date,
                cashIn: Number(row.cash_in || 0),
                cashOut: Number(row.cash_out || 0),
                transfers: Number(row.transfers || 0),
                transactionCount: Number(row.transaction_count || 0),
            })),

            transactionTypes: transactionTypesResult.rows.map((row) => ({
                transactionType: row.transaction_type,
                transactionCount: Number(row.transaction_count || 0),
                totalAmount: Number(row.total_amount || 0),
            })),

            accountBalances: accountBalancesResult.rows.map((row) => ({
                accountId: row.account_id,
                accountName: row.account_name,
                accountType: row.account_type,
                employeeId: row.employee_id,
                employeeName: row.employee_first_name
                    ? `${row.employee_first_name} ${row.employee_last_name}`
                    : null,
                balance: Number(row.balance || 0),
            })),

            employeeBalances: employeeBalancesResult.rows.map((row) => ({
                employeeId: row.employee_id,
                employeeCode: row.employee_code,
                employeeName: `${row.first_name} ${row.last_name}`,
                accountCount: Number(row.account_count || 0),
                totalBalance: Number(row.total_balance || 0),
            })),
        });
    } catch (error) {
        console.error("Reports API error:", error);

        return errorResponse(
            "Failed to generate financial reports.",
            500
        );
    }
}
