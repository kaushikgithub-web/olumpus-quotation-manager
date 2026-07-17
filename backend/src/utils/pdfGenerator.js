import puppeteer from "puppeteer";

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      executablePath: puppeteer.executablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });
  }

  return browserPromise;
}
/**
 * Renders an HTML string to a PDF buffer. Margins are intentionally 0 here
 * — renderQuotationHtml.js already builds its own margins/border into the
 * page via CSS (@page + .page padding), so letting Puppeteer add its own
 * margins on top would double them up.
 */
export async function generatePdfBuffer(html) {
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' })
    // Belt-and-suspenders: networkidle0 usually covers font loading, but
    // explicitly waiting on the Font Loading API avoids any race where the
    // PDF snapshot is taken a moment before the Google Font (Rye) finishes
    // swapping in, which would silently fall back to a generic font.
    await page.evaluate(() => document.fonts.ready)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    })
    return pdfBuffer
  } finally {
    await page.close()
  }
}

/** Call on server shutdown so Chromium doesn't linger as an orphan process. */
export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise
    await browser.close()
    browserPromise = null
  }
}
