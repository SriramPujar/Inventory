"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

export default function WorkerSalesPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProducts = () => {
        fetch("/api/product").then(res => res.json()).then(setProducts);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Sales</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Sale
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Product</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No sales recorded yet.</td></tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(product.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.customerName}</td>
                                    <td className="px-6 py-4">{product.productName}</td>
                                    <td className="px-6 py-4">${product.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${product.paymentMethod === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {product.paymentMethod}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <CreateProductModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchProducts();
                    }}
                />
            )}
        </div>
    );
}

function CreateProductModal({ onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await fetch("/api/product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            onSuccess();
        } catch (err) {
            alert("Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New Sale</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                        <input name="customerName" required className="w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Purchased</label>
                        <input name="productName" required className="w-full p-2 border rounded-md" />
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
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="paymentMethod" value="ONLINE" required /> Online
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="paymentMethod" value="OFFLINE" required /> Offline
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Sale</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
