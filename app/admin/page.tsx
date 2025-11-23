"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                    value={`$${data.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-green-500"
                />
                <StatCard
                    title="Total Orders"
                    value={data.orderStats.total}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Pending Orders"
                    value={data.orderStats.pending}
                    icon={Loader2}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Completed Orders"
                    value={data.orderStats.completed}
                    icon={TrendingUp}
                    color="bg-purple-500"
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
                            <div className="text-3xl font-bold text-green-600">${data.onlineRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">Online</div>
                        </div>
                        <div className="h-16 w-px bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">${data.offlineRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">Offline</div>
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
                                    <td className="px-6 py-4">${worker.totalSales.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-green-600">{worker.completedOrders}</td>
                                    <td className="px-6 py-4 text-yellow-600">{worker.pendingOrders}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                <Icon className={`text-${color.split('-')[1]}-600`} size={24} />
            </div>
        </div>
    );
}
