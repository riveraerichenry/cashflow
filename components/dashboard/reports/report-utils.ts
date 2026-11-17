export const currency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

export const compactCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(Number(value || 0));

export function localDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function getMonthStart() {
    const now = new Date();

    return localDate(
        new Date(now.getFullYear(), now.getMonth(), 1)
    );
}

export function getYearStart() {
    const now = new Date();

    return `${now.getFullYear()}-01-01`;
}

export function formatDate(value: string) {
    if (!value) return "—";

    const [year, month, day] = value.slice(0, 10).split("-");

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    ).toLocaleDateString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

export function formatShortDate(value: string) {
    if (!value) return "";

    const [year, month, day] = value.slice(0, 10).split("-");

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    ).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
    });
}

export function escapeCSV(value: unknown) {
    const text = String(value ?? "");

    return `"${text.replace(/"/g, '""')}"`;
}

export const transactionTypeLabels: Record<string, string> = {
    CASH_IN: "Cash In",
    WITHDRAWAL: "Cash Out",
    TRANSFER: "Transfers",
    ADJUSTMENT: "Adjustments",
    REVERSAL: "Reversals",
    REMITTANCE: "Remittances",
};

export const transactionTypeColors: Record<string, string> = {
    CASH_IN: "bg-green-500",
    WITHDRAWAL: "bg-red-500",
    TRANSFER: "bg-blue-500",
    ADJUSTMENT: "bg-amber-500",
    REVERSAL: "bg-purple-500",
    REMITTANCE: "bg-cyan-500",
};