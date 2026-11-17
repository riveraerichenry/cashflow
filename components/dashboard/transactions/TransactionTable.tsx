
"use client";

import {
    ArrowDownCircle,
    ArrowUpCircle,
    Eye,
    ReceiptText,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

export type Transaction = {
    ledgerEntryId: string;
    transactionNo: string;
    transactionId: string;
    transactionType: string;
    transactionDate: string;
    transactionAmount: number;
    direction: string;
    ledgerAmount: number;
    runningBalance: number;
    accountId: string;
    accountName: string;
    accountType: string;
    accountNumber: string | null;
    sourceName: string | null;
    referenceNo: string | null;
    description: string;
    employeeId: string | null;
    employeeName: string;
    employeeCode: string | null;
    createdBy: string | null;
    createdByName: string;
    approvedBy: string | null;
    postedAt: string | null;
};

type Props = {
    transactions: Transaction[];
    loading: boolean;
    onView: (transaction: Transaction) => void;
};

const PAGE_SIZE = 10;

function currency(value: number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value || 0);
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function isCashIn(transaction: Transaction) {
    return transaction.direction.toUpperCase() === "IN";
}

export default function TransactionTable({
    transactions,
    loading,
    onView,
}: Props) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(
        1,
        Math.ceil(transactions.length / PAGE_SIZE)
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;

        return transactions.slice(
            startIndex,
            startIndex + PAGE_SIZE
        );
    }, [transactions, currentPage]);

    const startRecord =
        transactions.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1;

    const endRecord = Math.min(
        currentPage * PAGE_SIZE,
        transactions.length
    );

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

                <p className="mt-3 text-sm text-slate-500">
                    Loading transaction history...
                </p>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                <ReceiptText className="mx-auto h-12 w-12 text-slate-300" />

                <h3 className="mt-4 font-semibold text-slate-800">
                    No transactions found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Try changing your filters or search terms.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] text-left text-sm">

                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-5 py-4">Transaction</th>
                            <th className="px-5 py-4">Date</th>
                            <th className="px-5 py-4">Account</th>
                            <th className="px-5 py-4">Employee</th>
                            <th className="px-5 py-4 text-right">Amount</th>
                            <th className="px-5 py-4 text-right">Running Balance</th>
                            <th className="px-5 py-4 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {paginatedTransactions.map((transaction) => {
                            const cashIn = isCashIn(transaction);

                            return (
                                <tr
                                    key={transaction.ledgerEntryId}
                                    className="transition hover:bg-slate-50"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`rounded-xl p-2 ${
                                                    cashIn
                                                        ? "bg-green-50 text-green-600"
                                                        : "bg-red-50 text-red-600"
                                                }`}
                                            >
                                                {cashIn ? (
                                                    <ArrowDownCircle size={20} />
                                                ) : (
                                                    <ArrowUpCircle size={20} />
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800">
                                                    {transaction.transactionNo}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {transaction.sourceName ||
                                                        transaction.description ||
                                                        transaction.transactionType}
                                                </p>

                                                <span
                                                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${
                                                        cashIn
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {transaction.transactionType.replaceAll("_", " ")}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                        {formatDate(transaction.transactionDate)}
                                    </td>

                                    <td className="px-5 py-4">
                                        <p className="font-medium text-slate-800">
                                            {transaction.accountName}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            {transaction.accountType}
                                        </p>
                                    </td>

                                    <td className="px-5 py-4">
                                        <p className="font-medium text-slate-700">
                                            {transaction.employeeName}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            {transaction.employeeCode || "—"}
                                        </p>
                                    </td>

                                    <td
                                        className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                                            cashIn
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {cashIn ? "+" : "−"}
                                        {currency(transaction.ledgerAmount)}
                                    </td>

                                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-800">
                                        {currency(transaction.runningBalance)}
                                    </td>

                                    <td className="px-5 py-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => onView(transaction)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            <Eye size={15} />
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MOBILE AND TABLET CARDS */}

            <div className="divide-y divide-slate-100 lg:hidden">
                {paginatedTransactions.map((transaction) => {
                    const cashIn = isCashIn(transaction);

                    return (
                        <div
                            key={transaction.ledgerEntryId}
                            className="p-4 sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div
                                        className={`rounded-xl p-2 ${
                                            cashIn
                                                ? "bg-green-50 text-green-600"
                                                : "bg-red-50 text-red-600"
                                        }`}
                                    >
                                        {cashIn ? (
                                            <ArrowDownCircle size={20} />
                                        ) : (
                                            <ArrowUpCircle size={20} />
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="break-all text-sm font-bold text-slate-800">
                                            {transaction.transactionNo}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {formatDate(transaction.transactionDate)}
                                        </p>
                                    </div>
                                </div>

                                <p
                                    className={`max-w-[46%] shrink-0 break-words text-right text-sm font-bold tabular-nums ${
                                        cashIn
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {cashIn ? "+" : "−"}
                                    {currency(transaction.ledgerAmount)}
                                </p>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                        cashIn
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {transaction.transactionType.replaceAll("_", " ")}
                                </span>

                                {transaction.referenceNo && (
                                    <span className="max-w-full break-all rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                                        Ref: {transaction.referenceNo}
                                    </span>
                                )}
                            </div>

                            {(transaction.sourceName || transaction.description) && (
                                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                        Description
                                    </p>

                                    <p className="mt-1 break-words text-xs text-slate-700">
                                        {transaction.sourceName || transaction.description}
                                    </p>
                                </div>
                            )}

                            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-xs sm:grid-cols-3">
                                <div className="min-w-0">
                                    <p className="text-slate-400">Account</p>

                                    <p className="mt-1 break-words font-semibold text-slate-700">
                                        {transaction.accountName}
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                        {transaction.accountType}
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-slate-400">Employee</p>

                                    <p className="mt-1 break-words font-semibold text-slate-700">
                                        {transaction.employeeName}
                                    </p>

                                    {transaction.employeeCode && (
                                        <p className="mt-0.5 break-all text-[10px] text-slate-400">
                                            {transaction.employeeCode}
                                        </p>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-slate-400">Running Balance</p>

                                    <p className="mt-1 break-words font-bold text-slate-800">
                                        {currency(transaction.runningBalance)}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onView(transaction)}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            >
                                <Eye size={15} />
                                View Transaction Details
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* PAGINATION */}

            {transactions.length > PAGE_SIZE && (
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

                    <p className="text-xs text-slate-500">
                        Showing{" "}
                        <span className="font-semibold text-slate-800">
                            {startRecord}-{endRecord}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-800">
                            {transactions.length}
                        </span>{" "}
                        transactions
                    </p>

                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <span className="mr-2 text-xs text-slate-500">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.max(1, page - 1)
                                )
                            }
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={15} />
                            Previous
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.min(totalPages, page + 1)
                                )
                            }
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
