export async function onRequestPost(context) {
  try {
    const { licenseKey } = await context.request.json();
    if (!licenseKey) return new Response(JSON.stringify({ success: false, msg: "Missing key" }), { status: 400 });
    
    const initialData = JSON.stringify({ status: "1", hwid: "" });
    await context.env.LIC_DB.put(licenseKey, initialData);
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: err.toString() }), { status: 500 });
  }
}