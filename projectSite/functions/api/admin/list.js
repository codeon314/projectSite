export async function onRequestPost(context) {
  try {
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
    return new Response(JSON.stringify({ success: false, msg: err.toString() }), { status: 500 });
  }
}