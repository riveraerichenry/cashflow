
"use client";

import { FormEvent, useState } from "react";
import { X, Loader2, Wallet } from "lucide-react";

type CashAccount = {
    id: string;
    account_name: string;
    account_type: string;
    provider?: string | null;
    balance: string | number;
};

type Props = {
    accounts: CashAccount[];
    onClose: () => void;
    onSuccess: () => void;
};

export default function CashInFormModal({
    accounts,
    onClose,
    onSuccess,
}: Props) {
    const [accountId, setAccountId] = useState("");
    const [sourceName, setSourceName] = useState("");
    const [amount, setAmount] = useState("");
    const [referenceNo, setReferenceNo] = useState("");
    const [description, setDescription] = useState("");
    const [transactionDate, setTransactionDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const formatCurrency = (value: number | string) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(Number(value || 0));

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!accountId) {
            setError("Please select a receiving account.");
            return;
        }

        if (!sourceName.trim()) {
            setError("Please enter the source or customer name.");
            return;
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        if (Math.round(numericAmount * 100) !== numericAmount * 100) {
            setError("Amount must have no more than two decimal places.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/dashboard/cash-in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accountId,
                    sourceName: sourceName.trim(),
                    amount: numericAmount,
                    referenceNo: referenceNo.trim() || null,
                    description: description.trim() || null,
                    transactionDate,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to post Cash In.");
            }

            onSuccess();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5">
            <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            New Cash In
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Record money received into a cash account.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="overflow-y-auto px-5 py-5 sm:px-6"
                >
                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Receiving Account *
                            </label>

                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">Select account</option>
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.account_name} — {account.account_type}
                                        {account.provider ? ` (${account.provider})` : ""}
                                        {" · "}
                                        {formatCurrency(account.balance)}
                                    </option>
                                ))}
                            </select>

                            {accounts.length === 0 && (
                                <p className="mt-2 text-sm text-amber-600">
                                    No active cash accounts are available.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Source / Customer Name *
                            </label>
                            <input
                                value={sourceName}
                                onChange={(e) => setSourceName(e.target.value)}
                                maxLength={150}
                                required
                                placeholder="e.g. Customer name or remitter"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Amount (PHP) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Transaction Date *
                                </label>
                                <input
                                    type="date"
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Reference Number
                            </label>
                            <input
                                value={referenceNo}
                                onChange={(e) => setReferenceNo(e.target.value)}
                                maxLength={100}
                                placeholder="Optional receipt or reference number"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Remarks
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={1000}
                                rows={3}
                                placeholder="Additional transaction details..."
                                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || accounts.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={17} className="animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Wallet size={17} />
                                    Post Cash In
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
