/// <reference types="../../winter.d.ts"/>

addEventListener("fetch", async ev => {
    const {url, method, headers} = ev.request;
    const body = await ev.request.text();

    return {
        status: 200,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            url: url.toString(),
            method,
            headers,
            body,
        }),
    };
});
