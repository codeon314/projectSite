export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, msg: "Method not allowed" }), { status: 405 });
  }

  const signatureBase64 = request.headers.get("X-Admin-Signature");
  const timestamp = request.headers.get("X-Admin-Timestamp");

  if (!signatureBase64 || !timestamp) {
    return new Response(JSON.stringify({ success: false, msg: "Missing authentication headers" }), { status: 401 });
  }

  // Prevent Replay Attacks: Reject requests older than 5 minutes
  const now = Date.now();
  if (Math.abs(now - parseInt(timestamp, 10)) > 300000) {
    return new Response(JSON.stringify({ success: false, msg: "Request timestamp expired" }), { status: 401 });
  }

  try {
    if (!env.ADMIN_PUBLIC_KEY) {
      return new Response(JSON.stringify({ success: false, msg: "Server missing public key configuration" }), { status: 500 });
    }

    // --- SAFE BODY READING LOGIC ---
    let rawBody = "";
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    
    if (contentLength > 0) {
      rawBody = await request.clone().text();
    }

    // If the client passed an empty payload or empty object, normalize it to match C# serialization
    if (!rawBody || rawBody.trim() === "" || rawBody === "{}") {
      rawBody = "{}";
    }

    // Reconstruct the exact text layout that C# signed
    const messageToVerify = `${timestamp}|${rawBody}`;

    // Clean up public key PEM from env layout
    const pem = env.ADMIN_PUBLIC_KEY.replace(/\\n/g, '\n').replace(/"/g, '').trim();
    const publicKeyBuffer = pemToArrayBuffer(pem);

    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const encoder = new TextEncoder();
    const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signatureBytes,
      encoder.encode(messageToVerify)
    );

    if (!isValid) {
      return new Response(JSON.stringify({ success: false, msg: "Invalid cryptographic signature" }), { status: 401 });
    }

    return await context.next();
	} catch (err) {
    // This intercepts any hidden crash and passes the real reason straight to your C# inspector pane
    return new Response(JSON.stringify({ 
      success: false, 
      msg: `Auth Exception: ${err.message}`,
      stack: err.stack 
    }), { 
      status: 500,
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