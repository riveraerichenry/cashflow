export type ReportSummary = {
    transactionCount: number;
    cashInCount: number;
    cashOutCount: number;
    transferCount: number;
    totalCashIn: number;
    totalCashOut: number;
    totalTransfers: number;
    netMovement: number;
};

export type DailyReport = {
    date: string;
    cashIn: number;
    cashOut: number;
    transfers: number;
    transactionCount: number;
};

export type TransactionTypeReport = {
    transactionType: string;
    transactionCount: number;
    totalAmount: number;
};

export type AccountBalance = {
    accountId: string;
    accountName: string;
    accountType: string;
    employeeId: string | null;
    employeeName: string | null;
    balance: number;
};

export type EmployeeBalance = {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    accountCount: number;
    totalBalance: number;
};

export type ReportData = {
    success: boolean;
    period: {
        dateFrom: string;
        dateTo: string;
    };
    summary: ReportSummary;
    daily: DailyReport[];
    transactionTypes: TransactionTypeReport[];
    accountBalances: AccountBalance[];
    employeeBalances: EmployeeBalance[];
};

export type Preset =
    | "TODAY"
    | "THIS_MONTH"
    | "THIS_YEAR"
    | "CUSTOM";