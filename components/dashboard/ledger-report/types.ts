export type CashAccount = {
    accountId: string;
    accountName: string;
    accountType: string;
    employeeName: string | null;
    currentBalance: number;
};

export type AccountSummary = {
    accountId: string;
    accountName: string;
    accountType: string;
    employeeId: string | null;
    employeeName: string | null;
    openingBalance: number;
    totalIn: number;
    totalOut: number;
    closingBalance: number;
    currentBalance: number;
    entryCount: number;
};

export type LedgerEntry = {
    ledgerEntryId: string;
    accountId: string;
    accountName: string;
    accountType: string;
    transactionId: string;
    transactionNo: string;
    transactionType: string;
    transactionDate: string;
    direction: "IN" | "OUT";
    amount: number;
    referenceNo: string | null;
    description: string | null;
    employeeId: string | null;
    employeeName: string | null;
    runningBalance: number;
};

export type LedgerSummary = {
    openingBalance: number;
    totalIn: number;
    totalOut: number;
    cashIn: number;
    cashOut: number;
    transferIn: number;
    transferOut: number;
    netMovement: number;
    closingBalance: number;
    entryCount: number;
};

export type LedgerResponse = {
    success: boolean;
    message?: string;
    period: {
        dateFrom: string;
        dateTo: string;
    };
    accounts: CashAccount[];
    summary: LedgerSummary;
    accountSummaries: AccountSummary[];
    entries: LedgerEntry[];
};