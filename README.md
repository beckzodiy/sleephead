# Sleepyhead (@SleepyBed_Bot)

A Telegram bot and Mini App that help you fall asleep. It runs on **Telegram Serverless**: Telegram hosts both the bot logic and the Mini App, so there is no server to run.

## What it does

**Mini App** (`public/index.html`, a single file, red on black with no blue light):
- **Brain dump**: write tomorrow's to-dos so they stop looping in your head. The list is saved, and a silent copy is sent to the bot chat for the morning.
- **Breathe**: a slow pacer at 6 breaths a minute (plus 4-7-8 and box breathing), guided by haptic waves.
- **Count sheep**: sheep jump at random, slowly lengthening gaps, so you just wait for the next one.
- **Shuffle**: a calm voice says a random harmless word every 8 seconds.
- **Sounds**: brown noise, pink noise, rain or a drone, with a slow fade-out.
- **Can't sleep**: if you reopen the app late, it suggests getting up instead of lying awake.

**Bot** (`tgcloud/`):
- `/start`: welcome message, an Open button and a menu button next to the message field
- Any plain text you send is added to your list (a brain dump by chat). Every reply is silent.
- `/list`, `/clear`, `/stats` (sessions in the last 7 days), `/sleep`, `/help`

## Layout

```
public/index.html        Mini App (hosted at https://app8749832663.tgcloud.ai/, and on Vercel)
tgcloud/schema.js        tables: users, lists, sessions
tgcloud/handlers/        message.js, callback_query.js
tgcloud/endpoints/       getList, saveList, clearList, logSession (called by the Mini App)
tgcloud/lib/             config, db helpers, keyboards and texts
```

## Deploy

```bash
npm install
npx tgcloud login        # paste the CLI token from BotFather → @SleepyBed_Bot → Serverless → CLI Access
npx tgcloud push         # deploys the bot code and the Mini App
npx tgcloud migrate      # creates the tables (first time, and after schema changes)
```

Then, in BotFather → @SleepyBed_Bot → Bot Settings → Configure Mini App, set the URL to
`https://app8749832663.tgcloud.ai/` and turn on full screen.

Deep links: `t.me/SleepyBed_Bot?startapp=sheep` (also `breathe`, `shuffle`, `sound`, `dump`).

Test without Telegram:
```bash
npx tgcloud run endpoints/getList '{}' --ctx '{ initData: { user: { id: 1 } } }'
```
