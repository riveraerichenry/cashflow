"use client";

import { useMemo, useState } from "react";
import { Search, Wallet } from "lucide-react";

import type { AccountBalance } from "./types";
import { currency } from "./report-utils";

type Props = {
    accounts: AccountBalance[];
    total: number;
};

export default function AccountBalances({
    accounts,
    total,
}: Props) {
    const [search, setSearch] = useState("");

    const filteredAccounts = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return accounts.filter((account) => {
            return (
                !keyword ||
                account.accountName.toLowerCase().includes(keyword) ||
                account.accountType.toLowerCase().includes(keyword) ||
                (account.employeeName || "")
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [accounts, search]);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Wallet size={19} className="text-blue-700" />

                        <h2 className="text-base font-bold text-gray-900">
                            Cash Account Balances
                        </h2>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                        Current balances across active business accounts
                    </p>
                </div>

                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search accounts..."
                        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-60"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-5 py-3">Account</th>
                            <th className="px-5 py-3">Type</th>
                            <th className="px-5 py-3">Assigned To</th>
                            <th className="px-5 py-3 text-right">
                                Current Balance
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {filteredAccounts.map((account) => (
                            <tr
                                key={account.accountId}
                                className="hover:bg-gray-50"
                            >
                                <td className="px-5 py-4 font-semibold text-gray-900">
                                    {account.accountName}
                                </td>

                                <td className="px-5 py-4">
                                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                        {account.accountType}
                                    </span>
                                </td>

                                <td className="px-5 py-4 text-gray-600">
                                    {account.employeeName || (
                                        <span className="text-gray-400">
                                            Shared / Unassigned
                                        </span>
                                    )}
                                </td>

                                <td className="px-5 py-4 text-right font-bold text-gray-900">
                                    {currency(account.balance)}
                                </td>
                            </tr>
                        ))}

                        {filteredAccounts.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-5 py-10 text-center text-gray-400"
                                >
                                    No matching accounts found.
                                </td>
                            </tr>
                        )}
                    </tbody>

                    <tfoot className="bg-gray-50">
                        <tr>
                            <td
                                colSpan={3}
                                className="px-5 py-4 font-bold text-gray-900"
                            >
                                Total Current Business Funds
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-blue-700">
                                {currency(total)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}