"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { App } from '@capacitor/app';

/**
 * Universal Android Back Button Handler (v1.3.2-CAPACITOR)
 * Hardened version that uses Capacitor hardware listeners + PopState steering.
 */
export function BackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState("BH-Active-Trap | Idle");

    useEffect(() => {
        // 1. Identify the portal root
        const isAdmin = pathname.startsWith('/admin');
        const isWorker = pathname.startsWith('/worker');
        const rootPath = isAdmin ? '/admin' : (isWorker ? '/worker' : '/');

        console.log("BH-Trap Initialization for path:", pathname, "Root:", rootPath);
        setStatus(`BH-Active-Trap | ${pathname}`);

        // 2. Capacitor Hardware Listener (for Android/iOS App)
        const setupCapacitor = async () => {
            try {
                const listener = await App.addListener('backButton', ({ canGoBack }) => {
                    console.log("Hardware Back Button Intercepted. canGoBack:", canGoBack);
                    
                    if (pathname !== rootPath && !pathname.startsWith('/login')) {
                        console.log("Steering hardware back to root:", rootPath);
                        setStatus(`BH-STEER (HW) -> ${rootPath}`);
                        window.location.href = rootPath; // Hard redirect
                    } else {
                        console.log("At root or login. Trapping to prevent exit.");
                        setStatus(`BH-TRAP (HW) | Stay at ${rootPath}`);
                    }
                });
                return listener;
            } catch (e) {
                console.log("Capacitor App plugin not available - using Web fallback.");
                return null;
            }
        };

        const capListenerPromise = setupCapacitor();

        // 3. Web/Browser PopState Logic
        // Always push a state to created a buffer
        window.history.pushState({ steer: true }, "", window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            if (pathname !== rootPath && !pathname.startsWith('/login')) {
                console.log("BH-PopState Intercepted. Steering to:", rootPath);
                setStatus(`BH-STEER (WEB) -> ${rootPath}`);
                window.location.href = rootPath;
            } else {
                console.log("BH-PopState at root. Trapped.");
                setStatus(`BH-TRAP (WEB) | Stay at ${rootPath}`);
                window.history.pushState({ steer: true }, "", window.location.href);
            }
        };

        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
            capListenerPromise.then(l => l?.remove());
        };
    }, [pathname]);

    // High-visibility pulsing bar
    return (
        <div className="fixed top-0 left-0 right-0 h-8 bg-yellow-400 text-black text-[12px] flex items-center justify-center px-2 z-[99999] border-b-2 border-black font-bold uppercase pointer-events-none animate-pulse">
            <span className="bg-red-600 text-white px-1 mr-2 italic">V1.3.2</span>
            {status}
        </div>
    );
}

