import puppeteer from "puppeteer";
import { computeExecutablePath } from "@puppeteer/browsers";

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: computeExecutablePath({
        browser: "chrome",
        buildId: "138.0.7204.168",
      }),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });
  }
  return browserPromise;
}