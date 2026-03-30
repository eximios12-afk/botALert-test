import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 3000);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const MONITORED_WALLET = process.env.MONITORED_WALLET || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const MIN_SOL = Number(process.env.MIN_SOL || 0);
const ONLY_TYPES = (process.env.ONLY_TYPES || "")
  .split(",")
  .map((v) => v.trim().toUpperCase())
  .filter(Boolean);

function shortAddr(addr = "") {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

function getNativeTransferSummary(tx, wallet) {
  const transfers = Array.isArray(tx?.nativeTransfers) ? tx.nativeTransfers : [];
  let received = 0;
  let sent = 0;

  for (const t of transfers) {
    const amountSol = Number(t?.amount || 0) / 1_000_000_000;
    const to = t?.toUserAccount || t?.toUser || "";
    const from = t?.fromUserAccount || t?.fromUser || "";

    if (to === wallet) received += amountSol;
    if (from === wallet) sent += amountSol;
  }

  return { received, sent };
}

function getTokenTransferSummary(tx, wallet) {
  const transfers = Array.isArray(tx?.tokenTransfers) ? tx.tokenTransfers : [];
  const relevant = [];

  for (const t of transfers) {
    const from = t?.fromUserAccount || t?.fromUser || "";
    const to = t?.toUserAccount || t?.toUser || "";
    const fromMatch = from === wallet;
    const toMatch = to === wallet;

    if (fromMatch || toMatch) {
      relevant.push({
        mint: t?.mint || "",
        tokenAmount: t?.tokenAmount ?? "?",
        direction: toMatch ? "IN" : "OUT",
      });
    }
  }

  return relevant;
}

function shouldSend(tx) {
  const type = String(tx?.type || "").toUpperCase();

  // Respect ONLY_TYPES from .env unless it's empty or set to ANY
  if (
    ONLY_TYPES.length > 0 &&
    !ONLY_TYPES.includes("ANY") &&
    !ONLY_TYPES.includes(type)
  ) {
    return false;
  }

  const { sent } = getNativeTransferSummary(tx, MONITORED_WALLET);

  // Buy alert = monitored wallet spent at least MIN_SOL
  return sent >= MIN_SOL;
}

function buildMessage(tx) {
  const signature = tx?.signature || "N/A";
  const type = tx?.type || "UNKNOWN";
  const source = tx?.source || "UNKNOWN";
  const description = tx?.description || "No description";
  const fee = (Number(tx?.fee || 0) / 1_000_000_000).toFixed(6);

  const { received, sent } = getNativeTransferSummary(tx, MONITORED_WALLET);
  const tokenTransfers = getTokenTransferSummary(tx, MONITORED_WALLET);
  const boughtTokens = tokenTransfers.filter((t) => t.direction === "IN");

  let message = `🚨 <b>Wallet Alert</b>\n`;
  message += `👛 Wallet: <code>${escapeHtml(shortAddr(MONITORED_WALLET))}</code>\n`;
  message += `📌 Type: <b>${escapeHtml(type)}</b>\n`;
  message += `🏷 Source: <b>${escapeHtml(source)}</b>\n`;
  message += `💸 Fee: <b>${fee} SOL</b>\n`;

  if (received > 0) {
    message += `🟢 Received: <b>${received.toFixed(4)} SOL</b>\n`;
  }

  if (sent > 0) {
    message += `🟢 BUY: <b>${sent.toFixed(4)} SOL</b>\n`;
  }

  if (boughtTokens.length > 0) {
    message += `🪙 Tokens Bought:\n`;
    for (const t of boughtTokens.slice(0, 5)) {
      message += `• ${escapeHtml(String(t.tokenAmount))} <code>${escapeHtml(shortAddr(t.mint))}</code>\n`;
    }
  }

  message += `📝 ${escapeHtml(description)}\n`;
  message += `🔗 <a href="https://solscan.io/tx/${encodeURIComponent(signature)}">View Transaction</a>`;

  return message;
}

app.get("/", (_req, res) => {
  res.send("Wallet alert bot is running.");
});

app.post("/webhook", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (WEBHOOK_SECRET && authHeader !== WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, error: "Invalid webhook secret" });
    }

    const payload = req.body;

    if (!Array.isArray(payload)) {
      return res.status(400).json({ ok: false, error: "Expected array payload from Helius" });
    }

    let sentCount = 0;

    for (const tx of payload) {
      if (!shouldSend(tx)) continue;

      const msg = buildMessage(tx);
      await sendTelegramMessage(msg);
      sentCount += 1;
    }

    return res.json({ ok: true, sent: sentCount });
  } catch (error) {
    console.error("Webhook error:", error?.response?.data || error.message);
    return res.status(500).json({ ok: false, error: error.message || "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Monitoring wallet: ${MONITORED_WALLET}`);
  console.log(`MIN_SOL: ${MIN_SOL}`);
  console.log(`ONLY_TYPES: ${ONLY_TYPES.join(",") || "ANY"}`);
});
