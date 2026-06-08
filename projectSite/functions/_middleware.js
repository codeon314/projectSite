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

  // Allow frontend and /api/comments to pass through normally on the main domain
  return await context.next();
}