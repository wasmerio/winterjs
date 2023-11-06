
async function handleRequest(req) {
  await sleep(1000);
  return new Response('hello');
}

const sleep = n => new Promise(resolve => setTimeout(resolve, n));

addEventListener('fetch', req => {
  req.respondWith(handleRequest(req));
});