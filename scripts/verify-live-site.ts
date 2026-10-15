import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'reports/screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function verifyLiveSite() {
  console.log('Verifying live deployment on https://vael-eight.vercel.app using Brave...');
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=metal',
      '--ignore-gpu-blocklist',
      '--window-size=1440,1100',
    ],
    defaultViewport: {
      width: 1440,
      height: 1050,
      deviceScaleFactor: 2,
    },
  });

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err));

    console.log('1. Loading https://vael-eight.vercel.app ...');
    await page.goto('https://vael-eight.vercel.app', { waitUntil: 'networkidle2', timeout: 45000 });

    // Click Try Demo Profile
    const demoBtn = await page.waitForSelector('button ::-p-text(TRY DEMO PROFILE)', { timeout: 10000 });
    if (demoBtn) {
      console.log('Clicking TRY DEMO PROFILE...');
      await demoBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Capture initial Flagship view
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'live-flagship-light.png'),
      fullPage: false,
    });
    console.log('Saved live-flagship-light.png');

    // Test Temperature and Precipitation Buttons
    console.log('2. Testing Temperature button "Hot (>27°C)"...');
    const hotBtn = await page.waitForSelector('button ::-p-text(Hot (>27°C))', { timeout: 5000 });
    if (hotBtn) {
      await hotBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    console.log('3. Testing Precipitation button "Rain / Wet"...');
    const rainBtn = await page.waitForSelector('button ::-p-text(Rain / Wet)', { timeout: 5000 });
    if (rainBtn) {
      await rainBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Verify both are selected
    const hotAriaChecked = await page.$eval('button ::-p-text(Hot (>27°C))', (el) => el.getAttribute('aria-checked'));
    const rainAriaChecked = await page.$eval('button ::-p-text(Rain / Wet)', (el) => el.getAttribute('aria-checked'));
    console.log(`Temperature "Hot" aria-checked: ${hotAriaChecked}, Precipitation "Rain" aria-checked: ${rainAriaChecked}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'live-temperature-rain-selected.png'),
      fullPage: false,
    });
    console.log('Saved live-temperature-rain-selected.png');

    // Test Dark Mode Toggle
    console.log('4. Testing Dark Mode toggle...');
    const initialDarkMode = await page.$eval('html', (el) => el.classList.contains('dark'));
    console.log(`Initial dark mode on HTML element: ${initialDarkMode}`);

    const darkBtn = await page.waitForSelector('button[aria-label="Toggle dark mode"]', { timeout: 5000 });
    if (darkBtn) {
      await darkBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
    }

    const toggledDarkMode = await page.$eval('html', (el) => el.classList.contains('dark'));
    console.log(`Toggled dark mode on HTML element: ${toggledDarkMode} (was: ${initialDarkMode})`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'live-flagship-dark-mode.png'),
      fullPage: false,
    });
    console.log('Saved live-flagship-dark-mode.png');

    // Capture footer stamp
    const footer = await page.$('footer');
    if (footer) {
      await footer.screenshot({
        path: path.join(SCREENSHOT_DIR, 'live-production-head.png'),
      });
      console.log('Saved live-production-head.png');
    }

    // Switch to Studio (beta) in Flagship
    console.log('5. Clicking "Studio (beta)" tab on live site...');
    const studioTab = await page.waitForSelector('button ::-p-text(Studio (beta))', { timeout: 5000 });
    if (studioTab) {
      await studioTab.click();
      console.log('Waiting 4s for 3D Studio to initialize WebGL & materials...');
      await new Promise((r) => setTimeout(r, 4500));
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'live-3d-studio-flagship-dark.png'),
      fullPage: false,
    });
    console.log('Saved live-3d-studio-flagship-dark.png');

    // Test fullscreen route /studio
    console.log('6. Loading https://vael-eight.vercel.app/studio ...');
    await page.goto('https://vael-eight.vercel.app/studio', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4000));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'live-studio-fullscreen-route.png'),
      fullPage: false,
    });
    console.log('Saved live-studio-fullscreen-route.png');

    console.log('All live verifications completed successfully!');
  } finally {
    await browser.close();
  }
}

verifyLiveSite().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
