
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),

    newPassword: z
        .string()
        .min(12, "Password must be at least 12 characters")
        .max(128, "Password must not exceed 128 characters"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
        message: "New passwords do not match",
        path: ["confirmPassword"],
    }
);

export async function POST(request: NextRequest) {
    try {
        // 1. Verify employee session
        const session = await getEmployeeSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Your session has expired. Please log in again.",
                },
                { status: 401 }
            );
        }

        // 2. Validate request
        const body = await request.json();

        const parsed = changePasswordSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: parsed.error.issues[0]?.message ??
                        "Invalid password information.",
                },
                { status: 400 }
            );
        }

        const {
            currentPassword,
            newPassword,
        } = parsed.data;

        if (currentPassword === newPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Your new password must be different from your current password.",
                },
                { status: 400 }
            );
        }

        // 3. Get employee account
        const employeeResult = await pool.query(
            `SELECT
                id,
                business_id,
                password_hash,
                must_change_password
             FROM employees
             WHERE id = $1
               AND business_id = $2
               AND is_active = TRUE
               AND account_status = 'ACTIVE'
             LIMIT 1`,
            [
                session.employeeId,
                session.businessId,
            ]
        );

        if (employeeResult.rowCount !== 1) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Employee account not found or inactive.",
                },
                { status: 403 }
            );
        }

        const employee = employeeResult.rows[0];

        // 4. Verify current password
        const passwordIsValid = await bcrypt.compare(
            currentPassword,
            employee.password_hash
        );

        if (!passwordIsValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Your current password is incorrect.",
                },
                { status: 400 }
            );
        }

        // 5. Hash new password
        const newPasswordHash = await bcrypt.hash(
            newPassword,
            12
        );

        // 6. Update password
        const updateResult = await pool.query(
            `UPDATE employees
             SET
                password_hash = $1,
                must_change_password = FALSE,
                updated_at = NOW()
             WHERE id = $2
               AND business_id = $3
               AND is_active = TRUE
               AND account_status = 'ACTIVE'
             RETURNING id`,
            [
                newPasswordHash,
                session.employeeId,
                session.businessId,
            ]
        );

        if (updateResult.rowCount !== 1) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to update your password.",
                },
                { status: 500 }
            );
        }

        // 7. Success
        return NextResponse.json({
            success: true,
            message: "Password changed successfully.",
            redirectTo: "/dashboard",
        });

    } catch (error) {
        console.error("CHANGE PASSWORD API ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "An unexpected server error occurred.",
            },
            { status: 500 }
        );
    }
}
