import puppeteer from "puppeteer";

export async function checkStock(
  url: string,
  querySelector: string,
  timeout = 30_000
): Promise<boolean | null> {
  const proxy = process.env.http_proxy || process.env.HTTP_PROXY;
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", ...(proxy ? [`--proxy-server=${proxy}`] : [])],
  });
  const page = await browser.newPage();
  await page.goto(url);

  // Wait for page to load
  await page
    .waitForNetworkIdle({
      idleTime: 5_000,
      timeout,
    })
    .catch(() => {
      console.warn(`Timed out waiting for ${url} to load.`);
    });

  // Check if page failed to load
  const error = await page.$("div.error-container");
  if (error) {
    await browser.close();
    console.warn(`Error container found on ${url}.`);
    return null;
  }
  // Check url
  const currentUrl = page.url();
  if (currentUrl !== url) {
    await browser.close();
    console.warn(`Redirected to ${currentUrl} from ${url}.`);
    return null;
  }

  const element = await page.$(querySelector);

  const wasFound = !!element;

  await browser.close();

  return wasFound;
}
