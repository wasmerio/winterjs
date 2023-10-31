
addEventListener('fetch', async req => {
    await sleep(1000);
    return "hello";
});

const sleep = n => new Promise(resolve => setTimeout(resolve, n));