
"use client";

import { useEffect, useState } from "react";
import type { AccountSummary, LedgerSummary } from "./types";
import { accountTypeLabel, money } from "./utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
    accounts: AccountSummary[];
    summary: LedgerSummary;
};

const PAGE_SIZE = 10;

export default function AccountSummaryTable({
    accounts,
    summary,
}: Props) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(
        1,
        Math.ceil(accounts.length / PAGE_SIZE)
    );

    const startIndex = (currentPage - 1) * PAGE_SIZE;

    const paginatedAccounts = accounts.slice(
        startIndex,
        startIndex + PAGE_SIZE
    );

    useEffect(() => {
        setCurrentPage((page) =>
            Math.min(page, totalPages)
        );
    }, [totalPages]);

    return (
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-bold text-slate-900">
                        Account Summary
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Opening balance, movements, and closing balance per account.
                    </p>
                </div>

                <span className="text-sm text-slate-500">
                    {accounts.length} account(s)
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-5 py-3 text-left">Account</th>
                            <th className="px-5 py-3 text-left">Assigned To</th>
                            <th className="px-5 py-3 text-right">Opening</th>
                            <th className="px-5 py-3 text-right">Money In</th>
                            <th className="px-5 py-3 text-right">Money Out</th>
                            <th className="px-5 py-3 text-right">Closing</th>
                            <th className="px-5 py-3 text-right">Entries</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {paginatedAccounts.map((account) => (
                            <tr
                                key={account.accountId}
                                className="transition hover:bg-slate-50"
                            >
                                <td className="px-5 py-4">
                                    <p className="font-semibold text-slate-800">
                                        {account.accountName}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {accountTypeLabel(account.accountType)}
                                    </p>
                                </td>

                                <td className="px-5 py-4 text-slate-600">
                                    {account.employeeName || "Unassigned"}
                                </td>

                                <td className="px-5 py-4 text-right tabular-nums">
                                    {money(account.openingBalance)}
                                </td>

                                <td className="px-5 py-4 text-right font-medium text-green-700 tabular-nums">
                                    {money(account.totalIn)}
                                </td>

                                <td className="px-5 py-4 text-right font-medium text-red-700 tabular-nums">
                                    {money(account.totalOut)}
                                </td>

                                <td className="px-5 py-4 text-right font-bold text-slate-900 tabular-nums">
                                    {money(account.closingBalance)}
                                </td>

                                <td className="px-5 py-4 text-right text-slate-600">
                                    {account.entryCount}
                                </td>
                            </tr>
                        ))}

                        {accounts.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-5 py-10 text-center text-slate-500"
                                >
                                    No cash accounts found.
                                </td>
                            </tr>
                        )}
                    </tbody>

                    {accounts.length > 0 && (
                        <tfoot className="bg-slate-50 font-bold text-slate-900">
                            <tr>
                                <td colSpan={2} className="px-5 py-4">
                                    TOTAL
                                </td>

                                <td className="px-5 py-4 text-right tabular-nums">
                                    {money(summary.openingBalance)}
                                </td>

                                <td className="px-5 py-4 text-right text-green-700 tabular-nums">
                                    {money(summary.totalIn)}
                                </td>

                                <td className="px-5 py-4 text-right text-red-700 tabular-nums">
                                    {money(summary.totalOut)}
                                </td>

                                <td className="px-5 py-4 text-right tabular-nums">
                                    {money(summary.closingBalance)}
                                </td>

                                <td className="px-5 py-4 text-right">
                                    {summary.entryCount}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {accounts.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Showing{" "}
                        <span className="font-semibold text-slate-700">
                            {startIndex + 1}
                        </span>
                        {" "}to{" "}
                        <span className="font-semibold text-slate-700">
                            {Math.min(startIndex + PAGE_SIZE, accounts.length)}
                        </span>
                        {" "}of{" "}
                        <span className="font-semibold text-slate-700">
                            {accounts.length}
                        </span>
                        {" "}accounts
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) => Math.max(1, page - 1))
                            }
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="px-2 text-sm font-medium text-slate-600">
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
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
