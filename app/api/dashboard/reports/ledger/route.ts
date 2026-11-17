
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
            "Only the business Owner can access account ledger reports.",
            403
        );
    }

    const params = request.nextUrl.searchParams;

    const dateFrom = params.get("dateFrom");
    const dateTo = params.get("dateTo");
    const accountId = params.get("accountId") || null;

    if (!dateFrom || !dateTo) {
        return errorResponse("Please provide the reporting date range.");
    }

    if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
        return errorResponse("Invalid date. Use YYYY-MM-DD.");
    }

    if (dateFrom > dateTo) {
        return errorResponse(
            "Start date cannot be later than end date."
        );
    }

    if (
        accountId &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)
    ) {
        return errorResponse("Invalid cash account ID.");
    }

    const businessId = session.businessId;

    try {
        const [
            accountsResult,
            openingResult,
            entriesResult,
        ] = await Promise.all([
            // =====================================================
            // ACTIVE CASH ACCOUNTS
            // =====================================================
            pool.query(
                `
                SELECT
                    ca.id AS account_id,
                    ca.account_name,
                    ca.account_type,
                    ca.employee_id,

                    e.first_name AS employee_first_name,
                    e.last_name AS employee_last_name,

                    COALESCE(cab.balance, 0) AS current_balance

                FROM cash_accounts ca

                LEFT JOIN employees e
                    ON e.id = ca.employee_id
                    AND e.business_id = ca.business_id

                LEFT JOIN cash_account_balances cab
                    ON cab.account_id = ca.id
                    AND cab.business_id = ca.business_id

                WHERE
                    ca.business_id = $1
                    AND ca.is_active = TRUE
                    AND ($2::uuid IS NULL OR ca.id = $2::uuid)

                ORDER BY ca.account_name
                `,
                [businessId, accountId]
            ),

            // =====================================================
            // OPENING BALANCE BEFORE SELECTED PERIOD
            // =====================================================
            pool.query(
                `
                SELECT
                    cle.account_id,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN cle.direction = 'IN'
                                    THEN cle.amount

                                WHEN cle.direction = 'OUT'
                                    THEN -cle.amount

                                ELSE 0
                            END
                        ),
                        0
                    ) AS opening_balance

                FROM cash_ledger_entries cle

                INNER JOIN cash_transactions ct
                    ON ct.id = cle.transaction_id
                    AND ct.business_id = cle.business_id

                WHERE
                    cle.business_id = $1
                    AND ct.status = 'POSTED'

                    AND (
                        ct.transaction_date
                        AT TIME ZONE 'Asia/Manila'
                    )::date < $2::date

                    AND (
                        $3::uuid IS NULL
                        OR cle.account_id = $3::uuid
                    )

                GROUP BY cle.account_id
                `,
                [businessId, dateFrom, accountId]
            ),

            // =====================================================
            // LEDGER ENTRIES WITH RUNNING BALANCE
            // =====================================================
            pool.query(
                `
                WITH ledger AS (
                    SELECT
                        cle.id AS ledger_entry_id,
                        cle.account_id,
                        cle.transaction_id,
                        cle.direction,
                        cle.amount,

                        cle.description AS ledger_description,
                        cle.created_at AS ledger_created_at,

                        ct.transaction_no,
                        ct.transaction_type,
                        ct.transaction_date,
                        ct.reference_no,
                        ct.description AS transaction_description,
                        ct.employee_id,

                        ca.account_name,
                        ca.account_type,

                        e.first_name AS employee_first_name,
                        e.last_name AS employee_last_name,

                        SUM(
                            CASE
                                WHEN cle.direction = 'IN'
                                    THEN cle.amount

                                WHEN cle.direction = 'OUT'
                                    THEN -cle.amount

                                ELSE 0
                            END
                        ) OVER (
                            PARTITION BY cle.account_id

                            ORDER BY
                                ct.transaction_date,
                                cle.created_at,
                                cle.id

                            ROWS BETWEEN UNBOUNDED PRECEDING
                                AND CURRENT ROW
                        ) AS running_balance,

                        (
                            ct.transaction_date
                            AT TIME ZONE 'Asia/Manila'
                        )::date AS local_transaction_date

                    FROM cash_ledger_entries cle

                    INNER JOIN cash_transactions ct
                        ON ct.id = cle.transaction_id
                        AND ct.business_id = cle.business_id

                    INNER JOIN cash_accounts ca
                        ON ca.id = cle.account_id
                        AND ca.business_id = cle.business_id

                    LEFT JOIN employees e
                        ON e.id = ct.employee_id
                        AND e.business_id = ct.business_id

                    WHERE
                        cle.business_id = $1
                        AND ct.status = 'POSTED'

                        AND (
                            $4::uuid IS NULL
                            OR cle.account_id = $4::uuid
                        )
                )

                SELECT
                    ledger_entry_id,
                    account_id,
                    account_name,
                    account_type,

                    transaction_id,
                    transaction_no,
                    transaction_type,

                    TO_CHAR(
                        local_transaction_date,
                        'YYYY-MM-DD'
                    ) AS transaction_date,

                    direction,
                    amount,
                    reference_no,

                    COALESCE(
                        ledger_description,
                        transaction_description
                    ) AS description,

                    employee_id,

                    CASE
                        WHEN employee_first_name IS NOT NULL
                        THEN employee_first_name || ' ' || employee_last_name
                        ELSE NULL
                    END AS employee_name,

                    running_balance

                FROM ledger

                WHERE
                    local_transaction_date
                    BETWEEN $2::date AND $3::date

                ORDER BY
                    transaction_date DESC,
                    transaction_no DESC,
                    ledger_entry_id DESC

                LIMIT 1000
                `,
                [businessId, dateFrom, dateTo, accountId]
            ),
        ]);

        // =========================================================
        // NORMALIZE OPENING BALANCES
        // =========================================================
        const openingBalances = openingResult.rows.map((row) => ({
            accountId: row.account_id,
            openingBalance: Number(row.opening_balance || 0),
        }));

        // =========================================================
        // NORMALIZE LEDGER ENTRIES
        // =========================================================
        const entries = entriesResult.rows.map((row) => ({
            ledgerEntryId: row.ledger_entry_id,
            accountId: row.account_id,

            accountName: row.account_name,
            accountType: row.account_type,

            transactionId: row.transaction_id,
            transactionNo: row.transaction_no,
            transactionType: row.transaction_type,

            transactionDate: row.transaction_date,

            direction: row.direction,
            amount: Number(row.amount || 0),

            referenceNo: row.reference_no,
            description: row.description,

            employeeId: row.employee_id,
            employeeName: row.employee_name,

            runningBalance: Number(row.running_balance || 0),
        }));

        // =========================================================
        // ACCOUNT SUMMARIES
        // =========================================================
        const accountSummaries = accountsResult.rows.map((account) => {
            const opening =
                openingBalances.find(
                    (item) => item.accountId === account.account_id
                )?.openingBalance || 0;

            const accountEntries = entries.filter(
                (entry) => entry.accountId === account.account_id
            );

            const totalIn = accountEntries
                .filter((entry) => entry.direction === "IN")
                .reduce((sum, entry) => sum + entry.amount, 0);

            const totalOut = accountEntries
                .filter((entry) => entry.direction === "OUT")
                .reduce((sum, entry) => sum + entry.amount, 0);

            return {
                accountId: account.account_id,
                accountName: account.account_name,
                accountType: account.account_type,

                employeeId: account.employee_id,

                employeeName: account.employee_first_name
                    ? `${account.employee_first_name} ${account.employee_last_name}`
                    : null,

                openingBalance: opening,
                totalIn,
                totalOut,

                closingBalance: opening + totalIn - totalOut,

                currentBalance: Number(account.current_balance || 0),

                entryCount: accountEntries.length,
            };
        });

        // =========================================================
        // FINANCIAL MOVEMENT SUMMARY
        // =========================================================

        // Actual external cash received.
        const cashIn = entries
            .filter(
                (entry) =>
                    entry.transactionType === "CASH_IN" &&
                    entry.direction === "IN"
            )
            .reduce((sum, entry) => sum + entry.amount, 0);

        // Actual withdrawals released.
        const cashOut = entries
            .filter(
                (entry) =>
                    entry.transactionType === "WITHDRAWAL" &&
                    entry.direction === "OUT"
            )
            .reduce((sum, entry) => sum + entry.amount, 0);

        // Internal transfers received by accounts.
        const transferIn = entries
            .filter(
                (entry) =>
                    entry.transactionType === "TRANSFER" &&
                    entry.direction === "IN"
            )
            .reduce((sum, entry) => sum + entry.amount, 0);

        // Internal transfers sent by accounts.
        const transferOut = entries
            .filter(
                (entry) =>
                    entry.transactionType === "TRANSFER" &&
                    entry.direction === "OUT"
            )
            .reduce((sum, entry) => sum + entry.amount, 0);

        // All ledger credits.
        const totalIn = entries
            .filter((entry) => entry.direction === "IN")
            .reduce((sum, entry) => sum + entry.amount, 0);

        // All ledger debits.
        const totalOut = entries
            .filter((entry) => entry.direction === "OUT")
            .reduce((sum, entry) => sum + entry.amount, 0);

        const openingBalance = accountSummaries.reduce(
            (sum, account) => sum + account.openingBalance,
            0
        );

        const closingBalance = accountSummaries.reduce(
            (sum, account) => sum + account.closingBalance,
            0
        );

        // =========================================================
        // RESPONSE
        // =========================================================
        return NextResponse.json({
            success: true,

            period: {
                dateFrom,
                dateTo,
            },

            accounts: accountsResult.rows.map((account) => ({
                accountId: account.account_id,
                accountName: account.account_name,
                accountType: account.account_type,

                employeeName: account.employee_first_name
                    ? `${account.employee_first_name} ${account.employee_last_name}`
                    : null,

                currentBalance: Number(account.current_balance || 0),
            })),

            summary: {
                openingBalance,

                // All account credits and debits, including transfers.
                totalIn,
                totalOut,

                // External movements only.
                cashIn,
                cashOut,

                // Internal account movements.
                transferIn,
                transferOut,

                // Business movement excludes internal transfers.
                netMovement: cashIn - cashOut,

                closingBalance,

                entryCount: entries.length,
            },

            accountSummaries,

            entries,
        });
    } catch (error) {
        console.error("Account Ledger Report API error:", error);

        return errorResponse(
            "Failed to generate account ledger report.",
            500
        );
    }
}
