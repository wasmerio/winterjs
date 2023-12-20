async function handleRequest(request) {
  const out = JSON.stringify({
    success: true,
    package: "owner/package-name",
  });
  return new Response(out, {
    headers: { "content-type": "application/json" },
  });
}

addEventListener("fetch", e => {
  e.respondWith(handleRequest(e.request));
});
