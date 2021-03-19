const { chromium, webkit, devices } = require("playwright");
const NODEURL = require('url');

// docs: https://playwright.dev/docs/api/class-playwright 
(async () => {

    const seenURLs = new Set()
    const browser = await chromium.launch();
    // const browser = await webkit.launch();
    // webkit doesn't have page.pdf, but chromium does...
    const context = await browser.newContext();
    const page = await context.newPage();
    const crawl = async (url) => {
        if (seenURLs.has(url)) {
            return
        }
        seenURLs.add(url)
        if (!url.startsWith('https://developer.apple.com/documentation/storekittest')) {
            return
        }
        console.log(`Visiting ${url}`)
        await page.goto(url)
        await page.waitForLoadState('networkidle');
        const urls = await page.$$eval('a', (elements) =>
            elements.map((el) => el.href),
        )
        thisURL = new NODEURL.URL(url)
        await page.pdf({path: `${thisURL.pathname.replace(/\//g,'_')}.pdf`})
        for await (const u of urls) {
            var parsedURL = new NODEURL.URL(u)
            parsedURL.search=null
            parsedURL.query=null
            parsedURL.hash=null
            await crawl(parsedURL.origin+parsedURL.pathname)
        }
    }
    await crawl('https://developer.apple.com/documentation/storekittest')
    console.log(`Checked ${seenURLs.size} URLs`)
    // await page.screenshot({
    //     path: `documentation.png`
    // });
    // await page.pdf({path: `documentation.pdf`});
    await browser.close();
})();
