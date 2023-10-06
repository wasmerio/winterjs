/// <reference types="../winter.d.ts"/>

addEventListener('fetch', (req) => {
  req.respondWith(doFetch());
});

async function doFetch() {
  let resp = await fetch("https://www.google.com");
  let res = await resp.text();
  for (let h of resp.headers.toList()) {
    res += `\n\t${h[0]}: ${h[1]}`;
  }
  return res;
}
