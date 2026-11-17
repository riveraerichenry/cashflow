import type { ElementType } from "react";

import {
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
} from "lucide-react";

import type { LedgerSummary } from "./types";
import { money } from "./utils";

type Props = {
    summary: LedgerSummary;
};

function SummaryCard({
    title,
    amount,
    icon: Icon,
    color,
    description,
}: {
    title: string;
    amount: number;
    icon: ElementType;
    color: string;
    description?: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl">
                        {money(amount)}
                    </p>

                    {description && (
                        <p className="mt-1 text-xs text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                <div className={`shrink-0 rounded-lg p-3 ${color}`}>
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

export default function LedgerSummaryCards({ summary }: Props) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
                title="Opening Balance"
                amount={summary.openingBalance}
                icon={Wallet}
                color="bg-slate-100 text-slate-700"
                description="Balance before the reporting period"
            />

            <SummaryCard
                title="Cash In"
                amount={summary.cashIn}
                icon={ArrowDownLeft}
                color="bg-green-100 text-green-700"
                description="External cash received"
            />

            <SummaryCard
                title="Cash Out"
                amount={summary.cashOut}
                icon={ArrowUpRight}
                color="bg-red-100 text-red-700"
                description="Released withdrawals"
            />

            <SummaryCard
                title="Transfer In"
                amount={summary.transferIn}
                icon={ArrowDownLeft}
                color="bg-blue-100 text-blue-700"
                description="Funds transferred into accounts"
            />

            <SummaryCard
                title="Transfer Out"
                amount={summary.transferOut}
                icon={ArrowUpRight}
                color="bg-orange-100 text-orange-700"
                description="Funds transferred between accounts"
            />

            <SummaryCard
                title="Closing Balance"
                amount={summary.closingBalance}
                icon={Wallet}
                color="bg-indigo-100 text-indigo-700"
                description="Balance at the end of the reporting period"
            />
        </div>
    );
}