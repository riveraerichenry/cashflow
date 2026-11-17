"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Wallet,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    User,
    CreditCard,
    CheckCircle,
    Clock,
    XCircle,
} from "lucide-react";

import {
    WithdrawalRequest,
    CashOutAction,
    currency,
    dateFormat,
} from "./types";

type Props = {
    requests: WithdrawalRequest[];
    isOwner: boolean;
    processingId: string;
    onProcess: (
        requestId: string,
        action: CashOutAction
    ) => void;
};

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
        APPROVED: "bg-blue-50 text-blue-700 ring-blue-200",
        REJECTED: "bg-red-50 text-red-700 ring-red-200",
        RELEASED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200",
    };

    const icons: Record<string, React.ReactNode> = {
        PENDING: <Clock size={13} />,
        APPROVED: <CheckCircle size={13} />,
        REJECTED: <XCircle size={13} />,
        RELEASED: <CheckCircle size={13} />,
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                styles[status] || "bg-slate-100 text-slate-600 ring-slate-200"
            }`}
        >
            {icons[status]}
            {status}
        </span>
    );
}

function ActionButton({
    label,
    color,
    loading,
    onClick,
}: {
    label: string;
    color: "green" | "red" | "blue";
    loading: boolean;
    onClick: () => void;
}) {
    const styles = {
        green: "bg-emerald-600 hover:bg-emerald-700",
        red: "bg-red-600 hover:bg-red-700",
        blue: "bg-blue-700 hover:bg-blue-800",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${styles[color]}`}
        >
            {loading ? "Processing..." : label}
        </button>
    );
}

function RequestActions({
    item,
    processing,
    onProcess,
}: {
    item: WithdrawalRequest;
    processing: boolean;
    onProcess: (action: CashOutAction) => void;
}) {
    if (item.status === "PENDING") {
        return (
            <div className="flex flex-wrap gap-2">
                <ActionButton
                    label="Approve"
                    color="green"
                    loading={processing}
                    onClick={() => onProcess("APPROVE")}
                />

                <ActionButton
                    label="Reject"
                    color="red"
                    loading={processing}
                    onClick={() => onProcess("REJECT")}
                />
            </div>
        );
    }

    if (item.status === "APPROVED") {
        return (
            <ActionButton
                label="Release Cash"
                color="blue"
                loading={processing}
                onClick={() => onProcess("RELEASE")}
            />
        );
    }

    if (item.status === "RELEASED") {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle size={15} />
                Cash released
            </span>
        );
    }

    return (
        <span className="text-xs text-slate-400">
            No available actions
        </span>
    );
}

function Info({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-slate-500">
                {label}
            </p>

            <p className="mt-1 break-words text-sm font-medium text-slate-800">
                {value || "—"}
            </p>
        </div>
    );
}

export default function WithdrawalRequests({
    requests,
    isOwner,
    processingId,
    onProcess,
}: Props) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredRequests = useMemo(() => {
        const query = search.trim().toLowerCase();

        return requests.filter((item) => {
            const matchesSearch =
                !query ||
                item.request_no?.toLowerCase().includes(query) ||
                item.employee_first_name?.toLowerCase().includes(query) ||
                item.employee_last_name?.toLowerCase().includes(query) ||
                item.employee_username?.toLowerCase().includes(query) ||
                item.account_name?.toLowerCase().includes(query) ||
                item.purpose?.toLowerCase().includes(query) ||
                item.status?.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "ALL" ||
                item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [requests, search, statusFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredRequests.length / PAGE_SIZE)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedRequests = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;

        return filteredRequests.slice(
            start,
            start + PAGE_SIZE
        );
    }, [filteredRequests, currentPage]);

    const startRecord =
        filteredRequests.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1;

    const endRecord = Math.min(
        currentPage * PAGE_SIZE,
        filteredRequests.length
    );

    return (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* HEADER */}
            <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
                <div>
                    <h2 className="font-bold text-slate-900">
                        Withdrawal Requests
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {isOwner
                            ? "Review and process employee withdrawal requests."
                            : "Track the status of your withdrawal requests."}
                    </p>
                </div>

                {/* SEARCH AND FILTER */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search request, employee, account..."
                            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 sm:w-44"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="RELEASED">Released</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* EMPTY STATE */}
            {filteredRequests.length === 0 ? (
                <div className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                        <Wallet size={26} />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-800">
                        {requests.length === 0
                            ? "No withdrawal requests yet"
                            : "No matching requests"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        {requests.length === 0
                            ? "Withdrawal requests will appear here."
                            : "Try changing your search or status filter."}
                    </p>
                </div>
            ) : (
                <>
                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Request</th>
                                    <th className="px-5 py-4">Employee</th>
                                    <th className="px-5 py-4">Account</th>
                                    <th className="px-5 py-4">Purpose</th>
                                    <th className="px-5 py-4">Requested</th>
                                    <th className="px-5 py-4 text-right">Amount</th>
                                    <th className="px-5 py-4">Status</th>
                                    {isOwner && (
                                        <th className="px-5 py-4">Actions</th>
                                    )}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {paginatedRequests.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="align-top hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-blue-700">
                                                {item.request_no}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-800">
                                                {item.employee_first_name}{" "}
                                                {item.employee_last_name}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {item.employee_username}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-800">
                                                {item.account_name}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {item.account_type}
                                            </p>
                                        </td>

                                        <td className="max-w-[220px] px-5 py-4">
                                            <p className="line-clamp-2 text-slate-700">
                                                {item.purpose}
                                            </p>

                                            {item.rejection_reason && (
                                                <p className="mt-2 text-xs text-red-600">
                                                    Reason: {item.rejection_reason}
                                                </p>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                            {dateFormat(item.requested_at)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                                            {currency(item.amount)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <StatusBadge status={item.status} />
                                        </td>

                                        {isOwner && (
                                            <td className="px-5 py-4">
                                                <RequestActions
                                                    item={item}
                                                    processing={processingId === item.id}
                                                    onProcess={(action) =>
                                                        onProcess(item.id, action)
                                                    }
                                                />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE AND TABLET CARDS */}
                    <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 lg:hidden">
                        {paginatedRequests.map((item) => (
                            <article
                                key={item.id}
                                className="min-w-0 rounded-xl border border-slate-200 bg-white p-4"
                            >
                                {/* REQUEST HEADER */}
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="break-all text-sm font-bold text-blue-700">
                                            {item.request_no}
                                        </p>

                                        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                                            <User
                                                size={15}
                                                className="shrink-0 text-slate-400"
                                            />

                                            <span className="break-words">
                                                {item.employee_first_name}{" "}
                                                {item.employee_last_name}
                                            </span>
                                        </div>

                                        <p className="mt-1 pl-6 text-xs text-slate-500">
                                            {item.employee_username}
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p className="text-base font-bold text-slate-900 sm:text-lg">
                                            {currency(item.amount)}
                                        </p>

                                        <div className="mt-2">
                                            <StatusBadge status={item.status} />
                                        </div>
                                    </div>
                                </div>

                                {/* DETAILS */}
                                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                                    <div className="flex min-w-0 gap-2">
                                        <CreditCard
                                            size={16}
                                            className="mt-0.5 shrink-0 text-slate-400"
                                        />

                                        <Info
                                            label="Cash Account"
                                            value={`${item.account_name} (${item.account_type})`}
                                        />
                                    </div>

                                    <div className="flex min-w-0 gap-2">
                                        <CalendarDays
                                            size={16}
                                            className="mt-0.5 shrink-0 text-slate-400"
                                        />

                                        <Info
                                            label="Requested"
                                            value={dateFormat(item.requested_at)}
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <Info
                                            label="Purpose"
                                            value={item.purpose}
                                        />
                                    </div>
                                </div>

                                {/* REJECTION REASON */}
                                {item.rejection_reason && (
                                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                                        <p className="text-xs font-semibold text-red-700">
                                            Rejection Reason
                                        </p>

                                        <p className="mt-1 break-words text-sm text-red-600">
                                            {item.rejection_reason}
                                        </p>
                                    </div>
                                )}

                                {/* ACTIONS */}
                                {isOwner && (
                                    <div className="mt-4 border-t border-slate-100 pt-4">
                                        <RequestActions
                                            item={item}
                                            processing={processingId === item.id}
                                            onProcess={(action) =>
                                                onProcess(item.id, action)
                                            }
                                        />
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </>
            )}

            {/* PAGINATION */}
            {filteredRequests.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-center text-xs text-slate-500 sm:text-left sm:text-sm">
                        Showing{" "}
                        <span className="font-semibold text-slate-800">
                            {startRecord}-{endRecord}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-800">
                            {filteredRequests.length}
                        </span>{" "}
                        requests
                    </p>

                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) => Math.max(1, page - 1))
                            }
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="whitespace-nowrap px-2 text-xs font-medium text-slate-600">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.min(totalPages, page + 1)
                                )
                            }
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}