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
     crawl2pdf crawl [-u]        starting crawlinmg a site and rendering PDFs for
                                each page

    Options:
         --version  Show version number                                   [boolean]
     -u, --url      URL to load
     -f, --file     file with URLS to load
     -h, --help     Show help                                             [boolean]
