"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import type { EmployeeBalance } from "./types";
import { currency } from "./report-utils";

type Props = {
    employees: EmployeeBalance[];
    total: number;
};

export default function EmployeeBalances({
    employees,
    total,
}: Props) {
    const [search, setSearch] = useState("");

    const filteredEmployees = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return employees.filter((employee) => {
            return (
                !keyword ||
                employee.employeeName.toLowerCase().includes(keyword) ||
                employee.employeeCode.toLowerCase().includes(keyword)
            );
        });
    }, [employees, search]);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Users size={19} className="text-blue-700" />

                        <h2 className="text-base font-bold text-gray-900">
                            Employee Accountability
                        </h2>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                        Current funds in employee-assigned accounts
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
                        placeholder="Search employees..."
                        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-60"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-5 py-3">
                                Employee Code
                            </th>

                            <th className="px-5 py-3">
                                Employee Name
                            </th>

                            <th className="px-5 py-3 text-center">
                                Assigned Accounts
                            </th>

                            <th className="px-5 py-3 text-right">
                                Current Balance
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {filteredEmployees.map((employee) => (
                            <tr
                                key={employee.employeeId}
                                className="hover:bg-gray-50"
                            >
                                <td className="px-5 py-4 font-mono text-gray-600">
                                    {employee.employeeCode}
                                </td>

                                <td className="px-5 py-4 font-semibold text-gray-900">
                                    {employee.employeeName}
                                </td>

                                <td className="px-5 py-4 text-center text-gray-600">
                                    {employee.accountCount}
                                </td>

                                <td className="px-5 py-4 text-right font-bold text-gray-900">
                                    {currency(employee.totalBalance)}
                                </td>
                            </tr>
                        ))}

                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-5 py-10 text-center text-gray-400"
                                >
                                    No matching employees found.
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
                                Total Employee-Assigned Funds
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-blue-700">
                                {currency(total)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="border-t border-gray-100 bg-amber-50 px-5 py-3">
                <p className="text-xs leading-relaxed text-amber-800">
                    Employee balances include only assigned accounts.
                    Shared and unassigned accounts are excluded. This is an
                    accountability view, not an additional amount of
                    business funds.
                </p>
            </div>
        </div>
    );
}