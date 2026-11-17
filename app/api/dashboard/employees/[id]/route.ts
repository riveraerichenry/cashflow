
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";
import { z } from "zod";

// ============================================================
// VALIDATION
// ============================================================

const updateSchema = z.object({
    isActive: z.boolean().optional(),
    accountIds: z.array(z.string().uuid()).max(20).optional(),
}).strict();

// ============================================================
// RESPONSE
// ============================================================

function errorResponse(
    message: string,
    status = 400
) {
    return NextResponse.json(
        {
            success: false,
            message,
        },
        { status }
    );
}

// ============================================================
// PATCH EMPLOYEE
// ============================================================

export async function PATCH(
    request: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    let session;

    try {
        session = await getEmployeeSession();
    } catch (error) {
        console.error("Employee session error:", error);

        return errorResponse(
            "Unable to verify your session.",
            500
        );
    }

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
            "Only the Owner can update employees.",
            403
        );
    }

    // --------------------------------------------------------
    // EMPLOYEE ID
    // --------------------------------------------------------

    const { id } = await context.params;

    if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
        return errorResponse("Invalid employee ID.");
    }

    // --------------------------------------------------------
    // REQUEST VALIDATION
    // --------------------------------------------------------

    const body = await request.json().catch(() => null);

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
        return errorResponse(
            parsed.error.issues[0]?.message ||
            "Invalid employee details."
        );
    }

    if (
        parsed.data.isActive === undefined &&
        parsed.data.accountIds === undefined
    ) {
        return errorResponse(
            "No changes were provided."
        );
    }

    // Prevent duplicate account IDs.
    const accountIds =
        parsed.data.accountIds !== undefined
            ? [...new Set(parsed.data.accountIds)]
            : undefined;

    // --------------------------------------------------------
    // DATABASE TRANSACTION
    // --------------------------------------------------------

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        // ----------------------------------------------------
        // LOCK EMPLOYEE
        // ----------------------------------------------------

        const employeeResult = await client.query(
            `
            SELECT
                id,
                employee_code,
                first_name,
                last_name,
                is_active,
                account_status
            FROM employees
            WHERE
                id = $1
                AND business_id = $2
                AND role = 'EMPLOYEE'
            FOR UPDATE
            `,
            [
                id,
                session.businessId,
            ]
        );

        if (employeeResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return errorResponse(
                "Employee not found.",
                404
            );
        }

        const employee = employeeResult.rows[0];

        // ====================================================
        // ACCOUNT ASSIGNMENT
        // ====================================================

        if (accountIds !== undefined) {

            // ------------------------------------------------
            // VERIFY SELECTED ACCOUNTS
            // ------------------------------------------------

            if (accountIds.length > 0) {

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
                    FOR UPDATE
                    `,
                    [
                        session.businessId,
                        accountIds,
                    ]
                );

                if (
                    accountResult.rowCount !== accountIds.length
                ) {
                    await client.query("ROLLBACK");

                    return errorResponse(
                        "One or more selected cash accounts do not exist."
                    );
                }

                // --------------------------------------------
                // CHECK ACCOUNT STATUS
                // --------------------------------------------

                const inactiveAccount =
                    accountResult.rows.find(
                        (account) => !account.is_active
                    );

                if (inactiveAccount) {
                    await client.query("ROLLBACK");

                    return errorResponse(
                        `${inactiveAccount.account_name} is inactive.`
                    );
                }

                // --------------------------------------------
                // CHECK ACCOUNT OWNERSHIP
                // --------------------------------------------

                const assignedElsewhere =
                    accountResult.rows.find(
                        (account) =>
                            account.employee_id !== null &&
                            account.employee_id !== id
                    );

                if (assignedElsewhere) {
                    await client.query("ROLLBACK");

                    return errorResponse(
                        `${assignedElsewhere.account_name} is assigned to another employee.`
                    );
                }
            }

            // ------------------------------------------------
            // UNASSIGN PREVIOUS ACCOUNTS
            // ------------------------------------------------

            await client.query(
                `
                UPDATE cash_accounts
                SET
                    employee_id = NULL,
                    updated_at = NOW()
                WHERE
                    business_id = $1
                    AND employee_id = $2
                `,
                [
                    session.businessId,
                    id,
                ]
            );

            // ------------------------------------------------
            // ASSIGN SELECTED ACCOUNTS
            // ------------------------------------------------

            if (accountIds.length > 0) {

                await client.query(
                    `
                    UPDATE cash_accounts
                    SET
                        employee_id = $1,
                        updated_at = NOW()
                    WHERE
                        business_id = $2
                        AND id = ANY($3::uuid[])
                    `,
                    [
                        id,
                        session.businessId,
                        accountIds,
                    ]
                );
            }
        }

        // ====================================================
        // ACTIVATE / DEACTIVATE
        // ====================================================

        if (parsed.data.isActive !== undefined) {

            const nextIsActive = parsed.data.isActive;

            // ------------------------------------------------
            // DEACTIVATION SAFEGUARDS
            // ------------------------------------------------

            if (
                !nextIsActive &&
                employee.is_active
            ) {

                // --------------------------------------------
                // CHECK NONZERO CASH BALANCES
                // --------------------------------------------

                const balanceResult = await client.query(
                    `
                    SELECT
                        ca.account_name,
                        cab.balance
                    FROM cash_accounts ca
                    INNER JOIN cash_account_balances cab
                        ON cab.account_id = ca.id
                    WHERE
                        ca.business_id = $1
                        AND ca.employee_id = $2
                        AND ca.is_active = TRUE
                        AND ABS(COALESCE(cab.balance, 0)) > 0.009
                    LIMIT 1
                    `,
                    [
                        session.businessId,
                        id,
                    ]
                );

                if (balanceResult.rowCount > 0) {
                    await client.query("ROLLBACK");

                    return errorResponse(
                        `Cannot deactivate this employee. ${balanceResult.rows[0].account_name} still has a cash balance. Transfer or settle the remaining balance first.`
                    );
                }

                // --------------------------------------------
                // CHECK PENDING WITHDRAWALS
                // --------------------------------------------

                const withdrawalResult = await client.query(
                    `
                    SELECT id
                    FROM withdrawal_requests
                    WHERE
                        business_id = $1
                        AND employee_id = $2
                        AND status IN ('PENDING', 'APPROVED')
                    LIMIT 1
                    `,
                    [
                        session.businessId,
                        id,
                    ]
                );

                if (withdrawalResult.rowCount > 0) {
                    await client.query("ROLLBACK");

                    return errorResponse(
                        "Cannot deactivate this employee while withdrawal requests are pending or approved."
                    );
                }

                // --------------------------------------------
                // CHECK PENDING REMITTANCES
                // --------------------------------------------

                const remittanceResult = await client.query(
                    `
                    SELECT id
                    FROM remittance_requests
                    WHERE
                        business_id = $1
                        AND employee_id = $2
                        AND status = 'PENDING'
                    LIMIT 1
                    `,
                    [
                        session.businessId,
                        id,
                    ]
                );

                if (remittanceResult.rowCount > 0) {
                    await client.query("ROLLBACK");

                    return errorResponse(
                        "Cannot deactivate this employee while remittance requests are pending."
                    );
                }
            }

            // ------------------------------------------------
            // UPDATE EMPLOYEE STATUS
            // ------------------------------------------------

            await client.query(
                `
                UPDATE employees
                SET
                    is_active = $1,
                    account_status = $2,
                    updated_at = NOW()
                WHERE
                    id = $3
                    AND business_id = $4
                    AND role = 'EMPLOYEE'
                `,
                [
                    nextIsActive,
                    nextIsActive ? "ACTIVE" : "INACTIVE",
                    id,
                    session.businessId,
                ]
            );
        }

        // ----------------------------------------------------
        // COMMIT
        // ----------------------------------------------------

        await client.query("COMMIT");

        return NextResponse.json({
            success: true,
            message: "Employee updated successfully.",
        });

    } catch (error) {

        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Employee PATCH rollback error:",
                    rollbackError
                );
            }
        }

        console.error(
            "Employee PATCH error:",
            error
        );

        return errorResponse(
            "Failed to update employee.",
            500
        );

    } finally {

        client?.release();

    }
}
