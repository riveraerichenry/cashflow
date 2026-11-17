import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import SummaryCards from "@/components/dashboard/SummaryCards";
import EmployeeBalances from "@/components/dashboard/EmployeeBalances";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="min-h-screen pl-[82px] lg:pl-[260px]">
        <Header />

        <div className="space-y-7 p-5 md:p-8">
          {/* PAGE TITLE */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Business Overview
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor your business cash, employees, and transactions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#EA580C]">
                <ArrowDownCircle size={18} />
                Cash In
              </button>

              <button className="flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF]">
                <ArrowUpCircle size={18} />
                Cash Out
              </button>
            </div>
          </section>

          {/* SUMMARY CARDS */}
          <SummaryCards />

          {/* CASH SUMMARY */}
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#173B75] to-[#1D4ED8] p-6 text-white shadow-sm xl:col-span-2">
              <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[30px] border-white/5" />
              <div className="absolute -bottom-24 right-36 h-64 w-64 rounded-full border-[30px] border-white/5" />

              <div className="relative z-10">
                <p className="text-sm font-medium text-blue-100">
                  Total Available Business Cash
                </p>

                <h2 className="mt-3 text-4xl font-bold tracking-tight">
                  ₱250,000.00
                </h2>

                <p className="mt-3 text-xs text-blue-100">
                  Combined available balance across all business cash accounts
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-xs text-blue-100">
                      Cash Accounts
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      ₱170,000.00
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-xs text-blue-100">
                      Employee Funds
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      ₱80,000.00
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute right-6 top-6 hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316] sm:flex">
                <Plus size={28} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-800">
                Quick Actions
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Manage your cash operations
              </p>

              <div className="mt-6 space-y-3">
                <button className="flex w-full items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 p-4 text-left transition hover:border-orange-300">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316] text-white">
                    <ArrowDownCircle size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Record Cash In
                    </p>
                    <p className="text-xs text-slate-500">
                      Add incoming cash
                    </p>
                  </div>
                </button>

                <button className="flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left transition hover:border-blue-300">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D4ED8] text-white">
                    <ArrowUpCircle size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Request Withdrawal
                    </p>
                    <p className="text-xs text-slate-500">
                      Submit for owner approval
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </section>

          {/* EMPLOYEES */}
          <section>
            <EmployeeBalances />
          </section>

          {/* TRANSACTIONS */}
          <section>
            <RecentTransactions />
          </section>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
            CashFlow Business Cash Monitoring System
          </footer>
        </div>
      </main>
    </div>
  );
}