
"use client";

import { useEffect, useMemo, useState } from "react";

import {
    Search,
    Eye,
    CheckCircle2,
    XCircle,
    Banknote,
    Wallet,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import {
    WithdrawalRequest,
    FilterStatus,
    currency,
    formatDate,
    statusStyles,
} from "./types";

type Props = {
    requests: WithdrawalRequest[];
    loading: boolean;
    processingId: string | null;
    onView: (request: WithdrawalRequest) => void;
    onApprove: (request: WithdrawalRequest) => void;
    onReject: (request: WithdrawalRequest) => void;
    onRelease: (request: WithdrawalRequest) => void;
};

const PAGE_SIZE = 10;

export default function ApprovalTable({
    requests,
    loading,
    processingId,
    onView,
    onApprove,
    onReject,
    onRelease,
}: Props) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<FilterStatus>("ALL");

    const [currentPage, setCurrentPage] = useState(1);

    const filteredRequests = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return requests.filter((request) => {
            const matchesStatus =
                statusFilter === "ALL" ||
                request.status === statusFilter;

            const employeeName =
                `${request.employee_first_name || ""} ${request.employee_last_name || ""}`;

            const matchesSearch =
                !keyword ||
                request.request_no?.toLowerCase().includes(keyword) ||
                employeeName.toLowerCase().includes(keyword) ||
                request.employee_username?.toLowerCase().includes(keyword) ||
                request.account_name?.toLowerCase().includes(keyword) ||
                request.purpose?.toLowerCase().includes(keyword);

            return matchesStatus && matchesSearch;
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

    function StatusBadge({ status }: { status: string }) {
        return (
            <span
                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusStyles[status] || statusStyles.CANCELLED
                }`}
            >
                {status}
            </span>
        );
    }

    function RequestActions({
        request,
    }: {
        request: WithdrawalRequest;
    }) {
        const disabled = !!processingId;

        return (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={() => onView(request)}
                    title="View details"
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
                >
                    <Eye size={16} />
                </button>

                {request.status === "PENDING" && (
                    <>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onApprove(request)}
                            title="Approve"
                            className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            <CheckCircle2 size={16} />
                        </button>

                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onReject(request)}
                            title="Reject"
                            className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            <XCircle size={16} />
                        </button>
                    </>
                )}

                {request.status === "APPROVED" && (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onRelease(request)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Banknote size={15} />
                        Release
                    </button>
                )}
            </div>
        );
    }

    return (
        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* HEADER */}

            <div className="border-b border-gray-200 p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Withdrawal Requests
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredRequests.length} request(s) displayed
                        </p>
                    </div>

                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                        <div className="relative min-w-0 flex-1">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search requests..."
                                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as FilterStatus
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="RELEASED">Released</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* LOADING */}

            {loading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
                    <Loader2 className="animate-spin" size={20} />
                    Loading withdrawal requests...
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                    <div className="rounded-full bg-gray-100 p-4">
                        <Wallet size={28} className="text-gray-400" />
                    </div>

                    <h3 className="mt-4 font-semibold text-gray-800">
                        No withdrawal requests found
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Requests matching your search and filter will appear here.
                    </p>
                </div>
            ) : (
                <>
                    {/* DESKTOP TABLE */}

                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Request</th>
                                    <th className="px-5 py-4">Employee</th>
                                    <th className="px-5 py-4">Account</th>
                                    <th className="px-5 py-4 text-right">
                                        Amount
                                    </th>
                                    <th className="px-5 py-4">Date</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {paginatedRequests.map((request) => (
                                    <tr
                                        key={request.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-900">
                                                {request.request_no}
                                            </p>

                                            <p className="mt-1 max-w-48 truncate text-xs text-gray-500">
                                                {request.purpose}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium text-gray-800">
                                                {request.employee_first_name}{" "}
                                                {request.employee_last_name}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500">
                                                @{request.employee_username}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium text-gray-800">
                                                {request.account_name}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500">
                                                {request.account_type}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 text-right font-bold text-gray-900">
                                            {currency(request.amount)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                            {formatDate(request.requested_at)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <StatusBadge status={request.status} />
                                        </td>

                                        <td className="px-5 py-4">
                                            <RequestActions request={request} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}

                    <div className="space-y-3 p-4 lg:hidden">
                        {paginatedRequests.map((request) => (
                            <article
                                key={request.id}
                                className="min-w-0 rounded-xl border border-gray-200 p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="break-all text-sm font-bold text-gray-900">
                                            {request.request_no}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-600">
                                            {request.employee_first_name}{" "}
                                            {request.employee_last_name}
                                        </p>

                                        <p className="mt-1 break-all text-xs text-gray-500">
                                            @{request.employee_username}
                                        </p>
                                    </div>

                                    <StatusBadge status={request.status} />
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2">
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500">
                                            Cash Account
                                        </p>

                                        <p className="mt-1 break-words text-sm font-medium text-gray-800">
                                            {request.account_name}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {request.account_type}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Requested Amount
                                        </p>

                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                            {currency(request.amount)}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                    {formatDate(request.requested_at)}
                                </p>

                                {request.purpose && (
                                    <p className="mt-2 break-words text-sm text-gray-600">
                                        {request.purpose}
                                    </p>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => onView(request)}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        View Details
                                    </button>

                                    {request.status === "PENDING" && (
                                        <>
                                            <button
                                                type="button"
                                                disabled={!!processingId}
                                                onClick={() => onApprove(request)}
                                                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                            >
                                                Approve
                                            </button>

                                            <button
                                                type="button"
                                                disabled={!!processingId}
                                                onClick={() => onReject(request)}
                                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {request.status === "APPROVED" && (
                                        <button
                                            type="button"
                                            disabled={!!processingId}
                                            onClick={() => onRelease(request)}
                                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                        >
                                            Release Funds
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}

            {/* PAGINATION */}

            {!loading && filteredRequests.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-center text-xs text-gray-500 sm:text-left sm:text-sm">
                        Showing{" "}
                        <span className="font-semibold text-gray-800">
                            {startRecord}-{endRecord}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-gray-800">
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
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="whitespace-nowrap px-2 text-xs font-medium text-gray-600">
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
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
