
"use client";

import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";

type Owner = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
};

type Business = {
    id: string;
    business_name: string;
    business_code: string;
    is_active: boolean;
    created_at: string;
    employee_count: number;
    owner: Owner | null;
};

type BusinessForm = {
    businessName: string;
    businessCode: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
    ownerUsername: string;
};

const initialForm: BusinessForm = {
    businessName: "",
    businessCode: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerUsername: "",
};

export default function BusinessesPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [form, setForm] = useState<BusinessForm>(initialForm);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);

    const [search, setSearch] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [temporaryPassword, setTemporaryPassword] = useState("");
    const [createdBusiness, setCreatedBusiness] = useState("");
    const [passwordOwner, setPasswordOwner] = useState("");

    const [copyMessage, setCopyMessage] = useState("");

    // =========================================================
    // LOAD BUSINESSES
    // =========================================================

    const loadBusinesses = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "/api/system-admin/businesses",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load businesses."
                );
            }

            setBusinesses(
                (data.businesses || []).map((business: any) => ({
                    ...business,
                    employee_count: Number(business.employee_count || 0),
                    owner: business.owner
                        ? {
                            id: business.owner.id,
                            firstName: business.owner.firstName ?? business.owner.first_name,
                            lastName: business.owner.lastName ?? business.owner.last_name,
                            email: business.owner.email,
                            username: business.owner.username,
                        }
                        : null,
                }))
            );

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load businesses."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBusinesses();
    }, [loadBusinesses]);

    // =========================================================
    // FORM
    // =========================================================

    function updateForm(
        field: keyof BusinessForm,
        value: string
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function closeCreateModal() {
        if (saving) return;

        setShowModal(false);
        setForm(initialForm);
        setError("");
    }

    // =========================================================
    // CREATE BUSINESS
    // =========================================================

    async function handleCreateBusiness(
        e: FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                "/api/system-admin/businesses",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(form),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to create business."
                );
            }

            const newBusiness: Business = {
                ...data.business,
                employee_count: 0,
                owner: data.owner
                    ? {
                        id: data.owner.id,
                        firstName: data.owner.first_name,
                        lastName: data.owner.last_name,
                        email: data.owner.email,
                        username: data.owner.username,
                    }
                    : null,
            };

            setBusinesses((current) => [
                newBusiness,
                ...current,
            ]);

            setCreatedBusiness(data.business.business_name);
            setPasswordOwner(
                data.owner
                    ? `${data.owner.first_name} ${data.owner.last_name}`
                    : "Business Owner"
            );

            setTemporaryPassword(data.temporaryPassword);
            setCopyMessage("");

            setForm(initialForm);
            setShowModal(false);

            setSuccess("Business registered successfully.");

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create business."
            );
        } finally {
            setSaving(false);
        }
    }

    // =========================================================
    // ACTIVATE / DEACTIVATE
    // =========================================================

    async function toggleBusiness(business: Business) {
        const action = business.is_active
            ? "deactivate"
            : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${business.business_name}?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `/api/system-admin/businesses/${business.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        isActive: !business.is_active,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to update business."
                );
            }

            setBusinesses((current) =>
                current.map((item) =>
                    item.id === business.id
                        ? {
                            ...item,
                            is_active: data.business?.is_active ??
                                !business.is_active,
                        }
                        : item
                )
            );

            setSuccess(
                `${business.business_name} has been ${action}d.`
            );

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update business."
            );
        }
    }

    // =========================================================
    // RESET OWNER PASSWORD
    // =========================================================

    async function resetOwnerPassword(business: Business) {
        if (!business.owner) {
            setError("This business has no Owner account.");
            return;
        }

        const confirmed = window.confirm(
            `Generate a new temporary password for ${business.owner.firstName} ${business.owner.lastName}? The existing password will stop working immediately.`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `/api/system-admin/businesses/${business.id}/reset-owner-password`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to reset Owner password."
                );
            }

            setCreatedBusiness(data.businessName);
            setPasswordOwner(
                `${data.owner.firstName} ${data.owner.lastName}`
            );

            setTemporaryPassword(data.temporaryPassword);
            setCopyMessage("");

            setSuccess("Owner password reset successfully.");

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to reset Owner password."
            );
        }
    }

    // =========================================================
    // COPY PASSWORD
    // =========================================================

    async function copyTemporaryPassword() {
        try {
            await navigator.clipboard.writeText(temporaryPassword);
            setCopyMessage("Password copied successfully.");
        } catch {
            setCopyMessage(
                "Copy failed. Please select and copy the password manually."
            );
        }
    }

    function closePasswordModal() {
        setTemporaryPassword("");
        setCreatedBusiness("");
        setPasswordOwner("");
        setCopyMessage("");
    }

    // =========================================================
    // SEARCH AND SUMMARY
    // =========================================================

    const filteredBusinesses = businesses.filter((business) => {
        const value = search.toLowerCase();

        return (
            business.business_name.toLowerCase().includes(value) ||
            business.business_code.toLowerCase().includes(value) ||
            business.owner?.email.toLowerCase().includes(value) ||
            business.owner?.username.toLowerCase().includes(value)
        );
    });

    const activeCount = businesses.filter(
        (business) => business.is_active
    ).length;

    const inactiveCount = businesses.length - activeCount;

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">

                {/* HEADER */}

                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                            System Administration / Businesses
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Business Management
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Register and manage businesses using CashFlow.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setForm(initialForm);
                            setShowModal(true);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:w-auto"
                    >
                        <span className="text-lg">+</span>
                        Register Business
                    </button>

                </div>

                {/* ALERTS */}

                {error && (
                    <Alert
                        type="error"
                        message={error}
                        onClose={() => setError("")}
                    />
                )}

                {success && (
                    <Alert
                        type="success"
                        message={success}
                        onClose={() => setSuccess("")}
                    />
                )}

                {/* SUMMARY */}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                    <SummaryCard
                        title="Total Businesses"
                        value={businesses.length}
                        description="All registered businesses"
                        color="blue"
                    />

                    <SummaryCard
                        title="Active Businesses"
                        value={activeCount}
                        description="Currently enabled"
                        color="green"
                    />

                    <SummaryCard
                        title="Inactive Businesses"
                        value={inactiveCount}
                        description="Currently disabled"
                        color="orange"
                    />

                </div>

                {/* BUSINESS TABLE */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Registered Businesses
                            </h2>

                            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                Manage registrations and Owner accounts.
                            </p>
                        </div>

                        <div className="flex w-full gap-2 lg:w-auto">

                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search businesses..."
                                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-72"
                            />

                            <button
                                type="button"
                                onClick={loadBusinesses}
                                disabled={loading}
                                className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:px-4"
                            >
                                Refresh
                            </button>

                        </div>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px] text-left text-sm">

                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Business</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4">Employees</th>
                                    <th className="px-6 py-4">Date Registered</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                            Loading businesses...
                                        </td>
                                    </tr>
                                ) : filteredBusinesses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="text-3xl">🏢</div>
                                            <div className="mt-3 font-semibold text-slate-700">
                                                No businesses found
                                            </div>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Register your first business to get started.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBusinesses.map((business) => (
                                        <tr
                                            key={business.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="font-semibold text-slate-900">
                                                    {business.business_name}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-400">
                                                    Code: {business.business_code}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                {business.owner ? (
                                                    <>
                                                        <div className="font-medium text-slate-800">
                                                            {business.owner.firstName}{" "}
                                                            {business.owner.lastName}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-400">
                                                            {business.owner.email}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-400">
                                                            @{business.owner.username}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        No Owner assigned
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-5 text-slate-600">
                                                {business.employee_count ?? 0}
                                            </td>

                                            <td className="px-6 py-5 text-slate-600">
                                                {new Date(
                                                    business.created_at
                                                ).toLocaleDateString("en-PH", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </td>

                                            <td className="px-6 py-5">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        business.is_active
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {business.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex flex-col items-end gap-2">

                                                    <button
                                                        type="button"
                                                        disabled={!business.owner}
                                                        onClick={() => resetOwnerPassword(business)}
                                                        className="whitespace-nowrap rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        Reset Owner Password
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleBusiness(business)}
                                                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                                            business.is_active
                                                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                                : "bg-green-50 text-green-700 hover:bg-green-100"
                                                        }`}
                                                    >
                                                        {business.is_active ? "Deactivate" : "Activate"}
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}

                            </tbody>

                        </table>

                    </div>

                    <div className="border-t border-slate-100 px-4 py-4 text-xs text-slate-400 sm:px-6">
                        Showing {filteredBusinesses.length} of {businesses.length} businesses
                    </div>

                </div>

            </main>

            {/* =====================================================
                REGISTER BUSINESS MODAL
            ===================================================== */}

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-slate-950/60 p-3 sm:items-center sm:p-5"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeCreateModal();
                        }
                    }}
                >

                    <div className="my-auto flex max-h-[calc(100dvh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-40px)]">

                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                                    Register New Business
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                    Create a business and its Owner account.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeCreateModal}
                                disabled={saving}
                                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateBusiness}
                            className="flex min-h-0 flex-1 flex-col overflow-hidden"
                        >

                            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-6">

                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}

                                {/* BUSINESS DETAILS */}

                                <section>
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                            🏢
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Business Information
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                Basic business details
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                        <InputField
                                            label="Business Name"
                                            required
                                            value={form.businessName}
                                            placeholder="Enter business name"
                                            onChange={(value) => updateForm("businessName", value)}
                                            className="sm:col-span-2"
                                        />

                                        <InputField
                                            label="Business Code"
                                            required
                                            value={form.businessCode}
                                            placeholder="e.g. RGM001"
                                            onChange={(value) => updateForm("businessCode", value.toUpperCase())}
                                        />

                                    </div>
                                </section>

                                <div className="border-t border-slate-100" />

                                {/* OWNER DETAILS */}

                                <section>
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                                            👤
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Business Owner Account
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                Initial account credentials
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                        <InputField
                                            label="First Name"
                                            required
                                            value={form.ownerFirstName}
                                            placeholder="First name"
                                            onChange={(value) => updateForm("ownerFirstName", value)}
                                        />

                                        <InputField
                                            label="Last Name"
                                            required
                                            value={form.ownerLastName}
                                            placeholder="Last name"
                                            onChange={(value) => updateForm("ownerLastName", value)}
                                        />

                                        <InputField
                                            label="Owner Email"
                                            type="email"
                                            required
                                            value={form.ownerEmail}
                                            placeholder="owner@example.com"
                                            onChange={(value) => updateForm("ownerEmail", value)}
                                        />

                                        <InputField
                                            label="Username"
                                            required
                                            value={form.ownerUsername}
                                            placeholder="owner.username"
                                            onChange={(value) => updateForm("ownerUsername", value)}
                                        />

                                    </div>
                                </section>

                                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                                    <p className="text-sm font-semibold text-orange-900">
                                        🔐 Temporary Password
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-orange-800">
                                        A temporary password will be generated automatically.
                                        The Owner must change it on their first login.
                                    </p>
                                </div>

                            </div>

                            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end sm:px-6">

                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={saving}
                                    className="w-full rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                >
                                    {saving ? "Registering..." : "Register Business"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =====================================================
                TEMPORARY PASSWORD MODAL
            ===================================================== */}

            {temporaryPassword && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/60 p-4">

                    <div className="my-auto max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl sm:p-7">

                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
                            ✓
                        </div>

                        <h2 className="text-xl font-bold text-slate-900">
                            {passwordOwner ? "Owner Password Ready" : "Password Reset"}
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            Business: <strong className="text-slate-800">{createdBusiness}</strong>
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Owner: <strong className="text-slate-800">{passwordOwner}</strong>
                        </p>

                        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">

                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-orange-700">
                                Temporary Password
                            </p>

                            <div className="break-all rounded-lg border border-orange-200 bg-white p-3 font-mono text-sm font-bold text-slate-900">
                                {temporaryPassword}
                            </div>

                            <button
                                type="button"
                                onClick={copyTemporaryPassword}
                                className="mt-3 w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700"
                            >
                                Copy Temporary Password
                            </button>

                            {copyMessage && (
                                <p className="mt-2 text-xs text-orange-800">
                                    {copyMessage}
                                </p>
                            )}

                        </div>

                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                            Save this password and securely provide it to the Owner.
                            It will not be displayed again after closing this window.
                        </div>

                        <button
                            type="button"
                            onClick={closePasswordModal}
                            className="mt-6 w-full rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                            Done
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}

// =============================================================
// INPUT FIELD
// =============================================================

function InputField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
    className = "",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-slate-700">
                {label} {required && "*"}
            </label>

            <input
                type={type}
                required={required}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>
    );
}

// =============================================================
// ALERT
// =============================================================

function Alert({
    type,
    message,
    onClose,
}: {
    type: "error" | "success";
    message: string;
    onClose: () => void;
}) {
    const styles =
        type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-green-200 bg-green-50 text-green-700";

    return (
        <div className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
            <span>{message}</span>
            <button type="button" onClick={onClose} className="font-bold">
                ✕
            </button>
        </div>
    );
}

// =============================================================
// SUMMARY CARD
// =============================================================

function SummaryCard({
    title,
    value,
    description,
    color,
}: {
    title: string;
    value: number;
    description: string;
    color: "blue" | "green" | "orange";
}) {
    const colors = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        orange: "bg-orange-50 text-orange-700",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="text-sm font-medium text-slate-500">
                {title}
            </div>

            <div className="mt-3 text-3xl font-bold text-slate-900">
                {value}
            </div>

            <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${colors[color]}`}>
                {description}
            </div>

        </div>
    );
}
