const peso = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
});

export function money(value: number) {
    return peso.format(Number(value || 0));
}

export function formatDate(value: string) {
    if (!value) return "-";

    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) return value;

    return new Date(year, month - 1, day).toLocaleDateString(
        "en-PH",
        {
            month: "short",
            day: "2-digit",
            year: "numeric",
        }
    );
}

export function today() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function monthStart() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}-01`;
}

export function accountTypeLabel(type: string) {
    switch (type) {
        case "CASH":
            return "Cash";
        case "BANK":
            return "Bank";
        case "EWALLET":
            return "E-Wallet";
        default:
            return type;
    }
}

export function transactionLabel(type: string) {
    switch (type) {
        case "CASH_IN":
            return "Cash In";
        case "WITHDRAWAL":
            return "Cash Out";
        case "TRANSFER":
            return "Transfer";
        case "REMITTANCE":
            return "Remittance";
        case "ADJUSTMENT":
            return "Adjustment";
        case "REVERSAL":
            return "Reversal";
        default:
            return type;
    }
}

export function escapeCsv(value: unknown) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}