"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Robust Global handler for the Android hardware back button.
 * Uses a "Hash Trap" which is much more reliable in mobile WebViews.
 */
export function BackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only trap back button if we are in a sub-section
        const isSubSection = 
            pathname.includes('/orders') || 
            pathname.includes('/products') || 
            pathname.includes('/sales') ||
            pathname.includes('/workers');

        if (!isSubSection) return;

        // Step 1: Ensure we have the "trap" hash in the URL
        if (window.location.hash !== "#back-guard") {
            window.location.hash = "back-guard";
        }

        const handlePopState = () => {
            // Step 2: If the user presses back, the hash will change or disappear.
            // When that happens, we force the redirect to the dashboard.
            if (window.location.hash !== "#back-guard") {
                if (pathname.startsWith('/admin')) {
                    router.replace('/admin');
                } else if (pathname.startsWith('/worker')) {
                    router.replace('/worker');
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [pathname, router]);

    return null;
}
