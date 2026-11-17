
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    Plus,
    RefreshCw,
    Users,
    Search,
    KeyRound,
    UserCheck,
    UserX,
    Wallet,
    X,
    Copy,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Mail,
    Phone,
    Clock,
    ShieldCheck,
} from "lucide-react";

type EmployeeAccount = {
    id: string;
    account_name: string;
    account_type: string;
    is_active: boolean;
};

type Employee = {
    id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    username: string;
    role: string;
    is_active: boolean;
    account_status: string;
    must_change_password: boolean;
    last_login: string | null;
    created_at: string;
    accounts: EmployeeAccount[];
};

type CashAccount = {
    id: string;
    account_name: string;
    account_type: string;
    employee_id: string | null;
    is_active: boolean;
};

type Session = {
    firstName: string;
    lastName: string;
    role: string;
    businessName: string;
    businessCode: string;
};

const PAGE_SIZE = 10;

const initialForm = {
    employeeCode: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    accountIds: [] as string[],
};

const formatDate = (value: string | null) => {
    if (!value) return "Never";

    return new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function EmployeesPage() {
    const [session, setSession] = useState<Session | null>(null);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [accounts, setAccounts] = useState<CashAccount[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [processingId, setProcessingId] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [expandedEmployeeId, setExpandedEmployeeId] =
        useState<string | null>(null);

    const [form, setForm] = useState(initialForm);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [temporaryPassword, setTemporaryPassword] = useState("");
    const [passwordEmployee, setPasswordEmployee] = useState("");

    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const [
                meResponse,
                employeeResponse,
                accountResponse,
            ] = await Promise.all([
                fetch("/api/auth/me", {
                    cache: "no-store",
                }),

                fetch("/api/dashboard/employees", {
                    cache: "no-store",
                }),

                fetch("/api/dashboard/accounts", {
                    cache: "no-store",
                }),
            ]);

            if (meResponse.status === 401) {
                window.location.href = "/login";
                return;
            }

            const meData = await meResponse.json();
            const employeeData = await employeeResponse.json();
            const accountData = await accountResponse.json();

            if (!meResponse.ok || !meData.success) {
                throw new Error(
                    meData.message || "Unable to load session."
                );
            }

            if (!employeeResponse.ok || !employeeData.success) {
                throw new Error(
                    employeeData.message || "Unable to load employees."
                );
            }

            if (!accountResponse.ok || !accountData.success) {
                throw new Error(
                    accountData.message || "Unable to load accounts."
                );
            }

            const employee =
                meData.session || meData.employee || meData;

            if (employee.role !== "OWNER") {
                throw new Error(
                    "Only the Owner can access Employee Management."
                );
            }

            setSession({
                firstName: employee.firstName || "",
                lastName: employee.lastName || "",
                role: employee.role || "",
                businessName: employee.businessName || "",
                businessCode: employee.businessCode || "",
            });

            setEmployees(employeeData.employees || []);

            setAccounts(
                (accountData.accounts || []).filter(
                    (account: CashAccount) =>
                        account.is_active !== false
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load employees."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // =========================================================
    // CREATE EMPLOYEE
    // =========================================================

    async function createEmployee(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const response = await fetch(
                "/api/dashboard/employees",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(form),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to create employee."
                );
            }

            setShowModal(false);
            setForm(initialForm);

            setTemporaryPassword(result.temporaryPassword);

            setPasswordEmployee(
                `${result.employee.first_name} ${result.employee.last_name}`
            );

            await loadData(true);

            setCurrentPage(1);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create employee."
            );
        } finally {
            setSaving(false);
        }
    }

    // =========================================================
    // UPDATE EMPLOYEE
    // =========================================================

    async function updateEmployee(
        employee: Employee,
        changes: {
            isActive?: boolean;
            accountIds?: string[];
        }
    ) {
        setError("");
        setSuccess("");

        setProcessingId(employee.id);

        try {
            const response = await fetch(
                `/api/dashboard/employees/${employee.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(changes),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to update employee."
                );
            }

            setSuccess(
                result.message || "Employee updated successfully."
            );

            await loadData(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Update failed."
            );
        } finally {
            setProcessingId("");
        }
    }

    // =========================================================
    // RESET PASSWORD
    // =========================================================

    async function resetPassword(employee: Employee) {
        const confirmed = window.confirm(
            `Generate a new temporary password for ${employee.first_name} ${employee.last_name}?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        setProcessingId(employee.id);

        try {
            const response = await fetch(
                `/api/dashboard/employees/${employee.id}/reset-password`,
                {
                    method: "POST",
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Password reset failed."
                );
            }

            setTemporaryPassword(result.temporaryPassword);

            setPasswordEmployee(
                `${result.employee.first_name} ${result.employee.last_name}`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Password reset failed."
            );
        } finally {
            setProcessingId("");
        }
    }

    // =========================================================
    // FILTER EMPLOYEES
    // =========================================================

    const filteredEmployees = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return employees.filter((employee) => {
            return [
                employee.employee_code,
                employee.first_name,
                employee.last_name,
                employee.username,
                employee.email,
                employee.phone,
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [employees, search]);

    // =========================================================
    // PAGINATION
    // =========================================================

    const totalPages = Math.max(
        1,
        Math.ceil(filteredEmployees.length / PAGE_SIZE)
    );

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;

        return filteredEmployees.slice(
            startIndex,
            startIndex + PAGE_SIZE
        );
    }, [filteredEmployees, currentPage]);

    const startRecord =
        filteredEmployees.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1;

    const endRecord = Math.min(
        currentPage * PAGE_SIZE,
        filteredEmployees.length
    );

    useEffect(() => {
        setCurrentPage(1);
        setExpandedEmployeeId(null);
    }, [search]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const activeCount = employees.filter(
        (employee) => employee.is_active
    ).length;

    const inactiveCount = employees.length - activeCount;

    // =========================================================
    // LOADING
    // =========================================================

    if (loading && !session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <RefreshCw
                    className="animate-spin text-blue-700"
                    size={28}
                />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="p-8 text-center text-sm text-red-600">
                {error || "Unable to load Employee Management."}

                <button
                    onClick={() => loadData()}
                    className="ml-2 underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="w-full min-w-0 space-y-6">


                    {/* PAGE TITLE */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                                <Users size={17} />
                                Business Management
                            </div>

                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                Employees
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage employee accounts and cash account assignments.
                            </p>
                        </div>

                        <div className="flex gap-2">

                            <button
                                onClick={() => loadData(true)}
                                disabled={refreshing}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={16}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />

                                Refresh
                            </button>

                            <button
                                onClick={() => {
                                    setForm(initialForm);
                                    setShowModal(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                            >
                                <Plus size={18} />
                                Add Employee
                            </button>

                        </div>
                    </div>

                    {/* ALERTS */}

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                            {success}
                        </div>
                    )}

                    {/* SUMMARY */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                        <SummaryCard
                            title="Total Employees"
                            value={employees.length}
                            icon={<Users size={20} />}
                        />

                        <SummaryCard
                            title="Active Employees"
                            value={activeCount}
                            icon={<UserCheck size={20} />}
                        />

                        <SummaryCard
                            title="Inactive Employees"
                            value={inactiveCount}
                            icon={<UserX size={20} />}
                        />

                    </div>

                    {/* EMPLOYEE DIRECTORY */}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {/* DIRECTORY HEADER */}

                        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Employee Directory
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Employee accounts for {session.businessName}
                                </p>
                            </div>

                            <div className="relative w-full sm:max-w-xs">
                                <Search
                                    size={17}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search employees..."
                                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                        </div>

                        {/* DIRECTORY COUNT */}

                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">

                            <p className="text-xs text-slate-500">
                                Showing{" "}
                                <span className="font-semibold text-slate-800">
                                    {startRecord}-{endRecord}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-800">
                                    {filteredEmployees.length}
                                </span>{" "}
                                employees
                            </p>

                            <p className="text-xs text-slate-500">
                                Click an employee to view details
                            </p>

                        </div>

                        {/* EMPTY STATE */}

                        {filteredEmployees.length === 0 ? (

                            <div className="px-5 py-16 text-center">

                                <Users
                                    className="mx-auto text-slate-300"
                                    size={35}
                                />

                                <h3 className="mt-3 font-semibold text-slate-800">
                                    {search
                                        ? "No matching employees"
                                        : "No employees created yet"}
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Add an employee to start managing your team.
                                </p>

                            </div>

                        ) : (

                            <div className="divide-y divide-slate-100">

                                {paginatedEmployees.map((employee) => {

                                    const isExpanded =
                                        expandedEmployeeId === employee.id;

                                    const availableAccounts = accounts.filter(
                                        (account) =>
                                            !account.employee_id ||
                                            account.employee_id === employee.id
                                    );

                                    const assignedIds = employee.accounts
                                        .filter((account) => account.is_active)
                                        .map((account) => account.id);

                                    return (

                                        <div key={employee.id}>

                                            {/* COMPACT EMPLOYEE ROW */}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExpandedEmployeeId(
                                                        isExpanded
                                                            ? null
                                                            : employee.id
                                                    );
                                                }}
                                                className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5 ${
                                                    isExpanded
                                                        ? "bg-blue-50/50"
                                                        : "bg-white"
                                                }`}
                                            >

                                                {/* AVATAR */}

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                                                    {employee.first_name.charAt(0)}
                                                    {employee.last_name.charAt(0)}
                                                </div>

                                                {/* EMPLOYEE NAME */}

                                                <div className="min-w-0 flex-1">

                                                    <div className="flex flex-wrap items-center gap-2">

                                                        <p className="truncate text-sm font-bold text-slate-900">
                                                            {employee.first_name}{" "}
                                                            {employee.last_name}
                                                        </p>

                                                        <StatusBadge
                                                            active={employee.is_active}
                                                        />

                                                    </div>

                                                    <p className="mt-1 truncate text-xs text-slate-500">
                                                        {employee.employee_code}
                                                        {" · "}
                                                        @{employee.username}
                                                    </p>

                                                </div>

                                                {/* ACCOUNT COUNT */}

                                                <div className="hidden shrink-0 text-right sm:block">

                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {assignedIds.length}
                                                    </p>

                                                    <p className="text-xs text-slate-400">
                                                        Accounts
                                                    </p>

                                                </div>

                                                {/* EXPAND ICON */}

                                                <div className="shrink-0 rounded-lg p-2 text-slate-400">

                                                    {isExpanded ? (
                                                        <ChevronDown size={19} />
                                                    ) : (
                                                        <ChevronRight size={19} />
                                                    )}

                                                </div>

                                            </button>

                                            {/* EXPANDED DETAILS */}

                                            {isExpanded && (

                                                <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">

                                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                                                        {/* EMPLOYEE INFORMATION */}

                                                        <div className="space-y-4">

                                                            <div>
                                                                <h3 className="text-sm font-bold text-slate-800">
                                                                    Employee Information
                                                                </h3>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Account and contact details
                                                                </p>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                                                <InfoItem
                                                                    icon={<Mail size={15} />}
                                                                    label="Email"
                                                                    value={employee.email || "No email"}
                                                                />

                                                                <InfoItem
                                                                    icon={<Phone size={15} />}
                                                                    label="Phone"
                                                                    value={employee.phone || "No phone"}
                                                                />

                                                                <InfoItem
                                                                    icon={<Clock size={15} />}
                                                                    label="Last Login"
                                                                    value={formatDate(employee.last_login)}
                                                                />

                                                                <InfoItem
                                                                    icon={<ShieldCheck size={15} />}
                                                                    label="Password Status"
                                                                    value={
                                                                        employee.must_change_password
                                                                            ? "Change required"
                                                                            : "Password changed"
                                                                    }
                                                                />

                                                            </div>

                                                            {/* ACTION BUTTONS */}

                                                            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        resetPassword(employee)
                                                                    }
                                                                    disabled={
                                                                        processingId === employee.id ||
                                                                        !employee.is_active
                                                                    }
                                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                                                >
                                                                    <KeyRound size={14} />

                                                                    Reset Password
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const next =
                                                                            !employee.is_active;

                                                                        if (
                                                                            window.confirm(
                                                                                `${next ? "Activate" : "Deactivate"} ${employee.first_name} ${employee.last_name}?`
                                                                            )
                                                                        ) {
                                                                            updateEmployee(
                                                                                employee,
                                                                                {
                                                                                    isActive: next,
                                                                                }
                                                                            );
                                                                        }
                                                                    }}
                                                                    disabled={
                                                                        processingId === employee.id
                                                                    }
                                                                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                                                                        employee.is_active
                                                                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                                                                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                    }`}
                                                                >
                                                                    {employee.is_active ? (
                                                                        <UserX size={14} />
                                                                    ) : (
                                                                        <UserCheck size={14} />
                                                                    )}

                                                                    {employee.is_active
                                                                        ? "Deactivate"
                                                                        : "Activate"}
                                                                </button>

                                                            </div>

                                                        </div>

                                                        {/* CASH ACCOUNT ASSIGNMENTS */}

                                                        <div className="rounded-xl border border-slate-200 bg-white p-4">

                                                            <div className="mb-3 flex items-center justify-between gap-2">

                                                                <div className="flex items-center gap-2">
                                                                    <Wallet
                                                                        size={17}
                                                                        className="text-blue-700"
                                                                    />

                                                                    <h3 className="text-sm font-bold text-slate-800">
                                                                        Assigned Cash Accounts
                                                                    </h3>
                                                                </div>

                                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                                    {assignedIds.length} assigned
                                                                </span>

                                                            </div>

                                                            <p className="mb-3 text-xs text-slate-500">
                                                                Select the accounts this employee is allowed to handle.
                                                            </p>

                                                            <div className="space-y-2">

                                                                {availableAccounts.map((account) => (

                                                                    <label
                                                                        key={account.id}
                                                                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/50"
                                                                    >

                                                                        <input
                                                                            type="checkbox"
                                                                            checked={assignedIds.includes(account.id)}
                                                                            disabled={
                                                                                !employee.is_active ||
                                                                                processingId === employee.id
                                                                            }
                                                                            onChange={(e) => {

                                                                                const next = e.target.checked
                                                                                    ? [
                                                                                        ...assignedIds,
                                                                                        account.id,
                                                                                    ]
                                                                                    : assignedIds.filter(
                                                                                        (id) =>
                                                                                            id !== account.id
                                                                                    );

                                                                                updateEmployee(
                                                                                    employee,
                                                                                    {
                                                                                        accountIds: next,
                                                                                    }
                                                                                );
                                                                            }}
                                                                            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                                                                        />

                                                                        <span className="min-w-0 flex-1">

                                                                            <span className="block text-sm font-medium text-slate-800">
                                                                                {account.account_name}
                                                                            </span>

                                                                            <span className="text-xs text-slate-500">
                                                                                {account.account_type}
                                                                            </span>

                                                                        </span>

                                                                    </label>

                                                                ))}

                                                                {availableAccounts.length === 0 && (

                                                                    <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
                                                                        No assignable cash accounts available.
                                                                    </div>

                                                                )}

                                                            </div>

                                                            {processingId === employee.id && (
                                                                <p className="mt-3 text-xs text-blue-700">
                                                                    Updating employee...
                                                                </p>
                                                            )}

                                                        </div>

                                                    </div>

                                                </div>

                                            )}

                                        </div>

                                    );
                                })}

                            </div>

                        )}

                        {/* PAGINATION */}

                        {filteredEmployees.length > PAGE_SIZE && (

                            <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

                                <p className="text-xs text-slate-500">
                                    Page {currentPage} of {totalPages}
                                </p>

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentPage((page) =>
                                                Math.max(1, page - 1)
                                            );

                                            setExpandedEmployeeId(null);
                                        }}
                                        disabled={currentPage === 1}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft size={15} />
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentPage((page) =>
                                                Math.min(totalPages, page + 1)
                                            );

                                            setExpandedEmployeeId(null);
                                        }}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                        <ChevronRight size={15} />
                                    </button>

                                </div>

                            </div>

                        )}

                    </section>

            {/* ================================================= */}
            {/* ADD EMPLOYEE MODAL */}
            {/* ================================================= */}

            {showModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3">

                    <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-200 p-5">

                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Add Employee
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Create a new employee login account.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-2 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form
                            onSubmit={createEmployee}
                            className="space-y-5 overflow-y-auto p-5"
                        >

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <Field label="Employee Code *">
                                    <input
                                        required
                                        value={form.employeeCode}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                employeeCode: e.target.value.toUpperCase(),
                                            })
                                        }
                                        placeholder="EMP-001"
                                        className="field-input"
                                    />
                                </Field>

                                <Field label="Username *">
                                    <input
                                        required
                                        minLength={3}
                                        value={form.username}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                username: e.target.value,
                                            })
                                        }
                                        placeholder="employee01"
                                        className="field-input"
                                    />
                                </Field>

                                <Field label="First Name *">
                                    <input
                                        required
                                        value={form.firstName}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                firstName: e.target.value,
                                            })
                                        }
                                        placeholder="First name"
                                        className="field-input"
                                    />
                                </Field>

                                <Field label="Last Name *">
                                    <input
                                        required
                                        value={form.lastName}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                lastName: e.target.value,
                                            })
                                        }
                                        placeholder="Last name"
                                        className="field-input"
                                    />
                                </Field>

                                <Field label="Email">
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                email: e.target.value,
                                            })
                                        }
                                        placeholder="employee@example.com"
                                        className="field-input"
                                    />
                                </Field>

                                <Field label="Phone">
                                    <input
                                        value={form.phone}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                phone: e.target.value,
                                            })
                                        }
                                        placeholder="09XXXXXXXXX"
                                        className="field-input"
                                    />
                                </Field>

                            </div>

                            {/* ACCOUNT ASSIGNMENT */}

                            <div>

                                <p className="mb-2 text-sm font-semibold text-slate-700">
                                    Assign Cash Accounts
                                </p>

                                <p className="mb-3 text-xs text-slate-500">
                                    Optional. Accounts already assigned to another employee cannot be selected.
                                </p>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                                    {accounts
                                        .filter(
                                            (account) => !account.employee_id
                                        )
                                        .map((account) => (

                                            <label
                                                key={account.id}
                                                className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={form.accountIds.includes(
                                                        account.id
                                                    )}
                                                    onChange={(e) => {
                                                        setForm({
                                                            ...form,
                                                            accountIds: e.target.checked
                                                                ? [
                                                                    ...form.accountIds,
                                                                    account.id,
                                                                ]
                                                                : form.accountIds.filter(
                                                                    (id) =>
                                                                        id !== account.id
                                                                ),
                                                        });
                                                    }}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-700"
                                                />

                                                <span>
                                                    <span className="block font-medium text-slate-800">
                                                        {account.account_name}
                                                    </span>

                                                    <span className="text-xs text-slate-500">
                                                        {account.account_type}
                                                    </span>
                                                </span>

                                            </label>

                                        ))}

                                </div>

                            </div>

                            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                                A temporary password will be generated automatically. The employee must change it on their first login.
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={saving}
                                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    {saving
                                        ? "Creating..."
                                        : "Create Employee"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* ================================================= */}
            {/* TEMPORARY PASSWORD MODAL */}
            {/* ================================================= */}

            {temporaryPassword && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <KeyRound size={24} />
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-slate-900">
                            Temporary Password
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            For {passwordEmployee}. Copy and securely provide this password to the employee. It will not be shown again.
                        </p>

                        <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 p-3">

                            <code className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900">
                                {temporaryPassword}
                            </code>

                            <button
                                type="button"
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        temporaryPassword
                                    )
                                }
                                className="shrink-0 rounded-lg bg-blue-700 p-2 text-white"
                                title="Copy temporary password"
                            >
                                <Copy size={17} />
                            </button>

                        </div>

                        <button
                            onClick={() => {
                                setTemporaryPassword("");
                                setPasswordEmployee("");
                            }}
                            className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Close
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}

// =============================================================
// SUMMARY CARD
// =============================================================

function SummaryCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

                <p className="text-sm text-slate-500">
                    {title}
                </p>

                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                    {icon}
                </div>

            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
                {value}
            </p>

        </div>
    );
}

// =============================================================
// INFORMATION ITEM
// =============================================================

function InfoItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 rounded-lg border border-slate-100 bg-white p-3">

            <div className="flex items-center gap-2 text-xs text-slate-500">
                {icon}
                {label}
            </div>

            <p className="mt-2 break-words text-sm font-medium text-slate-800">
                {value}
            </p>

        </div>
    );
}

// =============================================================
// FORM FIELD
// =============================================================

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">

            <span className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </span>

            {children}

        </label>
    );
}

// =============================================================
// STATUS BADGE
// =============================================================

function StatusBadge({
    active,
}: {
    active: boolean;
}) {
    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
            }`}
        >
            {active ? "ACTIVE" : "INACTIVE"}
        </span>
    );
}
