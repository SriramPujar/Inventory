"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Calendar, MapPin, User, Trash2 } from "lucide-react";

function OrdersContent() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editOrderId, setEditOrderId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const shouldAdd = searchParams.get('add') === 'true';

    useEffect(() => {
        if (shouldAdd) {
            setIsModalOpen(true);
        }
    }, [shouldAdd]);

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

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const selectedOrder = orders.find(o => o.id === selectedOrderId);

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
                                <p className="text-sm text-gray-700">{order.customerName}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-800">
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
                                ₹{order.amount.toLocaleString()}
                            </div>
                            <div className="font-semibold text-blue-600 mt-1">
                                Worker: ₹{order.workerAmount?.toLocaleString() || "0"}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                            <button
                                onClick={() => setSelectedOrderId(order.id)}
                                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 text-sm font-medium"
                            >
                                Details & Payments
                            </button>
                            <button
                                onClick={() => setEditOrderId(order.id)}
                                className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-md hover:bg-blue-100 text-sm font-medium"
                            >
                                Edit Order
                            </button>
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

            {editOrderId && (
                <EditOrderModal
                    order={orders.find(o => o.id === editOrderId)}
                    workers={workers}
                    onClose={() => setEditOrderId(null)}
                    onSuccess={() => {
                        setEditOrderId(null);
                        fetchData();
                    }}
                />
            )}

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrderId(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrdersContent />
        </Suspense>
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
            <div className="bg-white text-gray-900 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Accessories (Count)</label>
                            <input name="totalAccessories" type="number" className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ceremony Dates</label>
                            <input name="ceremonyDates" placeholder="e.g. 2023-10-01" className="w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Accessories Description</label>
                        <textarea name="accessories" className="w-full p-2 border rounded-md" rows={2} placeholder="List items..." />
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
                        <label className="block text-sm font-medium text-gray-700">Assign Worker</label>
                        <select name="workerId" className="w-full p-2 border rounded-md">
                            <option value="">Unassigned</option>
                            {workers.map((w: any) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Create Order</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function OrderDetailsModal({ order, onClose, onUpdate }: any) {
    const [loading, setLoading] = useState(false);

    // Parse accessories
    const accessoryItems = order.accessories ? order.accessories.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
    const [selectedAccessoryItems, setSelectedAccessoryItems] = useState<string[]>(order.providedAccessoryItems || []);

    const accessoriesProvidedCount = selectedAccessoryItems.length;

    // Payment State
    const [payAmount, setPayAmount] = useState("");
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [payNote, setPayNote] = useState("");

    const totalPaid = order.amountPaid || 0;
    const balance = order.amount - totalPaid;
    const accessoriesLeft = (order.totalAccessories || 0) - accessoriesProvidedCount;

    const toggleAccessorycheck = async (item: string) => {
        const newSelected = selectedAccessoryItems.includes(item)
            ? selectedAccessoryItems.filter(i => i !== item)
            : [...selectedAccessoryItems, item];

        setSelectedAccessoryItems(newSelected);

        // Save immediately
        try {
            await fetch("/api/order", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: order.id,
                    providedAccessoryItems: newSelected,
                }),
            });
            onUpdate();
        } catch (err) {
            alert("Failed to update accessories");
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch("/api/order", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: order.id,
                    newPayment: {
                        amount: parseFloat(payAmount),
                        date: payDate,
                        note: payNote
                    }
                }),
            });
            onUpdate();
        } catch (err) {
            alert("Failed to add payment");
            setLoading(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!confirm("Are you sure you want to delete this order PERMANENTLY?")) return;

        try {
            const res = await fetch(`/api/order?id=${order.id}`, { method: "DELETE" });
            if (res.ok) {
                onUpdate(); // This will re-fetch data
                onClose(); // Explicitly close since the order acts as "update" but now it's gone
            } else {
                alert("Failed to delete order");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting order");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{order.orderName}</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDeleteOrder}
                            className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 flex items-center gap-1 text-sm font-medium"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                        <button onClick={onClose} className="text-gray-700 hover:text-gray-900 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">Close</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Accessories Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3">Accessories</h3>
                        <p className="text-sm text-gray-800 mb-2"><strong>Items:</strong> {order.accessories || "None"}</p>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Total Required:</span>
                                <span className="font-medium">{order.totalAccessories || 0}</span>
                            </div>
                            <div className="text-sm">
                                <div className="flex justify-between mb-2">
                                    <span>Provided ({accessoriesProvidedCount}):</span>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded bg-white">
                                    {accessoryItems.length > 0 ? (
                                        accessoryItems.map((item: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`acc-${idx}`}
                                                    checked={selectedAccessoryItems.includes(item)}
                                                    onChange={() => toggleAccessorycheck(item)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={`acc-${idx}`} className="text-gray-900 cursor-pointer select-none">
                                                    {item}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic text-xs">No individual items listed.</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2 mt-2">
                                <span className={accessoriesLeft > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                                    Left to Provide:
                                </span>
                                <span className={accessoriesLeft > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                                    {accessoriesLeft}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3">Installment Payments</h3>
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between">
                                <span>Total Amount:</span>
                                <span>₹{order.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Paid So Far:</span>
                                <span className="text-green-600">₹{totalPaid.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2">
                                <span>Pending Balance:</span>
                                <span className={balance > 0 ? "text-red-600" : "text-green-600"}>₹{balance.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mb-4 max-h-32 overflow-y-auto">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">History</h4>
                            {order.payments?.map((p: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                                    <span>{new Date(p.date).toLocaleDateString()}</span>
                                    <span className="text-gray-700">{p.note}</span>
                                    <span className="font-medium">₹{p.amount.toLocaleString()}</span>
                                </div>
                            ))}
                            {(!order.payments || order.payments.length === 0) && <p className="text-xs text-gray-800">No payments yet.</p>}
                        </div>

                        <form onSubmit={handleAddPayment} className="space-y-2 border-t pt-3">
                            <h4 className="text-sm font-medium">Add Payment</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    required
                                    className="p-1 border rounded text-sm w-full"
                                />
                                <input
                                    type="date"
                                    value={payDate}
                                    onChange={(e) => setPayDate(e.target.value)}
                                    required
                                    className="p-1 border rounded text-sm w-full"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Note (optional)"
                                value={payNote}
                                onChange={(e) => setPayNote(e.target.value)}
                                className="p-1 border rounded text-sm w-full"
                            />
                            <button
                                type="submit"
                                disabled={loading || !payAmount}
                                className="w-full bg-green-600 text-white py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                                Record Payment
                            </button>
                        </form>
                    </div>
                </div>
            </div>
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assign Worker</label>
                        <select name="workerId" value={formData.workerId || ""} onChange={handleChange} className="w-full p-2 border rounded-md">
                            <option value="">Unassigned</option>
                            {workers.map((w: any) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
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
