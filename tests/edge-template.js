async function handler(request) {
  const out = JSON.stringify({
    success: true,
    package: "owner/package-name",
  });
  return new Response(out, {
    headers: { "content-type": "application/json" },
  });
}

addEventListener("fetch", handler);
