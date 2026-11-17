
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "@/lib/db";
import { EMPLOYEE_COOKIE } from "@/lib/employee-auth";

export const runtime = "nodejs";

const loginSchema = z.object({
    businessCode: z.string().trim().min(1),
    username: z.string().trim().min(1),
    password: z.string().min(1),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Business code, username, and password are required.",
                },
                { status: 400 }
            );
        }

        const businessCode = validation.data.businessCode.toUpperCase();
        const username = validation.data.username.toLowerCase();
        const password = validation.data.password;

        const result = await pool.query(
            `
            SELECT
                e.id,
                e.business_id,
                e.first_name,
                e.last_name,
                e.username,
                e.email,
                e.password_hash,
                e.role,
                e.must_change_password,
                e.account_status,
                b.business_name,
                b.business_code,
                b.is_active AS business_active
            FROM employees e
            INNER JOIN businesses b
                ON b.id = e.business_id
            WHERE UPPER(b.business_code) = $1
              AND LOWER(e.username) = $2
            LIMIT 1
            `,
            [businessCode, username]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid business code, username, or password.",
                },
                { status: 401 }
            );
        }

        const employee = result.rows[0];

        if (!employee.business_active) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This business account is inactive.",
                },
                { status: 403 }
            );
        }

        if (
            employee.account_status !== "ACTIVE"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Your employee account is inactive or suspended.",
                },
                { status: 403 }
            );
        }

        const passwordValid = await bcrypt.compare(
            password,
            employee.password_hash
        );

        if (!passwordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid business code, username, or password.",
                },
                { status: 401 }
            );
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET
        );

        const token = await new SignJWT({
            role: employee.role,
            businessId: employee.business_id,
            username: employee.username,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(employee.id)
            .setIssuedAt()
            .setExpirationTime("8h")
            .sign(secret);

        await pool.query(
            `
            UPDATE employees
            SET last_login = NOW(),
                updated_at = NOW()
            WHERE id = $1
            `,
            [employee.id]
        );

        const cookieStore = await cookies();

        cookieStore.set(EMPLOYEE_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 8,
        });

        return NextResponse.json({
            success: true,
            message: "Login successful.",
            mustChangePassword: employee.must_change_password,
            employee: {
                id: employee.id,
                firstName: employee.first_name,
                lastName: employee.last_name,
                username: employee.username,
                role: employee.role,
                businessName: employee.business_name,
                businessCode: employee.business_code,
            },
            redirectTo: employee.must_change_password
                ? "/change-password"
                : "/dashboard",
        });

    } catch (error) {
        console.error("EMPLOYEE LOGIN ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to process login.",
            },
            { status: 500 }
        );
    }
}
