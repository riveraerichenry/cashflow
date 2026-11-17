"use client";

import { useEffect, useMemo, useState } from "react";

import {
    Search,
    FileText,
    User,
    ArrowDownLeft,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
} from "lucide-react";

import {
    Remittance,
    RemittanceAction,
    formatDate,
    money,
} from "./types";

type Props = {
    requests: Remittance[];
    isOwner: boolean;
    onProcess: (
        request: Remittance,
        action: RemittanceAction
    ) => void;
};

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: "bg-amber-100 text-amber-700",
        RECEIVED: "bg-green-100 text-green-700",
        REJECTED: "bg-red-100 text-red-700",
        CANCELLED: "bg-slate-100 text-slate-600",
    };

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                styles[status] || styles.CANCELLED
            }`}
        >
            {status}
        </span>
    );
}

export default function RemittanceRequests({
    requests,
    isOwner,
    onProcess,
}: Props) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredRequests = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return requests.filter((request) => {
            const matchesSearch =
                !keyword ||
                [
                    request.requestNo,
                    request.employeeName,
                    request.sourceAccountName,
                    request.destinationAccountName,
                    request.purpose,
                    request.referenceNo,
                ].some((value) =>
                    String(value || "").toLowerCase().includes(keyword)
                );

            const matchesStatus =
                statusFilter === "ALL" ||
                request.status === statusFilter;

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

    function RequestActions({
        request,
    }: {
        request: Remittance;
    }) {
        if (request.status !== "PENDING") {
            return (
                <span className="text-xs text-slate-400">
                    {request.confirmedBy || "—"}
                </span>
            );
        }

        return (
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onProcess(request, "CONFIRM")}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                >
                    <CheckCircle size={14} />
                    Confirm
                </button>

                <button
                    type="button"
                    onClick={() => onProcess(request, "REJECT")}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                    <XCircle size={14} />
                    Reject
                </button>
            </div>
        );
    }

    return (
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* HEADER */}

            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center">
                <div>
                    <h2 className="font-bold text-slate-900">
                        {isOwner
                            ? "Remittance Approval Queue"
                            : "My Remittance History"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        View and track remittance requests.
                    </p>
                </div>

                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search requests..."
                            className="w-full rounded-lg border border-slate-300 py-3 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="RECEIVED">Received</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* EMPTY STATE */}

            {filteredRequests.length === 0 ? (
                <div className="p-12 text-center">
                    <FileText
                        size={34}
                        className="mx-auto mb-3 text-slate-300"
                    />

                    <h3 className="font-semibold text-slate-800">
                        {requests.length === 0
                            ? "No remittance requests yet"
                            : "No matching requests"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        {requests.length === 0
                            ? "Remittance requests will appear here."
                            : "Try changing your search or status filter."}
                    </p>
                </div>
            ) : (
                <>
                    {/* DESKTOP TABLE */}

                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-[1050px] text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-left">
                                        Request No.
                                    </th>

                                    {isOwner && (
                                        <th className="px-5 py-3 text-left">
                                            Employee
                                        </th>
                                    )}

                                    <th className="px-5 py-3 text-left">
                                        Transfer
                                    </th>

                                    <th className="px-5 py-3 text-left">
                                        Date
                                    </th>

                                    <th className="px-5 py-3 text-right">
                                        Amount
                                    </th>

                                    <th className="px-5 py-3 text-center">
                                        Status
                                    </th>

                                    {isOwner && (
                                        <th className="px-5 py-3 text-center">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {paginatedRequests.map((request) => (
                                    <tr
                                        key={request.id}
                                        className="align-top hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="break-all font-bold text-blue-700">
                                                {request.requestNo}
                                            </p>

                                            {request.referenceNo && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Ref: {request.referenceNo}
                                                </p>
                                            )}
                                        </td>

                                        {isOwner && (
                                            <td className="px-5 py-4 text-slate-700">
                                                {request.employeeName}
                                            </td>
                                        )}

                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-800">
                                                {request.sourceAccountName}
                                            </p>

                                            <p className="my-1 flex items-center gap-1 text-xs text-slate-400">
                                                <ArrowDownLeft size={13} />
                                                To
                                            </p>

                                            <p className="font-medium text-slate-700">
                                                {request.destinationAccountName}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                            {formatDate(request.requestedAt)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                                            {money(request.amount)}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={request.status} />
                                        </td>

                                        {isOwner && (
                                            <td className="px-5 py-4">
                                                <RequestActions request={request} />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE AND TABLET CARDS */}

                    <div className="divide-y divide-slate-200 lg:hidden">
                        {paginatedRequests.map((request) => (
                            <article
                                key={request.id}
                                className="min-w-0 space-y-3 p-4 sm:p-5"
                            >
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="break-all text-sm font-bold text-blue-700">
                                            {request.requestNo}
                                        </p>

                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                            <CalendarDays size={13} />
                                            {formatDate(request.requestedAt)}
                                        </p>
                                    </div>

                                    <StatusBadge status={request.status} />
                                </div>

                                {isOwner && (
                                    <p className="flex items-center gap-2 break-words text-sm text-slate-700">
                                        <User
                                            size={15}
                                            className="shrink-0"
                                        />
                                        {request.employeeName}
                                    </p>
                                )}

                                <div className="rounded-lg bg-slate-50 p-3">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                                        <span className="text-xs text-slate-500">
                                            From
                                        </span>

                                        <span className="break-words text-sm font-semibold text-slate-800 sm:text-right">
                                            {request.sourceAccountName}
                                        </span>
                                    </div>

                                    <div className="my-3 flex flex-col gap-1 border-t border-slate-200 pt-3 sm:flex-row sm:justify-between">
                                        <span className="text-xs text-slate-500">
                                            To
                                        </span>

                                        <span className="break-words text-sm font-semibold text-slate-800 sm:text-right">
                                            {request.destinationAccountName}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                        <span className="text-sm text-slate-500">
                                            Amount
                                        </span>

                                        <span className="text-base font-bold text-slate-900">
                                            {money(request.amount)}
                                        </span>
                                    </div>
                                </div>

                                {request.referenceNo && (
                                    <p className="break-words text-xs text-slate-500">
                                        Reference: {request.referenceNo}
                                    </p>
                                )}

                                {request.purpose && (
                                    <p className="break-words text-xs text-slate-500">
                                        Purpose: {request.purpose}
                                    </p>
                                )}

                                {request.rejectionReason && (
                                    <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                                        <p className="text-xs font-semibold text-red-700">
                                            Rejection Reason
                                        </p>

                                        <p className="mt-1 break-words text-sm text-red-600">
                                            {request.rejectionReason}
                                        </p>
                                    </div>
                                )}

                                {isOwner && request.status === "PENDING" && (
                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onProcess(request, "CONFIRM")
                                            }
                                            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-3 text-sm font-semibold text-white hover:bg-green-700"
                                        >
                                            <CheckCircle size={16} />
                                            Confirm
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onProcess(request, "REJECT")
                                            }
                                            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-3 text-sm font-semibold text-white hover:bg-red-700"
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {isOwner &&
                                    request.status !== "PENDING" &&
                                    request.confirmedBy && (
                                        <p className="text-xs text-slate-400">
                                            Processed by: {request.confirmedBy}
                                        </p>
                                    )}
                            </article>
                        ))}
                    </div>
                </>
            )}

            {/* PAGINATION */}

            {filteredRequests.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
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