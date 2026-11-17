
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

async function authorizeSystemAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("cashflow_admin_session")?.value;

    if (!token) {
        return false;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not configured.");
    }

    try {
        const secret = new TextEncoder().encode(jwtSecret);
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

const businessSchema = z.object({
    businessName: z.string().trim().min(2).max(200),
    businessCode: z.string().trim().min(2).max(50),
    ownerFirstName: z.string().trim().min(1).max(100),
    ownerLastName: z.string().trim().min(1).max(100),
    ownerEmail: z.string().trim().email().max(255),
    ownerUsername: z.string().trim().min(3).max(100),
});

export async function GET() {
    try {
        const authorized = await authorizeSystemAdmin();

        if (!authorized) {
            return NextResponse.json(
                { success: false, message: "Unauthorized." },
                { status: 401 }
            );
        }

        const result = await pool.query(`
            SELECT
                b.id,
                b.business_name,
                b.business_code,
                b.is_active,
                b.created_at,

                (
                    SELECT COUNT(*)
                    FROM employees e
                    WHERE e.business_id = b.id
                      AND e.role = 'EMPLOYEE'
                ) AS employee_count,

                (
                    SELECT json_build_object(
                        'id', owner.id,
                        'firstName', owner.first_name,
                        'lastName', owner.last_name,
                        'email', owner.email,
                        'username', owner.username
                    )
                    FROM employees owner
                    WHERE owner.business_id = b.id
                      AND owner.role = 'OWNER'
                    LIMIT 1
                ) AS owner

            FROM businesses b
            ORDER BY b.created_at DESC
        `);

        return NextResponse.json({
            success: true,
            businesses: result.rows,
        });
    } catch (error) {
        console.error("GET BUSINESSES ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to retrieve businesses.",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const client = await pool.connect();

    try {
        const authorized = await authorizeSystemAdmin();

        if (!authorized) {
            return NextResponse.json(
                { success: false, message: "Unauthorized." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = businessSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please check the submitted business and Owner details.",
                    errors: validation.error.flatten(),
                },
                { status: 400 }
            );
        }

        const data = validation.data;

        const businessCode = data.businessCode.toUpperCase();
        const ownerEmail = data.ownerEmail.toLowerCase();
        const ownerUsername = data.ownerUsername.toLowerCase();

        const cookieStore = await cookies();
        const token = cookieStore.get("cashflow_admin_session")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized." },
                { status: 401 }
            );
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET!
        );

        const { payload } = await jwtVerify(token, secret);
        const adminId = payload.sub;

        if (!adminId) {
            return NextResponse.json(
                { success: false, message: "Invalid administrator session." },
                { status: 401 }
            );
        }

        const temporaryPassword = randomBytes(18).toString("base64url");
        const passwordHash = await bcrypt.hash(temporaryPassword, 12);

        await client.query("BEGIN");

        const businessResult = await client.query(
            `
            INSERT INTO businesses (
                business_name,
                business_code,
                created_by_system_admin_id
            )
            VALUES ($1, $2, $3)
            RETURNING id, business_name, business_code, is_active, created_at
            `,
            [
                data.businessName,
                businessCode,
                adminId,
            ]
        );

        const business = businessResult.rows[0];

        const ownerResult = await client.query(
            `
            INSERT INTO employees (
                business_id,
                employee_code,
                first_name,
                last_name,
                email,
                username,
                password_hash,
                role,
                must_change_password,
                account_status
            )
            VALUES (
                $1,
                'OWNER-001',
                $2,
                $3,
                $4,
                $5,
                $6,
                'OWNER',
                TRUE,
                'ACTIVE'
            )
            RETURNING
                id,
                first_name,
                last_name,
                email,
                username,
                role
            `,
            [
                business.id,
                data.ownerFirstName,
                data.ownerLastName,
                ownerEmail,
                ownerUsername,
                passwordHash,
            ]
        );

        await client.query("COMMIT");

        return NextResponse.json(
            {
                success: true,
                message: "Business and Owner account created successfully.",
                business,
                owner: ownerResult.rows[0],
                temporaryPassword,
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        await client.query("ROLLBACK");

        const dbError = error as {
            code?: string;
            constraint?: string;
            message?: string;
        };

        console.error("CREATE BUSINESS ERROR:", error);

        if (dbError.code === "23505") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The business code, Owner username, or Owner email is already registered.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Unable to create business.",
            },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
