import { FormEvent } from "react";
import { X, Wallet } from "lucide-react";
import { Account } from "./types";

type Props = {
    open: boolean;
    accounts: Account[];
    accountId: string;
    amount: string;
    purpose: string;
    submitting: boolean;
    onAccountChange: (value: string) => void;
    onAmountChange: (value: string) => void;
    onPurposeChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
};

export default function WithdrawalRequestModal({
    open,
    accounts,
    accountId,
    amount,
    purpose,
    submitting,
    onAccountChange,
    onAmountChange,
    onPurposeChange,
    onSubmit,
    onClose,
}: Props) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !submitting) {
                    onClose();
                }
            }}
        >
            <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center gap-2 text-blue-700">
                            <Wallet size={19} />

                            <h2 className="text-lg font-bold text-slate-900">
                                Request Cash Out
                            </h2>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            Submit your withdrawal request for Owner approval.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close modal"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="space-y-5 p-4 sm:p-6"
                >
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Cash Account *
                        </label>

                        <select
                            value={accountId}
                            onChange={(event) =>
                                onAccountChange(event.target.value)
                            }
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">
                                Select account
                            </option>

                            {accounts.map((account) => (
                                <option
                                    key={account.id}
                                    value={account.id}
                                >
                                    {account.account_name} ({account.account_type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Amount *
                        </label>

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(event) =>
                                onAmountChange(event.target.value)
                            }
                            required
                            placeholder="0.00"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Purpose *
                        </label>

                        <textarea
                            value={purpose}
                            onChange={(event) =>
                                onPurposeChange(event.target.value)
                            }
                            required
                            minLength={3}
                            maxLength={1000}
                            rows={4}
                            placeholder="Explain why you need the cash..."
                            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting || accounts.length === 0}
                            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}