"use client";

import { useEffect, useState } from "react";
import { Plus, Search, User } from "lucide-react";

export default function WorkersPage() {
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchWorkers = () => {
        fetch("/api/worker")
            .then((res) => res.json())
            .then((data) => {
                setWorkers(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Worker Management</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Worker
                </button>
            </div>

            {/* Worker List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Joined Date</th>
                            <th className="px-6 py-3">Assigned Orders</th>
                            <th className="px-6 py-3">Total Sales</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
                            </tr>
                        ) : workers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No workers found</td>
                            </tr>
                        ) : (
                            workers.map((worker) => (
                                <tr key={worker.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                                            <User size={16} />
                                        </div>
                                        {worker.name}
                                    </td>
                                    <td className="px-6 py-4">{worker.email}</td>
                                    <td className="px-6 py-4">{new Date(worker.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{worker._count.assignedOrders}</td>
                                    <td className="px-6 py-4">{worker._count.sales}</td>
                                    <td className="px-6 py-4">
                                        <button className="text-red-600 hover:underline text-xs">Deactivate</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Worker Modal */}
            {isModalOpen && (
                <CreateWorkerModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchWorkers();
                    }}
                />
            )}
        </div>
    );
}

function CreateWorkerModal({ onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name");
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const res = await fetch("/api/worker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (!res.ok) throw new Error("Failed to create worker");

            onSuccess();
        } catch (err) {
            setError("Failed to create worker. Email might be in use.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New Worker</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input name="name" required className="w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input name="email" type="email" required className="w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input name="password" type="password" required className="w-full p-2 border rounded-md" />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Worker"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
