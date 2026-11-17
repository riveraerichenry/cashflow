
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { pool } from "@/lib/db";

import {
    getEmployeeSession,
    isOwner,
} from "@/lib/employee-auth";

// ============================================================
// VALIDATION
// ============================================================

const createEmployeeSchema = z.object({
    employeeCode: z.string().trim().min(1).max(50),

    firstName: z.string().trim().min(1).max(100),

    lastName: z.string().trim().min(1).max(100),

    username: z.string()
        .trim()
        .min(3)
        .max(50)
        .regex(
            /^[a-zA-Z0-9._-]+$/,
            "Username may contain letters, numbers, dots, underscores, and hyphens."
        ),

    email: z.string()
        .trim()
        .email()
        .max(255)
        .optional()
        .or(z.literal("")),

    phone: z.string()
        .trim()
        .max(30)
        .optional(),

    accountIds: z.array(z.string().uuid())
        .max(20)
        .optional()
        .default([]),
});

// ============================================================
// HELPERS
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

function generateTemporaryPassword() {
    return randomBytes(12).toString("base64url");
}

async function getAuthorizedOwner() {
    const session = await getEmployeeSession();

    if (!session) {
        return {
            session: null,
            response: errorResponse("Unauthorized.", 401),
        };
    }

    if (session.mustChangePassword) {
        return {
            session: null,
            response: errorResponse(
                "Please change your password first.",
                403
            ),
        };
    }

    if (!isOwner(session)) {
        return {
            session: null,
            response: errorResponse(
                "Only the Owner can manage employees.",
                403
            ),
        };
    }

    return {
        session,
        response: null,
    };
}

// ============================================================
// GET EMPLOYEES
// OWNER ONLY
// ============================================================

export async function GET() {
    const authorization = await getAuthorizedOwner();

    if (authorization.response) {
        return authorization.response;
    }

    const session = authorization.session!;

    try {
        const result = await pool.query(
            `
            SELECT
                e.id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.username,
                e.role,
                e.is_active,
                e.account_status,
                e.must_change_password,
                e.last_login,
                e.created_at,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', ca.id,
                            'account_name', ca.account_name,
                            'account_type', ca.account_type,
                            'is_active', ca.is_active
                        )
                    ) FILTER (
                        WHERE ca.id IS NOT NULL
                    ),
                    '[]'::json
                ) AS accounts

            FROM employees e

            LEFT JOIN cash_accounts ca
                ON ca.employee_id = e.id
                AND ca.business_id = e.business_id

            WHERE
                e.business_id = $1
                AND e.role = 'EMPLOYEE'

            GROUP BY e.id

            ORDER BY e.created_at DESC
            `,
            [session.businessId]
        );

        return NextResponse.json({
            success: true,
            employees: result.rows,
        });

    } catch (error) {
        console.error(
            "EMPLOYEES GET ERROR:",
            error
        );

        return errorResponse(
            "Failed to retrieve employees.",
            500
        );
    }
}

// ============================================================
// CREATE EMPLOYEE
// OWNER ONLY
// ============================================================

export async function POST(request: NextRequest) {
    const authorization = await getAuthorizedOwner();

    if (authorization.response) {
        return authorization.response;
    }

    const session = authorization.session!;

    // --------------------------------------------------------
    // VALIDATE BODY
    // --------------------------------------------------------

    const body = await request.json().catch(() => null);

    const parsed = createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
        return errorResponse(
            parsed.error.issues[0]?.message ||
            "Invalid employee details."
        );
    }

    const data = parsed.data;

    const username = data.username
        .trim()
        .toLowerCase();

    const email = data.email
        ?.trim()
        .toLowerCase() || null;

    const employeeCode = data.employeeCode
        .trim()
        .toUpperCase();

    const accountIds = [
        ...new Set(data.accountIds),
    ];

    // --------------------------------------------------------
    // GENERATE TEMPORARY PASSWORD
    // --------------------------------------------------------

    const temporaryPassword =
        generateTemporaryPassword();

    const passwordHash = await bcrypt.hash(
        temporaryPassword,
        12
    );

    // --------------------------------------------------------
    // DATABASE TRANSACTION
    // --------------------------------------------------------

    let client;
    let transactionStarted = false;

    try {
        client = await pool.connect();

        await client.query("BEGIN");
        transactionStarted = true;

        // ----------------------------------------------------
        // 1. VERIFY SELECTED CASH ACCOUNTS
        // ----------------------------------------------------

        if (accountIds.length > 0) {
            const accountResult = await client.query(
                `
                SELECT
                    id,
                    account_name,
                    employee_id

                FROM cash_accounts

                WHERE
                    business_id = $1
                    AND id = ANY($2::uuid[])
                    AND is_active = TRUE

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
                throw new Error(
                    "INVALID_OR_INACTIVE_ACCOUNTS"
                );
            }

            // ------------------------------------------------
            // 2. CHECK ACCOUNT ASSIGNMENT
            // ------------------------------------------------

            const alreadyAssigned =
                accountResult.rows.find(
                    (account) =>
                        account.employee_id !== null
                );

            if (alreadyAssigned) {
                throw new Error(
                    `ACCOUNT_ALREADY_ASSIGNED:${alreadyAssigned.account_name}`
                );
            }
        }

        // ----------------------------------------------------
        // 3. CREATE EMPLOYEE
        // ----------------------------------------------------

        const employeeResult = await client.query(
            `
            INSERT INTO employees (
                business_id,
                employee_code,
                first_name,
                last_name,
                email,
                phone,
                role,
                is_active,
                username,
                password_hash,
                must_change_password,
                account_status,
                created_at,
                updated_at
            )

            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                'EMPLOYEE',
                TRUE,
                $7,
                $8,
                TRUE,
                'ACTIVE',
                NOW(),
                NOW()
            )

            RETURNING
                id,
                employee_code,
                first_name,
                last_name,
                email,
                phone,
                username,
                role,
                is_active,
                account_status,
                must_change_password,
                created_at
            `,
            [
                session.businessId,
                employeeCode,
                data.firstName.trim(),
                data.lastName.trim(),
                email,
                data.phone?.trim() || null,
                username,
                passwordHash,
            ]
        );

        const employee = employeeResult.rows[0];

        // ----------------------------------------------------
        // 4. ASSIGN CASH ACCOUNTS
        // ----------------------------------------------------

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
                    employee.id,
                    session.businessId,
                    accountIds,
                ]
            );
        }

        // ----------------------------------------------------
        // 5. COMMIT
        // ----------------------------------------------------

        await client.query("COMMIT");
        transactionStarted = false;

        return NextResponse.json(
            {
                success: true,

                message:
                    "Employee account created successfully.",

                employee,

                // Display this password only once.
                temporaryPassword,
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        // ----------------------------------------------------
        // ROLLBACK
        // ----------------------------------------------------

        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "EMPLOYEE ROLLBACK ERROR:",
                    rollbackError
                );
            }
        }

        // ----------------------------------------------------
        // ERROR HANDLING
        // ----------------------------------------------------

        console.error(
            "EMPLOYEES POST ERROR:",
            error
        );

        const dbError = error as {
            code?: string;
            constraint?: string;
        };

        const message =
            error instanceof Error
                ? error.message
                : "";

        if (message === "INVALID_OR_INACTIVE_ACCOUNTS") {
            return errorResponse(
                "One or more selected accounts are invalid or inactive."
            );
        }

        if (message.startsWith("ACCOUNT_ALREADY_ASSIGNED:")) {
            const accountName = message.split(":")[1];

            return errorResponse(
                `${accountName} is already assigned to another employee.`
            );
        }

        if (dbError.code === "23505") {
            if (dbError.constraint?.includes("username")) {
                return errorResponse(
                    "Username already exists in this business."
                );
            }

            if (dbError.constraint?.includes("email")) {
                return errorResponse(
                    "Email address already exists in this business."
                );
            }

            if (dbError.constraint?.includes("employee_code")) {
                return errorResponse(
                    "Employee code already exists in this business."
                );
            }

            return errorResponse(
                "A duplicate employee record was detected."
            );
        }

        return errorResponse(
            "Failed to create employee.",
            500
        );

    } finally {
        if (client) {
            client.release();
        }
    }
}
