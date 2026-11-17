import { formatDate, formatShortDate, currency } from "./report-utils";
import type { DailyReport } from "./types";

type Props = {
    daily: DailyReport[];
};

export default function DailyMovementChart({ daily }: Props) {
    const dailyMaximum = Math.max(
        1,
        ...daily.flatMap((row) => [
            Number(row.cashIn),
            Number(row.cashOut),
            Number(row.transfers),
        ])
    );

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-bold text-gray-900">
                        Daily Cash Flow
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                        Daily cash-in, cash-out, and transfers
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                        Cash In
                    </span>

                    <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        Cash Out
                    </span>

                    <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        Transfers
                    </span>
                </div>
            </div>

            {daily.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                    No transaction activity for this period.
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    <div className="flex h-64 items-end gap-2 overflow-x-auto border-b border-gray-200 pb-2">
                        {daily.map((day) => {
                            const values = [
                                {
                                    key: "in",
                                    value: Number(day.cashIn),
                                    color: "bg-green-500",
                                },
                                {
                                    key: "out",
                                    value: Number(day.cashOut),
                                    color: "bg-red-500",
                                },
                                {
                                    key: "transfer",
                                    value: Number(day.transfers),
                                    color: "bg-blue-500",
                                },
                            ];

                            return (
                                <div
                                    key={day.date}
                                    className="flex h-full min-w-12 flex-1 flex-col items-center justify-end"
                                    title={`${formatDate(day.date)} | Cash In: ${currency(day.cashIn)} | Cash Out: ${currency(day.cashOut)} | Transfers: ${currency(day.transfers)}`}
                                >
                                    <div className="flex h-full w-full items-end justify-center gap-1">
                                        {values.map((item) => (
                                            <div
                                                key={item.key}
                                                className={`w-full max-w-5 rounded-t-sm ${item.color}`}
                                                style={{
                                                    height:
                                                        item.value > 0
                                                            ? `${Math.max(3, (item.value / dailyMaximum) * 100)}%`
                                                            : "0%",
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <span className="mt-2 whitespace-nowrap text-[10px] text-gray-500">
                                        {formatShortDate(day.date)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-xs text-gray-400">
                        Each group represents one day. Hover over a group to
                        see its exact amounts.
                    </p>
                </div>
            )}
        </div>
    );
}