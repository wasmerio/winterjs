addEventListener('fetch', req => {
  req.respondWith(handleRequest(req));
});

async function handleRequest(req) {
  let url = await req.request.text();
  console.log("Fetching", url);
  let h = req.request.headers.get('x-wasmer-test');
  console.log("Header val:", h);
  let res = await fetch(url);
  let text = await res.text();
  return new Response(text);
}