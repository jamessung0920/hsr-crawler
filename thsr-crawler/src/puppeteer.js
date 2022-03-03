const puppeteer = require('puppeteer')
const { promisify } = require('util')

const sleep = promisify(setTimeout)

const TARGET_STATION_PAIR = ['']

;(async () => {
    // 1. puppeteer FATAL:zygote_host_impl_linux.cc(191)] Check failed:
    // can check reference (https://github.com/Zenika/alpine-chrome/issues/152, https://github.com/Zenika/alpine-chrome/issues/33)
    // 2. be careful with --no-sandbox (https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox)
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    }) // manual add example: { executablePath: '/usr/bin/chromium-browser' }
    const page = await browser.newPage()
    await page.goto('https://www.latebird.co/thsr_tickets')
    await page.screenshot({ path: '/home/pptruser/Downloads/example.png' })

    await browser.close()
})()
