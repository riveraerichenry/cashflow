
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowDownUp, X } from "lucide-react";

type Account = {
    id: string;
    account_name?: string;
    accountName?: string;
    account_type?: string;
    accountType?: string;
    balance?: number | string;
};

type Props = {
    open: boolean;
    accounts: Account[];
    onClose: () => void;
    onSuccess: () => void;
};

function currency(value: number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value || 0);
}

function accountName(account: Account) {
    return account.account_name || account.accountName || "Cash Account";
}

function accountType(account: Account) {
    return account.account_type || account.accountType || "";
}

export default function TransferFormModal({
    open,
    accounts,
    onClose,
    onSuccess,
}: Props) {
    const [fromAccountId, setFromAccountId] = useState("");
    const [toAccountId, setToAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [transactionDate, setTransactionDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );
    const [referenceNo, setReferenceNo] = useState("");
    const [description, setDescription] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        setFromAccountId("");
        setToAccountId("");
        setAmount("");
        setTransactionDate(new Date().toLocaleDateString("en-CA"));
        setReferenceNo("");
        setDescription("");
        setError("");
    }, [open]);

    if (!open) return null;

    const sourceAccount = accounts.find(
        (account) => account.id === fromAccountId
    );

    const destinationAccount = accounts.find(
        (account) => account.id === toAccountId
    );

    const availableBalance = Number(sourceAccount?.balance || 0);
    const transferAmount = Number(amount || 0);

    const insufficientBalance =
        transferAmount > 0 &&
        transferAmount > availableBalance;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!fromAccountId || !toAccountId) {
            setError("Please select both accounts.");
            return;
        }

        if (fromAccountId === toAccountId) {
            setError("Source and destination accounts must be different.");
            return;
        }

        if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
            setError("Enter a valid transfer amount.");
            return;
        }

        if (Math.round(transferAmount * 100) !== transferAmount * 100) {
            setError("Amount must have no more than two decimal places.");
            return;
        }

        if (insufficientBalance) {
            setError("Insufficient source account balance.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/dashboard/transfers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fromAccountId,
                    toAccountId,
                    amount: transferAmount,
                    transactionDate,
                    referenceNo,
                    description,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to complete transfer."
                );
            }

            onSuccess();
            onClose();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    onClose();
                }
            }}
        >
            <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
                            <ArrowDownUp size={22} />
                        </div>

                        <div>
                            <h2 className="font-bold text-slate-800">
                                Transfer Funds
                            </h2>
                            <p className="text-xs text-slate-500">
                                Move funds between your business accounts.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={saving}
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">

                        {/* SOURCE ACCOUNT */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                From Account
                            </label>

                            <select
                                required
                                value={fromAccountId}
                                onChange={(event) => {
                                    setFromAccountId(event.target.value);

                                    if (event.target.value === toAccountId) {
                                        setToAccountId("");
                                    }
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">Select source account</option>

                                {accounts.map((account) => (
                                    <option
                                        key={account.id}
                                        value={account.id}
                                    >
                                        {accountName(account)} — {currency(Number(account.balance || 0))}
                                    </option>
                                ))}
                            </select>

                            {sourceAccount && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Available balance:{" "}
                                    <span className="font-bold text-green-700">
                                        {currency(availableBalance)}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* DESTINATION ACCOUNT */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                To Account
                            </label>

                            <select
                                required
                                value={toAccountId}
                                onChange={(event) =>
                                    setToAccountId(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">Select destination account</option>

                                {accounts
                                    .filter((account) => account.id !== fromAccountId)
                                    .map((account) => (
                                        <option
                                            key={account.id}
                                            value={account.id}
                                        >
                                            {accountName(account)} — {accountType(account)}
                                        </option>
                                    ))}
                            </select>

                            {destinationAccount && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Current balance:{" "}
                                    <span className="font-semibold text-slate-700">
                                        {currency(Number(destinationAccount.balance || 0))}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* AMOUNT */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Transfer Amount
                            </label>

                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                                    ₱
                                </span>

                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={amount}
                                    onChange={(event) =>
                                        setAmount(event.target.value)
                                    }
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-lg font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {insufficientBalance && (
                                <p className="mt-2 text-xs font-semibold text-red-600">
                                    Insufficient balance.
                                </p>
                            )}
                        </div>

                        {/* DATE */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Transfer Date
                            </label>

                            <input
                                required
                                type="date"
                                value={transactionDate}
                                onChange={(event) =>
                                    setTransactionDate(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* REFERENCE */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Reference Number
                                <span className="ml-1 font-normal text-slate-400">
                                    (Optional)
                                </span>
                            </label>

                            <input
                                value={referenceNo}
                                onChange={(event) =>
                                    setReferenceNo(event.target.value)
                                }
                                maxLength={100}
                                placeholder="Bank transfer reference or receipt number"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* DESCRIPTION */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Remarks
                            </label>

                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                maxLength={500}
                                rows={3}
                                placeholder="Enter transfer remarks..."
                                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* TRANSFER PREVIEW */}

                        {sourceAccount && destinationAccount && transferAmount > 0 && (
                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                    Transfer Preview
                                </p>

                                <div className="mt-3 flex items-center justify-between text-sm">
                                    <span className="text-slate-600">
                                        {accountName(sourceAccount)}
                                    </span>
                                    <span className="font-bold text-red-600">
                                        −{currency(transferAmount)}
                                    </span>
                                </div>

                                <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-slate-600">
                                        {accountName(destinationAccount)}
                                    </span>
                                    <span className="font-bold text-green-600">
                                        +{currency(transferAmount)}
                                    </span>
                                </div>

                                <div className="mt-3 border-t border-blue-200 pt-3 text-xs text-blue-800">
                                    This is an internal transfer. It will not
                                    increase or decrease total business funds.
                                </div>
                            </div>
                        )}

                        {/* ERROR */}

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                !fromAccountId ||
                                !toAccountId ||
                                !amount ||
                                insufficientBalance
                            }
                            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? "Processing..." : "Confirm Transfer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
