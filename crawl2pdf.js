const { chromium, webkit, devices } = require("playwright");
// docs: https://playwright.dev/docs/api/class-playwright 
const NODEURL = require('url');
const yargs = require('yargs');
const fs = require('fs');
const userDataDir = '_cachedBrowserData';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const seenURLs = new Set()
const failedURLs = new Set()
var startHost = ""
var startPathname = ""
const argv = yargs
.scriptName("crawl2pdf")
.command('render [-u]|[-f]', 'render the page into a PDF')
.command('crawl [-a] [-u]', 'start crawling a site and rendering PDFs for each page')
.command('setup [-u]', 'open a browser to set up cached state (auth/login)')
.alias('u', 'url')
.describe('u', 'URL to load')
.alias('a', 'articles')
.describe('a', 'Only render articles into PDFs')
.alias('f', 'file')
.describe('f', 'file with URLS to load')
.help()
.alias('help','h')
.epilogue(' Copyright 2021, thanks Playwright!')
.argv;

const render = async (url, page) => {
    // constrain the spidering to the URLs at the starting location or below...
    const parsedURL = new NODEURL.URL(url)
    const stringForFiles = parsedURL.pathname
        .replace(/\//g,'_') // translate all the / into _
        .replace(/_documentation_/i,'') // shorten up the file names a smidge
    await page.pdf({path: `${stringForFiles}.pdf`})
    // await page.screenshot({
    //     path: `documentation.png`
    // });
}

const crawl = async (url, page) => {
    if (seenURLs.has(url)) {
        return
    }
    // constrain the spidering to the URLs at the starting location or below...
    const parsedURL = new NODEURL.URL(url)
    if (!(parsedURL.host == startHost && parsedURL.pathname.startsWith(startPathname))) {
        console.log(" - skipping ", parsedURL.href)
        return
    }
    try {
        console.log(` + Visiting ${url}`)
        // https://playwright.dev/docs/api/class-page#pagesetdefaultnavigationtimeouttimeout
        // https://playwright.dev/docs/api/class-page#pagegotourl-options
        await page.goto(url, {timeout: 45000, waitUntil: 'networkidle'})
        // await page.waitForLoadState('networkidle');
        seenURLs.add(url)
    } catch (err) {
        console.log(` * Unable to load ${url} within timeout of 45 sec, moving on`)
        failedURLs.add(url)
        return
    }
    // NOTE(heckj): Topic pages have a 'div.doc-topic' and within that a 'div.topictitle'
    if (argv.a) {
        // -a means only render the article pages - so let's check what we've got before
        // calling render
        const elementHandle = await page.$('span.eyebrow')
        if (elementHandle) {
            const pagetype = await elementHandle.innerText()
            // console.log(`innerText of element handle is >${pagetype}<`)
            if (pagetype == 'Article') {
                await render(url, page) // renders the page into a local PDF file
            }
        }
    } else {
        // render everything
        await sleep(3000);
        await render(url, page) // renders the page into a local PDF file
    }
    const urls = await page.$$eval('a', (elements) =>
        elements.map((el) => el.href),
        // scrape all the page's a.href links into a list of urls
    )
    for await (const u of urls) {
        // squish out the search, query, and hash variations of the UR
        if (u != '') {
            console.log(`  -- cleaning URL ${u}`)
            var nextURL = new NODEURL.URL(u)
            nextURL.search=null
            nextURL.query=null
            nextURL.hash=null
            //console.log(`converting ${u} into ${nextURL.origin+nextURL.pathname}`)
            await crawl(nextURL.origin+nextURL.pathname, page)    
        }
    }
}

(async () => {
    // console.log("argv is ",argv)
    // const browser = await chromium.launch();
    // const browser = await webkit.launch();
    // webkit doesn't have page.pdf, but chromium does...
    if (argv._.includes('setup')) {
        const context = await chromium.launchPersistentContext(userDataDir, { headless: false });
        const page = await context.newPage();    
        console.log('Connect to your authentication and log in. Quit the browser when done.')
        if (argv.u) {
            // -u or --url option included - use the URL from the command line
            try {
                console.log(` + Visiting ${argv.url}`)
                // https://playwright.dev/docs/api/class-page#pagesetdefaultnavigationtimeouttimeout
                // https://playwright.dev/docs/api/class-page#pagegotourl-options
                await page.goto(argv.url, {timeout: 45000, waitUntil: 'networkidle'})
            } catch (err) {
                console.log(` * Unable to load ${argv.url} within timeout of 45 sec, moving on`)
                failedURLs.add(argv.url)
            }
        }
    } else if (argv._.includes('crawl')) {        
        if (argv.url) {
            const context = await chromium.launchPersistentContext(userDataDir, { headless: false });
            const page = await context.newPage();
            const startURL = new NODEURL.URL(argv.url)
            startHost = startURL.host
            startPathname = startURL.pathname
            
            console.log("Crawling starting from ", startURL.href)
            await crawl(startURL.href, page)
            // Make another round through any URLs that fell through the cracks
            // due to timeouts
            for await (const tryAgainUrl of failedURLs) {
                await crawl(tryAgainUrl, page)
            }
            console.log(`Checked ${seenURLs.size} URLs`)    
            await browser.close();
        } else {
            yargs.showHelp()
        }
    } else if (argv._.includes('render')) {
        if (argv.f) {
            const context = await chromium.launchPersistentContext(userDataDir, { headless: false });
            const page = await context.newPage();

            // -f, or --file option included - open and read URLS from a file
            const data = fs.readFileSync(argv.f, 'utf8')
            // split data into lines - /r or /n as newline
            const lines = data.split(/\r?\n/);
            for (let index = 0; index < lines.length; index++) {
                if (lines[index]) {
                    try {
                        console.log(` + Visiting ${url}`)
                        // https://playwright.dev/docs/api/class-page#pagesetdefaultnavigationtimeouttimeout
                        // https://playwright.dev/docs/api/class-page#pagegotourl-options
                        await page.goto(url, {timeout: 45000, waitUntil: 'networkidle'})
                        console.log("rendering ", lines[index])
                        await render(lines[index], page)    
                    } catch (err) {
                        console.log(` * Unable to load ${url} within timeout of 45 sec, moving on`)
                        failedURLs.add(url)
                    }
                }
            }
            await browser.close();
        } else if (argv.u) {
            const context = await chromium.launchPersistentContext(userDataDir, { headless: false });
            const page = await context.newPage();

            // -u or --url option included - use the URL from the command line
            console.log("rendering ", argv.url)
            try {
                console.log(` + Visiting ${argv.url}`)
                // https://playwright.dev/docs/api/class-page#pagesetdefaultnavigationtimeouttimeout
                // https://playwright.dev/docs/api/class-page#pagegotourl-options
                await page.goto(argv.url, {timeout: 45000, waitUntil: 'networkidle'})
                await render(argv.url, page)    
            } catch (err) {
                console.log(` * Unable to load ${argv.url} within timeout of 45 sec, moving on`)
                failedURLs.add(argv.url)
            }
            await browser.close();
        } else {
            yargs.showHelp();    
        }
    } else {
        yargs.showHelp();
    }

})()
