"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navItems = [
        { href: "/worker", label: "My Orders", icon: LayoutDashboard },
        { href: "/worker/sales", label: "My Sales", icon: ShoppingBag },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Worker Panel</h2>
                    <p className="text-sm text-gray-500 truncate">{session?.user?.name}</p>
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
                        onClick={() => signOut({ callbackUrl: "/login/worker" })}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
