/*
 * MathChampions service worker - lets the app open and play without data
 *
 * Pages: network first (up to NETWORK_TIMEOUT_MS on slow data), falling back to
 *   the saved copy. Query strings are ignored: every page is a static shell, so
 *   /practice?node=farm-1 is served from the saved /practice.
 * Next.js build files (/_next/static, content-hashed): cache first.
 * Other files from this site (icons, manifest): saved copy, refreshed in the background.
 * API calls go to the backend's own origin and are left alone; the app queues
 * results and events itself while offline.
 *
 * After a deploy, pages saved at install would go stale; the app asks for a
 * refresh (REFRESH_MESSAGE) when it opens online, at most every REFRESH_EVERY_MS.
 *
 * Change VERSION to throw away every saved file on the next visit.
 */
const VERSION = "v1";
const PAGES_CACHE = `mc-pages-${VERSION}`;
const STATIC_CACHE = `mc-static-${VERSION}`;
const NETWORK_TIMEOUT_MS = 4000;
// Old build files pile up after each deploy; keep the newest ones
const MAX_STATIC_ENTRIES = 150;

// Saved on install so every game works offline, even ones not opened yet
const APP_PAGES = [
    "/play",
    "/practice",
    "/battle",
    "/games/counting-catch",
    "/games/number-pop",
    "/student/select",
    "/dashboard",
    "/parent/dashboard",
    "/login",
    "/",
];

const STATIC_ASSET_PATTERN = /\/_next\/static\/[^"'\s)\\]+/g;
const REFRESH_MESSAGE = "refresh-pages";
const REFRESH_EVERY_MS = 6 * 60 * 60 * 1000;
const REFRESHED_AT_KEY = "/__mc-pages-refreshed-at";

async function savePageAndAssets(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) return;
    const html = await response.clone().text();
    const pages = await caches.open(PAGES_CACHE);
    await pages.put(path, response);

    const statics = await caches.open(STATIC_CACHE);
    const assets = Array.from(new Set(html.match(STATIC_ASSET_PATTERN) || []));
    await Promise.allSettled(
        assets.map(async (asset) => {
            if (await statics.match(asset)) return;
            const res = await fetch(asset);
            if (res.ok) await statics.put(asset, res);
        })
    );
}

async function saveAllPages() {
    // One failing page must not stop the rest from being saved
    await Promise.allSettled(APP_PAGES.map(savePageAndAssets));
    const pages = await caches.open(PAGES_CACHE);
    await pages.put(REFRESHED_AT_KEY, new Response(String(Date.now())));
}

self.addEventListener("install", (event) => {
    event.waitUntil(saveAllPages().then(() => self.skipWaiting()));
});

self.addEventListener("message", (event) => {
    if (event.data !== REFRESH_MESSAGE) return;
    event.waitUntil(
        (async () => {
            const pages = await caches.open(PAGES_CACHE);
            const saved = await pages.match(REFRESHED_AT_KEY);
            const last = saved ? Number(await saved.text()) : 0;
            if (Date.now() - last >= REFRESH_EVERY_MS) await saveAllPages();
        })()
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key.startsWith("mc-") && key !== PAGES_CACHE && key !== STATIC_CACHE)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

async function trimStaticCache() {
    const cache = await caches.open(STATIC_CACHE);
    const keys = await cache.keys();
    // keys() is in insertion order, so the oldest come first
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_STATIC_ENTRIES)).map((key) => cache.delete(key)));
}

async function handlePage(request) {
    const path = new URL(request.url).pathname;
    const cache = await caches.open(PAGES_CACHE);
    const saved = await cache.match(path);

    const network = fetch(request).then((response) => {
        if (response.ok && !response.redirected) cache.put(path, response.clone());
        return response;
    });

    if (!saved) {
        return network.catch(async () => (await cache.match("/play")) || offlineResponse());
    }

    // Slow 2G: don't keep a child staring at a blank screen
    const timeout = new Promise((resolve) => setTimeout(() => resolve(saved), NETWORK_TIMEOUT_MS));
    return Promise.race([network.catch(() => saved), timeout]);
}

async function handleStatic(request) {
    const cache = await caches.open(STATIC_CACHE);
    const saved = await cache.match(request);
    if (saved) return saved;
    const response = await fetch(request);
    if (response.ok) {
        await cache.put(request, response.clone());
        trimStaticCache();
    }
    return response;
}

async function handleOtherFile(request) {
    const cache = await caches.open(STATIC_CACHE);
    const saved = await cache.match(request);
    const network = fetch(request)
        .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
        })
        .catch(() => saved || Response.error());
    return saved || network;
}

function offlineResponse() {
    return new Response(
        "<!doctype html><meta name=viewport content='width=device-width'><title>Offline</title>" +
            "<body style='font-family:sans-serif;text-align:center;padding:3rem;background:#FFF9E6'>" +
            "<p style='font-size:3rem'>📶</p><h1>No internet</h1><p>Connect once to download MathChampions, then you can play offline.</p>",
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
}

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    // Next.js client navigation data: when it fails offline, Next reloads the
    // page in full, and that navigation is served from the cache below
    if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

    if (request.mode === "navigate") {
        event.respondWith(handlePage(request));
    } else if (url.pathname.startsWith("/_next/static/")) {
        event.respondWith(handleStatic(request));
    } else if (!url.pathname.startsWith("/_next/")) {
        event.respondWith(handleOtherFile(request));
    }
});
