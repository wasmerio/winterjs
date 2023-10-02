addEventListener('fetch', async req => {
    req.respondWith(handleRequest(req));
});

async function handleRequest(req) {
    let url = req.text();
    console.log("Fetching", url);
    let h = req.headers['x-wasmer-test'];
    console.log("Header val:", h);
    let res = await fetch(url);
    let text = await res.text();
    // console.log("Fetched", text);
    return text;
}