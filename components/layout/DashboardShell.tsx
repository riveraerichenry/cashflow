"use client";

import { useEffect, useState, type ReactNode } from "react";

import OwnerSidebar from "@/components/layout/OwnerSidebar";
import OwnerHeader from "@/components/layout/OwnerHeader";

type Props = {
    children: ReactNode;
    firstName: string;
    lastName: string;
    role: string;
    businessName: string;
    businessCode: string;
};

export default function DashboardShell({
    children,
    firstName,
    lastName,
    role,
    businessName,
    businessCode,
}: Props) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!mobileMenuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setMobileMenuOpen(false);
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, []);

    return (
        <div className="flex min-h-screen min-w-0 bg-slate-50">
            {mobileMenuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
                />
            )}

            <OwnerSidebar
                businessName={businessName}
                businessCode={businessCode}
                role={role}
                isMobileOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <OwnerHeader
                    firstName={firstName}
                    lastName={lastName}
                    role={role}
                    onMenuClick={() => setMobileMenuOpen(true)}
                />

                <main className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
