const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto('https://api.shoonya.com/OAuthlogin/investor-entry-level/login?api_key=06099530&route_to=FN219925', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type="password"]');
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(el => ({
      id: el.id, name: el.name, type: el.type, placeholder: el.placeholder
    }));
  });
  console.log(JSON.stringify(inputs, null, 2));
  await browser.close();
})();
