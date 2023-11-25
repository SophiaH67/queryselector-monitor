import puppeteer from "puppeteer";

export async function checkStock(
  url: string,
  querySelector: string,
  timeout = 30_000
): Promise<boolean> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Wait for page to load
  const element = await page.waitForSelector(querySelector, {
    visible: true,
    timeout,
  });

  const wasFound = !!element;

  await browser.close();

  return wasFound;
}
