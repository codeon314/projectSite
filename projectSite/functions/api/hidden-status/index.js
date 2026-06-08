export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    try {
      const { licenseKey, nonce, hwid } = await request.json();

      if (!licenseKey || !nonce || !hwid) {
        return new Response(JSON.stringify({ success: false }), { status: 400 });
      }

      // 1. Fetch user data object from KV
      const rawUserData = await env.LIC_DB.get(licenseKey);
      if (!rawUserData) {
        return new Response(JSON.stringify({ success: false, msg: "Invalid Key" }), { status: 200 });
      }

      let userData = JSON.parse(rawUserData); // Structure: { status: "1", hwid: "abc..." }

      // 2. Validate overall license standing
      if (userData.status !== "1") {
        return new Response(JSON.stringify({ success: false, msg: "Revoked" }), { status: 200 });
      }

      // 3. Hardware Lock Logic
      if (!userData.hwid || userData.hwid === "") {
        // First-time registration: Save this machine's HWID to the key
        userData.hwid = hwid;
        await env.LIC_DB.put(licenseKey, JSON.stringify(userData));
      } else if (userData.hwid !== hwid) {
        // HWID mismatch: Someone is sharing the tool or cloned the license key
        return new Response(JSON.stringify({ success: false, msg: "HWID Mismatch" }), { status: 200 });
      }

      // 4. Everything matches -> Generate cryptographic signature token (from Strat 1)
      const timestamp = Date.now().toString();
      const messageToSign = `${nonce}|${timestamp}|${hwid}`; // Include HWID in signed envelope

      const privateKeyPem = env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
      const privateKeyBuffer = pemToArrayBuffer(privateKeyPem);
      
      const privateKey = await crypto.subtle.importKey(
        "pkcs8", privateKeyBuffer, 
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, 
        false, ["sign"]
      );

      const encoder = new TextEncoder();
      const signatureBuffer = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5", privateKey, encoder.encode(messageToSign)
      );

      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

      return new Response(JSON.stringify({
        success: true,
        payload: messageToSign,
        signature: signatureBase64
      }), { headers: { "Content-Type": "application/json" } });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
  }
};

function pemToArrayBuffer(pem) {
  const b64Lines = pem.replace(/-----\s*BEGIN[^-]*-----\s*/g, "").replace(/-----\s*END[^-]*-----\s*/g, "").replace(/\s/g, "");
  const binaryStr = atob(b64Lines);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return bytes.buffer;
}