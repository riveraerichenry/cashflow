
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";

export async function GET(request: NextRequest) {
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
                    message: "Please change your password first.",
                },
                { status: 403 }
            );
        }

        const params = request.nextUrl.searchParams;

        const accountId = params.get("accountId");
        const transactionType = params.get("type");
        const search = params.get("search")?.trim() || "";
        const dateFrom = params.get("dateFrom");
        const dateTo = params.get("dateTo");

        const values: unknown[] = [];
        const filters: string[] = [];

        // Always restrict records to the authenticated business.
        values.push(session.businessId);
        const businessParam = `$${values.length}`;

        // Employees can only view transactions connected to themselves
        // or accounts assigned to them.
        if (session.role !== "OWNER") {
            values.push(session.employeeId);
            const employeeParam = `$${values.length}`;

            filters.push(`
                (
                    t.employee_id = ${employeeParam}
                    OR ca.employee_id = ${employeeParam}
                )
            `);
        }

        if (accountId) {
            values.push(accountId);
            filters.push(`le.account_id = $${values.length}`);
        }

        if (transactionType && transactionType !== "ALL") {
            values.push(transactionType);
            filters.push(`t.transaction_type = $${values.length}`);
        }

        if (dateFrom) {
            values.push(dateFrom);
            filters.push(
                `t.transaction_date >= $${values.length}::date`
            );
        }

        if (dateTo) {
            values.push(dateTo);
            filters.push(
                `t.transaction_date < ($${values.length}::date + INTERVAL '1 day')`
            );
        }

        if (search) {
            values.push(`%${search}%`);
            const searchParam = `$${values.length}`;

            filters.push(`
                (
                    t.transaction_no ILIKE ${searchParam}
                    OR COALESCE(t.reference_no, '') ILIKE ${searchParam}
                    OR COALESCE(t.source_name, '') ILIKE ${searchParam}
                    OR COALESCE(t.description, '') ILIKE ${searchParam}
                    OR ca.account_name ILIKE ${searchParam}
                    OR COALESCE(
                        e.first_name || ' ' || e.last_name,
                        ''
                    ) ILIKE ${searchParam}
                )
            `);
        }

        const whereFilters = filters.length
            ? `AND ${filters.join(" AND ")}`
            : "";

        const query = `
            WITH ledger AS (
                SELECT
                    le.id AS ledger_entry_id,
                    le.business_id,
                    le.transaction_id,
                    le.account_id,
                    le.direction,
                    le.amount AS ledger_amount,
                    le.description AS ledger_description,
                    le.created_at AS ledger_created_at,

                    t.transaction_no,
                    t.transaction_type,
                    t.transaction_date,
                    t.amount AS transaction_amount,
                    t.description AS transaction_description,
                    t.reference_no,
                    t.source_name,
                    t.employee_id,
                    t.created_by,
                    t.approved_by,
                    t.posted_at,
                    t.created_at AS transaction_created_at,

                    ca.account_name,
                    ca.account_type,
                    ca.account_number,
                    ca.employee_id AS assigned_employee_id,

                    e.first_name AS employee_first_name,
                    e.last_name AS employee_last_name,
                    e.employee_code,

                    creator.first_name AS creator_first_name,
                    creator.last_name AS creator_last_name,

                    SUM(
                        CASE
                            WHEN UPPER(le.direction) = 'IN'
                                THEN le.amount
                            WHEN UPPER(le.direction) = 'OUT'
                                THEN -le.amount
                            ELSE 0
                        END
                    ) OVER (
                        PARTITION BY le.account_id
                        ORDER BY
                            t.transaction_date,
                            t.created_at,
                            le.created_at,
                            le.id
                        ROWS BETWEEN UNBOUNDED PRECEDING
                        AND CURRENT ROW
                    ) AS running_balance

                FROM cash_ledger_entries le

                INNER JOIN cash_transactions t
                    ON t.id = le.transaction_id
                    AND t.business_id = le.business_id

                INNER JOIN cash_accounts ca
                    ON ca.id = le.account_id
                    AND ca.business_id = le.business_id

                LEFT JOIN employees e
                    ON e.id = t.employee_id
                    AND e.business_id = t.business_id

                LEFT JOIN employees creator
                    ON creator.id = t.created_by
                    AND creator.business_id = t.business_id

                WHERE le.business_id = ${businessParam}
                    AND t.status = 'POSTED'
            )

            SELECT
                *,
                COUNT(*) OVER() AS total_records

            FROM ledger

            WHERE TRUE
                ${whereFilters}

            ORDER BY
                transaction_date DESC,
                transaction_created_at DESC,
                ledger_created_at DESC

            LIMIT 500
        `;

        const result = await pool.query(query, values);

        const transactions = result.rows.map((row) => ({
            ledgerEntryId: row.ledger_entry_id,

            transactionNo: row.transaction_no,
            transactionId: row.transaction_id,
            transactionType: row.transaction_type,

            transactionDate: row.transaction_date,
            transactionAmount: Number(row.transaction_amount),

            direction: row.direction,
            ledgerAmount: Number(row.ledger_amount),
            runningBalance: Number(row.running_balance),

            accountId: row.account_id,
            accountName: row.account_name,
            accountType: row.account_type,
            accountNumber: row.account_number,

            sourceName: row.source_name,
            referenceNo: row.reference_no,

            description:
                row.ledger_description ||
                row.transaction_description ||
                "",

            employeeId: row.employee_id,
            employeeName: row.employee_first_name
                ? `${row.employee_first_name} ${row.employee_last_name}`
                : "Unassigned",

            employeeCode: row.employee_code,

            createdBy: row.created_by,
            createdByName: row.creator_first_name
                ? `${row.creator_first_name} ${row.creator_last_name}`
                : "System",

            approvedBy: row.approved_by,
            postedAt: row.posted_at,

            totalRecords: Number(row.total_records),
        }));

        return NextResponse.json({
            success: true,
            transactions,
            totalRecords: transactions.length
                ? transactions[0].totalRecords
                : 0,
        });

    } catch (error) {
        console.error("GET TRANSACTIONS ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to retrieve transaction history.",
            },
            { status: 500 }
        );
    }
}
