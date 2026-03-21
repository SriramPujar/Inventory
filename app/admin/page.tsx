"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, IndianRupee, ShoppingBag, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/dashboard")
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch data");
                }
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Error: {error}
            </div>
        );
    }

    if (!data) return <div>No data available</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={`₹${data.totalRevenue.toLocaleString()}`}
                    icon={IndianRupee}
                    color="bg-green-500"
                    onClick={() => setSelectedCard('REVENUE')}
                />
                <StatCard
                    title="Total Orders"
                    value={data.orderStats.total}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                    onClick={() => setSelectedCard('TOTAL_ORDERS')}
                />
                <StatCard
                    title="Pending Orders"
                    value={data.orderStats.pending}
                    icon={Loader2}
                    color="bg-yellow-500"
                    onClick={() => setSelectedCard('PENDING')}
                />
                <StatCard
                    title="Completed Orders"
                    value={data.orderStats.completed}
                    icon={TrendingUp}
                    color="bg-purple-500"
                    onClick={() => setSelectedCard('COMPLETED')}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Sales Trends (Last 7 Days)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <LineChart data={data.salesTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Revenue Split</h3>
                    <div className="flex items-center justify-center h-64 space-x-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">₹{data.onlineRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-700">Online</div>
                        </div>
                        <div className="h-16 w-px bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">₹{data.offlineRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-700">Offline</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Worker Performance */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Worker Performance</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Worker Name</th>
                                <th className="px-6 py-3">Total Sales</th>
                                <th className="px-6 py-3">Completed Orders</th>
                                <th className="px-6 py-3">Pending Orders</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.workerPerformance.map((worker: any, idx: number) => (
                                <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{worker.name}</td>
                                    <td className="px-6 py-4">₹{worker.totalSales.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-green-600">{worker.completedOrders}</td>
                                    <td className="px-6 py-4 text-yellow-600">{worker.pendingOrders}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedCard && (
                <DetailsModal 
                    type={selectedCard}
                    data={data}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between ${onClick ? 'cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all' : ''}`}
        >
            <div>
                <p className="text-sm font-medium text-gray-700">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                <Icon className={`text-${color.split('-')[1]}-600`} size={24} />
            </div>
        </div>
    );
}

function DetailsModal({ type, data, onClose }: { type: string, data: any, onClose: () => void }) {
    let listData: any[] = [];
    let title = "";

    if (type === 'REVENUE') {
        title = "Total Revenue Breakdown (Sales)";
        listData = data.products || [];
    } else if (type === 'TOTAL_ORDERS') {
        title = "Total Orders";
        listData = data.orders || [];
    } else if (type === 'PENDING') {
        title = "Pending Orders";
        listData = (data.orders || []).filter((o: any) => o.status === "PENDING");
    } else if (type === 'COMPLETED') {
        title = "Completed Orders";
        listData = (data.orders || []).filter((o: any) => o.status === "COMPLETED");
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:bg-gray-200 rounded-full p-2 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                    <div className="border border-gray-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Customer</th>
                                    {type === 'REVENUE' ? (
                                        <>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3">Method</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Status</th>
                                        </>
                                    )}
                                    <th className="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            No records found.
                                        </td>
                                    </tr>
                                ) : (
                                    listData.map((item, idx) => (
                                        <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {item.customerName}
                                            </td>
                                            
                                            {/* Column 3 & 4 */}
                                            {type === 'REVENUE' ? (
                                                <>
                                                    <td className="px-4 py-3 truncate max-w-xs">{item.productName}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${item.paymentMethod === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {item.paymentMethod}
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 truncate max-w-xs">{item.orderName}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                            ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                                                            ${item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : ''}
                                                            ${item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                        `}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                ₹{item.amount?.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
