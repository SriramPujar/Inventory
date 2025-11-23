"use client";

import { useEffect, useState } from "react";
import { Plus, Calendar, MapPin, User } from "lucide-react";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = () => {
        fetch("/api/order")
            .then(async (res) => {
                if (res.ok) return res.json();
                throw new Error("Failed to fetch orders");
            })
            .then(setOrders)
            .catch(console.error);

        fetch("/api/worker")
            .then(async (res) => {
                if (res.ok) return res.json();
                throw new Error("Failed to fetch workers");
            })
            .then(setWorkers)
            .catch(console.error);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New Order
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{order.orderName}</h3>
                                <p className="text-sm text-gray-500">{order.customerName}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                {new Date(order.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} />
                                {order.location || "No location"}
                            </div>
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                {order.workerName || (order.worker ? order.worker.name : "Unassigned")}
                            </div>
                            <div className="font-semibold text-gray-900 mt-2">
                                ${order.amount.toLocaleString()}
                            </div>
                            <div className="font-semibold text-blue-600 mt-1">
                                Worker: ${order.workerAmount?.toLocaleString() || "0"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <CreateOrderModal
                    workers={workers}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}

function CreateOrderModal({ workers, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const workerId = formData.get("workerId") as string;
        let workerName = "";
        if (workerId) {
            const w = workers.find((w: any) => w.id === workerId);
            if (w) workerName = w.name;
        }

        try {
            await fetch("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, workerName }),
            });
            onSuccess();
        } catch (err) {
            alert("Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Create New Order</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                            <input name="customerName" required className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Order Name</label>
                            <input name="orderName" required className="w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input name="date" type="date" required className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount</label>
                            <input name="amount" type="number" required className="w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Worker Amount</label>
                        <input name="workerAmount" type="number" className="w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input name="location" className="w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ceremony Dates</label>
                        <input name="ceremonyDates" placeholder="e.g. 2023-10-01, 2023-10-02" className="w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assign Worker</label>
                        <select name="workerId" className="w-full p-2 border rounded-md">
                            <option value="">Unassigned</option>
                            {workers.map((w: any) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Create Order</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
