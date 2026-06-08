export async function onRequestPost(context) {
  return new Response(JSON.stringify({
    success: true,
    payload: "HELLO_FROM_SERVER",
    signature: "TEST_SIG"
  }), {
    headers: { "Content-Type": "application/json" }
  });
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