export type Account = {
    accountId: string;
    accountName: string;
    accountType: string;
    employeeId: string | null;
    employeeName: string | null;
    balance: number;
};

export type Remittance = {
    id: string;
    requestNo: string;
    employeeId: string;
    employeeName: string;
    sourceAccountId: string;
    sourceAccountName: string;
    destinationAccountId: string;
    destinationAccountName: string;
    amount: number;
    purpose: string | null;
    referenceNo: string | null;
    status: string;
    requestedAt: string;
    confirmedAt: string | null;
    confirmedBy: string | null;
    rejectionReason: string | null;
    transactionId: string | null;
};

export type Session = {
    employeeId: string;
    role: string;
    firstName: string;
    lastName: string;
};

export type ApiData = {
    success: boolean;
    message?: string;
    accounts: Account[];
    sourceAccounts: Account[];
    destinationAccounts: Account[];
    requests: Remittance[];
};

export type RemittanceAction = "CONFIRM" | "REJECT";

export const currency = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
});

export function money(value: number) {
    return currency.format(Number(value || 0));
}

export function formatDate(value: string) {
    return new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}