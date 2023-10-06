/// <reference types="../winter.d.ts"/>

addEventListener('fetch', (req) => {
  req.respondWith(`hello from ${req.request.url.href}`);
});
