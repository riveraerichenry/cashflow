
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";
import { z } from "zod";

// ============================================================
// VALIDATION
// ============================================================

const querySchema = z.object({
    search: z.string().max(150).optional(),
    employeeId: z.string().uuid().optional(),
    action: z.string().max(100).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

// ============================================================
// RESPONSE
// ============================================================

function errorResponse(message: string, status = 400) {
    return NextResponse.json(
        {
            success: false,
            message,
        },
        { status }
    );
}

function isValidDate(value?: string) {
    if (!value) return true;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

// ============================================================
// GET AUDIT LOGS
// ============================================================

export async function GET(request: NextRequest) {
    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    let session;

    try {
        session = await getEmployeeSession();
    } catch (error) {
        console.error("Audit logs session error:", error);

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
            "Only the Owner can access activity logs.",
            403
        );
    }

    // --------------------------------------------------------
    // QUERY PARAMETERS
    // --------------------------------------------------------

    const params = Object.fromEntries(
        request.nextUrl.searchParams.entries()
    );

    const parsed = querySchema.safeParse(params);

    if (!parsed.success) {
        return errorResponse(
            parsed.error.issues[0]?.message ||
            "Invalid filter parameters."
        );
    }

    const {
        search,
        employeeId,
        action,
        dateFrom,
        dateTo,
        page,
        pageSize,
    } = parsed.data;

    if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
        return errorResponse(
            "Invalid date format. Use YYYY-MM-DD."
        );
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
        return errorResponse(
            "Start date cannot be later than end date."
        );
    }

    // --------------------------------------------------------
    // BUILD FILTERS
    // --------------------------------------------------------

    const conditions: string[] = [
        "al.business_id = $1",
    ];

    const values: unknown[] = [
        session.businessId,
    ];

    function addFilter(
        condition: (placeholder: string) => string,
        value: unknown
    ) {
        values.push(value);

        conditions.push(
            condition(`$${values.length}`)
        );
    }

    if (employeeId) {
        addFilter(
            (p) => `al.employee_id = ${p}`,
            employeeId
        );
    }

    if (action) {
        addFilter(
            (p) => `al.action = ${p}`,
            action
        );
    }

    // --------------------------------------------------------
    // DATE FILTERS
    // Philippines local calendar dates.
    // --------------------------------------------------------

    if (dateFrom) {
        addFilter(
            (p) => `
                al.created_at >=
                (
                    ${p}::date::timestamp
                    AT TIME ZONE 'Asia/Manila'
                )
            `,
            dateFrom
        );
    }

    if (dateTo) {
        addFilter(
            (p) => `
                al.created_at <
                (
                    (${p}::date + INTERVAL '1 day')::timestamp
                    AT TIME ZONE 'Asia/Manila'
                )
            `,
            dateTo
        );
    }

    // --------------------------------------------------------
    // SEARCH FILTER
    // --------------------------------------------------------

    if (search?.trim()) {
        values.push(`%${search.trim()}%`);

        const p = `$${values.length}`;

        conditions.push(`
            (
                al.action ILIKE ${p}
                OR COALESCE(al.table_name, '') ILIKE ${p}
                OR COALESCE(e.first_name, '') ILIKE ${p}
                OR COALESCE(e.last_name, '') ILIKE ${p}
                OR COALESCE(e.username, '') ILIKE ${p}
                OR COALESCE(al.record_id::text, '') ILIKE ${p}
            )
        `);
    }

    // --------------------------------------------------------
    // PAGINATION
    // --------------------------------------------------------

    const offset = (page - 1) * pageSize;

    values.push(pageSize);
    const limitPlaceholder = `$${values.length}`;

    values.push(offset);
    const offsetPlaceholder = `$${values.length}`;

    // --------------------------------------------------------
    // FETCH RECORDS
    // --------------------------------------------------------

    try {
        const result = await pool.query(
            `
            SELECT
                al.id,
                al.business_id,
                al.employee_id,
                al.action,
                al.table_name,
                al.record_id,
                al.old_values,
                al.new_values,
                al.ip_address::text AS ip_address,
                al.created_at,

                e.employee_code,
                e.first_name,
                e.last_name,
                e.username,

                CASE
                    WHEN e.id IS NOT NULL THEN
                        CONCAT(e.first_name, ' ', e.last_name)
                    ELSE 'System / Unknown'
                END AS employee_name,

                COUNT(*) OVER()::integer AS total_count

            FROM audit_logs al

            LEFT JOIN employees e
                ON e.id = al.employee_id
                AND e.business_id = al.business_id

            WHERE ${conditions.join(" AND ")}

            ORDER BY al.created_at DESC, al.id DESC

            LIMIT ${limitPlaceholder}
            OFFSET ${offsetPlaceholder}
            `,
            values
        );

        const total =
            result.rows.length > 0
                ? result.rows[0].total_count
                : await getTotalCount(
                    session.businessId,
                    conditions,
                    values.slice(0, values.length - 2)
                );

        return NextResponse.json({
            success: true,

            logs: result.rows.map((row) => ({
                id: row.id,
                employeeId: row.employee_id,
                employeeCode: row.employee_code,
                employeeName: row.employee_name,
                username: row.username,

                action: row.action,
                tableName: row.table_name,
                recordId: row.record_id,

                oldValues: row.old_values,
                newValues: row.new_values,

                ipAddress: row.ip_address,
                createdAt: row.created_at,
            })),

            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });

    } catch (error) {
        console.error("Audit logs GET error:", error);

        return errorResponse(
            "Failed to load activity logs.",
            500
        );
    }
}

// ============================================================
// TOTAL COUNT FOR EMPTY PAGES
// ============================================================

async function getTotalCount(
    businessId: string,
    conditions: string[],
    values: unknown[]
) {
    const result = await pool.query(
        `
        SELECT COUNT(*)::integer AS total
        FROM audit_logs al

        LEFT JOIN employees e
            ON e.id = al.employee_id
            AND e.business_id = al.business_id

        WHERE ${conditions.join(" AND ")}
        `,
        values
    );

    return result.rows[0].total;
}
