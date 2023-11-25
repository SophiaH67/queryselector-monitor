import puppeteer from "puppeteer";

export async function checkStock(
  url: string,
  querySelector: string,
  timeout = 30_000
): Promise<boolean> {
  const browser = await puppeteer.launch({
    headless: "new",
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

  const element = await page.$(querySelector);

  const wasFound = !!element;

  await browser.close();

  return wasFound;
}
