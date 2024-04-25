async function handleRequest(request) {
    try {
        let origin = performance.timeOrigin;
        if (origin === undefined) {
            throw new Error('Expected performance.timeOrigin to be defined');
        }

        // We already have to use setTimeout, so let's test setInterval here as well

        let intervalsElapsed = 0;
        let intervalHandle = setInterval(() => intervalsElapsed += 1, 100);

        let now = performance.now();
        await sleep(1000);
        let after1Sec = performance.now();
        let elapsed = after1Sec - now;
        if (elapsed < 500 || elapsed > 3000) {
            throw new Error(`Expected elapsed time to be almost 1 second, but it's ${elapsed}MS`);
        }

        clearInterval(intervalHandle);

        let totalIntervals = intervalsElapsed;
        if (intervalsElapsed < 5 || intervalsElapsed > 30) {
            throw new Error(`Expected elapsed intervals to be almost 10, but it's ${intervalsElapsed}`);
        }

        await sleep(500);

        if (totalIntervals !== intervalsElapsed) {
            throw new Error(`More intervals elapsed after clearInterval was called, total before clearing ${totalIntervals}, after ${intervalsElapsed}`);
        }

        return new Response('All tests passed!');
    }
    catch (e) {
        return new Response(e.toString(), { status: 500 });
    }
}

const sleep = (n) => new Promise(resolve => setTimeout(resolve, n));

export { handleRequest };