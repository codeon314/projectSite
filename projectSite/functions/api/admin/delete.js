export async function onRequestPost(context) {
  try {
    const { licenseKey } = await context.request.json();
    await context.env.LIC_DB.delete(licenseKey);
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: err.toString() }), { status: 500 });
  }
}