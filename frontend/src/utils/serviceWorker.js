/**
 * Service Worker Registration
 * 
 * Registers and manages the service worker for PWA functionality
 * and offline support.
 */

export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Service worker is registered by vite-plugin-pwa
            // This file can be used for additional service worker logic
            if (import.meta.env.PROD) {
                // Check for updates periodically
                setInterval(() => {
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                        registrations.forEach((registration) => {
                            registration.update();
                        });
                    });
                }, 60 * 60 * 1000); // Check every hour
            }
        });
    }
};

export const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
    }
};

