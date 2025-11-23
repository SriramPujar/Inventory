"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

interface LoginFormProps {
    role: "ADMIN" | "WORKER";
}

export function LoginForm({ role }: LoginFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const businessName = formData.get("businessName") as string;

        try {
            const result = await signIn("credentials", {
                email,
                password,
                businessName,
                expectedRole: role,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push(role === "ADMIN" ? "/admin" : "/worker");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
            {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Business Name</label>
                <input
                    name="businessName"
                    type="text"
                    required
                    suppressHydrationWarning
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter your business name"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                    name="email"
                    type="email"
                    required
                    suppressHydrationWarning
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="name@example.com"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                    name="password"
                    type="password"
                    required
                    suppressHydrationWarning
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                />
            </div>

            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
            </div>

            <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Sign In as {role === "ADMIN" ? "Admin" : "Worker"}
            </button>
        </form>
    );
}
