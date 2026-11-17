
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";

const updateSchema = z.object({
    isActive: z.boolean(),
});

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    let client;

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

        if (session.role !== "OWNER") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Only the Owner can update cash accounts.",
                },
                { status: 403 }
            );
        }

        const { id } = await context.params;

        if (!z.string().uuid().safeParse(id).success) {
            return NextResponse.json(
                { success: false, message: "Invalid account ID." },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => null);
        const parsed = updateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, message: "Invalid account status." },
                { status: 400 }
            );
        }

        client = await pool.connect();

        await client.query("BEGIN");

        // Lock the account while checking and updating its status.
        const accountResult = await client.query(
            `SELECT
                id,
                account_name,
                is_active
             FROM cash_accounts
             WHERE id = $1
               AND business_id = $2
             FOR UPDATE`,
            [id, session.businessId]
        );

        if (accountResult.rowCount !== 1) {
            await client.query("ROLLBACK");

            return NextResponse.json(
                {
                    success: false,
                    message: "Cash account not found.",
                },
                { status: 404 }
            );
        }

        const account = accountResult.rows[0];

        // Only check the balance when deactivating.
        if (!parsed.data.isActive && account.is_active) {
            const balanceResult = await client.query(
                `SELECT COALESCE(balance, 0) AS balance
                 FROM cash_account_balances
                 WHERE account_id = $1
                   AND business_id = $2`,
                [id, session.businessId]
            );

            const balance = Number(
                balanceResult.rows[0]?.balance ?? 0
            );

            // Do not allow accounts with remaining funds to be deactivated.
            if (balance !== 0) {
                await client.query("ROLLBACK");

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "This account cannot be deactivated because it still has a remaining balance. Please transfer or withdraw the funds first.",
                        balance,
                        accountName: account.account_name,
                    },
                    { status: 409 }
                );
            }
        }

        const updateResult = await client.query(
            `UPDATE cash_accounts
             SET is_active = $1,
                 updated_at = NOW()
             WHERE id = $2
               AND business_id = $3
             RETURNING id, account_name, is_active`,
            [
                parsed.data.isActive,
                id,
                session.businessId,
            ]
        );

        await client.query("COMMIT");

        return NextResponse.json({
            success: true,
            message: parsed.data.isActive
                ? "Account activated successfully."
                : "Account deactivated successfully.",
            account: updateResult.rows[0],
        });
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        console.error("UPDATE CASH ACCOUNT ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to update cash account.",
            },
            { status: 500 }
        );
    } finally {
        client?.release();
    }
}
