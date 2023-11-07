async function handleRequest(req) {
  return new Response("hello");
}

addEventListener("fetch", async (req) => {
  req.respondWith(await handleRequest(req));
});
