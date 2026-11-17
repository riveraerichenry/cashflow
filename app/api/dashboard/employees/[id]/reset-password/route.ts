
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";

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
// RESET EMPLOYEE PASSWORD
// ============================================================

export async function POST(
    _request: Request,
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
        console.error(
            "Password reset session error:",
            error
        );

        return errorResponse(
            "Unable to verify your session.",
            500
        );
    }

    if (!session) {
        return errorResponse(
            "Unauthorized.",
            401
        );
    }

    if (session.mustChangePassword) {
        return errorResponse(
            "Please change your password first.",
            403
        );
    }

    if (session.role !== "OWNER") {
        return errorResponse(
            "Only the Owner can reset employee passwords.",
            403
        );
    }

    // --------------------------------------------------------
    // VALIDATE EMPLOYEE ID
    // --------------------------------------------------------

    const { id } = await context.params;

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
        return errorResponse(
            "Invalid employee ID."
        );
    }

    // --------------------------------------------------------
    // GENERATE TEMPORARY PASSWORD
    // --------------------------------------------------------

    const temporaryPassword =
        randomBytes(18).toString("base64url");

    let passwordHash: string;

    try {
        passwordHash = await bcrypt.hash(
            temporaryPassword,
            12
        );
    } catch (error) {
        console.error(
            "Password hashing error:",
            error
        );

        return errorResponse(
            "Unable to generate temporary password.",
            500
        );
    }

    // --------------------------------------------------------
    // UPDATE EMPLOYEE PASSWORD
    // --------------------------------------------------------

    try {

        const result = await pool.query(
            `
            UPDATE employees
            SET
                password_hash = $1,
                must_change_password = TRUE,
                updated_at = NOW()
            WHERE
                id = $2
                AND business_id = $3
                AND role = 'EMPLOYEE'
                AND is_active = TRUE
                AND account_status = 'ACTIVE'
            RETURNING
                id,
                employee_code,
                username,
                first_name,
                last_name
            `,
            [
                passwordHash,
                id,
                session.businessId,
            ]
        );

        // ----------------------------------------------------
        // EMPLOYEE NOT FOUND
        // ----------------------------------------------------

        if (result.rowCount === 0) {
            return errorResponse(
                "Active employee not found.",
                404
            );
        }

        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        return NextResponse.json({
            success: true,

            message:
                "Temporary password generated successfully.",

            employee: result.rows[0],

            temporaryPassword,
        });

    } catch (error) {

        console.error(
            "Employee password reset error:",
            error
        );

        return errorResponse(
            "Failed to reset employee password.",
            500
        );
    }
}
