
addEventListener('fetch', async req => {
  await sleep(1000);
  req.respondWith(new Response('hello'));
});

const sleep = n => new Promise(resolve => setTimeout(resolve, n));