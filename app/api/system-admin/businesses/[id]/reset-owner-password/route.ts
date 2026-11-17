
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function authorizeSystemAdmin(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get("cashflow_admin_session")?.value;

    if (!token || !process.env.JWT_SECRET) {
        return false;
    }

    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET
        );

        const { payload } = await jwtVerify(token, secret);

        if (
            payload.role !== "SYSTEM_ADMIN" ||
            !payload.sub
        ) {
            return false;
        }

        const result = await pool.query(
            `
            SELECT id
            FROM system_admins
            WHERE id = $1
              AND is_active = TRUE
            LIMIT 1
            `,
            [payload.sub]
        );

        return result.rowCount === 1;
    } catch {
        return false;
    }
}

export async function POST(
    _request: Request,
    context: RouteContext
) {
    try {
        const authorized = await authorizeSystemAdmin();

        if (!authorized) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized. Please log in again.",
                },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid business ID.",
                },
                { status: 400 }
            );
        }

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const ownerResult = await client.query(
                `
                SELECT
                    b.id AS business_id,
                    b.business_name,
                    e.id AS owner_id,
                    e.first_name,
                    e.last_name,
                    e.email,
                    e.username
                FROM businesses b
                INNER JOIN employees e
                    ON e.business_id = b.id
                   AND e.role = 'OWNER'
                WHERE b.id = $1
                FOR UPDATE OF e
                `,
                [id]
            );

            if (ownerResult.rowCount === 0) {
                await client.query("ROLLBACK");

                return NextResponse.json(
                    {
                        success: false,
                        message: "Business or Owner account not found.",
                    },
                    { status: 404 }
                );
            }

            const owner = ownerResult.rows[0];

            const temporaryPassword = randomBytes(18).toString("base64url");

            const passwordHash = await bcrypt.hash(
                temporaryPassword,
                12
            );

            await client.query(
                `
                UPDATE employees
                SET
                    password_hash = $1,
                    must_change_password = TRUE,
                    updated_at = NOW()
                WHERE id = $2
                  AND business_id = $3
                  AND role = 'OWNER'
                `,
                [
                    passwordHash,
                    owner.owner_id,
                    id,
                ]
            );

            await client.query("COMMIT");

            return NextResponse.json({
                success: true,
                message: "Owner password reset successfully.",
                businessName: owner.business_name,
                owner: {
                    id: owner.owner_id,
                    firstName: owner.first_name,
                    lastName: owner.last_name,
                    email: owner.email,
                    username: owner.username,
                },
                temporaryPassword,
            });

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("RESET OWNER PASSWORD ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to reset Owner password.",
            },
            { status: 500 }
        );
    }
}
