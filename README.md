# Wallet Alert Bot

This bot watches the wallet:
`54Pz1e35z9uoFdnxtzjp7xZQoFiofqhdayQWBMN7dsuy`

and sends Telegram alerts when Helius posts webhook events to your server.

## 1) Install
```bash
npm install
```

## 2) Update `.env`
Set:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## 3) Run
```bash
npm start
```

## 4) Expose your local server
If running locally:
```bash
ngrok http 3000
```

Use:
`https://YOUR-URL/webhook`

## 5) Create Helius webhook
In Helius, create a webhook with:
- Account address: `54Pz1e35z9uoFdnxtzjp7xZQoFiofqhdayQWBMN7dsuy`
- Webhook URL: `https://YOUR-URL/webhook`
- Authorization header: `mysecret123`

Recommended first setup:
- Transaction types: ANY

## 6) Get your Telegram chat ID
1. Create a bot with BotFather
2. Send your bot a message
3. Open:
```bash
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```
4. Copy the `chat.id`

## Optional filters
- `MIN_SOL=0.1` → only alert if sent/received SOL is at least 0.1
- `ONLY_TYPES=SWAP` → only alerts for swaps

## Telegram bot details already added
Bot username:
`@Tacksolbot`

Only the `TELEGRAM_CHAT_ID` is still missing.

Quick way to get chat ID:
1. Open Telegram and send any message to `@Tacksolbot`
2. In your browser open:
```bash
https://api.telegram.org/bot8645849301:AAGMG5tp-9wLQWirExlJTBDw2hgX9j4x6B8/getUpdates
```
3. Find:
```json
"chat":{"id":123456789
```
4. Copy that number into:
```env
TELEGRAM_CHAT_ID=123456789
```
