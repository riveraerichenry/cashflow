
"use client";

import { useEffect, useState } from "react";

import {
    Search,
    X,
    FileText,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import type { LedgerEntry } from "./types";

import {
    accountTypeLabel,
    formatDate,
    money,
    transactionLabel,
} from "./utils";

type Props = {
    entries: LedgerEntry[];
    totalEntries: number;
    search: string;
    typeFilter: string;
    directionFilter: string;
    closingBalance: number;
    onSearchChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    onDirectionChange: (value: string) => void;
    onClearFilters: () => void;
};

const PAGE_SIZE = 10;

export default function LedgerEntries({
    entries,
    totalEntries,
    search,
    typeFilter,
    directionFilter,
    closingBalance,
    onSearchChange,
    onTypeChange,
    onDirectionChange,
    onClearFilters,
}: Props) {
    /*
    ================================================================
    PAGINATION
    ================================================================
    */

    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(
        1,
        Math.ceil(entries.length / PAGE_SIZE)
    );

    const startIndex = (currentPage - 1) * PAGE_SIZE;

    const paginatedEntries = entries.slice(
        startIndex,
        startIndex + PAGE_SIZE
    );

    /*
    ================================================================
    RESET PAGINATION WHEN FILTERS CHANGE
    ================================================================
    */

    useEffect(() => {
        setCurrentPage(1);
    }, [search, typeFilter, directionFilter]);

    /*
    ================================================================
    KEEP CURRENT PAGE VALID
    ================================================================
    */

    useEffect(() => {
        setCurrentPage((page) =>
            Math.min(page, totalPages)
        );
    }, [totalPages]);

    /*
    ================================================================
    PAGINATION ACTIONS
    ================================================================
    */

    const handlePreviousPage = () => {
        setCurrentPage((page) =>
            Math.max(1, page - 1)
        );
    };

    const handleNextPage = () => {
        setCurrentPage((page) =>
            Math.min(totalPages, page + 1)
        );
    };

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center">

                <div>
                    <h2 className="font-bold text-slate-900">
                        Detailed Ledger Entries
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {entries.length === 0
                            ? "No entries to display"
                            : `Showing ${startIndex + 1}-${Math.min(
                                  startIndex + PAGE_SIZE,
                                  entries.length
                              )} of ${entries.length} filtered entries`}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        onClearFilters();
                        setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700 print:hidden"
                >
                    <X size={15} />
                    Clear filters
                </button>

            </div>

            {/* =====================================================
                FILTERS
            ===================================================== */}

            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-4 md:grid-cols-3 print:hidden">

                {/* SEARCH */}

                <div className="relative">

                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        placeholder="Search transaction..."
                        value={search}
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                    />

                </div>

                {/* TRANSACTION TYPE */}

                <select
                    value={typeFilter}
                    onChange={(event) =>
                        onTypeChange(event.target.value)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                    <option value="ALL">
                        All Transaction Types
                    </option>

                    <option value="CASH_IN">
                        Cash In
                    </option>

                    <option value="WITHDRAWAL">
                        Cash Out
                    </option>

                    <option value="TRANSFER">
                        Transfer
                    </option>

                    <option value="REMITTANCE">
                        Remittance
                    </option>

                    <option value="ADJUSTMENT">
                        Adjustment
                    </option>

                    <option value="REVERSAL">
                        Reversal
                    </option>
                </select>

                {/* DIRECTION */}

                <select
                    value={directionFilter}
                    onChange={(event) =>
                        onDirectionChange(event.target.value)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                    <option value="ALL">
                        Money In and Out
                    </option>

                    <option value="IN">
                        Money In
                    </option>

                    <option value="OUT">
                        Money Out
                    </option>
                </select>

            </div>

            {/* =====================================================
                DESKTOP TABLE
            ===================================================== */}

            <div className="hidden overflow-x-auto lg:block">

                <table className="w-full min-w-[1250px] text-sm">

                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                        <tr>
                            <th className="px-4 py-3 text-left">
                                Date
                            </th>

                            <th className="px-4 py-3 text-left">
                                Transaction No.
                            </th>

                            <th className="px-4 py-3 text-left">
                                Account
                            </th>

                            <th className="px-4 py-3 text-left">
                                Description
                            </th>

                            <th className="px-4 py-3 text-left">
                                Type
                            </th>

                            <th className="px-4 py-3 text-right">
                                Money Out
                            </th>

                            <th className="px-4 py-3 text-right">
                                Money In
                            </th>

                            <th className="px-4 py-3 text-right">
                                Running Balance
                            </th>
                        </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                        {paginatedEntries.map((entry) => (

                            <tr
                                key={entry.ledgerEntryId}
                                className="hover:bg-slate-50"
                            >

                                {/* DATE */}

                                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                                    {formatDate(entry.transactionDate)}
                                </td>

                                {/* TRANSACTION NUMBER */}

                                <td className="whitespace-nowrap px-4 py-4">

                                    <p className="font-semibold text-blue-700">
                                        {entry.transactionNo}
                                    </p>

                                    {entry.referenceNo && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Ref: {entry.referenceNo}
                                        </p>
                                    )}

                                </td>

                                {/* ACCOUNT */}

                                <td className="px-4 py-4">

                                    <p className="font-medium text-slate-800">
                                        {entry.accountName}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {accountTypeLabel(entry.accountType)}
                                    </p>

                                </td>

                                {/* DESCRIPTION */}

                                <td className="max-w-[220px] px-4 py-4">

                                    <p className="truncate text-slate-700">
                                        {entry.description || "-"}
                                    </p>

                                    {entry.employeeName && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            By: {entry.employeeName}
                                        </p>
                                    )}

                                </td>

                                {/* TYPE */}

                                <td className="whitespace-nowrap px-4 py-4">

                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            entry.transactionType === "CASH_IN"
                                                ? "bg-green-100 text-green-700"
                                                : entry.transactionType === "WITHDRAWAL"
                                                  ? "bg-red-100 text-red-700"
                                                  : entry.transactionType === "TRANSFER"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-slate-100 text-slate-700"
                                        }`}
                                    >
                                        {transactionLabel(entry.transactionType)} ({entry.direction})
                                    </span>

                                </td>

                                {/* MONEY OUT */}

                                <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-red-700 tabular-nums">

                                    {entry.direction === "OUT"
                                        ? money(entry.amount)
                                        : "-"}

                                </td>

                                {/* MONEY IN */}

                                <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-green-700 tabular-nums">

                                    {entry.direction === "IN"
                                        ? money(entry.amount)
                                        : "-"}

                                </td>

                                {/* RUNNING BALANCE */}

                                <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-slate-900 tabular-nums">
                                    {money(entry.runningBalance)}
                                </td>

                            </tr>

                        ))}

                        {entries.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-5 py-12 text-center text-slate-500"
                                >
                                    <FileText
                                        size={30}
                                        className="mx-auto mb-2 text-slate-300"
                                    />

                                    No ledger entries found.
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

            {/* =====================================================
                MOBILE CARDS
            ===================================================== */}

            <div className="divide-y divide-slate-200 lg:hidden">

                {paginatedEntries.map((entry) => (

                    <div
                        key={entry.ledgerEntryId}
                        className="p-4"
                    >

                        {/* TOP */}

                        <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                                <p className="break-all text-sm font-bold text-blue-700">
                                    {entry.transactionNo}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {formatDate(entry.transactionDate)}
                                </p>

                            </div>

                            <span
                                className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                                    entry.direction === "IN"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                            >
                                {entry.direction === "IN"
                                    ? "Money In"
                                    : "Money Out"}
                            </span>

                        </div>

                        {/* DETAILS */}

                        <div className="mt-3">

                            <p className="font-semibold text-slate-800">
                                {entry.accountName}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                {entry.description ||
                                    transactionLabel(entry.transactionType)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {transactionLabel(entry.transactionType)}

                                {entry.employeeName
                                    ? ` • ${entry.employeeName}`
                                    : ""}
                            </p>

                            {entry.referenceNo && (
                                <p className="mt-1 text-xs text-slate-500">
                                    Ref: {entry.referenceNo}
                                </p>
                            )}

                        </div>

                        {/* AMOUNT AND BALANCE */}

                        <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">

                            <div>

                                <p className="text-xs text-slate-500">
                                    {entry.direction === "IN"
                                        ? "Amount Received"
                                        : "Amount Released"}
                                </p>

                                <p
                                    className={`mt-1 font-bold tabular-nums ${
                                        entry.direction === "IN"
                                            ? "text-green-700"
                                            : "text-red-700"
                                    }`}
                                >
                                    {money(entry.amount)}
                                </p>

                            </div>

                            <div className="text-right">

                                <p className="text-xs text-slate-500">
                                    Running Balance
                                </p>

                                <p className="mt-1 font-bold text-slate-900 tabular-nums">
                                    {money(entry.runningBalance)}
                                </p>

                            </div>

                        </div>

                    </div>

                ))}

                {entries.length === 0 && (
                    <div className="p-10 text-center text-sm text-slate-500">
                        No ledger entries found.
                    </div>
                )}

            </div>

            {/* =====================================================
                FOOTER
            ===================================================== */}

            <div className="flex flex-col justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm sm:flex-row">

                <span className="text-slate-500">
                    Showing {entries.length === 0 ? 0 : startIndex + 1}
                    {" "}to{" "}
                    {Math.min(startIndex + PAGE_SIZE, entries.length)}
                    {" "}of {entries.length} filtered entries
                    {totalEntries !== entries.length &&
                        ` (${totalEntries} retrieved)`}
                </span>

                <span className="font-semibold text-slate-800">
                    Closing Balance: {money(closingBalance)}
                </span>

            </div>

            {/* =====================================================
                PAGINATION
            ===================================================== */}

            {entries.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between print:hidden">

                    <p className="text-sm text-slate-500">
                        Showing{" "}
                        <span className="font-semibold text-slate-700">
                            {startIndex + 1}
                        </span>
                        {" "}to{" "}
                        <span className="font-semibold text-slate-700">
                            {Math.min(
                                startIndex + PAGE_SIZE,
                                entries.length
                            )}
                        </span>
                        {" "}of{" "}
                        <span className="font-semibold text-slate-700">
                            {entries.length}
                        </span>
                        {" "}entries
                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="whitespace-nowrap px-2 text-sm font-medium text-slate-600">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
