"use client";

import { CalendarDays } from "lucide-react";

import type { CashAccount } from "./types";
import { today } from "./utils";

type Props = {
    dateFrom: string;
    dateTo: string;
    accountId: string;
    accounts: CashAccount[];
    loading: boolean;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onAccountChange: (value: string) => void;
    onGenerate: () => void;
};

export default function LedgerFilters({
    dateFrom,
    dateTo,
    accountId,
    accounts,
    loading,
    onDateFromChange,
    onDateToChange,
    onAccountChange,
    onGenerate,
}: Props) {
    return (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
            <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={19} className="text-blue-700" />

                <h2 className="font-semibold text-slate-800">
                    Report Filters
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                        Date From
                    </label>

                    <input
                        type="date"
                        value={dateFrom}
                        max={dateTo}
                        onChange={(event) =>
                            onDateFromChange(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                        Date To
                    </label>

                    <input
                        type="date"
                        value={dateTo}
                        min={dateFrom}
                        max={today()}
                        onChange={(event) =>
                            onDateToChange(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                        Cash Account
                    </label>

                    <select
                        value={accountId}
                        onChange={(event) =>
                            onAccountChange(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="ALL">
                            All Cash Accounts
                        </option>

                        {accounts.map((account) => (
                            <option
                                key={account.accountId}
                                value={account.accountId}
                            >
                                {account.accountName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={onGenerate}
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                        Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
}