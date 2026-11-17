
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { z } from "zod";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
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

const updateSchema = z.object({
    isActive: z.boolean(),
});

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        // Verify administrator session.
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

        // Validate business ID.
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

        // Validate request body.
        const body = await request.json();
        const validation = updateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid business status.",
                },
                { status: 400 }
            );
        }

        const { isActive } = validation.data;

        // Check if business exists and update its status.
        const result = await pool.query(
            `
            UPDATE businesses
            SET
                is_active = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING
                id,
                business_name,
                business_code,
                is_active,
                created_at
            `,
            [isActive, id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Business not found.",
                },
                { status: 404 }
            );
        }

        const business = result.rows[0];

        return NextResponse.json({
            success: true,
            message: `Business successfully ${
                isActive ? "activated" : "deactivated"
            }.`,
            business,
        });

    } catch (error) {
        console.error("UPDATE BUSINESS STATUS ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to update business status.",
            },
            { status: 500 }
        );
    }
}
