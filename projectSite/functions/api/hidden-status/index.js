export async function onRequestGet(context) {
    // Set this to "1" or "0" depending on the desired output
    const status = "0";

    return new Response(status, {
        status: 200,
        headers: {
            "Content-Type": "text/plain",
            // Aggressive cache-busting headers to ensure Cloudflare always serves the latest value
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    });
}