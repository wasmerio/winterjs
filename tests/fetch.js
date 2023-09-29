addEventListener('fetch', async req => {
    // let url = req.body;
    let url = "https://google.com";
    console.log("Fetching", url);
    let res = await fetch(url);
    let text = await res.text();
    console.log("Fetched", text);
    return text;
});