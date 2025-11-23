import { LoginForm } from "@/components/auth/login-form";

export default function WorkerLoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Worker Login</h1>
                    <p className="text-gray-500">Access your assigned tasks</p>
                </div>

                <LoginForm role="WORKER" />
            </div>
        </div>
    );
}
