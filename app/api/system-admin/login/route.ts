
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

const loginSchema = z.object({
    email: z.string().email(),
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
                    message: "Please provide a valid email and password.",
                },
                { status: 400 }
            );
        }

        const email = validation.data.email.trim().toLowerCase();
        const password = validation.data.password;

        const result = await pool.query(
            `
            SELECT
                id,
                full_name,
                email,
                password_hash,
                is_active
            FROM system_admins
            WHERE LOWER(email) = $1
            LIMIT 1
            `,
            [email]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password.",
                },
                { status: 401 }
            );
        }

        const admin = result.rows[0];

        if (!admin.is_active) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This administrator account is inactive.",
                },
                { status: 403 }
            );
        }

        const passwordValid = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password.",
                },
                { status: 401 }
            );
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const secret = new TextEncoder().encode(jwtSecret);

        const token = await new SignJWT({
            role: "SYSTEM_ADMIN",
            email: admin.email,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(admin.id)
            .setIssuedAt()
            .setExpirationTime("8h")
            .sign(secret);

        await pool.query(
            `
            UPDATE system_admins
            SET last_login = NOW(),
                updated_at = NOW()
            WHERE id = $1
            `,
            [admin.id]
        );

        const cookieStore = await cookies();

        cookieStore.set("cashflow_admin_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 8,
        });

        return NextResponse.json({
            success: true,
            message: "Login successful.",
            admin: {
                id: admin.id,
                fullName: admin.full_name,
                email: admin.email,
            },
        });

    } catch (error) {
        console.error("SYSTEM ADMIN LOGIN ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to process login.",
            },
            { status: 500 }
        );
    }
}
