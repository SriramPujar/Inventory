"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Universal Android Back Button Handler (v1.3 DEBUG)
 * Includes a HIGH-VISIBILITY debug overlay to diagnose pathname detection.
 */
/**
 * Universal Android Back Button Handler (v1.3.2-STEER)
 * Hardened version that uses aggressive history steering.
 */
export function BackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState("BH-Standby");

    useEffect(() => {
        // 1. Identify if we are in a sub-section
        const isSubSection = 
            pathname.includes('/orders') || 
            pathname.includes('/products') || 
            pathname.includes('/sales') ||
            pathname.includes('/workers');

        // 2. Identify the portal root
        const rootPath = pathname.startsWith('/admin') ? '/admin' : '/worker';

        // 3. If we are ALREADY at root, don't trap (let them exit or log out normally)
        if (pathname === '/admin' || pathname === '/worker' || pathname === '/') {
            setStatus(`BH-Standby | ${pathname}`);
            return;
        }

        setStatus(`BH-Active-Trap | ${pathname}`);

        // 4. Aggressively push state to create a "Back Buffer"
        // We do this twice to ensure even if one is popped, we have another.
        window.history.pushState({ steer: true }, "", window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // If the user hits 'Back', we catch it here.
            // Since we pushed a state, the 'Back' just popped that state.
            // We now force them to the rootPath.
            console.log("BH-PopState Intercepted. Steering to:", rootPath);
            setStatus(`BH-STEERED -> ${rootPath}`);
            
            // Use window.location.href for a hard reset to ensure 100% success on Android
            window.location.href = rootPath;
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [pathname]);

    // Keep the high-visibility bar for now until the user confirms it's working
    return (
        <div className="fixed top-0 left-0 right-0 h-8 bg-yellow-400 text-black text-[12px] flex items-center justify-center px-2 z-[99999] border-b-2 border-black font-bold uppercase pointer-events-none animate-pulse">
            <span className="bg-red-600 text-white px-1 mr-2">V1.3.2</span>
            {status}
        </div>
    );
}

