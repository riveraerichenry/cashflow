"use client";

import { CalendarDays } from "lucide-react";

import type { Preset } from "./types";
import { formatDate } from "./report-utils";

type Props = {
    dateFrom: string;
    dateTo: string;
    preset: Preset;
    loading: boolean;
    refreshing: boolean;
    reportPeriod?: {
        dateFrom: string;
        dateTo: string;
    };
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onPresetChange: (value: Preset) => void;
    onApply: () => void;
};

const presets: [Preset, string][] = [
    ["TODAY", "Today"],
    ["THIS_MONTH", "This Month"],
    ["THIS_YEAR", "This Year"],
    ["CUSTOM", "Custom Range"],
];

export default function ReportDateFilters({
    dateFrom,
    dateTo,
    preset,
    loading,
    refreshing,
    reportPeriod,
    onDateFromChange,
    onDateToChange,
    onPresetChange,
    onApply,
}: Props) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={19} className="text-blue-700" />

                <h2 className="font-semibold text-gray-900">
                    Reporting Period
                </h2>
            </div>

            <div className="flex flex-wrap gap-2">
                {presets.map(([value, label]) => (
                    <button
                        type="button"
                        key={value}
                        onClick={() => onPresetChange(value)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            preset === value
                                ? "bg-blue-700 text-white"
                                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Date From
                    </label>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(event) =>
                            onDateFromChange(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Date To
                    </label>

                    <input
                        type="date"
                        value={dateTo}
                        onChange={(event) =>
                            onDateToChange(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <button
                    type="button"
                    onClick={onApply}
                    disabled={loading || refreshing}
                    className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                    Apply Filters
                </button>
            </div>

            {reportPeriod && (
                <p className="mt-3 text-xs text-gray-500">
                    Showing transaction activity from{" "}
                    <strong>{formatDate(reportPeriod.dateFrom)}</strong>{" "}
                    to{" "}
                    <strong>{formatDate(reportPeriod.dateTo)}</strong>.
                    Account balances show current balances.
                </p>
            )}
        </div>
    );
}