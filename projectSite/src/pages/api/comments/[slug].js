// CRITICAL: This tells Astro to NOT generate this as a static file, 
// but to compile it into the Cloudflare Worker as a live endpoint.
export const prerender = false;

// In-memory fallback for local development if Cloudflare KV is not yet bound
const localDevCache = new Map();

export async function GET({ params, locals }) {
    const { slug } = params;
    const env = locals?.runtime?.env;
    
    let comments = [];
    
    // Check if Cloudflare KV is bound (Production)
    if (env && env.COMMENTS_KV) {
        const commentsStr = await env.COMMENTS_KV.get(`comments_${slug}`);
        if (commentsStr) comments = JSON.parse(commentsStr);
    } else {
        // Fallback for local testing (Development)
        const commentsStr = localDevCache.get(`comments_${slug}`);
        if (commentsStr) comments = JSON.parse(commentsStr);
    }

    return new Response(JSON.stringify(comments), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function POST({ params, request, locals }) {
    const { slug } = params;
    const env = locals?.runtime?.env;
    
    const data = await request.json();
    if (!data.username || !data.text) {
        return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Basic sanitization to prevent XSS
    const newComment = {
        id: Date.now().toString(),
        username: data.username.substring(0, 50).replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        text: data.text.substring(0, 500).replace(/</g, "&lt;").replace(/>/g, "&gt;"),
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
        // Fallback for local testing (Development)
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