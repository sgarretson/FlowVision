// Test script to debug initiative access issue
const puppeteer = require('puppeteer');

async function testInitiativeAccess() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 },
    });

    const page = await browser.newPage();

    // Enable console logging
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (error) => console.error('PAGE ERROR:', error.message));

    // Navigate to login
    console.log('🔄 Navigating to login page...');
    await page.goto('http://localhost:3000/auth');

    // Login
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'admin@flowvision.dev');
    await page.type('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForNavigation();
    console.log('✅ Logged in, current URL:', page.url());

    // Navigate to initiatives list
    console.log('📋 Navigating to initiatives list...');
    await page.goto('http://localhost:3000/initiatives');
    await page.waitForSelector('h1', { timeout: 5000 });

    const title = await page.$eval('h1', (el) => el.textContent);
    console.log('✅ Initiatives page title:', title);

    // Check if there are any initiative links
    const initiativeLinks = await page.$$('a[href*="/initiatives/"]');
    console.log('📊 Found', initiativeLinks.length, 'initiative links');

    if (initiativeLinks.length > 0) {
      // Get the href of the first initiative
      const firstLink = await page.$eval('a[href*="/initiatives/"]', (el) => el.href);
      console.log('🎯 Testing first initiative:', firstLink);

      // Navigate to first initiative
      await page.goto(firstLink);
      await page.waitForTimeout(2000); // Wait for page to load

      const currentUrl = page.url();
      const pageTitle = await page.$eval('h1', (el) => el.textContent).catch(() => 'N/A');

      console.log('🎯 Initiative page URL:', currentUrl);
      console.log('📄 Initiative page title:', pageTitle);

      if (pageTitle.includes('Not Found')) {
        console.error('❌ Initiative page shows "Not Found" error');
      } else {
        console.log('✅ Initiative page loaded successfully');
      }
    } else {
      console.log('⚠️  No initiative links found on the page');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testInitiativeAccess();
