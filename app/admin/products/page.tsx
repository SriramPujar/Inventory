"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Trash2, Edit2 } from "lucide-react";
import { PRODUCT_CATEGORIES, PriceItem, PricingCategory } from "@/app/data/pricingData";
import { App } from "@capacitor/app";

function ProductsContent() {
    const router = useRouter();
    const [products, setProducts] = useState<any | null>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<any | null>(null);
    const searchParams = useSearchParams();
    const shouldAdd = searchParams.get('add') === 'true';

    useEffect(() => {
        const listener = App.addListener('backButton', () => {
            router.push('/admin');
        });
        return () => {
            listener.then(l => l.remove());
        };
    }, [router]);

    useEffect(() => {
        if (shouldAdd) {
            setIsModalOpen(true);
        }
    }, [shouldAdd]);

    const fetchProducts = () => {
        fetch("/api/product")
            .then(async (res) => {
                if (res.ok) return res.json();
                throw new Error("Failed to fetch products");
            })
            .then(setProducts)
            .catch(console.error);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product sale?")) return;

        try {
            const res = await fetch(`/api/product?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchProducts();
            } else {
                alert("Failed to delete product");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting product");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Product Sales</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Sale
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Product</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Payment</th>
                            <th className="px-6 py-3">Added By</th>
                            <th className="px-6 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product: any) => (
                            <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">{new Date(product.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{product.customerName}</td>
                                <td className="px-6 py-4">{product.productName}</td>
                                <td className="px-6 py-4">₹{product.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${product.paymentMethod === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {product.paymentMethod}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-700">{product.createdBy?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setEditProduct(product)}
                                        className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                                        title="Edit Sale"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                                        title="Delete Sale"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
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

            {editProduct && (
                <EditProductModal
                    product={editProduct}
                    onClose={() => setEditProduct(null)}
                    onSuccess={() => {
                        setEditProduct(null);
                        fetchProducts();
                    }}
                />
            )}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProductsContent />
        </Suspense>
    );
}



function CreateProductModal({ onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<PricingCategory | null>(null);
    const [selectedItem, setSelectedItem] = useState<PriceItem | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [amount, setAmount] = useState<number>(0);

    // Update amount when item or quantity changes
    useEffect(() => {
        if (selectedItem) {
            setAmount(selectedItem.price * quantity);
        } else {
            setAmount(0);
        }
    }, [selectedItem, quantity]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const customerName = formData.get("customerName");
        const date = formData.get("date");
        const paymentMethod = formData.get("paymentMethod");

        if (!selectedCategory || !selectedItem) {
            alert("Please select a product category and item");
            setLoading(false);
            return;
        }

        // Construct product name
        const productName = `${selectedCategory.name} - ${selectedItem.name}${selectedCategory.variablePrice ? ':' : ' x'} ${quantity}${selectedCategory.variablePrice ? ' sq.in' : ''}`;

        const data = {
            customerName,
            productName,
            date,
            amount, // Use the calculated amount
            paymentMethod
        };

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
                <h2 className="text-xl font-bold mb-4">Add New Sale</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                        <input name="customerName" required className="w-full p-2 border rounded-md" />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            className="w-full p-2 border rounded-md"
                            onChange={(e) => {
                                const category = PRODUCT_CATEGORIES.find(c => c.name === e.target.value) || null;
                                setSelectedCategory(category);
                                setSelectedItem(null);
                                setQuantity(1);
                            }}
                            required
                        >
                            <option value="">Select Category</option>
                            {PRODUCT_CATEGORIES.map(cat => (
                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Item Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Item</label>
                        <select
                            className="w-full p-2 border rounded-md"
                            onChange={(e) => {
                                const item = selectedCategory?.items.find(i => i.name === e.target.value) || null;
                                setSelectedItem(item);
                            }}
                            disabled={!selectedCategory}
                            required
                        >
                            <option value="">Select Item</option>
                            {selectedCategory?.items.map(item => (
                                <option key={item.name} value={item.name}>{item.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {selectedCategory?.variablePrice ? "Size (Sq. Inch)" : "Quantity"}
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-full p-2 border rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input name="date" type="date" required className="w-full p-2 border rounded-md" />
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
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Sale</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditProductModal({ product, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: product.customerName,
        productName: product.productName,
        date: new Date(product.date).toISOString().split('T')[0],
        amount: product.amount,
        paymentMethod: product.paymentMethod
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            await fetch("/api/product", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, id: product.id }),
            });
            onSuccess();
        } catch (err) {
            alert("Failed to update product sale");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
                <h2 className="text-xl font-bold mb-4">Edit Sale</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                        <input name="customerName" value={formData.customerName} onChange={handleChange} required className="w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Details</label>
                        <input name="productName" value={formData.productName} onChange={handleChange} required className="w-full p-2 border rounded-md" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                            <input
                                name="amount"
                                type="number"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input name="date" type="date" value={formData.date} onChange={handleChange} required className="w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="paymentMethod" value="ONLINE" checked={formData.paymentMethod === 'ONLINE'} onChange={handleChange} required /> Online
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="paymentMethod" value="OFFLINE" checked={formData.paymentMethod === 'OFFLINE'} onChange={handleChange} required /> Offline
                            </label>
                        </div>
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
