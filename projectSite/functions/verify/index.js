export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Read the incoming raw request text first to avoid potential stream reading errors
    const rawBody = await request.text();
    if (!rawBody) {
      return new Response(JSON.stringify({ success: false, msg: "Empty request body" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { licenseKey, nonce, hwid } = JSON.parse(rawBody);

    if (!licenseKey || !nonce || !hwid) {
      return new Response(JSON.stringify({ success: false, msg: "Missing fields in JSON" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. Fetch user data object from KV
    if (!env.LIC_DB) {
      return new Response(JSON.stringify({ success: false, msg: "Internal Server Error" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawUserData = await env.LIC_DB.get(licenseKey);
    if (!rawUserData) {
      return new Response(JSON.stringify({ success: false, msg: "Invalid Key" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    let userData = JSON.parse(rawUserData);

    // 2. Validate overall license standing
    if (userData.status !== "1") {
      return new Response(JSON.stringify({ success: false, msg: "Revoked" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Hardware Lock Logic
    if (!userData.hwid || userData.hwid === "") {
      userData.hwid = hwid;
      await env.LIC_DB.put(licenseKey, JSON.stringify(userData));
    } else if (userData.hwid !== hwid) {
      return new Response(JSON.stringify({ success: false, msg: "HWID Mismatch" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Cryptographic signature token generation
    const timestamp = Date.now().toString();
    const messageToSign = `${nonce}|${timestamp}|${hwid}`;

    if (!env.RSA_PRIVATE_KEY) {
      return new Response(JSON.stringify({ success: false, msg: "Internal Server Error" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Clean up key format
    const privateKeyPem = env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '').trim();
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
    // SECURITY FIX: Do not leak internal error messages or stack traces to the client.
    return new Response(JSON.stringify({ 
      success: false, 
      payload: `error_catch: Internal Server Error`,
      signature: "ERROR"
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

function pemToArrayBuffer(pem) {
  const b64Lines = pem.replace(/-----\s*BEGIN[^-]*-----\s*/g, "").replace(/-----\s*END[^-]*-----\s*/g, "").replace(/\s/g, "");
  const binaryStr = atob(b64Lines);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return bytes.buffer;
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({ 
    success: false, 
    msg: "GET method reached successfully! Use POST to validate licenses." 
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}