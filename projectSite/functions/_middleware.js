export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname;

  const API_DOMAIN = "licensing.mastercodeon.dev"; 

  // 1. If the request is hitting the API subdomain
  if (hostname === API_DOMAIN) {
    // Allow access to admin and hidden-status endpoints at the root of the subdomain
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/verify')) {
      return await context.next();
    }
    // Block everything else (like the frontend HTML or blog comments) on the API subdomain
    return new Response(JSON.stringify({ error: "Not Found" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
    });
  }

  // 2. If the request is hitting the main domain (or the default .pages.dev domain)
  // Block access to the secure APIs so they can ONLY be accessed via the API subdomain
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/verify')) {
    return new Response(JSON.stringify({ error: "Forbidden: Access restricted to API gateway." }), { 
        status: 403, 
        headers: { "Content-Type": "application/json" } 
    });
  }

  // 3. Secure the /scripts/ directory with a Custom Auth Header
  if (url.pathname.startsWith('/scripts/')) {
    
    // Handle CORS Preflight (OPTIONS) request sent by the browser before the actual GET request
    if (context.request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "X-TM-Auth"
        }
      });
    }

    // Check for Authentication on the actual request
    const tmAuthHeader = context.request.headers.get("X-TM-Auth");
    
    // Uses a Cloudflare Environment Variable if set, otherwise falls back to a hardcoded string
    const expectedSecret = context.env.TM_SCRIPT_SECRET || "super_secret_loader_token_123!"; 

    if (tmAuthHeader !== expectedSecret) {
      return new Response("403 Forbidden - Unauthorized access.", { 
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }

  // Allow frontend and /api/comments to pass through normally on the main domain
  return await context.next();
}