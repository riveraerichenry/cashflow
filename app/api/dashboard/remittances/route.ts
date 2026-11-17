
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import {
    pool,
    getPoolStatus,
} from "@/lib/db";

import {
    getEmployeeSession,
} from "@/lib/employee-auth";

import {
    createAuditLog,
} from "@/lib/audit-log";

function errorResponse(message: string, status = 400) {
    return NextResponse.json(
        {
            success: false,
            message,
        },
        { status }
    );
}

function logPoolStatus(label: string) {
    console.log(
        `REMITTANCE POOL STATUS ${label}:`,
        getPoolStatus()
    );
}

function getClientIp(request: NextRequest): string | null {
    const forwardedFor = request.headers.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() || null;
    }

    return request.headers.get("x-real-ip")?.trim() || null;
}

// ============================================================
// GET REMITTANCES
// ============================================================

export async function GET() {
    const session = await getEmployeeSession();

    if (!session) {
        return errorResponse("Unauthorized.", 401);
    }

    if (session.mustChangePassword) {
        return errorResponse(
            "Please change your password first.",
            403
        );
    }

    const businessId = session.businessId;
    const isOwner = session.role === "OWNER";

    try {
        // ----------------------------------------------------
        // CONNECTION DIAGNOSTICS
        // ----------------------------------------------------

        logPoolStatus("BEFORE");

        // ----------------------------------------------------
        // 1. GET CASH ACCOUNTS
        // ----------------------------------------------------

        const accountsResult = await pool.query(
            `
            SELECT
                ca.id,
                ca.account_name,
                ca.account_type,
                ca.employee_id,
                e.first_name,
                e.last_name,
                COALESCE(cab.balance, 0) AS balance

            FROM cash_accounts ca

            LEFT JOIN employees e
                ON e.id = ca.employee_id
                AND e.business_id = ca.business_id

            LEFT JOIN cash_account_balances cab
                ON cab.account_id = ca.id
                AND cab.business_id = ca.business_id

            WHERE
                ca.business_id = $1
                AND ca.is_active = TRUE
                AND (
                    $2::boolean = TRUE
                    OR ca.employee_id = $3::uuid
                    OR ca.employee_id IS NULL
                )

            ORDER BY ca.account_name
            `,
            [
                businessId,
                isOwner,
                session.employeeId,
            ]
        );

        logPoolStatus("AFTER ACCOUNTS");

        // ----------------------------------------------------
        // 2. GET REMITTANCE REQUESTS
        // ----------------------------------------------------

        const requestsResult = await pool.query(
            `
            SELECT
                rr.id,
                rr.request_no,
                rr.employee_id,
                rr.source_account_id,
                rr.destination_account_id,
                rr.amount,
                rr.purpose,
                rr.reference_no,
                rr.status,
                rr.requested_at,
                rr.confirmed_at,
                rr.rejection_reason,
                rr.transaction_id,

                source.account_name AS source_account_name,
                destination.account_name AS destination_account_name,

                employee.first_name AS employee_first_name,
                employee.last_name AS employee_last_name,

                confirmer.first_name AS confirmer_first_name,
                confirmer.last_name AS confirmer_last_name

            FROM remittance_requests rr

            INNER JOIN cash_accounts source
                ON source.id = rr.source_account_id
                AND source.business_id = rr.business_id

            INNER JOIN cash_accounts destination
                ON destination.id = rr.destination_account_id
                AND destination.business_id = rr.business_id

            INNER JOIN employees employee
                ON employee.id = rr.employee_id
                AND employee.business_id = rr.business_id

            LEFT JOIN employees confirmer
                ON confirmer.id = rr.confirmed_by
                AND confirmer.business_id = rr.business_id

            WHERE
                rr.business_id = $1
                AND (
                    $2::boolean = TRUE
                    OR rr.employee_id = $3::uuid
                )

            ORDER BY rr.requested_at DESC
            LIMIT 300
            `,
            [
                businessId,
                isOwner,
                session.employeeId,
            ]
        );

        logPoolStatus("AFTER REQUESTS");

        // ----------------------------------------------------
        // 3. FORMAT ACCOUNTS
        // ----------------------------------------------------

        const accounts = accountsResult.rows.map((row) => ({
            accountId: row.id,
            accountName: row.account_name,
            accountType: row.account_type,
            employeeId: row.employee_id,

            employeeName: row.first_name
                ? `${row.first_name} ${row.last_name}`
                : null,

            balance: Number(row.balance || 0),
        }));

        // ----------------------------------------------------
        // 4. SOURCE ACCOUNTS
        // ----------------------------------------------------

        const sourceAccounts = isOwner
            ? accounts
            : accounts.filter(
                (account) =>
                    account.employeeId === session.employeeId
            );

        // ----------------------------------------------------
        // 5. DESTINATION ACCOUNTS
        // ----------------------------------------------------

        const destinationAccounts = isOwner
            ? accounts
            : accounts.filter(
                (account) => account.employeeId === null
            );

        // ----------------------------------------------------
        // 6. FORMAT REQUESTS
        // ----------------------------------------------------

        const requests = requestsResult.rows.map((row) => ({
            id: row.id,
            requestNo: row.request_no,

            employeeId: row.employee_id,

            employeeName:
                `${row.employee_first_name} ${row.employee_last_name}`,

            sourceAccountId: row.source_account_id,
            sourceAccountName: row.source_account_name,

            destinationAccountId: row.destination_account_id,
            destinationAccountName: row.destination_account_name,

            amount: Number(row.amount || 0),

            purpose: row.purpose,
            referenceNo: row.reference_no,

            status: row.status,

            requestedAt: row.requested_at,
            confirmedAt: row.confirmed_at,

            confirmedBy: row.confirmer_first_name
                ? `${row.confirmer_first_name} ${row.confirmer_last_name}`
                : null,

            rejectionReason: row.rejection_reason,
            transactionId: row.transaction_id,
        }));

        // ----------------------------------------------------
        // 7. RESPONSE
        // ----------------------------------------------------

        return NextResponse.json({
            success: true,
            accounts,
            sourceAccounts,
            destinationAccounts,
            requests,
        });

    } catch (error) {
        console.error(
            "GET REMITTANCES ERROR:",
            error
        );

        logPoolStatus("AFTER ERROR");

        return errorResponse(
            "Failed to load remittance information.",
            500
        );
    }
}

// ============================================================
// CREATE REMITTANCE REQUEST
// ============================================================

export async function POST(request: NextRequest) {
    const session = await getEmployeeSession();

    if (!session) {
        return errorResponse("Unauthorized.", 401);
    }

    if (session.mustChangePassword) {
        return errorResponse(
            "Please change your password first.",
            403
        );
    }

    if (session.role !== "EMPLOYEE") {
        return errorResponse(
            "Only employees can submit remittance requests.",
            403
        );
    }

    // --------------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------------

    let body: {
        sourceAccountId?: string;
        destinationAccountId?: string;
        amount?: number | string;
        purpose?: string;
        referenceNo?: string;
    };

    try {
        body = await request.json();
    } catch {
        return errorResponse("Invalid request body.");
    }

    const {
        sourceAccountId,
        destinationAccountId,
        amount,
        purpose,
        referenceNo,
    } = body;

    if (!sourceAccountId || !destinationAccountId) {
        return errorResponse(
            "Please select both cash accounts."
        );
    }

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
        !uuidRegex.test(sourceAccountId) ||
        !uuidRegex.test(destinationAccountId)
    ) {
        return errorResponse(
            "Invalid cash account ID."
        );
    }

    if (sourceAccountId === destinationAccountId) {
        return errorResponse(
            "Source and destination accounts must be different."
        );
    }

    const parsedAmount = Number(amount);

    if (
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0 ||
        Math.round(parsedAmount * 100) !== parsedAmount * 100
    ) {
        return errorResponse(
            "Enter a valid amount with up to two decimal places."
        );
    }

    const cleanPurpose = String(purpose || "").trim();
    const cleanReference = String(referenceNo || "").trim();

    if (cleanPurpose.length > 500) {
        return errorResponse(
            "Purpose cannot exceed 500 characters."
        );
    }

    if (cleanReference.length > 100) {
        return errorResponse(
            "Reference number cannot exceed 100 characters."
        );
    }

    const businessId = session.businessId;
    const employeeId = session.employeeId;
    const ipAddress = getClientIp(request);

    // --------------------------------------------------------
    // DATABASE TRANSACTION
    // --------------------------------------------------------

    let client;

    try {
        logPoolStatus("BEFORE POST CONNECTION");

        client = await pool.connect();

        logPoolStatus("AFTER POST CONNECTION");

        await client.query("BEGIN");

        // ----------------------------------------------------
        // 1. LOCK SOURCE AND DESTINATION ACCOUNTS
        // ----------------------------------------------------

        const accountsResult = await client.query(
            `
            SELECT
                id,
                account_name,
                account_type,
                employee_id,
                is_active

            FROM cash_accounts

            WHERE
                business_id = $1
                AND id = ANY($2::uuid[])

            ORDER BY id
            FOR UPDATE
            `,
            [
                businessId,
                [
                    sourceAccountId,
                    destinationAccountId,
                ],
            ]
        );

        if (accountsResult.rows.length !== 2) {
            throw new Error(
                "One or both cash accounts were not found."
            );
        }

        const source = accountsResult.rows.find(
            (account) =>
                account.id === sourceAccountId
        );

        const destination = accountsResult.rows.find(
            (account) =>
                account.id === destinationAccountId
        );

        if (!source || !destination) {
            throw new Error(
                "Invalid cash account selection."
            );
        }

        if (!source.is_active || !destination.is_active) {
            throw new Error(
                "Both cash accounts must be active."
            );
        }

        // ----------------------------------------------------
        // 2. VERIFY SOURCE ACCOUNT OWNERSHIP
        // ----------------------------------------------------

        if (source.employee_id !== employeeId) {
            throw new Error(
                "You can only remit from a cash account assigned to you."
            );
        }

        // ----------------------------------------------------
        // 3. VERIFY DESTINATION ACCOUNT
        // ----------------------------------------------------

        if (destination.employee_id !== null) {
            throw new Error(
                "The receiving account must be a shared business account."
            );
        }

        // ----------------------------------------------------
        // 4. CHECK SOURCE BALANCE
        // ----------------------------------------------------

        const balanceResult = await client.query(
            `
            SELECT balance

            FROM cash_account_balances

            WHERE
                account_id = $1
                AND business_id = $2
            `,
            [
                sourceAccountId,
                businessId,
            ]
        );

        const balance = Number(
            balanceResult.rows[0]?.balance || 0
        );

        if (balance < parsedAmount) {
            throw new Error(
                `Insufficient balance. Available balance: ${balance.toFixed(2)}.`
            );
        }

        // ----------------------------------------------------
        // 5. GENERATE REQUEST NUMBER
        // ----------------------------------------------------

        const requestNo =
            `RM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID()
                .replace(/-/g, "")
                .slice(0, 8)
                .toUpperCase()}`;

        // ----------------------------------------------------
        // 6. CREATE PENDING REMITTANCE REQUEST
        // ----------------------------------------------------

        const result = await client.query(
            `
            INSERT INTO remittance_requests (
                business_id,
                request_no,
                employee_id,
                source_account_id,
                destination_account_id,
                amount,
                purpose,
                reference_no,
                status
            )

            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                'PENDING'
            )

            RETURNING
                id,
                request_no,
                amount,
                status,
                requested_at
            `,
            [
                businessId,
                requestNo,
                employeeId,
                sourceAccountId,
                destinationAccountId,
                parsedAmount,
                cleanPurpose || null,
                cleanReference || null,
            ]
        );

        const remittance = result.rows[0];

        // ----------------------------------------------------
        // 7. AUDIT LOG
        // ----------------------------------------------------

        await createAuditLog(client, {
            businessId,
            employeeId,
            action: "REMITTANCE_REQUESTED",
            tableName: "remittance_requests",
            recordId: remittance.id,

            oldValues: null,

            newValues: {
                requestId: remittance.id,
                requestNo: remittance.request_no,

                employeeId,

                sourceAccountId,
                sourceAccountName: source.account_name,
                sourceAccountType: source.account_type,

                destinationAccountId,
                destinationAccountName: destination.account_name,
                destinationAccountType: destination.account_type,

                sourceBalanceAtRequest: balance.toFixed(2),

                amount: parsedAmount.toFixed(2),
                purpose: cleanPurpose || null,
                referenceNo: cleanReference || null,

                status: "PENDING",
            },

            ipAddress,
        });

        // ----------------------------------------------------
        // 8. COMMIT
        // ----------------------------------------------------

        await client.query("COMMIT");

        return NextResponse.json(
            {
                success: true,

                message:
                    "Remittance request submitted successfully. Awaiting Owner confirmation.",

                request: {
                    id: remittance.id,
                    requestNo: remittance.request_no,
                    amount: Number(remittance.amount),
                    status: remittance.status,
                    requestedAt: remittance.requested_at,
                },
            },
            { status: 201 }
        );

    } catch (error) {
        console.error(
            "CREATE REMITTANCE ERROR:",
            error
        );

        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "REMITTANCE ROLLBACK ERROR:",
                    rollbackError
                );
            }
        }

        logPoolStatus("AFTER POST ERROR");

        const message =
            error instanceof Error
                ? error.message
                : "Failed to submit remittance request.";

        const status =
            message.includes("not found") ? 404 :
            message.includes("only remit") ||
            message.includes("shared business") ? 403 :
            message.includes("Insufficient balance") ||
            message.includes("must be active") ||
            message.includes("different") ? 400 :
            500;

        return errorResponse(
            status === 500
                ? "Failed to submit remittance request."
                : message,
            status
        );

    } finally {
        if (client) {
            client.release();
        }
    }
}
