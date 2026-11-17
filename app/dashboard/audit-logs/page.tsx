
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
    Activity,
    Search,
    RefreshCw,
    Download,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    User,
    Clock,
    ShieldCheck,
    FileText,
    AlertCircle,
    Loader2,
    Filter,
    Monitor,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type AuditLog = {
    id: string;
    employeeId: string | null;
    employeeCode: string | null;
    employeeName: string;
    username: string | null;
    action: string;
    tableName: string | null;
    recordId: string | null;
    oldValues: Record<string, any> | null;
    newValues: Record<string, any> | null;
    ipAddress: string | null;
    createdAt: string;
};

type AuditResponse = {
    success: boolean;
    logs: AuditLog[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
};

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
    { value: "CASH_IN_POSTED", label: "Cash In Posted" },
    { value: "CASH_OUT_REQUESTED", label: "Cash Out Requested" },
    { value: "CASH_OUT_APPROVED", label: "Cash Out Approved" },
    { value: "CASH_OUT_REJECTED", label: "Cash Out Rejected" },
    { value: "CASH_OUT_RELEASED", label: "Cash Out Released" },
    { value: "TRANSFER_POSTED", label: "Transfer Posted" },
    { value: "REMITTANCE_REQUESTED", label: "Remittance Requested" },
    { value: "REMITTANCE_CONFIRMED", label: "Remittance Confirmed" },
    { value: "REMITTANCE_REJECTED", label: "Remittance Rejected" },
];

const ACTION_STYLES: Record<string, string> = {
    CASH_IN_POSTED: "bg-green-100 text-green-700",
    CASH_OUT_REQUESTED: "bg-amber-100 text-amber-700",
    CASH_OUT_APPROVED: "bg-blue-100 text-blue-700",
    CASH_OUT_REJECTED: "bg-red-100 text-red-700",
    CASH_OUT_RELEASED: "bg-red-100 text-red-700",
    TRANSFER_POSTED: "bg-indigo-100 text-indigo-700",
    REMITTANCE_REQUESTED: "bg-cyan-100 text-cyan-700",
    REMITTANCE_CONFIRMED: "bg-green-100 text-green-700",
    REMITTANCE_REJECTED: "bg-red-100 text-red-700",
};

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: unknown) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

function formatDate(value: string) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function formatDateTime(value: string) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
}

function formatAction(value: string) {
    return value
        .split("_")
        .map((part) =>
            part.charAt(0) + part.slice(1).toLowerCase()
        )
        .join(" ");
}

function formatLabel(value: string) {
    return value
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "—";
    }

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
    }

    return String(value);
}

function escapeCSV(value: unknown) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function getActionStyle(action: string) {
    return ACTION_STYLES[action] || "bg-gray-100 text-gray-700";
}

// ============================================================
// DETAILS MODAL
// ============================================================

function AuditLogDetailsModal({
    log,
    onClose,
}: {
    log: AuditLog;
    onClose: () => void;
}) {
    const sections = [
        {
            title: "Previous Values",
            values: log.oldValues,
            color: "border-amber-200 bg-amber-50",
        },
        {
            title: "New Values",
            values: log.newValues,
            color: "border-green-200 bg-green-50",
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                                <FileText size={20} />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Activity Details
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Complete audit record
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-5 overflow-y-auto p-5">

                    {/* Action */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Action
                        </p>

                        <span
                            className={`inline-flex rounded-lg px-3 py-2 text-sm font-bold ${getActionStyle(log.action)}`}
                        >
                            {formatAction(log.action)}
                        </span>
                    </div>

                    {/* Basic details */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500">
                                Performed By
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {log.employeeName}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                {log.username || "No username"}
                                {log.employeeCode
                                    ? ` • ${log.employeeCode}`
                                    : ""}
                            </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500">
                                Date and Time
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {formatDateTime(log.createdAt)}
                            </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500">
                                Table
                            </p>

                            <p className="mt-1 break-all font-semibold text-gray-900">
                                {log.tableName || "—"}
                            </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500">
                                IP Address
                            </p>

                            <p className="mt-1 break-all font-semibold text-gray-900">
                                {log.ipAddress || "—"}
                            </p>
                        </div>
                    </div>

                    {/* Record ID */}
                    <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">
                            Record ID
                        </p>

                        <p className="mt-1 break-all font-mono text-xs text-gray-700">
                            {log.recordId || "—"}
                        </p>
                    </div>

                    {/* Old and new values */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {sections.map((section) => (
                            <div
                                key={section.title}
                                className={`overflow-hidden rounded-xl border ${section.color}`}
                            >
                                <div className="border-b border-inherit px-4 py-3">
                                    <h3 className="text-sm font-bold text-gray-800">
                                        {section.title}
                                    </h3>
                                </div>

                                <div className="max-h-80 space-y-3 overflow-y-auto p-4">
                                    {!section.values ||
                                    Object.keys(section.values).length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            No data available.
                                        </p>
                                    ) : (
                                        Object.entries(section.values).map(
                                            ([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="border-b border-gray-200/70 pb-2 last:border-0"
                                                >
                                                    <p className="text-xs font-semibold text-gray-600">
                                                        {formatLabel(key)}
                                                    </p>

                                                    <p className="mt-1 break-all whitespace-pre-wrap text-sm text-gray-900">
                                                        {formatValue(value)}
                                                    </p>
                                                </div>
                                            )
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Complete JSON */}
                    <details className="rounded-xl border border-gray-200 bg-gray-50">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700">
                            View complete JSON record
                        </summary>

                        <pre className="max-h-96 overflow-auto border-t border-gray-200 p-4 text-xs text-gray-700">
                            {JSON.stringify(log, null, 2)}
                        </pre>
                    </details>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-200 p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [action, setAction] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });

    const [selectedLog, setSelectedLog] =
        useState<AuditLog | null>(null);

    // ========================================================
    // FETCH LOGS
    // ========================================================

    const fetchLogs = useCallback(
        async (targetPage = 1, refresh = false) => {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const params = new URLSearchParams({
                    page: String(targetPage),
                    pageSize: String(PAGE_SIZE),
                });

                if (search.trim()) {
                    params.set("search", search.trim());
                }

                if (action) {
                    params.set("action", action);
                }

                if (dateFrom) {
                    params.set("dateFrom", dateFrom);
                }

                if (dateTo) {
                    params.set("dateTo", dateTo);
                }

                const response = await fetch(
                    `/api/dashboard/audit-logs?${params.toString()}`,
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const data: AuditResponse = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        (data as any).message ||
                        "Failed to load activity logs."
                    );
                }

                setLogs(data.logs || []);
                setPagination(data.pagination);
                setPage(data.pagination.page);

            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load activity logs."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [search, action, dateFrom, dateTo]
    );

    useEffect(() => {
        fetchLogs(1);
    }, [fetchLogs]);

    // ========================================================
    // FILTER ACTIONS
    // ========================================================

    const applyFilters = () => {
        if (dateFrom && dateTo && dateFrom > dateTo) {
            setError("Start date cannot be later than end date.");
            return;
        }

        fetchLogs(1);
    };

    const clearFilters = () => {
        setSearch("");
        setAction("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    // ========================================================
    // SUMMARY
    // ========================================================

    const displayedCount = logs.length;

    const uniqueUsers = useMemo(
        () =>
            new Set(
                logs
                    .map((log) => log.employeeId)
                    .filter(Boolean)
            ).size,
        [logs]
    );

    const latestActivity = logs[0];

    // ========================================================
    // EXPORT CSV
    // ========================================================

    const exportCSV = () => {
        if (logs.length === 0) return;

        const rows = [
            [
                "Date",
                "Employee",
                "Username",
                "Action",
                "Table",
                "Record ID",
                "IP Address",
                "Old Values",
                "New Values",
            ],
            ...logs.map((log) => [
                formatDateTime(log.createdAt),
                log.employeeName,
                log.username || "",
                log.action,
                log.tableName || "",
                log.recordId || "",
                log.ipAddress || "",
                JSON.stringify(log.oldValues || {}),
                JSON.stringify(log.newValues || {}),
            ]),
        ];

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
        link.download = `cashflow-activity-logs-page-${page}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    // ========================================================
    // SUMMARY CARD
    // ========================================================

    const SummaryCard = ({
        title,
        value,
        subtitle,
        icon: Icon,
        color,
    }: {
        title: string;
        value: string | number;
        subtitle: string;
        icon: typeof Activity;
        color: string;
    }) => (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <p className="mt-2 break-words text-2xl font-bold text-gray-900">
                        {value}
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

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                            <Activity size={22} />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Activity Logs
                        </h1>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                        Monitor and review business activities and user actions.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={exportCSV}
                        disabled={logs.length === 0 || loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>

                    <button
                        type="button"
                        onClick={() => fetchLogs(page, true)}
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

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                    title="Total Activities"
                    value={pagination.total.toLocaleString("en-PH")}
                    subtitle="Matching current filters"
                    icon={Activity}
                    color="bg-blue-100 text-blue-700"
                />

                <SummaryCard
                    title="Users on This Page"
                    value={uniqueUsers}
                    subtitle={`${displayedCount} records displayed`}
                    icon={User}
                    color="bg-purple-100 text-purple-700"
                />

                <SummaryCard
                    title="Latest Activity"
                    value={
                        latestActivity
                            ? formatDate(latestActivity.createdAt)
                            : "—"
                    }
                    subtitle={
                        latestActivity
                            ? formatAction(latestActivity.action)
                            : "No activity found"
                    }
                    icon={Clock}
                    color="bg-orange-100 text-orange-700"
                />
            </div>

            {/* FILTERS */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                    <Filter size={19} className="text-blue-700" />

                    <h2 className="font-semibold text-gray-900">
                        Filter Activities
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-5">

                    {/* SEARCH */}
                    <div className="xl:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                            Search
                        </label>

                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        applyFilters();
                                    }
                                }}
                                placeholder="Employee, action, username, record ID..."
                                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {/* ACTION */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                            Action Type
                        </label>

                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="">All Actions</option>

                            {ACTION_OPTIONS.map((item) => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DATE FROM */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                            Date From
                        </label>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* DATE TO */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                            Date To
                        </label>

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                        Clear Filters
                    </button>

                    <button
                        type="button"
                        onClick={applyFilters}
                        disabled={loading || refreshing}
                        className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* ERROR */}
            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0"
                    />

                    <span>{error}</span>
                </div>
            )}

            {/* TABLE */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-col gap-2 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900">
                            Audit Trail
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                            Recorded business activities, newest first.
                        </p>
                    </div>

                    <span className="text-xs font-medium text-gray-500">
                        {pagination.total.toLocaleString("en-PH")} total record(s)
                    </span>
                </div>

                {loading ? (
                    <div className="flex min-h-72 items-center justify-center gap-3 text-gray-500">
                        <Loader2
                            size={22}
                            className="animate-spin"
                        />
                        Loading activity logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
                        <div className="rounded-full bg-gray-100 p-4 text-gray-400">
                            <Activity size={30} />
                        </div>

                        <p className="mt-4 font-semibold text-gray-800">
                            No activity records found
                        </p>

                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                            No activities match your selected filters.
                            Try changing your search criteria.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* DESKTOP TABLE */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3">
                                            Date & Time
                                        </th>

                                        <th className="px-5 py-3">
                                            Employee
                                        </th>

                                        <th className="px-5 py-3">
                                            Action
                                        </th>

                                        <th className="px-5 py-3">
                                            Module
                                        </th>

                                        <th className="px-5 py-3">
                                            IP Address
                                        </th>

                                        <th className="px-5 py-3 text-right">
                                            Details
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <p className="font-medium text-gray-800">
                                                    {formatDate(log.createdAt)}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {new Date(log.createdAt).toLocaleTimeString(
                                                        "en-PH",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                        }
                                                    )}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900">
                                                    {log.employeeName}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {log.username || "—"}
                                                    {log.employeeCode
                                                        ? ` • ${log.employeeCode}`
                                                        : ""}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-bold ${getActionStyle(log.action)}`}
                                                >
                                                    {formatAction(log.action)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {log.tableName || "—"}
                                            </td>

                                            <td className="px-5 py-4 font-mono text-xs text-gray-500">
                                                {log.ipAddress || "—"}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Eye size={15} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARDS */}
                        <div className="space-y-3 p-3 md:hidden">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="rounded-xl border border-gray-200 p-4"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900">
                                                {log.employeeName}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500">
                                                {log.username || "—"}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${getActionStyle(log.action)}`}
                                        >
                                            {formatAction(log.action)}
                                        </span>
                                    </div>

                                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                                        <p className="flex items-center gap-2">
                                            <Clock size={14} />
                                            {formatDateTime(log.createdAt)}
                                        </p>

                                        <p className="flex items-center gap-2">
                                            <FileText size={14} />
                                            {log.tableName || "—"}
                                        </p>

                                        <p className="flex items-center gap-2">
                                            <Monitor size={14} />
                                            {log.ipAddress || "—"}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedLog(log)}
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                                    >
                                        <Eye size={16} />
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* PAGINATION */}
                {!loading && pagination.total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-gray-500">
                            Showing{" "}
                            <strong>
                                {(page - 1) * PAGE_SIZE + 1}
                            </strong>
                            {" "}to{" "}
                            <strong>
                                {Math.min(
                                    page * PAGE_SIZE,
                                    pagination.total
                                )}
                            </strong>
                            {" "}of{" "}
                            <strong>
                                {pagination.total}
                            </strong>
                            {" "}records
                        </p>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => fetchLogs(page - 1)}
                                disabled={page <= 1 || loading}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={15} />
                                Previous
                            </button>

                            <span className="px-2 text-xs font-semibold text-gray-600">
                                Page {page} of {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() => fetchLogs(page + 1)}
                                disabled={
                                    page >= pagination.totalPages ||
                                    loading
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2">
                    <ShieldCheck
                        size={15}
                        className="text-green-600"
                    />
                    Activity records are read-only.
                </p>

                <p>
                    CashFlow Audit Trail
                </p>
            </div>

            {/* DETAILS MODAL */}
            {selectedLog && (
                <AuditLogDetailsModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
}
