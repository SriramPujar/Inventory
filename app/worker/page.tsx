"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function WorkerOrdersPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOrderId, setEditOrderId] = useState<string | null>(null);

    const fetchOrders = () => {
        fetch("/api/order")
            .then(async (res) => {
                if (res.ok) return res.json();
                throw new Error("Failed to fetch orders");
            })
            .then((data) => {
                setOrders(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        await fetch("/api/order", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
        fetchOrders();
    };

    const handleClaimOrder = async (id: string) => {
        if (!session?.user?.id) return;
        await fetch("/api/order", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, workerId: session.user.id }),
        });
        fetchOrders();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => {
                    const isAssignedToMe = order.workerId === session?.user?.id;
                    const isUnassigned = !order.workerId;

                    return (
                        <div key={order.id} className={`bg-white p-6 rounded-lg shadow-sm border ${isAssignedToMe ? 'border-blue-200 ring-1 ring-blue-200' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{order.orderName}</h3>
                                    <p className="text-sm text-gray-700">{order.customerName}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-800 mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    {new Date(order.date).toLocaleDateString()}
                                </div>
                                {order.ceremonyDates && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar size={16} className="text-blue-500" />
                                        <span>{order.ceremonyDates.replace(/^"|"$/g, '')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    {order.location || "No location"}
                                </div>
                                <div className="font-semibold text-gray-900 mt-2">
                                    Worker Amount: ₹{order.workerAmount?.toLocaleString() || "0"}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                                {(isUnassigned || isAssignedToMe) && (
                                    <button
                                        onClick={() => setEditOrderId(order.id)}
                                        className="w-full bg-blue-50 text-blue-700 py-2 rounded-md hover:bg-blue-100 text-sm font-medium border border-blue-100"
                                    >
                                        Edit Order Details
                                    </button>
                                )}
                                {isUnassigned ? (
                                    <button
                                        onClick={() => handleClaimOrder(order.id)}
                                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                                    >
                                        Claim Order
                                    </button>
                                ) : isAssignedToMe ? (
                                    <div className="flex gap-2">
                                        {order.status !== "COMPLETED" && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, "COMPLETED")}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm font-medium flex justify-center items-center gap-1"
                                            >
                                                <CheckCircle size={16} /> Complete
                                            </button>
                                        )}
                                        {order.status === "PENDING" && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, "IN_PROGRESS")}
                                                className="flex-1 bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 text-sm font-medium flex justify-center items-center gap-1"
                                            >
                                                <Clock size={16} /> Start
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-800 text-sm italic">
                                        Assigned to {order.workerName || "someone else"}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {editOrderId && (
                <EditOrderModal
                    order={orders.find(o => o.id === editOrderId)}
                    workers={[]} // Workers list is not needed for workers themselves
                    onClose={() => setEditOrderId(null)}
                    onSuccess={() => {
                        setEditOrderId(null);
                        fetchOrders();
                    }}
                />
            )}
        </div>
    );
}

function EditOrderModal({ order, workers, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: order.customerName,
        orderName: order.orderName,
        date: new Date(order.date).toISOString().split('T')[0],
        amount: order.amount,
        totalAccessories: order.totalAccessories || 0,
        ceremonyDates: order.ceremonyDates ? JSON.parse(order.ceremonyDates) : "",
        accessories: order.accessories || "",
        workerAmount: order.workerAmount || 0,
        location: order.location || "",
        workerId: order.workerId || ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // Find worker name if workerId is selected
        let workerName = null;
        if (formData.workerId) {
            const w = workers.find((wk: any) => wk.id === formData.workerId);
            if (w) workerName = w.name;
        }

        const updateData = {
            id: order.id,
            ...formData,
            amount: parseFloat(formData.amount as string),
            totalAccessories: parseInt(formData.totalAccessories as string),
            workerAmount: parseFloat(formData.workerAmount as string),
            ceremonyDates: JSON.stringify(formData.ceremonyDates), // Needs to be stringified as per schema
            workerName
        };

        try {
            await fetch("/api/order", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });
            onSuccess();
        } catch (err) {
            alert("Failed to update order");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Edit Order</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                            <input name="customerName" value={formData.customerName} onChange={handleChange} required className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Order Name</label>
                            <input name="orderName" value={formData.orderName} onChange={handleChange} required className="w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input name="date" type="date" value={formData.date} onChange={handleChange} required className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount</label>
                            <input name="amount" type="number" value={formData.amount} onChange={handleChange} required className="w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Accessories (Count)</label>
                            <input name="totalAccessories" type="number" value={formData.totalAccessories} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ceremony Dates</label>
                            <input name="ceremonyDates" placeholder="e.g. 2023-10-01" value={formData.ceremonyDates} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Accessories Description</label>
                        <textarea name="accessories" value={formData.accessories} onChange={handleChange} className="w-full p-2 border rounded-md" rows={2} placeholder="List items..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Worker Amount</label>
                        <input name="workerAmount" type="number" value={formData.workerAmount} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input name="location" value={formData.location} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
