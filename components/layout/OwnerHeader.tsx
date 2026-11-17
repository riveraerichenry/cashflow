"use client";

import { Bell, Menu } from "lucide-react";

type Props = {
    firstName: string;
    lastName: string;
    role: string;
    onMenuClick: () => void;
};

export default function OwnerHeader({
    firstName,
    lastName,
    role,
    onMenuClick,
}: Props) {
    return (
        <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:h-20 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open navigation menu"
                    aria-controls="cashflow-mobile-sidebar"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
                >
                    <Menu size={22} />
                </button>

                <div className="min-w-0">
                    <p className="truncate text-xs text-slate-500 sm:text-sm">
                        Business Workspace
                    </p>
                    <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                        Dashboard
                    </h2>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                <button
                    type="button"
                    aria-label="Notifications"
                    className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                >
                    <Bell size={20} />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
                </button>

                <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-slate-800">
                        {firstName} {lastName}
                    </p>
                    <p className="text-xs text-slate-500">{role}</p>
                </div>

                <div
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 sm:h-10 sm:w-10"
                    aria-label={`${firstName} ${lastName}`}
                    title={`${firstName} ${lastName}`}
                >
                    {firstName.charAt(0).toUpperCase()}
                    {lastName.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
