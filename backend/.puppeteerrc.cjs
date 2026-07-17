const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Directs Puppeteer to install Chrome inside your project folder
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};