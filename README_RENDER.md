# Wallet Buy Alert Bot (Render-ready)

This bot sends a Telegram alert only when the target wallet makes a **SWAP buy of at least 1 SOL**.

Target wallet:
`54Pz1e35z9uoFdnxtzjp7xZQoFiofqhdayQWBMN7dsuy`

## Deploy on Render
Render supports deploying Node web services from a Git repo, with `npm install` as the build command and `npm start` / `node server.js` as valid start commands. It also lets you add environment variables from the dashboard or with Blueprint placeholders in `render.yaml`. citeturn795060search0turn795060search1turn795060search2turn795060search6

### Files included
- `server.js`
- `package.json`
- `render.yaml`
- `.env.example`

## Fastest deployment steps
1. Create a new GitHub repo and upload these files.
2. In Render, click **New > Web Service** and connect that repo. Render's docs say web services can be deployed from a linked Git provider repo. citeturn795060search0turn795060search5
3. Use:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add these env vars in Render:
   - `HELIUS_API_KEY`
   - `WEBHOOK_SECRET`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `MONITORED_WALLET`
   - `MIN_BUY_SOL=1`
5. Deploy.
6. Your webhook URL will be:
   - `https://YOUR-RENDER-APP.onrender.com/webhook`

## Create Helius webhook
In Helius, create a webhook with:
- Account address: `54Pz1e35z9uoFdnxtzjp7xZQoFiofqhdayQWBMN7dsuy`
- Webhook URL: `https://YOUR-RENDER-APP.onrender.com/webhook`
- Authorization header: `mysecret123`
- Transaction types: `SWAP`

## Telegram chat ID
1. Send a message to your bot.
2. Open:
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Copy the `chat.id` into `TELEGRAM_CHAT_ID`.

## Note
Rotate any exposed keys or bot tokens after setup.
