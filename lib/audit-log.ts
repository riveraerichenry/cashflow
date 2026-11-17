
type AuditQueryClient = {
    query: (
        text: string,
        values?: unknown[]
    ) => Promise<unknown>;
};

type AuditLogInput = {
    businessId: string;
    employeeId: string | null;
    action: string;
    tableName?: string | null;
    recordId?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string | null;
};

export async function createAuditLog(
    client: AuditQueryClient,
    data: AuditLogInput
) {
    await client.query(
        `
        INSERT INTO audit_logs (
            business_id,
            employee_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values,
            ip_address
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6::jsonb,
            $7::jsonb,
            $8::inet
        )
        `,
        [
            data.businessId,
            data.employeeId,
            data.action,
            data.tableName ?? null,
            data.recordId ?? null,
            data.oldValues
                ? JSON.stringify(data.oldValues)
                : null,
            data.newValues
                ? JSON.stringify(data.newValues)
                : null,
            data.ipAddress ?? null,
        ]
    );
}
