
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
    Plus,
    Wallet,
    Building2,
    Smartphone,
    Search,
    RefreshCw,
    X,
    User,
    Power,
    CreditCard,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

type Account = {
    id: string;
    account_name: string;
    account_type: "CASH" | "BANK" | "EWALLET";
    account_number: string | null;
    provider: string | null;
    description: string | null;
    employee_id: string | null;
    is_active: boolean;
    balance: string;
    employee_code: string | null;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
};

type Employee = {
    id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
};

type AccountForm = {
    accountName: string;
    accountType: "CASH" | "BANK" | "EWALLET";
    accountNumber: string;
    provider: string;
    description: string;
    employeeId: string;
};

const initialForm: AccountForm = {
    accountName: "",
    accountType: "CASH",
    accountNumber: "",
    provider: "",
    description: "",
    employeeId: "",
};

const PAGE_SIZE = 10;

const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(value || 0));

const typeLabels = {
    CASH: "Cash",
    BANK: "Bank",
    EWALLET: "E-Wallet",
};

export default function CashAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<AccountForm>(initialForm);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [accountsResponse, employeesResponse] = await Promise.all([
                fetch("/api/dashboard/accounts", { cache: "no-store" }),
                fetch("/api/dashboard/employees", { cache: "no-store" }),
            ]);

            const accountsData = await accountsResponse.json();

            if (!accountsResponse.ok || !accountsData.success) {
                throw new Error(accountsData.message || "Unable to load accounts.");
            }

            setAccounts(accountsData.accounts || []);

            if (employeesResponse.ok) {
                const employeesData = await employeesResponse.json();

                if (employeesData.success) {
                    setEmployees(employeesData.employees || []);
                }
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load accounts."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const filteredAccounts = useMemo(() => {
        return accounts.filter((account) => {
            const matchesFilter =
                filter === "ALL" || account.account_type === filter;

            const text = [
                account.account_name,
                account.account_type,
                account.account_number,
                account.provider,
                account.first_name,
                account.last_name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return matchesFilter && text.includes(search.toLowerCase());
        });
    }, [accounts, filter, search]);

    // Pagination calculations
    const totalPages = Math.max(
        1,
        Math.ceil(filteredAccounts.length / PAGE_SIZE)
    );

    const startIndex = (currentPage - 1) * PAGE_SIZE;

    const paginatedAccounts = filteredAccounts.slice(
        startIndex,
        startIndex + PAGE_SIZE
    );

    // Reset pagination when search or type filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filter]);

    // Keep current page valid when accounts are added or removed
    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const activeAccounts = accounts.filter((account) => account.is_active);

    const totalBalance = activeAccounts.reduce(
        (sum, account) => sum + Number(account.balance || 0),
        0
    );

    const cashCount = activeAccounts.filter(
        (a) => a.account_type === "CASH"
    ).length;

    const bankCount = activeAccounts.filter(
        (a) => a.account_type === "BANK"
    ).length;

    const walletCount = activeAccounts.filter(
        (a) => a.account_type === "EWALLET"
    ).length;

    function updateForm<K extends keyof AccountForm>(
        key: K,
        value: AccountForm[K]
    ) {
        setForm((previous) => ({ ...previous, [key]: value }));
    }

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (form.accountType === "BANK" && !form.accountNumber.trim()) {
            setError("Please enter the bank account number.");
            return;
        }

        if (form.accountType === "EWALLET" && !form.provider.trim()) {
            setError("Please enter the e-wallet provider.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/dashboard/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountName: form.accountName,
                    accountType: form.accountType,
                    accountNumber: form.accountNumber || null,
                    provider: form.provider || null,
                    description: form.description || null,
                    employeeId: form.employeeId || null,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to create account.");
            }

            setShowModal(false);
            setForm(initialForm);
            setCurrentPage(1);
            setMessage("Cash account created successfully.");

            await loadAccounts();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to create account."
            );
        } finally {
            setSaving(false);
        }
    }

    async function toggleAccount(account: Account) {
        const action = account.is_active ? "deactivate" : "activate";

        if (
            !window.confirm(
                `Are you sure you want to ${action} ${account.account_name}?`
            )
        ) {
            return;
        }

        setUpdatingId(account.id);
        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `/api/dashboard/accounts/${account.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: !account.is_active }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to update account.");
            }

            setMessage(data.message);
            await loadAccounts();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to update account."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <main className="space-y-6">
            {/* =====================================================
                PAGE HEADER
            ===================================================== */}

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Cash Accounts
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage your business cash, bank, and e-wallet accounts.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={loadAccounts}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        onClick={() => {
                            setError("");
                            setForm(initialForm);
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                        <Plus size={17} />
                        Add Account
                    </button>
                </div>
            </div>

            {/* ALERTS */}

            {error && (
                <Alert
                    type="error"
                    message={error}
                    onClose={() => setError("")}
                />
            )}

            {message && (
                <Alert
                    type="success"
                    message={message}
                    onClose={() => setMessage("")}
                />
            )}

            {/* =====================================================
                SUMMARY CARDS
            ===================================================== */}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Total Account Balance"
                    value={formatCurrency(totalBalance)}
                    subtitle="Active accounts only"
                    icon={<Wallet size={22} />}
                    color="blue"
                />

                <SummaryCard
                    title="Cash Accounts"
                    value={String(cashCount)}
                    subtitle="Active cash accounts"
                    icon={<Wallet size={22} />}
                    color="green"
                />

                <SummaryCard
                    title="Bank Accounts"
                    value={String(bankCount)}
                    subtitle="Active bank accounts"
                    icon={<Building2 size={22} />}
                    color="purple"
                />

                <SummaryCard
                    title="E-Wallet Accounts"
                    value={String(walletCount)}
                    subtitle="Active digital wallets"
                    icon={<Smartphone size={22} />}
                    color="orange"
                />
            </section>

            {/* =====================================================
                ACCOUNT DIRECTORY
            ===================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">
                            Account Directory
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {accounts.length} total accounts
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search accounts..."
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
                            />
                        </div>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Types</option>
                            <option value="CASH">Cash</option>
                            <option value="BANK">Bank</option>
                            <option value="EWALLET">E-Wallet</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-sm text-slate-400">
                        Loading cash accounts...
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Wallet size={26} />
                        </div>

                        <h3 className="mt-4 font-semibold text-slate-800">
                            No accounts found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Create your first cash, bank, or e-wallet account.
                        </p>

                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                            Create Account
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ACCOUNT TABLE */}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Account</th>
                                        <th className="px-5 py-4">Type</th>
                                        <th className="px-5 py-4">Account Details</th>
                                        <th className="px-5 py-4">Assigned To</th>
                                        <th className="px-5 py-4 text-right">Balance</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {paginatedAccounts.map((account) => (
                                        <tr
                                            key={account.id}
                                            className="hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {account.account_name}
                                                </p>

                                                {account.description && (
                                                    <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                                                        {account.description}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <TypeBadge type={account.account_type} />
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                <p>{account.provider || "—"}</p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {account.account_number || "No account number"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {account.employee_id ? (
                                                    <>
                                                        <p>
                                                            {account.first_name} {account.last_name}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {account.employee_code}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        Business
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-right font-bold text-slate-900">
                                                {formatCurrency(account.balance)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        account.is_active
                                                            ? "bg-green-50 text-green-700"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    {account.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => toggleAccount(account)}
                                                    disabled={updatingId === account.id}
                                                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                                                        account.is_active
                                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                            : "bg-green-50 text-green-700 hover:bg-green-100"
                                                    }`}
                                                >
                                                    <Power size={14} />

                                                    {updatingId === account.id
                                                        ? "Updating..."
                                                        : account.is_active
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}

                        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Showing{" "}
                                <span className="font-semibold text-slate-700">
                                    {startIndex + 1}
                                </span>
                                {" "}to{" "}
                                <span className="font-semibold text-slate-700">
                                    {Math.min(
                                        startIndex + PAGE_SIZE,
                                        filteredAccounts.length
                                    )}
                                </span>
                                {" "}of{" "}
                                <span className="font-semibold text-slate-700">
                                    {filteredAccounts.length}
                                </span>
                                {" "}accounts
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((page) => Math.max(1, page - 1))
                                    }
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>

                                <span className="whitespace-nowrap px-2 text-sm font-medium text-slate-600">
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
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* =====================================================
                CREATE ACCOUNT MODAL
            ===================================================== */}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5">
                    <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Create Cash Account
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    New accounts start with a zero balance.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreate}
                            className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"
                        >
                            <FormField label="Account Name">
                                <input
                                    required
                                    minLength={2}
                                    maxLength={100}
                                    value={form.accountName}
                                    onChange={(e) =>
                                        updateForm("accountName", e.target.value)
                                    }
                                    placeholder="e.g. Main Cash, GCash Main"
                                    className="form-input"
                                />
                            </FormField>

                            <FormField label="Account Type">
                                <select
                                    value={form.accountType}
                                    onChange={(e) =>
                                        updateForm(
                                            "accountType",
                                            e.target.value as AccountForm["accountType"]
                                        )
                                    }
                                    className="form-input"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK">Bank</option>
                                    <option value="EWALLET">E-Wallet</option>
                                </select>
                            </FormField>

                            {form.accountType === "BANK" && (
                                <>
                                    <FormField label="Bank Account Number">
                                        <input
                                            required
                                            value={form.accountNumber}
                                            onChange={(e) =>
                                                updateForm("accountNumber", e.target.value)
                                            }
                                            placeholder="Enter bank account number"
                                            className="form-input"
                                        />
                                    </FormField>

                                    <FormField label="Bank Name">
                                        <input
                                            value={form.provider}
                                            onChange={(e) =>
                                                updateForm("provider", e.target.value)
                                            }
                                            placeholder="e.g. BDO, BPI, LandBank"
                                            className="form-input"
                                        />
                                    </FormField>
                                </>
                            )}

                            {form.accountType === "EWALLET" && (
                                <>
                                    <FormField label="E-Wallet Provider">
                                        <select
                                            required
                                            value={form.provider}
                                            onChange={(e) =>
                                                updateForm("provider", e.target.value)
                                            }
                                            className="form-input"
                                        >
                                            <option value="">Select provider</option>
                                            <option value="GCash">GCash</option>
                                            <option value="Maya">Maya</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </FormField>

                                    <FormField label="Wallet Number">
                                        <input
                                            value={form.accountNumber}
                                            onChange={(e) =>
                                                updateForm("accountNumber", e.target.value)
                                            }
                                            placeholder="Enter wallet number"
                                            className="form-input"
                                        />
                                    </FormField>
                                </>
                            )}

                            {form.accountType === "CASH" && (
                                <FormField label="Reference / Identifier (Optional)">
                                    <input
                                        value={form.accountNumber}
                                        onChange={(e) =>
                                            updateForm("accountNumber", e.target.value)
                                        }
                                        placeholder="Optional reference"
                                        className="form-input"
                                    />
                                </FormField>
                            )}

                            <FormField label="Assign to Employee (Optional)">
                                <select
                                    value={form.employeeId}
                                    onChange={(e) =>
                                        updateForm("employeeId", e.target.value)
                                    }
                                    className="form-input"
                                >
                                    <option value="">
                                        Business account (not assigned)
                                    </option>

                                    {employees.map((employee) => (
                                        <option
                                            key={employee.id}
                                            value={employee.id}
                                        >
                                            {employee.first_name} {employee.last_name} ({employee.employee_code})
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Description (Optional)">
                                <textarea
                                    rows={3}
                                    maxLength={500}
                                    value={form.description}
                                    onChange={(e) =>
                                        updateForm("description", e.target.value)
                                    }
                                    placeholder="Account purpose or notes"
                                    className="form-input resize-none"
                                />
                            </FormField>

                            {error && (
                                <Alert type="error" message={error} />
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                                >
                                    {saving ? "Creating..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .form-input {
                    width: 100%;
                    border: 1px solid #cbd5e1;
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    font-size: 0.875rem;
                    outline: none;
                    background: white;
                }

                .form-input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
            `}</style>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    subtitle,
    icon,
    color,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
}) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        purple: "bg-purple-50 text-purple-700",
        orange: "bg-orange-50 text-orange-700",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-500">{title}</p>
                    <h3 className="mt-3 text-2xl font-bold text-slate-900">
                        {value}
                    </h3>
                </div>

                <div className={`rounded-xl p-3 ${colors[color]}`}>
                    {icon}
                </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">{subtitle}</p>
        </div>
    );
}

function FormField({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </label>

            {children}
        </div>
    );
}

function TypeBadge({ type }: { type: Account["account_type"] }) {
    const styles = {
        CASH: "bg-green-50 text-green-700",
        BANK: "bg-blue-50 text-blue-700",
        EWALLET: "bg-purple-50 text-purple-700",
    };

    const Icon =
        type === "CASH"
            ? Wallet
            : type === "BANK"
                ? Building2
                : Smartphone;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[type]}`}
        >
            <Icon size={13} />
            {typeLabels[type]}
        </span>
    );
}

function Alert({
    type,
    message,
    onClose,
}: {
    type: "error" | "success";
    message: string;
    onClose?: () => void;
}) {
    return (
        <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
            }`}
        >
            <span>{message}</span>

            {onClose && (
                <button onClick={onClose} aria-label="Dismiss message">
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
