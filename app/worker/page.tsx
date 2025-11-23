"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function WorkerOrdersPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                                    <p className="text-sm text-gray-500">{order.customerName}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    {new Date(order.date).toLocaleDateString()}
                                </div>
                                {order.ceremonyDates && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Calendar size={16} className="text-blue-500" />
                                        <span>{order.ceremonyDates.replace(/^"|"$/g, '')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    {order.location || "No location"}
                                </div>
                                <div className="font-semibold text-gray-900 mt-2">
                                    Worker Amount: ${order.workerAmount?.toLocaleString() || "0"}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
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
                                    <div className="text-center text-gray-400 text-sm italic">
                                        Assigned to {order.workerName || "someone else"}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
