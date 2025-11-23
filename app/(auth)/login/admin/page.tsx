import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
                    <p className="text-gray-500">Manage your business inventory</p>
                </div>

                <LoginForm role="ADMIN" />

                <div className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                        Register your business
                    </Link>
                </div>
            </div>
        </div>
    );
}
