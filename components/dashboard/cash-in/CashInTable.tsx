
"use client";

import {
    Search,
    ArrowDownLeft,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

type CashInTransaction = {
    id: string;
    transaction_no: string;
    transaction_date: string;
    source_name: string;
    amount: string | number;
    reference_no?: string | null;
    description?: string | null;
    status: string;
    account_name?: string | null;
    account_type?: string | null;
    first_name?: string | null;
    last_name?: string | null;
};

type Props = {
    transactions: CashInTransaction[];
};

const PAGE_SIZE = 10;

export default function CashInTable({ transactions }: Props) {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const formatCurrency = (value: number | string) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(Number(value || 0));

    const formatDate = (value: string) => {
        if (!value) return "—";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
              });
    };

    // FILTER TRANSACTIONS

    const filteredTransactions = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return transactions;

        return transactions.filter((item) =>
            [
                item.transaction_no,
                item.source_name,
                item.reference_no,
                item.account_name,
                item.description,
                item.status,
                item.first_name,
                item.last_name,
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value).toLowerCase().includes(keyword)
                )
        );
    }, [transactions, search]);

    // PAGINATION

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTransactions.length / PAGE_SIZE)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;

        return filteredTransactions.slice(
            startIndex,
            startIndex + PAGE_SIZE
        );
    }, [filteredTransactions, currentPage]);

    const startRecord =
        filteredTransactions.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1;

    const endRecord = Math.min(
        currentPage * PAGE_SIZE,
        filteredTransactions.length
    );

    return (
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* HEADER */}

            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="font-bold text-slate-900">
                        Cash In Transactions
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Latest posted cash receipts
                    </p>
                </div>

                <div className="relative w-full md:max-w-xs">
                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            {/* EMPTY STATE */}

            {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <ArrowDownLeft size={27} />
                    </div>

                    <h3 className="font-semibold text-slate-800">
                        {search
                            ? "No matching transactions"
                            : "No Cash In transactions yet"}
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                        {search
                            ? "Try another transaction number, source, or reference."
                            : "Your posted Cash In transactions will appear here."}
                    </p>
                </div>
            ) : (
                <>
                    {/* DESKTOP TABLE */}

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[950px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">
                                        Transaction No.
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Date
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Source
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Account
                                    </th>
                                    <th className="px-5 py-4 text-right font-semibold">
                                        Amount
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Reference
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {paginatedTransactions.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4 font-semibold text-blue-700">
                                            {item.transaction_no}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                            {formatDate(item.transaction_date)}
                                        </td>

                                        <td className="px-5 py-4 text-slate-800">
                                            {item.source_name || "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-800">
                                                {item.account_name || "—"}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {item.account_type || ""}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums text-emerald-700">
                                            +{formatCurrency(item.amount)}
                                        </td>

                                        <td className="px-5 py-4 text-slate-600">
                                            {item.reference_no || "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}

                    <div className="divide-y divide-slate-100 md:hidden">
                        {paginatedTransactions.map((item) => (
                            <div
                                key={item.id}
                                className="space-y-3 p-4 sm:p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <ArrowDownLeft size={20} />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="break-all text-sm font-bold text-blue-700">
                                                {item.transaction_no}
                                            </p>

                                            <p className="mt-1 break-words text-xs text-slate-500">
                                                {item.source_name || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                        {item.status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                                        CASH IN
                                    </span>

                                    {item.reference_no && (
                                        <span className="break-all rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                            Ref: {item.reference_no}
                                        </span>
                                    )}
                                </div>

                                {item.description && (
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                            Description
                                        </p>

                                        <p className="mt-1 break-words text-xs text-slate-700">
                                            {item.description}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="min-w-0">
                                        <p className="text-slate-400">
                                            Account
                                        </p>

                                        <p className="mt-1 break-words font-semibold text-slate-700">
                                            {item.account_name || "—"}
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            {item.account_type || ""}
                                        </p>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-slate-400">
                                            Received From
                                        </p>

                                        <p className="mt-1 break-words font-semibold text-slate-700">
                                            {item.source_name || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-400">
                                            Date
                                        </p>

                                        <p className="mt-1 flex items-center gap-1 font-medium text-slate-700">
                                            <CalendarDays size={13} />
                                            {formatDate(item.transaction_date)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-400">
                                            Amount
                                        </p>

                                        <p className="mt-1 break-words text-sm font-bold tabular-nums text-emerald-700">
                                            +{formatCurrency(item.amount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* PAGINATION */}

            {filteredTransactions.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-xs text-slate-500">
                        Showing{" "}
                        <span className="font-semibold text-slate-800">
                            {startRecord}-{endRecord}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-800">
                            {filteredTransactions.length}
                        </span>{" "}
                        transactions
                    </p>

                    {filteredTransactions.length > PAGE_SIZE && (
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
                    )}
                </div>
            )}
        </section>
    );
}
