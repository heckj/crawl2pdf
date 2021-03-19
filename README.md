# crawl2pdf

A tool that either takes a command `crawl` and a URL:

- crawls the site, rendering the URLS into PDF pages

or takes a command `render`, and either a file or a url:

- renders the URL into a PDF
- and renders the URLS in that file into PDF

To use:

    npm install
    node crawl2pdf

    crawl2pdf [command]

    Commands:
     crawl2pdf render [-u]|[-f]  render the page into a PDF
     crawl2pdf crawl [-a] [-u]   starting crawlinmg a site and rendering PDFs for
                                 each page

    Options:
         --version   Show version number                                  [boolean]
     -u, --url       URL to load
     -a, --articles  Only render articles into PDFs
     -f, --file      file with URLS to load
     -h, --help      Show help                                            [boolean]

    Copyright 2021, thanks Playwright!

## DEBUG MODE

use `DEBUG=pw:api` before a command to generate Playwright debugging output
