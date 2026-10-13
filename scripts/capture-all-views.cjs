const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const PORT = 9225;
const TARGET_URL = 'https://vael-eight.vercel.app';
const OUT_DIR = path.resolve(__dirname, '../screenshots');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result ? res.result.value : null;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot to ${filePath}`);
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const brave = spawn(BRAVE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,1200',
    TARGET_URL,
  ]);

  await sleep(2500);

  try {
    const targets = await getJson(`http://localhost:${PORT}/json`);
    const pageTarget = targets.find((t) => t.type === 'page');
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await sleep(2000);

    // 1. Fresh Profile (0/3 styles, uninitialized state)
    await client.evaluate(`window.scrollTo(0, 0);`);
    await sleep(500);
    await client.screenshot(path.join(OUT_DIR, '01_fresh_profile.png'));

    // 2. Footer Commit Stamp
    await client.evaluate(`window.scrollTo(0, document.body.scrollHeight);`);
    await sleep(500);
    await client.screenshot(path.join(OUT_DIR, '07_footer_commit_stamp.png'));

    // 3. Initialize Demo Profile
    await client.evaluate(`
      const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('TRY DEMO'));
      if (demoBtn) demoBtn.click();
    `);
    await sleep(2000);

    // 4. Temperature & Condition Groups (top controls)
    await client.evaluate(`window.scrollTo(0, 0);`);
    await sleep(500);
    await client.screenshot(path.join(OUT_DIR, '02_temp_condition_groups.png'));

    // 5. Sub-setting pills: Select Workplace or Job Interview
    await client.evaluate(`
      const interviewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('JOB INTERVIEW') || b.textContent.includes('WORKPLACE') || b.textContent.includes('OFFICE'));
      if (interviewBtn) interviewBtn.click();
    `);
    await sleep(1000);
    await client.evaluate(`window.scrollTo(0, 0);`);
    await sleep(500);
    await client.screenshot(path.join(OUT_DIR, '03_subsetting_pills.png'));

    // 6. Formality Warning: Select Wedding Guest and set formality to 1
    await client.evaluate(`
      const weddingBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('WEDDING'));
      if (weddingBtn) weddingBtn.click();
    `);
    await sleep(1000);
    await client.evaluate(`
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        slider.value = 1;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await sleep(1000);
    await client.evaluate(`window.scrollTo(0, 200);`);
    await sleep(500);
    await client.screenshot(path.join(OUT_DIR, '04_formality_warning.png'));

    // 7. Open Profile Modal and expand all 4 accordions
    await client.evaluate(`
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('EDIT PROFILE') || b.textContent.includes('PHYSICAL PROFILE'));
      if (editBtn) editBtn.click();
    `);
    await sleep(1000);
    // Expand all accordion buttons in modal
    await client.evaluate(`
      const modal = document.querySelector('form');
      if (modal) {
        const accordionBtns = Array.from(modal.querySelectorAll('button')).filter(b => 
          b.textContent.includes('COLOR & CONTRAST') ||
          b.textContent.includes('PROPORTIONS') ||
          b.textContent.includes('BUDGET') ||
          b.textContent.includes('DISLIKES')
        );
        accordionBtns.forEach(b => b.click());
      }
    `);
    await sleep(1000);
    await client.screenshot(path.join(OUT_DIR, '05_four_profile_accordions.png'));

    // Close modal
    await client.evaluate(`
      const closeBtn = document.querySelector('button svg.lucide-x')?.parentElement;
      if (closeBtn) closeBtn.click();
    `);
    await sleep(1000);

    // 8. Look card with confidence line and "assumed" labels
    // Return slider to 3, scroll down to look card
    await client.evaluate(`
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        slider.value = 3;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await sleep(1500);
    await client.evaluate(`window.scrollTo(0, 700);`);
    await sleep(1000);
    await client.screenshot(path.join(OUT_DIR, '06_look_card_confidence_assumed.png'));

    console.log('All 7 screenshots captured successfully.');
  } finally {
    brave.kill();
  }
}

main().catch(console.error);
