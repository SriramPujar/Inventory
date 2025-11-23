"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const businessName = formData.get("businessName");
        const adminName = formData.get("adminName");
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessName, adminName, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            router.push("/login/admin");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Register Business</h1>
                    <p className="text-gray-500">Start managing your inventory today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="My Awesome Business"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Admin Name</label>
                        <input
                            name="adminName"
                            type="text"
                            required
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        Create Account
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login/admin" className="text-blue-600 hover:underline font-medium">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
