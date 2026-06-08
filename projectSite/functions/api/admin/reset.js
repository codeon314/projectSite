export async function onRequestPost(context) {
  try {
    const { licenseKey } = await context.request.json();
    const raw = await context.env.LIC_DB.get(licenseKey);
    if (!raw) return new Response(JSON.stringify({ success: false, msg: "Key not found" }), { status: 404 });
    
    let data = JSON.parse(raw);
    data.hwid = ""; // Wipe HWID association
    await context.env.LIC_DB.put(licenseKey, JSON.stringify(data));
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: err.toString() }), { status: 500 });
  }
}