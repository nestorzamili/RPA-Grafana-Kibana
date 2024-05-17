require("dotenv").config();
const fs = require("fs");
const puppeteer = require("puppeteer");

async function login(page) {
  await page.goto(process.env.GRAFANA_URL, { waitUntil: "networkidle0" });
  await page.setViewport({ width: 1920, height: 1548 });
  await page.type('input[name="user"]', process.env.GRAFANA_USERNAME);
  await page.type('input[name="password"]', process.env.GRAFANA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 });
}

async function takeScreenshot(page) {
  await page.screenshot({
    path: process.env.GRAFANA_IMAGE_PATH,
    type: "jpeg",
    quality: 100,
    omitBackground: true,
    fullPage: true,
  });
}

async function getPanelData(page, title) {
  return await page.evaluate((title) => {
    const panel = Array.from(document.querySelectorAll("h2.css-1m35bcr")).find(
      (h2) => h2.textContent === title
    );
    if (!panel) return null;

    const panelContainer = panel.closest(".panel-container");
    const ips = Array.from(
      panelContainer.querySelectorAll(".graph-legend-alias.pointer")
    ).map((button) => button.textContent);
    const maxValues = Array.from(
      panelContainer.querySelectorAll(".graph-legend-value.max")
    ).map((td) => td.textContent);
    const avgValues = Array.from(
      panelContainer.querySelectorAll(".graph-legend-value.avg")
    ).map((td) => td.textContent);
    const currentValues = Array.from(
      panelContainer.querySelectorAll(".graph-legend-value.current")
    ).map((td) => td.textContent);

    return ips.map((ip, i) => ({
      ip,
      max: maxValues[i],
      avg: avgValues[i],
      current: currentValues[i],
    }));
  }, title);
}

function processResults(results) {
  const abnormalResults = [];

  for (const result of results) {
    for (const data of result.data) {
      const max = parseFloat(data.max);
      const current = parseFloat(data.current);

      if (
        (result.title === "CPU Basic" || result.title === "Memory %") &&
        (max >= 50 || current >= 50)
      ) {
        abnormalResults.push({
          panel: result.title,
          ip: data.ip,
          status: "Tidak Normal⚠️",
          max,
          current,
        });
      } else if (result.title === "Disk Space Used Basic" && current >= 75) {
        abnormalResults.push({
          panel: result.title,
          ip: data.ip,
          status: "Tidak Normal⚠️",
          current,
        });
      }
    }
  }

  if (abnormalResults.length === 0) {
    fs.writeFileSync(
      process.env.GRAFANA_LOG_PATH,
      JSON.stringify({ status: "Normal✅" }, null, 2)
    );
  } else {
    fs.writeFileSync(
      process.env.GRAFANA_LOG_PATH,
      JSON.stringify(abnormalResults, null, 2)
    );
  }
}

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "true",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await login(page);
    await takeScreenshot(page);

    const panelTitles = ["CPU Basic", "Memory %", "Disk Space Used Basic"];
    const results = [];

    for (const title of panelTitles) {
      const result = await getPanelData(page, title);
      if (result) {
        results.push({ title, data: result });
      }
    }

    processResults(results);

    await browser.close();
  } catch (error) {
    const date = new Date();
    fs.appendFileSync(
      process.env.ERROR_LOG,
      `Grafana: ${date.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      })}: ${error.toString()}\n`
    );
    process.exit(1);
  }
})();
