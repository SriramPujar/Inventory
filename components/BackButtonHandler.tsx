"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Universal Android Back Button Handler (v1.3 DEBUG)
 * Includes a HIGH-VISIBILITY debug overlay to diagnose pathname detection.
 */
export function BackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState("BH-Init");

    useEffect(() => {
        // Log to console for desktop debugging
        console.log("BH Handler Active Path:", pathname);

        const isSubSection = 
            pathname.includes('/orders') || 
            pathname.includes('/products') || 
            pathname.includes('/sales') ||
            pathname.includes('/workers');

        if (!isSubSection) {
            setStatus(`BH-Standby | Path: ${pathname}`);
            return;
        }

        setStatus(`BH-ACTIVE-TRAP | Path: ${pathname}`);

        // Force a history entry
        window.history.pushState({ trap: true }, "", window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            const currentPath = window.location.pathname;
            const stillInSub = 
                currentPath.includes('/orders') || 
                currentPath.includes('/products') || 
                currentPath.includes('/sales');

            if (stillInSub) {
                const target = currentPath.startsWith('/admin') ? '/admin' : '/worker';
                window.location.href = target;
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [pathname]);

    // Render a HIGH VISIBILITY debug bar at the top
    return (
        <div className="fixed top-0 left-0 right-0 h-6 bg-yellow-400 text-black text-[10px] flex items-center px-2 z-[99999] border-b border-black font-bold uppercase pointer-events-none">
            {status}
        </div>
    );
}
