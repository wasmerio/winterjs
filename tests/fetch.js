addEventListener('fetch', async req => {
    req.respondWith(handleRequest(req));
});

async function handleRequest(req) {
    let url = req.request.text();
    console.log("Fetching", url);
    let h = req.request.headers.get('x-wasmer-test');
    console.log("Header val:", h);
    let res = await fetch(url);
    let text = await res.text();
    return text;
}