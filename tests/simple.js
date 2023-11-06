async function handleRequest(req) {
  return new Response('hello');
}

addEventListener('fetch', req => {
  req.respondWith(handleRequest(req));
});
