"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
    Activity,
    AlertCircle,
    Download,
    FileSpreadsheet,
    Loader2,
    Printer,
    RefreshCw,
} from "lucide-react";

import type { Preset, ReportData } from "@/components/dashboard/reports/types";

import {
    escapeCSV,
    formatDate,
    getMonthStart,
    getYearStart,
    localDate,
    currency,
} from "@/components/dashboard/reports/report-utils";

import ReportSummaryCards from "@/components/dashboard/reports/ReportSummaryCards";
import ReportDateFilters from "@/components/dashboard/reports/ReportDateFilters";
import DailyMovementChart from "@/components/dashboard/reports/DailyMovementChart";
import TransactionBreakdown from "@/components/dashboard/reports/TransactionBreakdown";
import AccountBalances from "@/components/dashboard/reports/AccountBalances";
import EmployeeBalances from "@/components/dashboard/reports/EmployeeBalances";

export default function ReportsPage() {
    const [report, setReport] = useState<ReportData | null>(null);

    const [dateFrom, setDateFrom] = useState(getMonthStart);
    const [dateTo, setDateTo] = useState(() => localDate(new Date()));
    const [preset, setPreset] = useState<Preset>("THIS_MONTH");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchReport = useCallback(
        async (from: string, to: string, refresh = false) => {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const params = new URLSearchParams({
                    dateFrom: from,
                    dateTo: to,
                });

                const response = await fetch(
                    `/api/dashboard/reports?${params.toString()}`,
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Failed to generate report."
                    );
                }

                setReport(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load reports."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchReport(dateFrom, dateTo);
        // Initial report load.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchReport]);

    const accountTotal = useMemo(
        () =>
            (report?.accountBalances || []).reduce(
                (sum, account) =>
                    sum + Number(account.balance || 0),
                0
            ),
        [report]
    );

    const employeeTotal = useMemo(
        () =>
            (report?.employeeBalances || []).reduce(
                (sum, employee) =>
                    sum + Number(employee.totalBalance || 0),
                0
            ),
        [report]
    );

    const applyPreset = (value: Preset) => {
        const today = localDate(new Date());

        let from = dateFrom;
        let to = today;

        if (value === "TODAY") {
            from = today;
            to = today;
        }

        if (value === "THIS_MONTH") {
            from = getMonthStart();
            to = today;
        }

        if (value === "THIS_YEAR") {
            from = getYearStart();
            to = today;
        }

        setPreset(value);
        setDateFrom(from);
        setDateTo(to);

        if (value !== "CUSTOM") {
            fetchReport(from, to);
        }
    };

    const applyCustomDates = () => {
        if (!dateFrom || !dateTo) {
            setError("Please select both start and end dates.");
            return;
        }

        if (dateFrom > dateTo) {
            setError("Start date cannot be later than end date.");
            return;
        }

        setPreset("CUSTOM");
        fetchReport(dateFrom, dateTo);
    };

    const exportCSV = () => {
        if (!report) return;

        const rows: string[][] = [];

        rows.push(["CASHFLOW - FINANCIAL REPORT"]);

        rows.push([
            "Reporting Period",
            `${report.period.dateFrom} to ${report.period.dateTo}`,
        ]);

        rows.push([]);
        rows.push(["FINANCIAL SUMMARY"]);
        rows.push(["Metric", "Amount"]);

        rows.push([
            "Total Cash In",
            String(report.summary.totalCashIn),
        ]);

        rows.push([
            "Total Cash Out",
            String(report.summary.totalCashOut),
        ]);

        rows.push([
            "Transfers",
            String(report.summary.totalTransfers),
        ]);

        rows.push([
            "Net Movement",
            String(report.summary.netMovement),
        ]);

        rows.push([
            "Transaction Count",
            String(report.summary.transactionCount),
        ]);

        rows.push([]);
        rows.push(["DAILY CASH FLOW"]);

        rows.push([
            "Date",
            "Cash In",
            "Cash Out",
            "Transfers",
            "Transactions",
        ]);

        report.daily.forEach((row) => {
            rows.push([
                row.date,
                String(row.cashIn),
                String(row.cashOut),
                String(row.transfers),
                String(row.transactionCount),
            ]);
        });

        rows.push([]);
        rows.push(["ACCOUNT BALANCES"]);

        rows.push([
            "Account",
            "Type",
            "Assigned Employee",
            "Current Balance",
        ]);

        report.accountBalances.forEach((account) => {
            rows.push([
                account.accountName,
                account.accountType,
                account.employeeName || "Shared / Unassigned",
                String(account.balance),
            ]);
        });

        rows.push([]);
        rows.push(["EMPLOYEE ACCOUNTABILITY"]);

        rows.push([
            "Employee Code",
            "Employee Name",
            "Assigned Accounts",
            "Current Balance",
        ]);

        report.employeeBalances.forEach((employee) => {
            rows.push([
                employee.employeeCode,
                employee.employeeName,
                String(employee.accountCount),
                String(employee.totalBalance),
            ]);
        });

        const csv = rows
            .map((row) => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `cashflow-report-${report.period.dateFrom}-to-${report.period.dateTo}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    const refreshReport = () => {
        fetchReport(dateFrom, dateTo, true);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                            <FileSpreadsheet size={22} />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Reports & Analytics
                        </h1>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                        Monitor cash movements, account balances, and
                        employee accountability.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={exportCSV}
                        disabled={!report || loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={!report || loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Printer size={16} />
                        Print
                    </button>

                    <button
                        type="button"
                        onClick={refreshReport}
                        disabled={refreshing || loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Date Filters */}
            <ReportDateFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                preset={preset}
                loading={loading}
                refreshing={refreshing}
                reportPeriod={report?.period}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onPresetChange={applyPreset}
                onApply={applyCustomDates}
            />

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0"
                    />

                    <span>{error}</span>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex min-h-72 items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-500">
                    <Loader2 size={22} className="animate-spin" />
                    Generating financial reports...
                </div>
            ) : report ? (
                <>
                    {/* Summary */}
                    <ReportSummaryCards
                        summary={report.summary}
                        accountTotal={accountTotal}
                        employeeTotal={employeeTotal}
                    />

                    {/* Daily Movement and Breakdown */}
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                        <DailyMovementChart daily={report.daily} />

                        <TransactionBreakdown
                            items={report.transactionTypes}
                            summary={report.summary}
                        />
                    </div>

                    {/* Account Balances */}
                    <AccountBalances
                        accounts={report.accountBalances}
                        total={accountTotal}
                    />

                    {/* Employee Accountability */}
                    <EmployeeBalances
                        employees={report.employeeBalances}
                        total={employeeTotal}
                    />

                    {/* Footer */}
                    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            Report period:{" "}
                            {formatDate(report.period.dateFrom)} –{" "}
                            {formatDate(report.period.dateTo)}
                        </p>

                        <p>
                            {report.summary.transactionCount} posted
                            transaction(s)
                        </p>
                    </div>
                </>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                    <Activity
                        className="mx-auto text-gray-400"
                        size={32}
                    />

                    <p className="mt-3 font-semibold text-gray-800">
                        No report data available
                    </p>

                    <button
                        type="button"
                        onClick={() => fetchReport(dateFrom, dateTo)}
                        className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}