import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'reports/screenshots');
const FRAMES_DIR = path.join(SCREENSHOT_DIR, 'frames');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function runStudioRecording() {
  console.log('Launching headless browser via Brave at:', BRAVE_PATH);

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

    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err));

    console.log('Navigating to http://localhost:3000/studio?preview=1...');
    await page.goto('http://localhost:3000/studio?preview=1', { waitUntil: 'networkidle0', timeout: 30000 });

    // If preview button is visible, click it
    const previewBtn = await page.$('button');
    if (previewBtn) {
      const text = await page.evaluate((el) => el.textContent, previewBtn);
      if (text && text.includes('PREVIEW 3D SPIKE')) {
        await previewBtn.click();
      }
    }

    // Wait for the studio canvas or UI to mount
    console.log('Waiting for canvas to mount...');
    await page.waitForSelector('canvas', { timeout: 30000 });
    console.log('Canvas detected! Waiting 2s for initial procedural shaders to settle...');
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Screenshot Profile 1
    console.log('Capturing Screenshot: Profile 1 3D Studio...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'studio-3d-profile-01.png') });

    // 2. Measure FPS on Desktop
    console.log('Measuring Desktop 3D FPS...');
    const desktopFps = (await page.evaluate(`
      new Promise((resolve) => {
        let frameCount = 0;
        const start = performance.now();
        const checkFrame = () => {
          frameCount++;
          if (performance.now() - start >= 1000) {
            resolve(frameCount);
          } else {
            requestAnimationFrame(checkFrame);
          }
        };
        requestAnimationFrame(checkFrame);
      })
    `)) as number;
    console.log(`✓ Desktop Average FPS: ${desktopFps} FPS`);

    const getText = async (el: any): Promise<string> => {
      try {
        const val = await el.evaluate('e => e ? String(e.innerText || e.textContent || "") : ""');
        return String(val || '');
      } catch {
        return '';
      }
    };

    // 3. Switch to Profile 17 (Masculine Hot Interview)
    console.log('Switching to Profile 17 (Masculine Hot Interview)...');
    const profileButtons = await page.$$('button');
    for (const btn of profileButtons) {
      const text = await getText(btn);
      if (text && text.includes('Profile 17')) {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing Screenshot: Profile 17 3D Tailoring...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'studio-3d-profile-17.png') });

    // 4. Click Shuffle Next Look
    console.log('Clicking Shuffle Next Look...');
    for (const btn of await page.$$('button')) {
      const text = await getText(btn);
      if (text && text.includes('SHUFFLE NEXT LOOK')) {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing Screenshot: Shuffled Alternative Look...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'studio-3d-shuffle-alt1.png') });

    // 5. Select a slot to open SlotDrawer with compatible swaps
    console.log('Selecting slot to inspect compatible swaps...');
    const slotButtons = await page.$$('button');
    for (const btn of slotButtons) {
      const text = await getText(btn);
      // Click first garment slot button
      if (text && (text.includes('Shirt') || text.includes('Tee') || text.includes('Trousers') || text.includes('Blazer') || text.includes('Jacket'))) {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing Screenshot: Slot Drawer with Compatible Swaps...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'studio-3d-slot-swap-drawer.png') });

    // 6. Open Avatar Calibration Drawer
    console.log('Opening Avatar Calibration Drawer...');
    const avatarBtn = await page.$('button[title="Configure Avatar Appearance"]');
    if (avatarBtn) {
      await avatarBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('Capturing Screenshot: Avatar Calibration Drawer...');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'studio-3d-avatar-calibration.png') });
    }

    // 7. Toggle 2D Flat-Lay Fallback Mode
    console.log('Switching to 2D Flat-Lay Fallback View...');
    for (const btn of await page.$$('button')) {
      const text = await getText(btn);
      if (text && text.trim() === '2D') {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing Screenshot: 2D Flat-Lay Fallback View...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'studio-2d-flatlay-fallback.png') });

    // Switch back to 3D for recording
    for (const btn of await page.$$('button')) {
      const text = await getText(btn);
      if (text && text.trim() === '3D') {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));

    // 8. 10-Second Screen Capture Sequence
    console.log('Recording 10-second screen capture sequence (100 frames @ 10fps)...');
    // Clear old frames
    const oldFrames = fs.readdirSync(FRAMES_DIR);
    for (const f of oldFrames) fs.unlinkSync(path.join(FRAMES_DIR, f));

    for (let frame = 0; frame < 100; frame++) {
      const framePath = path.join(FRAMES_DIR, `frame_${String(frame).padStart(4, '0')}.png`);
      await page.screenshot({ path: framePath });

      // Trigger actions during recording to show interactivity
      if (frame === 30) {
        // Trigger a shuffle at 3 seconds
        for (const btn of await page.$$('button')) {
          const text = await getText(btn);
          if (text && text.includes('SHUFFLE')) {
            await btn.click();
            break;
          }
        }
      } else if (frame === 65) {
        // Inspect footwear slot at 6.5 seconds
        for (const btn of await page.$$('button')) {
          const text = await getText(btn);
          if (text && (text.includes('Loafer') || text.includes('Boot') || text.includes('Derby') || text.includes('Oxford'))) {
            await btn.click();
            break;
          }
        }
      }

      await new Promise((r) => setTimeout(r, 100)); // 100ms per frame = 10 fps
    }
    console.log('✓ Captured 100 frames.');

    // 9. Compile frames into MP4 and GIF using ffmpeg
    const mp4Path = path.join(SCREENSHOT_DIR, 'studio-10s-capture.mp4');
    const gifPath = path.join(SCREENSHOT_DIR, 'studio-10s-capture.gif');

    console.log('Compiling 10-second MP4 with ffmpeg...');
    execSync(
      `/opt/homebrew/bin/ffmpeg -y -framerate 10 -i "${FRAMES_DIR}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=1200:-2" "${mp4Path}"`,
      { stdio: 'inherit' }
    );
    console.log('✓ Created MP4 at:', mp4Path);

    console.log('Compiling GIF with ffmpeg...');
    execSync(
      `/opt/homebrew/bin/ffmpeg -y -framerate 10 -i "${FRAMES_DIR}/frame_%04d.png" -vf "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${gifPath}"`,
      { stdio: 'inherit' }
    );
    console.log('✓ Created GIF at:', gifPath);

    // 10. Measure Throttled Mobile FPS (4x CPU slowdown)
    console.log('Measuring Throttled Mobile Performance...');
    const client = await page.target().createCDPSession();
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const mobileFps = (await page.evaluate(`
      new Promise((resolve) => {
        let count = 0;
        const start = performance.now();
        const loop = () => {
          count++;
          if (performance.now() - start >= 1000) {
            resolve(count);
          } else {
            requestAnimationFrame(loop);
          }
        };
        requestAnimationFrame(loop);
      })
    `)) as number;
    console.log(`✓ Throttled Mobile FPS: ${mobileFps} FPS`);

    // Write performance report json
    const perfData = {
      timestamp: new Date().toISOString(),
      desktopFps,
      throttledMobileFps: mobileFps,
      targetFps: 60,
      dprCap: 1.5,
      canvasWidth: 1400,
      canvasHeight: 950,
      mp4Path: 'reports/screenshots/studio-10s-capture.mp4',
      gifPath: 'reports/screenshots/studio-10s-capture.gif',
    };
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'performance.json'), JSON.stringify(perfData, null, 2));
    console.log('✓ Performance data written to reports/screenshots/performance.json');
  } finally {
    await browser.close();
  }
}

runStudioRecording().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
