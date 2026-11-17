"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    ChevronLeft,
    Download,
    FileSpreadsheet,
    Printer,
    RefreshCw,
} from "lucide-react";

import Link from "next/link";

import type {
    LedgerEntry,
    LedgerResponse,
} from "@/components/dashboard/ledger-report/types";

import {
    accountTypeLabel,
    escapeCsv,
    formatDate,
    monthStart,
    money,
    today,
    transactionLabel,
} from "@/components/dashboard/ledger-report/utils";

import LedgerSummaryCards from "@/components/dashboard/ledger-report/LedgerSummaryCards";
import LedgerFilters from "@/components/dashboard/ledger-report/LedgerFilters";
import AccountSummaryTable from "@/components/dashboard/ledger-report/AccountSummaryTable";
import LedgerEntries from "@/components/dashboard/ledger-report/LedgerEntries";

export default function AccountLedgerReportPage() {
    const [dateFrom, setDateFrom] = useState(monthStart);
    const [dateTo, setDateTo] = useState(today);

    const [accountId, setAccountId] = useState("ALL");

    const [data, setData] = useState<LedgerResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [directionFilter, setDirectionFilter] = useState("ALL");

    /*
    ============================================================
    FETCH LEDGER
    ============================================================
    */

    const fetchLedger = useCallback(async () => {
        if (!dateFrom || !dateTo) {
            setError("Please select both reporting dates.");
            return;
        }

        if (dateFrom > dateTo) {
            setError("Start date cannot be later than end date.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            params.set("dateFrom", dateFrom);
            params.set("dateTo", dateTo);

            if (accountId !== "ALL") {
                params.set("accountId", accountId);
            }

            const response = await fetch(
                `/api/dashboard/reports/ledger?${params.toString()}`,
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load ledger report."
                );
            }

            setData(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );

            setData(null);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, accountId]);

    /*
    ============================================================
    AUTO FETCH WHEN DATE OR ACCOUNT CHANGES
    ============================================================
    */

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    /*
    ============================================================
    FILTERED ENTRIES
    ============================================================
    */

    const filteredEntries = useMemo(() => {
        if (!data) return [];

        const keyword = search.toLowerCase().trim();

        return data.entries.filter((entry: LedgerEntry) => {
            const matchesSearch =
                !keyword ||
                [
                    entry.transactionNo,
                    entry.accountName,
                    entry.description,
                    entry.referenceNo,
                    entry.employeeName,
                    transactionLabel(entry.transactionType),
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(keyword)
                    );

            const matchesType =
                typeFilter === "ALL" ||
                entry.transactionType === typeFilter;

            const matchesDirection =
                directionFilter === "ALL" ||
                entry.direction === directionFilter;

            return (
                matchesSearch &&
                matchesType &&
                matchesDirection
            );
        });
    }, [data, search, typeFilter, directionFilter]);

    /*
    ============================================================
    SELECTED ACCOUNT
    ============================================================
    */

    const selectedAccountName =
        accountId === "ALL"
            ? "All Cash Accounts"
            : data?.accounts.find(
                  (account) => account.accountId === accountId
              )?.accountName || "Selected Account";

    /*
    ============================================================
    EXPORT CSV
    ============================================================
    */

    const exportCsv = () => {
        if (!data || filteredEntries.length === 0) return;

        const headers = [
            "Date",
            "Transaction No.",
            "Account",
            "Account Type",
            "Transaction Type",
            "Description",
            "Reference No.",
            "Employee",
            "Money In",
            "Money Out",
            "Running Balance",
        ];

        const rows = filteredEntries.map((entry) => [
            entry.transactionDate,
            entry.transactionNo,
            entry.accountName,
            accountTypeLabel(entry.accountType),
            transactionLabel(entry.transactionType),
            entry.description || "",
            entry.referenceNo || "",
            entry.employeeName || "",
            entry.direction === "IN" ? entry.amount : 0,
            entry.direction === "OUT" ? entry.amount : 0,
            entry.runningBalance,
        ]);

        const csv = [
            headers.map(escapeCsv).join(","),
            ...rows.map((row) =>
                row.map(escapeCsv).join(",")
            ),
        ].join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            {
                type: "text/csv;charset=utf-8;",
            }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `cash-account-ledger-${dateFrom}-${dateTo}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    /*
    ============================================================
    RESET TABLE FILTERS
    ============================================================
    */

    const resetFilters = () => {
        setSearch("");
        setTypeFilter("ALL");
        setDirectionFilter("ALL");
    };

    /*
    ============================================================
    RENDER
    ============================================================
    */

    return (
        <div className="space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* HEADER */}

            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                    <div className="mb-2">
                        <Link
                            href="/dashboard/reports"
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            <ChevronLeft size={17} />
                            Back to Reports
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                            <FileSpreadsheet size={22} />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900">
                            Cash Account Ledger
                        </h1>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                        Detailed account movements, transactions, and running balances.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 print:hidden">
                    <button
                        type="button"
                        onClick={fetchLedger}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={exportCsv}
                        disabled={!data || filteredEntries.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={!data}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                </div>
            </div>

            {/* FILTERS */}

            <LedgerFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                accountId={accountId}
                accounts={data?.accounts || []}
                loading={loading}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onAccountChange={setAccountId}
                onGenerate={fetchLedger}
            />

            {/* ERROR */}

            {error && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={fetchLedger}
                        className="font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* LOADING */}

            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                    <RefreshCw
                        className="mx-auto animate-spin text-blue-700"
                        size={30}
                    />

                    <p className="mt-3 text-sm text-slate-500">
                        Generating account ledger...
                    </p>
                </div>
            )}

            {/* REPORT */}

            {!loading && data && (
                <div id="ledger-report">

                    {/* PRINT HEADER */}

                    <div className="mb-6 hidden print:block">
                        <h1 className="text-center text-xl font-bold">
                            CASH ACCOUNT LEDGER REPORT
                        </h1>

                        <p className="mt-2 text-center text-sm">
                            {selectedAccountName}
                        </p>

                        <p className="text-center text-sm">
                            Period: {formatDate(dateFrom)} - {formatDate(dateTo)}
                        </p>
                    </div>

                    {/* PERIOD INFORMATION */}

                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm text-slate-500">
                                Selected Account
                            </p>

                            <p className="text-lg font-bold text-slate-900">
                                {selectedAccountName}
                            </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2">
                            <p className="text-xs text-slate-500">
                                Reporting Period
                            </p>

                            <p className="text-sm font-semibold text-slate-800">
                                {formatDate(dateFrom)} - {formatDate(dateTo)}
                            </p>
                        </div>
                    </div>

                    {/* SUMMARY CARDS */}

                    <div className="mb-6">
                        <LedgerSummaryCards summary={data.summary} />
                    </div>

                    {/* ACCOUNT SUMMARY */}

                    <AccountSummaryTable
                        accounts={data.accountSummaries}
                        summary={data.summary}
                    />

                    {/* DETAILED ENTRIES */}

                    <LedgerEntries
                        entries={filteredEntries}
                        totalEntries={data.entries.length}
                        search={search}
                        typeFilter={typeFilter}
                        directionFilter={directionFilter}
                        closingBalance={data.summary.closingBalance}
                        onSearchChange={setSearch}
                        onTypeChange={setTypeFilter}
                        onDirectionChange={setDirectionFilter}
                        onClearFilters={resetFilters}
                    />

                    {/* REPORT NOTES */}

                    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800 print:hidden">
                        <p className="font-semibold">
                            Report Notes
                        </p>

                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            <li>
                                Transfers are internal movements between accounts and do not increase or decrease total business funds.
                            </li>

                            <li>
                                Running balances are calculated separately for each cash account.
                            </li>

                            <li>
                                The closing balance represents the balance at the end of the selected reporting period.
                            </li>

                            <li>
                                Current balance may differ from closing balance if transactions occurred after the selected reporting period.
                            </li>

                            <li>
                                The detailed history currently displays up to 1,000 ledger entries.
                            </li>
                        </ul>
                    </div>

                    {/* SIGNATURES */}

                    <div className="mt-8 hidden grid-cols-2 gap-16 print:grid">
                        <div className="text-center">
                            <div className="mx-auto mb-2 mt-12 w-56 border-t border-slate-800" />

                            <p className="text-sm font-semibold">
                                Prepared By
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="mx-auto mb-2 mt-12 w-56 border-t border-slate-800" />

                            <p className="text-sm font-semibold">
                                Approved By
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* NO DATA */}

            {!loading && !data && !error && (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                    <ArrowLeft
                        className="mx-auto text-slate-300"
                        size={32}
                    />

                    <p className="mt-3 font-semibold text-slate-800">
                        No ledger data available.
                    </p>

                    <button
                        type="button"
                        onClick={fetchLedger}
                        className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* PRINT STYLES */}

            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 12mm;
                    }

                    body {
                        background: white !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    #ledger-report,
                    #ledger-report * {
                        visibility: visible;
                    }

                    #ledger-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    #ledger-report .shadow-sm {
                        box-shadow: none !important;
                    }

                    #ledger-report .overflow-hidden,
                    #ledger-report .overflow-x-auto {
                        overflow: visible !important;
                    }

                    #ledger-report table {
                        width: 100%;
                        font-size: 9px;
                    }

                    #ledger-report th,
                    #ledger-report td {
                        padding: 5px;
                    }

                    #ledger-report tr {
                        break-inside: avoid;
                    }

                    #ledger-report .lg\\:block {
                        display: block !important;
                    }

                    #ledger-report .lg\\:hidden {
                        display: none !important;
                    }

                    #ledger-report .print\\:block {
                        display: block !important;
                    }

                    #ledger-report .print\\:grid {
                        display: grid !important;
                    }

                    #ledger-report .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}