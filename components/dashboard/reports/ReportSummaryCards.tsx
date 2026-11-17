import {
    Activity,
    ArrowLeftRight,
    TrendingDown,
    TrendingUp,
} from "lucide-react";

import type { ReportSummary } from "./types";
import { currency } from "./report-utils";

type Props = {
    summary: ReportSummary;
    accountTotal: number;
    employeeTotal: number;
};

function SummaryCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    valueColor = "text-gray-900",
}: {
    title: string;
    value: number;
    subtitle: string;
    icon: typeof Activity;
    color: string;
    valueColor?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <p
                        className={`mt-2 break-words text-xl font-bold sm:text-2xl ${valueColor}`}
                    >
                        {currency(value)}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                        {subtitle}
                    </p>
                </div>

                <div className={`shrink-0 rounded-xl p-3 ${color}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

export default function ReportSummaryCards({
    summary,
    accountTotal,
    employeeTotal,
}: Props) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
                <SummaryCard
                    title="Total Cash In"
                    value={summary.totalCashIn}
                    subtitle={`${summary.cashInCount} cash-in transactions`}
                    icon={TrendingUp}
                    color="bg-green-100 text-green-700"
                    valueColor="text-green-700"
                />

                <SummaryCard
                    title="Total Cash Out"
                    value={summary.totalCashOut}
                    subtitle={`${summary.cashOutCount} withdrawal transactions`}
                    icon={TrendingDown}
                    color="bg-red-100 text-red-700"
                    valueColor="text-red-700"
                />

                <SummaryCard
                    title="Internal Transfers"
                    value={summary.totalTransfers}
                    subtitle={`${summary.transferCount} transfer transactions`}
                    icon={ArrowLeftRight}
                    color="bg-blue-100 text-blue-700"
                />

                <SummaryCard
                    title="Net Movement"
                    value={summary.netMovement}
                    subtitle="Cash in minus cash out"
                    icon={Activity}
                    color="bg-purple-100 text-purple-700"
                    valueColor={
                        summary.netMovement >= 0
                            ? "text-green-700"
                            : "text-red-700"
                    }
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium text-gray-500">
                        Total Transactions
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {summary.transactionCount}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium text-gray-500">
                        Current Business Funds
                    </p>

                    <p className="mt-2 break-words text-xl font-bold text-blue-700 sm:text-2xl">
                        {currency(accountTotal)}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium text-gray-500">
                        Employee-Assigned Funds
                    </p>

                    <p className="mt-2 break-words text-xl font-bold text-gray-900 sm:text-2xl">
                        {currency(employeeTotal)}
                    </p>
                </div>
            </div>
        </div>
    );
}