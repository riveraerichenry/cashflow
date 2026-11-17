
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { getEmployeeSession } from "@/lib/employee-auth";
import { createAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const requestSchema = z.object({
    accountId: z.string().uuid("Invalid cash account."),
    amount: z.coerce.number().positive().max(999999999999),
    purpose: z.string().trim().min(3, "Please enter the purpose.").max(1000),
});

function errorResponse(message: string, status = 400) {
    return NextResponse.json(
        { success: false, message },
        { status }
    );
}

function generateRequestNo() {
    const date = new Date();

    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("");

    return `CO-${datePart}-${randomUUID()
        .replace(/-/g, "")
        .slice(0, 8)
        .toUpperCase()}`;
}

function getClientIp(request: NextRequest): string | null {
    const forwardedFor = request.headers.get("x-forwarded-for");

    if (forwardedFor) {
        const ip = forwardedFor.split(",")[0]?.trim();
        return ip || null;
    }

    return request.headers.get("x-real-ip")?.trim() || null;
}

export async function GET() {
    const session = await getEmployeeSession();

    if (!session) {
        return errorResponse("Unauthorized.", 401);
    }

    if (session.mustChangePassword) {
        return errorResponse("Please change your password first.", 403);
    }

    try {
        const isOwner = session.role === "OWNER";

        const result = await pool.query(
            `
            SELECT
                wr.id,
                wr.request_no,
                wr.business_id,
                wr.employee_id,
                wr.account_id,
                wr.amount,
                wr.purpose,
                wr.status,
                wr.requested_at,
                wr.approved_by,
                wr.approved_at,
                wr.rejection_reason,
                wr.released_transaction_id,
                wr.created_at,
                wr.updated_at,

                ca.account_name,
                ca.account_type,

                requester.first_name AS employee_first_name,
                requester.last_name AS employee_last_name,
                requester.username AS employee_username,

                approver.first_name AS approver_first_name,
                approver.last_name AS approver_last_name

            FROM withdrawal_requests wr

            INNER JOIN cash_accounts ca
                ON ca.id = wr.account_id
                AND ca.business_id = wr.business_id

            INNER JOIN employees requester
                ON requester.id = wr.employee_id
                AND requester.business_id = wr.business_id

            LEFT JOIN employees approver
                ON approver.id = wr.approved_by
                AND approver.business_id = wr.business_id

            WHERE
                wr.business_id = $1
                AND ($2::boolean = TRUE OR wr.employee_id = $3)

            ORDER BY wr.requested_at DESC

            LIMIT 200
            `,
            [
                session.businessId,
                isOwner,
                session.employeeId,
            ]
        );

        return NextResponse.json({
            success: true,
            requests: result.rows,
        });
    } catch (error) {
        console.error("Cash Out GET error:", error);

        return errorResponse(
            "Failed to retrieve withdrawal requests.",
            500
        );
    }
}

export async function POST(request: NextRequest) {
    const session = await getEmployeeSession();

    if (!session) {
        return errorResponse("Unauthorized.", 401);
    }

    if (session.mustChangePassword) {
        return errorResponse("Please change your password first.", 403);
    }

    if (session.role !== "EMPLOYEE") {
        return errorResponse(
            "Only employees can submit withdrawal requests.",
            403
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
        return errorResponse(
            parsed.error.issues[0]?.message || "Invalid request details."
        );
    }

    const { accountId, amount, purpose } = parsed.data;

    if (
        !Number.isFinite(amount) ||
        Math.round(amount * 100) !== amount * 100
    ) {
        return errorResponse(
            "Amount must have no more than two decimal places."
        );
    }

    const ipAddress = getClientIp(request);

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const accountResult = await client.query(
            `
            SELECT
                id,
                account_name,
                account_type,
                employee_id
            FROM cash_accounts
            WHERE
                id = $1
                AND business_id = $2
                AND is_active = TRUE
            FOR UPDATE
            `,
            [accountId, session.businessId]
        );

        if (accountResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return errorResponse(
                "Selected cash account is unavailable."
            );
        }

        const account = accountResult.rows[0];

        // Employees may request from shared accounts
        // or their own assigned account.
        if (
            account.employee_id &&
            account.employee_id !== session.employeeId
        ) {
            await client.query("ROLLBACK");

            return errorResponse(
                "You cannot request a withdrawal from another employee's account.",
                403
            );
        }

        const requestNo = generateRequestNo();

        const result = await client.query(
            `
            INSERT INTO withdrawal_requests (
                business_id,
                request_no,
                employee_id,
                account_id,
                amount,
                purpose,
                status,
                requested_at,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                'PENDING', NOW(), NOW(), NOW()
            )
            RETURNING *
            `,
            [
                session.businessId,
                requestNo,
                session.employeeId,
                accountId,
                amount.toFixed(2),
                purpose,
            ]
        );

        const withdrawalRequest = result.rows[0];

        // Record the withdrawal request in the audit log.
        await createAuditLog(client, {
            businessId: session.businessId,
            employeeId: session.employeeId,
            action: "CASH_OUT_REQUESTED",
            tableName: "withdrawal_requests",
            recordId: withdrawalRequest.id,
            oldValues: null,
            newValues: {
                requestId: withdrawalRequest.id,
                requestNo: withdrawalRequest.request_no,
                employeeId: session.employeeId,
                accountId,
                accountName: account.account_name,
                accountType: account.account_type,
                amount: amount.toFixed(2),
                purpose,
                status: "PENDING",
            },
            ipAddress,
        });

        await client.query("COMMIT");

        return NextResponse.json(
            {
                success: true,
                message: "Withdrawal request submitted successfully.",
                request: {
                    ...withdrawalRequest,
                    account_name: account.account_name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => undefined);
        }

        console.error("Cash Out POST error:", error);

        return errorResponse(
            "Failed to submit withdrawal request.",
            500
        );
    } finally {
        client?.release();
    }
}
