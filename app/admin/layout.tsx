"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Users, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/workers", label: "Workers", icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
                    <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login/admin" })}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
