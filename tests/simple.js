
addEventListener('fetch', (req) => {
  req.respondWith(`hello from ${req.request.url.href}`);
});
