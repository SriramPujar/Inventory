"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Universal Android Back Button Handler (v1.2)
 * Includes a visual indicator in the top-left to confirm the trap is active.
 * Uses hard location resets to ensure navigation follows on stubborn devices.
 */
export function BackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState("BH-Init");

    useEffect(() => {
        // Identify if we are in a sub-section
        const isSubSection = 
            pathname.includes('/orders') || 
            pathname.includes('/products') || 
            pathname.includes('/sales') ||
            pathname.includes('/workers');

        if (!isSubSection) {
            setStatus("BH-Standby");
            return;
        }

        // Set status to active so the user can see it's working
        setStatus("BH-Active-Trap");

        // Force a history entry that the browser "stops" on when pressing back
        window.history.pushState({ trap: true }, "", window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // Check current location again. If the back button was pressed,
            // we might have already popped out of the state. 
            // We force a redirect to the main dash.
            const currentPath = window.location.pathname;
            
            // Re-check sub-section status to avoid loops on the dashboard itself
            const stillInSub = 
                currentPath.includes('/orders') || 
                currentPath.includes('/products') || 
                currentPath.includes('/sales');

            if (stillInSub) {
                const target = currentPath.startsWith('/admin') ? '/admin' : '/worker';
                // Using window.location.href for a FORCE redirect that works even if the JS router is confused
                window.location.href = target;
            }
        };

        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [pathname]);

    // Render a tiny invisible debug token
    return (
        <div className="fixed top-0 left-0 p-1 text-[8px] text-red-600/50 bg-white/20 pointer-events-none z-[9999] font-mono">
            {status}
        </div>
    );
}
