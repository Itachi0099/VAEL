import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const REPORTS_DIR = path.resolve(process.cwd(), 'reports');

async function measureStudioPerformance() {
  console.log('Launching browser to measure Studio WebGL performance...');
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
      '--window-size=1400,1000',
    ],
    defaultViewport: {
      width: 1400,
      height: 950,
      deviceScaleFactor: 2,
    },
  });

  try {
    const page = await browser.newPage();
    console.log('Navigating to https://vael-eight.vercel.app/studio?preview=1...');
    await page.goto('https://vael-eight.vercel.app/studio?preview=1', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('Waiting for canvas to mount...');
    await page.waitForSelector('canvas', { timeout: 30000 });
    console.log('Canvas detected! Stabilizing for 2 seconds...');
    await new Promise((r) => setTimeout(r, 2000));

    console.log('Collecting 180 consecutive animation frames...');
    const frameData = (await page.evaluate(`
      new Promise((resolve) => {
        const frameDeltas = [];
        let prevTime = performance.now();
        let frameCount = 0;
        const totalFrames = 180;

        const loop = (currentTime) => {
          const delta = currentTime - prevTime;
          prevTime = currentTime;
          if (frameCount > 0) {
            frameDeltas.push(delta);
          }
          frameCount++;
          if (frameCount <= totalFrames) {
            requestAnimationFrame(loop);
          } else {
            resolve(frameDeltas);
          }
        };
        requestAnimationFrame(loop);
      })
    `)) as number[];

    const sorted = [...frameData].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const longFrames16 = frameData.filter((d) => d > 16.67).length;
    const longFrames33 = frameData.filter((d) => d > 33.33).length;
    const avgFps = Math.round(1000 / (frameData.reduce((a, b) => a + b, 0) / frameData.length));

    const perfReport = {
      timestamp: new Date().toISOString(),
      environment: 'Headless Chromium / Brave (Apple Metal ANGLE GL)',
      totalFramesSampled: frameData.length,
      averageFps: avgFps,
      frameTime_ms: {
        p50: Number(p50.toFixed(2)),
        p95: Number(p95.toFixed(2)),
        p99: Number(p99.toFixed(2)),
        min: Number(sorted[0].toFixed(2)),
        max: Number(sorted[sorted.length - 1].toFixed(2)),
      },
      longFrames: {
        framesOver16ms: longFrames16,
        framesOver33ms: longFrames33,
        ratioOver16ms: `${((longFrames16 / frameData.length) * 100).toFixed(1)}%`,
      },
      disclaimers: {
        headlessSoftwareGL: 'Headless software GL / CI virtualization is not representative of real hardware GPU rendering.',
        mobileStatus: 'NOT VERIFIED (Mobile FPS cannot be certified until measured on a real phone via remote DevTools).',
      },
    };

    const outPath = path.join(REPORTS_DIR, 'performance-studio.json');
    fs.writeFileSync(outPath, JSON.stringify(perfReport, null, 2));
    console.log('✓ Performance benchmark saved to:', outPath);
    console.log(JSON.stringify(perfReport, null, 2));
  } finally {
    await browser.close();
  }
}

measureStudioPerformance().catch((err) => {
  console.error('Performance benchmark failed:', err);
  process.exit(1);
});
