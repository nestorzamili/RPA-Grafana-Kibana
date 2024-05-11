require('dotenv').config();
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.goto(process.env.URL, { waitUntil: 'networkidle0' })
    await page.setViewport({ width: 1920, height: 1548 });

    await page.type('input[name="user"]', "admin");
    await page.type('input[name="password"]', process.env.PASSWORD);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    await page.screenshot({ path: process.env.IMAGE_PATH, type: "jpeg", quality: 100, omitBackground: true, fullPage: true });

    const panelTitles = ["CPU Basic", "Memory %", "Disk Space Used Basic"];
    const results = [];

    for (const title of panelTitles) {
    const result = await page.evaluate((title) => {
        const panel = Array.from(document.querySelectorAll('h2.css-1m35bcr')).find(h2 => h2.textContent === title);
        if (!panel) return null;

        const panelContainer = panel.closest('.panel-container');
        const ips = Array.from(panelContainer.querySelectorAll('.graph-legend-alias.pointer')).map(button => button.textContent);
        const maxValues = Array.from(panelContainer.querySelectorAll('.graph-legend-value.max')).map(td => td.textContent);
        const avgValues = Array.from(panelContainer.querySelectorAll('.graph-legend-value.avg')).map(td => td.textContent);
        const currentValues = Array.from(panelContainer.querySelectorAll('.graph-legend-value.current')).map(td => td.textContent);

        return ips.map((ip, i) => ({
        ip,
        max: maxValues[i],
        avg: avgValues[i],
        current: currentValues[i],
        }));
    }, title);

    if (result) {
        results.push({ title, data: result });
    }}

    // Check abnormal
    const abnormalResults = [];

    for (const result of results) {
    for (const data of result.data) {
        const max = parseFloat(data.max);
        const current = parseFloat(data.current);

        if ((result.title === "CPU Basic" || result.title === "Memory %") && (max >= 50 || current >= 50)) {
        abnormalResults.push({ panel: result.title, ip: data.ip, status: "Abnormal", max, current });
        } else if (result.title === "Disk Space Used Basic" && (current >= 75)) {
        abnormalResults.push({ panel: result.title, ip: data.ip, status: "Abnormal", current });
        }
    }}  

    fs.writeFileSync(process.env.LOG_PATH, JSON.stringify(abnormalResults, null, 2));
    
    await browser.close();
})();

// Note
// Powershell Command in UiPath
// "Set-Location -Path 'D:\Santai\Report-Grafana'; node D:\Santai\Report-Grafana\grafana.js"