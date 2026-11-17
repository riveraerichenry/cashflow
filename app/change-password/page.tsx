
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (newPassword.length < 12) {
            setError("Your new password must contain at least 12 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Your new passwords do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setError("Your new password must be different from your current password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || "Unable to change password.");
                return;
            }

            setSuccess("Password changed successfully!");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                router.replace(data.redirectTo || "/dashboard");
                router.refresh();
            }, 1000);

        } catch (error) {
            console.error(error);
            setError("Unable to connect to the server. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">

            <div className="w-full max-w-md">

                {/* BRAND */}
                <div className="text-center mb-8">

                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white text-3xl font-bold shadow-lg">
                        C
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900">
                        CashFlow
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Business Cash Monitoring System
                    </p>

                </div>

                {/* FORM CARD */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">

                    <div className="mb-7">

                        <h2 className="text-xl font-bold text-slate-900">
                            Change Your Password
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Your account was created with a temporary password.
                            Please create a new password before continuing.
                        </p>

                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* CURRENT PASSWORD */}
                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Current Temporary Password
                            </label>

                            <input
                                type={showPasswords ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="Enter temporary password"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                        {/* NEW PASSWORD */}
                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                New Password
                            </label>

                            <input
                                type={showPasswords ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={12}
                                maxLength={128}
                                autoComplete="new-password"
                                placeholder="Enter new password"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />

                            <p className="mt-2 text-xs text-slate-400">
                                Minimum of 12 characters.
                            </p>

                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Confirm New Password
                            </label>

                            <input
                                type={showPasswords ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                placeholder="Confirm new password"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                        {/* SHOW PASSWORD */}
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">

                            <input
                                type="checkbox"
                                checked={showPasswords}
                                onChange={(e) => setShowPasswords(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                            />

                            Show passwords

                        </label>

                        {/* ERROR */}
                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* SUCCESS */}
                        {success && (
                            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                {success}
                            </div>
                        )}

                        {/* SUBMIT */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Updating Password..." : "Update Password"}
                        </button>

                    </form>

                    <div className="mt-7 border-t border-slate-100 pt-5 text-center">

                        <p className="text-xs text-slate-400">
                            CashFlow Business Cash Monitoring System
                        </p>

                    </div>

                </div>

            </div>

        </main>
    );
}
