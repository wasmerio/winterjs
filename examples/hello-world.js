

function handler(req) {
  return new Response('Hello, world!', {
    headers: {
      'content-type': 'text/plain',
    },
  });
}

addEventListener('fetch', (ev) => ev.respondWith(handler(ev.request)));
