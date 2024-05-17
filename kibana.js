require("dotenv").config();
const fs = require("fs");
const tesseract = require("tesseract.js");
const sharp = require("sharp");
const puppeteer = require("puppeteer");

async function login(page) {
  await page.goto(process.env.ELASTIC_URL), { waitUntil: "networkidle0" };
  await page.setViewport({ width: 1600, height: 1129 });
  await page.waitForSelector('input[name="username"]');
  await page.waitForSelector('input[name="password"]');
  await page.type('input[name="username"]', process.env.KIBANA_USERNAME);
  await page.type('input[name="password"]', process.env.KIBANA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 });
}

async function takeScreenshot(page) {
  await page.click(
    'a[data-test-subj="dashboardListingTitleLink-[Metricbeat-PostgreSQL]-Database-Overview"]'
  );
  await page.waitForFunction(
    () => document.querySelectorAll("canvas").length >= 8
  );
  await page.click("span.embPanel__titleText");
  await page.screenshot({
    path: process.env.KIBANA_IMAGE_PATH,
    type: "jpeg",
    quality: 100,
    omitBackground: true,
    fullPage: true,
  });
}

async function processImage() {
  await sharp(process.env.KIBANA_IMAGE_PATH)
    .extract({
      width: 160,
      height: 320,
      left: 0,
      top: 360,
    })
    .resize(320, 640)
    .modulate({ brightness: 2, saturation: 0.5 })
    .toFile(process.env.KIBANA_QUERY_LATENCY);

  const {
    data: { text },
  } = await tesseract.recognize(process.env.KIBANA_QUERY_LATENCY, "eng");
  const matches = text.match(/\d+/g);
  const numbers = matches.map(Number);

  if (numbers[0] >= 3000) {
    fs.writeFileSync(
      process.env.KIBANA_LOG_PATH,
      JSON.stringify(
        {
          status: "Tidak Normal⚠️",
          query_latency: numbers[0],
        },
        null,
        2
      )
    );
  } else {
    fs.writeFileSync(
      process.env.KIBANA_LOG_PATH,
      JSON.stringify(
        {
          status: "Normal✅",
        },
        null,
        2
      )
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
    await browser.close();
    await processImage();
  } catch (error) {
    const date = new Date();
    fs.appendFileSync(
      process.env.ERROR_LOG,
      `Kibana: ${date.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      })}: ${error.toString()}\n`
    );
    process.exit(1);
  }
})();
