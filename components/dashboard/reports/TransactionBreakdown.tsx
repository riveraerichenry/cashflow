import type {
    ReportSummary,
    TransactionTypeReport,
} from "./types";

import {
    currency,
    transactionTypeColors,
    transactionTypeLabels,
} from "./report-utils";

type Props = {
    items: TransactionTypeReport[];
    summary: ReportSummary;
};

export default function TransactionBreakdown({
    items,
    summary,
}: Props) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">
                Transaction Breakdown
            </h2>

            <p className="mt-1 text-xs text-gray-500">
                By transaction type
            </p>

            <div className="mt-5 space-y-5">
                {items.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-400">
                        No transactions found.
                    </p>
                ) : (
                    items.map((item) => {
                        const percentage =
                            summary.transactionCount > 0
                                ? (item.transactionCount /
                                      summary.transactionCount) *
                                  100
                                : 0;

                        return (
                            <div key={item.transactionType}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {transactionTypeLabels[
                                                item.transactionType
                                            ] || item.transactionType}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {item.transactionCount} transaction(s)
                                        </p>
                                    </div>

                                    <p className="shrink-0 text-sm font-bold text-gray-900">
                                        {currency(item.totalAmount)}
                                    </p>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className={`h-full rounded-full ${
                                            transactionTypeColors[
                                                item.transactionType
                                            ] || "bg-gray-500"
                                        }`}
                                        style={{
                                            width: `${Math.min(100, percentage)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-3">
                <p className="text-xs leading-relaxed text-blue-800">
                    Transfers are shown separately and are excluded from
                    net cash movement.
                </p>
            </div>
        </div>
    );
}