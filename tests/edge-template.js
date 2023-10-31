async function handler(request) {
  const out = JSON.stringify({
    success: true,
    package: "owner/package-name",
  });
  request.respondWith(new Response(out, {
    headers: { "content-type": "application/json" },
  }));
}

addEventListener("fetch", handler);
