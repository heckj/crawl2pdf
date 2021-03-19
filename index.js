const { chromium, webkit, devices } = require("playwright");
// docs: https://playwright.dev/docs/api/class-playwright 
const NODEURL = require('url');
const yargs = require('yargs');

const seenURLs = new Set()
var startHost = ""
var startPathname = ""
const argv = yargs
.scriptName("crawl2pdf")
.usage('$0 <cmd> [args]')
.command('render [url]', 'starting crawlinmg a site and rendering PDFs for each page', (yargs) => {
    yargs.positional('ur', {
        description: 'the URL to start crawling',
        alias: 'url',
        type: String
    })
}, async function(argv) {

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
        // constrain the spidering to the URLs at the starting location or below...
        const parsedURL = new NODEURL.URL(url)
        if (!(parsedURL.host == startHost && parsedURL.pathname.startsWith(startPathname))) {
            console.log(" - skipping ", parsedURL.href)
            return
        }
        console.log(` + Visiting ${url}`)
        await page.goto(url)
        await page.waitForLoadState('networkidle');
        const urls = await page.$$eval('a', (elements) =>
            elements.map((el) => el.href),
        )
        await page.pdf({path: `${parsedURL.pathname.replace(/\//g,'_')}.pdf`})
        for await (const u of urls) {
            var nextURL = new NODEURL.URL(u)
            nextURL.search=null
            nextURL.query=null
            nextURL.hash=null
            await crawl(nextURL.origin+nextURL.pathname)
        }
    }

    if (argv._.includes('render')) {
        const startURL = new NODEURL.URL(argv.url)
        startHost = startURL.host
        startPathname = startURL.pathname
        
        console.log("Crawling starting from ", startURL.href)
        await crawl(startURL.href)
        console.log(`Checked ${seenURLs.size} URLs`)
        // await page.screenshot({
        //     path: `documentation.png`
        // });
    }
    await browser.close();

})
.help()
.alias('help','h')
.argv;
