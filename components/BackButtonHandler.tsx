"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Global handler for the Android hardware back button.
 * Uses a "History Trap" to catch back button presses and redirect to the dashboard.
 */
export function BackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only trap back button if we are in a sub-section (not on dashboards or login)
        const isSubSection = 
            pathname.includes('/orders') || 
            pathname.includes('/products') || 
            pathname.includes('/sales') ||
            pathname.includes('/workers');

        if (!isSubSection) return;

        // Push a dummy state so the back button has something to "pop" without leaving the app
        window.history.pushState({ trap: true }, "", window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // If the back button is pressed, the browser pops the state we just pushed.
            // We intercept this and redirect to the appropriate dashboard.
            if (pathname.startsWith('/admin')) {
                router.replace('/admin');
            } else if (pathname.startsWith('/worker')) {
                router.replace('/worker');
            }
        };

        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [pathname, router]);

    return null;
}
