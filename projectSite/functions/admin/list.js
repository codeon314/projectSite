export async function onRequestPost(context) {
  try {
    // CRITICAL INSPECTION: Verify the database binding link is structurally available
    if (!context.env.LIC_DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        msg: "The LIC_DB KV namespace binding is completely missing in Cloudflare Pages settings!" 
      }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const kvList = await context.env.LIC_DB.list();
    const keys = [];
    for (const key of kvList.keys) {
      const raw = await context.env.LIC_DB.get(key.name);
      let parsed = { status: "0", hwid: "" };
      try { parsed = JSON.parse(raw); } catch (e) {}
      keys.push({ licenseKey: key.name, status: parsed.status, hwid: parsed.hwid });
    }
    return new Response(JSON.stringify({ success: true, keys }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      msg: `Endpoint Crash: ${err.message}`, 
      stack: err.stack 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}