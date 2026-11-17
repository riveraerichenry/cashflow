
export type WithdrawalRequest = {
    id: string;
    request_no: string;
    business_id: string;
    employee_id: string;
    account_id: string;
    amount: string | number;
    purpose: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "RELEASED" | "CANCELLED";
    requested_at: string;
    approved_by: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    released_transaction_id: string | null;
    created_at: string;
    updated_at: string;
    account_name: string;
    account_type: string;
    employee_first_name: string;
    employee_last_name: string;
    employee_username: string;
    approver_first_name: string | null;
    approver_last_name: string | null;
};

export type FilterStatus =
    | "ALL"
    | "PENDING"
    | "APPROVED"
    | "RELEASED"
    | "REJECTED"
    | "CANCELLED";

export type ProcessingAction = "APPROVE" | "RELEASE" | "REJECT";

export const currency = (value: number | string) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(value || 0));

export const formatDate = (value: string) => {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const statusStyles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-blue-100 text-blue-800",
    RELEASED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-700",
};
