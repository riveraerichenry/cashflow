
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    X,
    LayoutDashboard,
    Wallet,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    Users,
    ClipboardList,
    CheckCircle,
    Settings,
    LogOut,
    Building2,
    ChartNoAxesCombined,
    BookOpen,
    Activity,
} from "lucide-react";
import { useState } from "react";

type NavigationItem = {
    name: string;
    href: string;
    icon: React.ElementType;
};

type NavigationGroup = {
    label: string;
    items: NavigationItem[];
};

type Props = {
    businessName: string;
    businessCode: string;
    role: string;
    isMobileOpen: boolean;
    onClose: () => void;
};

// ================================================================
// OWNER NAVIGATION
// ================================================================

const ownerNavigation: NavigationGroup[] = [
    {
        label: "OVERVIEW",
        items: [
            {
                name: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: "CASH MANAGEMENT",
        items: [
            {
                name: "Cash Accounts",
                href: "/dashboard/accounts",
                icon: Wallet,
            },
            {
                name: "Cash In",
                href: "/dashboard/cash-in",
                icon: ArrowDownToLine,
            },
            {
                name: "Cash Out",
                href: "/dashboard/cash-out",
                icon: ArrowUpFromLine,
            },
            {
                name: "Transfers",
                href: "/dashboard/transfers",
                icon: ArrowLeftRight,
            },
            {
                name: "Remittances",
                href: "/dashboard/remittances",
                icon: ArrowLeftRight,
            },
            {
                name: "Transactions",
                href: "/dashboard/transactions",
                icon: ClipboardList,
            },
        ],
    },
    {
        label: "BUSINESS MANAGEMENT",
        items: [
            {
                name: "Employees",
                href: "/dashboard/employees",
                icon: Users,
            },
            {
                name: "Approvals",
                href: "/dashboard/approvals",
                icon: CheckCircle,
            },
        ],
    },
    {
        label: "REPORTS",
        items: [
            {
                name: "Financial Reports",
                href: "/dashboard/reports",
                icon: ChartNoAxesCombined,
            },
            {
                name: "Cash Account Ledger",
                href: "/dashboard/reports/ledger",
                icon: BookOpen,
            },
        ],
    },
    {
        label: "SYSTEM",
        items: [
            {
                name: "Activity Logs",
                href: "/dashboard/audit-logs",
                icon: Activity,
            },
            {
                name: "Settings",
                href: "/dashboard/settings",
                icon: Settings,
            },
        ],
    },
];

// ================================================================
// EMPLOYEE NAVIGATION
// ================================================================

const employeeNavigation: NavigationGroup[] = [
    {
        label: "OVERVIEW",
        items: [
            {
                name: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: "MY CASH",
        items: [
            {
                name: "Cash In",
                href: "/dashboard/cash-in",
                icon: ArrowDownToLine,
            },
            {
                name: "Cash Out",
                href: "/dashboard/cash-out",
                icon: ArrowUpFromLine,
            },
            {
                name: "Remittances",
                href: "/dashboard/remittances",
                icon: ArrowLeftRight,
            },
            {
                name: "My Transactions",
                href: "/dashboard/transactions",
                icon: ClipboardList,
            },
        ],
    },
];

// ================================================================
// SIDEBAR COMPONENT
// ================================================================

export default function OwnerSidebar({
    businessName,
    businessCode,
    role,
    isMobileOpen,
    onClose,
}: Props) {
    const pathname = usePathname();
    const router = useRouter();

    const [loggingOut, setLoggingOut] = useState(false);

    const isEmployee = role === "EMPLOYEE";

    const navigation = isEmployee
        ? employeeNavigation
        : ownerNavigation;

    // ============================================================
    // LOGOUT
    // ============================================================

    async function handleLogout() {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Logout failed.");
            }

            router.replace("/login");
            router.refresh();

        } catch (error) {
            console.error("LOGOUT ERROR:", error);

            setLoggingOut(false);

            alert("Unable to log out. Please try again.");
        }
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <aside
            id="cashflow-mobile-sidebar"
            className={`fixed inset-y-0 left-0 z-[60] flex h-screen w-64 shrink-0 flex-col bg-[#173B75] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 lg:shadow-none ${
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            aria-label="Main navigation"
        >

            {/* BRAND */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-6">
                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl font-bold">
                        C
                    </div>

                    <div>
                        <h1 className="text-lg font-bold">
                            CashFlow
                        </h1>

                        <p className="text-xs text-blue-200">
                            Business Management
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close navigation menu"
                    className="rounded-lg p-2 text-blue-100 transition hover:bg-white/10 lg:hidden"
                >
                    <X size={20} />
                </button>
            </div>

            {/* BUSINESS INFORMATION */}
            <div className="border-b border-white/10 px-5 py-4">

                <div className="flex items-center gap-2">

                    <Building2
                        size={17}
                        className="shrink-0 text-orange-400"
                    />

                    <p className="truncate text-sm font-semibold">
                        {businessName}
                    </p>

                </div>

                <p className="mt-1 pl-6 text-xs text-blue-200">
                    {businessCode}
                </p>

                <p className="mt-2 pl-6 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                    {isEmployee ? "Employee Portal" : "Owner Portal"}
                </p>

            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">

                {navigation.map((group) => (

                    <div key={group.label}>

                        <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-blue-300">
                            {group.label}
                        </p>

                        <div className="space-y-1">

                            {group.items.map((item) => {

                                const Icon = item.icon;

                                const active =
                                    item.href === "/dashboard"
                                        ? pathname === item.href
                                        : pathname === item.href ||
                                          pathname.startsWith(item.href + "/");

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                                            active
                                                ? "bg-white font-semibold text-blue-800 shadow-sm"
                                                : "text-blue-100 hover:bg-white/10"
                                        }`}
                                    >

                                        <Icon size={18} />

                                        <span>
                                            {item.name}
                                        </span>

                                    </Link>
                                );

                            })}

                        </div>

                    </div>

                ))}

            </nav>

            {/* LOGOUT */}
            <div className="border-t border-white/10 p-4">

                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-blue-100 transition hover:bg-white/10 disabled:opacity-50"
                >

                    <LogOut size={18} />

                    {loggingOut
                        ? "Logging out..."
                        : "Sign Out"}

                </button>

            </div>

        </aside>
    );
}
