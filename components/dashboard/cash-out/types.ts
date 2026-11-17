export type Account = {
    id: string;
    account_name: string;
    account_type: string;
    balance: number | string;
    is_active?: boolean;
};

export type WithdrawalRequest = {
    id: string;
    request_no: string;
    employee_id: string;
    account_id: string;
    amount: number | string;
    purpose: string;
    status: string;
    requested_at: string;
    rejection_reason?: string | null;
    account_name: string;
    account_type: string;
    employee_first_name: string;
    employee_last_name: string;
    employee_username: string;
    approver_first_name?: string | null;
    approver_last_name?: string | null;
};

export type CashOutAction = "APPROVE" | "REJECT" | "RELEASE";

export const currency = (value: number | string) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(value || 0));

export const dateFormat = (value: string) =>
    new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });