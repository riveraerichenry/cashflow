
"use client";

import { useEffect, useMemo, useState } from "react";

import {
    ArrowDownUp,
    Eye,
    Search,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    ArrowRight,
} from "lucide-react";

export type Transfer = {
    id: string;
    transactionNo: string;
    transactionDate: string;
    amount: number;
    referenceNo: string | null;
    description: string | null;
    status: string;
    createdAt: string;
    fromAccountId: string;
    fromAccountName: string;
    fromAccountType: string;
    toAccountId: string;
    toAccountName: string;
    toAccountType: string;
    createdByName: string;
};

type Props = {
    transfers: Transfer[];
    loading: boolean;
    onView: (transfer: Transfer) => void;
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

export default function TransferTable({
    transfers,
    loading,
    onView,
}: Props) {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    /*
    ================================================================
    SEARCH
    ================================================================
    */

    const filteredTransfers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return transfers;

        return transfers.filter((transfer) => {
            return (
                transfer.transactionNo?.toLowerCase().includes(query) ||
                transfer.referenceNo?.toLowerCase().includes(query) ||
                transfer.description?.toLowerCase().includes(query) ||
                transfer.fromAccountName?.toLowerCase().includes(query) ||
                transfer.toAccountName?.toLowerCase().includes(query) ||
                transfer.fromAccountType?.toLowerCase().includes(query) ||
                transfer.toAccountType?.toLowerCase().includes(query) ||
                transfer.createdByName?.toLowerCase().includes(query) ||
                transfer.status?.toLowerCase().includes(query)
            );
        });
    }, [transfers, search]);

    /*
    ================================================================
    PAGINATION
    ================================================================
    */

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTransfers.length / PAGE_SIZE)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedTransfers = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;

        return filteredTransfers.slice(
            start,
            start + PAGE_SIZE
        );
    }, [filteredTransfers, currentPage]);

    const startRecord =
        filteredTransfers.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1;

    const endRecord = Math.min(
        currentPage * PAGE_SIZE,
        filteredTransfers.length
    );

    /*
    ================================================================
    LOADING
    ================================================================
    */

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

                <p className="mt-3 text-sm text-slate-500">
                    Loading transfers...
                </p>
            </div>
        );
    }

    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* HEADER AND SEARCH */}

            <div className="border-b border-slate-100 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">
                            Transfer History
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            View completed transfers between cash accounts.
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-sm">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search transfers..."
                            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </div>

            {/* EMPTY STATE */}

            {filteredTransfers.length === 0 ? (
                <div className="px-6 py-16 text-center">
                    <ArrowDownUp className="mx-auto h-12 w-12 text-slate-300" />

                    <h3 className="mt-4 font-semibold text-slate-800">
                        {transfers.length === 0
                            ? "No transfers yet"
                            : "No matching transfers"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        {transfers.length === 0
                            ? "Completed account transfers will appear here."
                            : "Try another search term."}
                    </p>
                </div>
            ) : (
                <>
                    {/* DESKTOP TABLE */}

                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">
                                        Transfer No.
                                    </th>

                                    <th className="px-5 py-4">
                                        Date
                                    </th>

                                    <th className="px-5 py-4">
                                        From Account
                                    </th>

                                    <th className="px-5 py-4">
                                        To Account
                                    </th>

                                    <th className="px-5 py-4 text-right">
                                        Amount
                                    </th>

                                    <th className="px-5 py-4">
                                        Created By
                                    </th>

                                    <th className="px-5 py-4 text-center">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {paginatedTransfers.map((transfer) => (
                                    <tr
                                        key={transfer.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-800">
                                                {transfer.transactionNo}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {transfer.referenceNo || "No reference"}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                            {formatDate(transfer.transactionDate)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-800">
                                                {transfer.fromAccountName}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {transfer.fromAccountType}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-800">
                                                {transfer.toAccountName}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {transfer.toAccountType}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-800">
                                            {currency(transfer.amount)}
                                        </td>

                                        <td className="px-5 py-4 text-slate-600">
                                            {transfer.createdByName}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onView(transfer)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                <Eye size={15} />
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE AND TABLET CARDS */}

                    <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 lg:hidden">
                        {paginatedTransfers.map((transfer) => (
                            <article
                                key={transfer.id}
                                className="min-w-0 rounded-xl border border-slate-200 bg-white p-4"
                            >
                                {/* HEADER */}

                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="break-all text-sm font-bold text-slate-800">
                                            {transfer.transactionNo}
                                        </p>

                                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                            <CalendarDays size={14} className="shrink-0" />

                                            <span>
                                                {formatDate(transfer.transactionDate)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="shrink-0 text-right text-sm font-bold text-slate-900 sm:text-base">
                                        {currency(transfer.amount)}
                                    </p>
                                </div>

                                {/* TRANSFER FLOW */}

                                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-400">
                                                From
                                            </p>

                                            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                                                {transfer.fromAccountName}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {transfer.fromAccountType}
                                            </p>
                                        </div>

                                        <ArrowRight
                                            size={18}
                                            className="shrink-0 text-blue-600"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-400">
                                                To
                                            </p>

                                            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                                                {transfer.toAccountName}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {transfer.toAccountType}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* DETAILS */}

                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Reference No.
                                        </p>

                                        <p className="mt-1 break-words text-sm font-medium text-slate-700">
                                            {transfer.referenceNo || "No reference"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Created By
                                        </p>

                                        <p className="mt-1 break-words text-sm font-medium text-slate-700">
                                            {transfer.createdByName}
                                        </p>
                                    </div>

                                    {transfer.description && (
                                        <div className="sm:col-span-2">
                                            <p className="text-xs text-slate-400">
                                                Description
                                            </p>

                                            <p className="mt-1 break-words text-sm text-slate-700">
                                                {transfer.description}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ACTION */}

                                <button
                                    type="button"
                                    onClick={() => onView(transfer)}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                                >
                                    <Eye size={15} />
                                    View Transfer Details
                                </button>
                            </article>
                        ))}
                    </div>
                </>
            )}

            {/* PAGINATION */}

            {filteredTransfers.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-center text-xs text-slate-500 sm:text-left sm:text-sm">
                        Showing{" "}
                        <span className="font-semibold text-slate-800">
                            {startRecord}-{endRecord}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-800">
                            {filteredTransfers.length}
                        </span>{" "}
                        transfers
                    </p>

                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) => Math.max(1, page - 1))
                            }
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="whitespace-nowrap px-2 text-xs font-medium text-slate-600">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.min(totalPages, page + 1)
                                )
                            }
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
