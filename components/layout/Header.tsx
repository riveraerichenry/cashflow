"use client";

import {
  Bell,
  Search,
  CalendarDays,
  ChevronDown,
} from "lucide-react";

export default function Header() {
  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
      {/* LEFT */}
      <div>
        <h2 className="text-lg font-bold text-slate-800">
          Dashboard
        </h2>
        <p className="hidden text-xs text-slate-500 sm:block">
          Welcome back! Here's your business cash overview.
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 md:flex">
          <CalendarDays size={15} className="text-[#1D4ED8]" />
          {today}
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-orange-50 hover:text-[#F97316]">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#F97316]" />
        </button>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
            OW
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Owner
            </p>
            <p className="text-[11px] text-slate-500">
              Administrator
            </p>
          </div>

          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}