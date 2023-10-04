
addEventListener('fetch', (req) => {
  req.respondWith(doFetch());
});

async function doFetch() {
  let resp = await fetch("https://www.google.com");
  let res = resp.body;
  for (let h in resp.headers) {
    res += `\n\t${h}: ${resp.headers[h]}`;
  }
  return res;
}