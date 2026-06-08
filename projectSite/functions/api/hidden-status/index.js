export async function onRequestPost(context) {
  return new Response(JSON.stringify({
    success: true,
    payload: "HELLO_FROM_SERVER",
    signature: "TEST_SIG"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}