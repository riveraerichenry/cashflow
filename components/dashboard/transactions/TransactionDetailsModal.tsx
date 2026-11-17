
"use client";

import {
    X,
    ArrowDownCircle,
    ArrowUpCircle,
    ReceiptText,
} from "lucide-react";

import type { Transaction } from "./TransactionTable";

type Props = {
    transaction: Transaction | null;
    onClose: () => void;
};

function currency(value: number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value || 0);
}

function formatDate(value: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function Detail({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">
                {label}
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {value || "—"}
            </p>
        </div>
    );
}

export default function TransactionDetailsModal({
    transaction,
    onClose,
}: Props) {
    if (!transaction) return null;

    const cashIn = transaction.direction.toUpperCase() === "IN";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
                            <ReceiptText size={21} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">
                                Transaction Details
                            </h2>
                            <p className="text-xs text-slate-500">
                                Complete ledger record
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6">
                    <div
                        className={`rounded-2xl p-5 ${
                            cashIn
                                ? "bg-green-50"
                                : "bg-red-50"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {cashIn ? (
                                <ArrowDownCircle className="text-green-600" size={22} />
                            ) : (
                                <ArrowUpCircle className="text-red-600" size={22} />
                            )}

                            <span
                                className={`text-xs font-bold uppercase tracking-wider ${
                                    cashIn ? "text-green-700" : "text-red-700"
                                }`}
                            >
                                {transaction.transactionType.replaceAll("_", " ")}
                            </span>
                        </div>

                        <p
                            className={`mt-3 text-3xl font-bold ${
                                cashIn ? "text-green-700" : "text-red-700"
                            }`}
                        >
                            {cashIn ? "+" : "−"}
                            {currency(transaction.ledgerAmount)}
                        </p>

                        <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                            {transaction.transactionNo}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-4 text-sm font-bold text-slate-800">
                            Transaction Information
                        </h3>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Detail
                                label="Transaction Date"
                                value={formatDate(transaction.transactionDate)}
                            />
                            <Detail
                                label="Transaction Number"
                                value={transaction.transactionNo}
                            />
                            <Detail
                                label="Reference Number"
                                value={transaction.referenceNo}
                            />
                            <Detail
                                label="Source"
                                value={transaction.sourceName}
                            />
                            <Detail
                                label="Description"
                                value={transaction.description}
                            />
                            <Detail
                                label="Transaction Status"
                                value="POSTED"
                            />
                        </div>
                    </div>

                    <div className="my-6 border-t border-slate-100" />

                    <div>
                        <h3 className="mb-4 text-sm font-bold text-slate-800">
                            Account Information
                        </h3>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Detail
                                label="Account Name"
                                value={transaction.accountName}
                            />
                            <Detail
                                label="Account Type"
                                value={transaction.accountType}
                            />
                            <Detail
                                label="Account Number"
                                value={transaction.accountNumber}
                            />
                            <Detail
                                label="Running Balance"
                                value={currency(transaction.runningBalance)}
                            />
                        </div>
                    </div>

                    <div className="my-6 border-t border-slate-100" />

                    <div>
                        <h3 className="mb-4 text-sm font-bold text-slate-800">
                            Personnel and Audit Information
                        </h3>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Detail
                                label="Employee"
                                value={transaction.employeeName}
                            />
                            <Detail
                                label="Employee Code"
                                value={transaction.employeeCode}
                            />
                            <Detail
                                label="Recorded By"
                                value={transaction.createdByName}
                            />
                            <Detail
                                label="Approved By"
                                value={
                                    transaction.approvedBy
                                        ? "Owner approval recorded"
                                        : "No separate approval recorded"
                                }
                            />
                            <Detail
                                label="Posted At"
                                value={formatDate(transaction.postedAt)}
                            />
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Ledger movement
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {cashIn ? "Money received" : "Money released"}
                                </p>
                            </div>

                            <p
                                className={`text-lg font-bold ${
                                    cashIn ? "text-green-600" : "text-red-600"
                                }`}
                            >
                                {cashIn ? "+" : "−"}
                                {currency(transaction.ledgerAmount)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-right sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
