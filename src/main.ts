import * as path from "path";
import * as fs from "fs/promises";
import { checkStock } from "./checkStock.";

const STORAGE_PATH = path.join(__dirname, "..", "storage.json");

const CHECK_URL = process.env.CHECK_URL;
const CHECK_QUERY = process.env.CHECK_QUERY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!CHECK_URL) throw new Error("CHECK_URL is not set");
if (!CHECK_QUERY) throw new Error("CHECK_QUERY is not set");
if (!DISCORD_WEBHOOK_URL) throw new Error("DISCORD_WEBHOOK_URL is not set");

function sendDiscordMessage(message: string) {
  return fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: message }),
  });
}

// setInterval but it waits for the callback to finish before starting the next interval
function setIntervalAsync(callback: () => Promise<void>, ms: number) {
  const interval = () => {
    callback().finally(() => {
      setTimeout(interval, ms);
    });
  };

  setTimeout(interval, ms);
}

async function main() {
  // Check if storage file exists
  const storageExists = await fs
    .access(STORAGE_PATH)
    .then(() => true)
    .catch(() => false);

  if (!storageExists) {
    // Create storage file
    await fs.writeFile(STORAGE_PATH, JSON.stringify({}));
  }

  // Read storage file
  const storage = JSON.parse(await fs.readFile(STORAGE_PATH, "utf-8"));
  async function saveStorage() {
    await fs.writeFile(STORAGE_PATH, JSON.stringify(storage));
  }

  setIntervalAsync(async () => {
    const wasFound = await checkStock(CHECK_URL, CHECK_QUERY);
    const wasFoundBefore = storage[CHECK_URL] ?? false;

    if (wasFound && !wasFoundBefore) {
      // Send discord message
      await sendDiscordMessage(
        `The item is in stock!\n${CHECK_URL}\n${CHECK_QUERY}`
      );

      // Update storage
      storage[CHECK_URL] = true;
      await saveStorage();
    } else if (!wasFound && wasFoundBefore) {
      // Send discord message
      await sendDiscordMessage(
        `Item is no longer in stock.\n${CHECK_URL}\n${CHECK_QUERY}`
      );

      // Update storage
      storage[CHECK_URL] = false;
      await saveStorage();
    }
  }, 60_000);
}

main();
