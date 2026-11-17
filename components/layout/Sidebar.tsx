"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Send,
  ClipboardCheck,
  ReceiptText,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useState } from "react";

const navigation = [
  {
    title: "MAIN MENU",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        label: "Employees",
        href: "/employees",
        icon: Users,
      },
      {
        label: "Cash Accounts",
        href: "/cash-accounts",
        icon: Wallet,
      },
    ],
  },
  {
    title: "TRANSACTIONS",
    items: [
      {
        label: "Cash In",
        href: "/cash-in",
        icon: ArrowDownCircle,
      },
      {
        label: "Remittances",
        href: "/remittances",
        icon: Send,
      },
      {
        label: "Withdrawals",
        href: "/withdrawals",
        icon: ArrowUpCircle,
      },
      {
        label: "Approvals",
        href: "/approvals",
        icon: ClipboardCheck,
      },
      {
        label: "Transactions",
        href: "/transactions",
        icon: ReceiptText,
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: ChartNoAxesCombined,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#173B75] text-white transition-all duration-300 ${
        collapsed ? "w-[82px]" : "w-[260px]"
      }`}
    >
      {/* LOGO */}
      <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316]">
            <Wallet size={22} className="text-white" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-wide">
                CashFlow
              </h1>
              <p className="text-[10px] uppercase tracking-[2px] text-blue-200">
                Business Manager
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[27px] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-800 shadow-md"
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
        {navigation.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[1.5px] text-blue-200/70">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      item.href === "/"
                        ? "bg-white text-[#173B75] shadow-sm"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={19}
                      className={
                        item.href === "/"
                          ? "text-[#F97316]"
                          : "text-blue-200 group-hover:text-[#F97316]"
                      }
                    />

                    {!collapsed && (
                      <span>{item.label}</span>
                    )}

                    {item.href === "/" && !collapsed && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[#F97316]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* USER PROFILE */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-sm font-bold">
            OW
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                Owner Account
              </p>
              <p className="text-xs text-blue-200">
                Administrator
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              title="Log out"
              className="text-blue-200 transition hover:text-[#F97316]"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}