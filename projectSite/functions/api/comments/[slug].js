// In-memory fallback for local development if Cloudflare KV is not yet bound
const localDevCache = new Map();

// Rate Limiting Configuration
const RATE_LIMIT_WINDOW_MS = 30000; // 30 seconds
const MAX_COMMENTS_PER_WINDOW = 2;

export async function onRequestGet({ params, env }) {
    const { slug } = params;
    let comments = [];

    // Check if Cloudflare KV is bound (Production)
    if (env && env.COMMENTS_KV) {
        const commentsStr = await env.COMMENTS_KV.get(`comments_${slug}`);
        if (commentsStr) comments = JSON.parse(commentsStr);
    } else {
        // Fallback for local testing
        const commentsStr = localDevCache.get(`comments_${slug}`);
        if (commentsStr) comments = JSON.parse(commentsStr);
    }

    // Return response with aggressive cache-busting headers
    return new Response(JSON.stringify(comments), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
}

export async function onRequestPost({ request, params, env }) {
    const { slug } = params;
    
    // 1. Extract Identifiers for Rate Limiting
    const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const fingerprint = request.headers.get('X-Client-Fingerprint');

    // Reject requests that stripped the fingerprint header (e.g., via Tampermonkey)
    if (!fingerprint || fingerprint.length < 32) {
        return new Response(JSON.stringify({ error: "Invalid client signature. Transmission rejected." }), { status: 400 });
    }

    // 2. Dual-Layer Rate Limiting Check
    const ipKey = `rl_ip_${ip}`;
    const fpKey = `rl_fp_${fingerprint}`;
    const now = Date.now();

    async function checkAndEnforceLimit(key) {
        let timestamps = [];
        if (env && env.COMMENTS_KV) {
            const rlStr = await env.COMMENTS_KV.get(key);
            if (rlStr) timestamps = JSON.parse(rlStr);
        } else {
            const rlStr = localDevCache.get(key);
            if (rlStr) timestamps = JSON.parse(rlStr);
        }

        // Filter out timestamps older than the 30-second window
        timestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

        if (timestamps.length >= MAX_COMMENTS_PER_WINDOW) {
            return false; // Rate limit exceeded
        }

        timestamps.push(now);

        // Save back to KV with a 60-second expiration to auto-cleanup
        if (env && env.COMMENTS_KV) {
            await env.COMMENTS_KV.put(key, JSON.stringify(timestamps), { expirationTtl: 60 });
        } else {
            localDevCache.set(key, JSON.stringify(timestamps));
        }
        return true; // Allowed
    }

    // Check both IP and Fingerprint independently
    const ipAllowed = await checkAndEnforceLimit(ipKey);
    const fpAllowed = await checkAndEnforceLimit(fpKey);

    if (!ipAllowed || !fpAllowed) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait 30 seconds before transmitting again." }), { status: 429 });
    }

    // 3. Process and Sanitize the Comment
    const data = await request.json();

    if (!data.username || !data.text) {
        return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Server-Side Sanitization
    // Username: Only Alphanumeric and spaces
    const cleanUsername = data.username.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50).trim();
    
    // Text: Only Alphanumeric, spaces, and basic punctuation (.,!?'-)
    const cleanText = data.text.replace(/[^a-zA-Z0-9\s.,!?'-]/g, '').substring(0, 500).trim();

    if (!cleanUsername || !cleanText) {
        return new Response(JSON.stringify({ error: "Invalid input. Only basic text and numbers are allowed." }), { status: 400 });
    }

    const newComment = {
        id: Date.now().toString(),
        username: cleanUsername,
        text: cleanText,
        date: new Date().toISOString()
    };

    let comments = [];

    // Check if Cloudflare KV is bound (Production)
    if (env && env.COMMENTS_KV) {
        const commentsStr = await env.COMMENTS_KV.get(`comments_${slug}`);
        if (commentsStr) comments = JSON.parse(commentsStr);

        comments.push(newComment);
        await env.COMMENTS_KV.put(`comments_${slug}`, JSON.stringify(comments));
    } else {
        // Fallback for local testing
        const commentsStr = localDevCache.get(`comments_${slug}`);
        if (commentsStr) comments = JSON.parse(commentsStr);

        comments.push(newComment);
        localDevCache.set(`comments_${slug}`, JSON.stringify(comments));
    }

    return new Response(JSON.stringify(newComment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}