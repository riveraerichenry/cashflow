
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { pool } from "@/lib/db";

export const EMPLOYEE_COOKIE = "cashflow_employee_session";

export type EmployeeRole = "OWNER" | "ADMIN" | "EMPLOYEE";

export type EmployeeSession = {
    employeeId: string;
    businessId: string;
    role: EmployeeRole;
    username: string;
    firstName: string;
    lastName: string;
    businessName: string;
    businessCode: string;
    mustChangePassword: boolean;
};

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(EMPLOYEE_COOKIE)?.value;

    if (!token || !process.env.JWT_SECRET) {
        return null;
    }

    let payload;

    // STEP 1: Verify JWT
    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET
        );

        const verified = await jwtVerify(token, secret);

        payload = verified.payload;

    } catch {
        // Invalid, expired, or improperly signed token
        return null;
    }

    // STEP 2: Validate JWT claims
    if (
        payload.role !== "OWNER" &&
        payload.role !== "ADMIN" &&
        payload.role !== "EMPLOYEE"
    ) {
        return null;
    }

    if (
        !payload.sub ||
        typeof payload.businessId !== "string"
    ) {
        return null;
    }

    // STEP 3: Verify employee against database
    // Database errors intentionally propagate instead of
    // being incorrectly treated as authentication failures.

    const result = await pool.query(
        `
        SELECT
            e.id,
            e.business_id,
            e.role,
            e.username,
            e.first_name,
            e.last_name,
            e.must_change_password,
            b.business_name,
            b.business_code
        FROM employees e
        INNER JOIN businesses b
            ON b.id = e.business_id
        WHERE e.id = $1
          AND e.business_id = $2
          AND e.is_active = TRUE
          AND e.account_status = 'ACTIVE'
          AND b.is_active = TRUE
        LIMIT 1
        `,
        [payload.sub, payload.businessId]
    );

    if (result.rowCount !== 1) {
        return null;
    }

    const employee = result.rows[0];

    // Prevent role changes from being bypassed by an old JWT
    if (employee.role !== payload.role) {
        return null;
    }

    return {
        employeeId: employee.id,
        businessId: employee.business_id,
        role: employee.role,
        username: employee.username,
        firstName: employee.first_name,
        lastName: employee.last_name,
        businessName: employee.business_name,
        businessCode: employee.business_code,
        mustChangePassword: employee.must_change_password,
    };
}

// Check whether a session has one of the permitted roles.
export function hasRole(
    session: EmployeeSession,
    allowedRoles: EmployeeRole[]
): boolean {
    return allowedRoles.includes(session.role);
}

// Convenient role checks
export function isOwner(session: EmployeeSession): boolean {
    return hasRole(session, ["OWNER"]);
}

export function isAdmin(session: EmployeeSession): boolean {
    return hasRole(session, ["ADMIN"]);
}

export function isOwnerOrAdmin(
    session: EmployeeSession
): boolean {
    return hasRole(session, ["OWNER", "ADMIN"]);
}

export function isEmployee(session: EmployeeSession): boolean {
    return hasRole(session, ["EMPLOYEE"]);
}
