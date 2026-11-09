import { api, db } from 'sdk'
import { eq, sql } from 'sdk/db'
import { users, broadcasts } from '../schema.js'

const BATCH = 150            // users per run; tap "Continue" for the next batch
const TIME_BUDGET_MS = 20000 // stop early so a single run never times out

const sleep = (ms) => (typeof setTimeout === 'function' ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve())

export const audience = async () =>
  (await db.get(sql`SELECT count(*) AS n FROM users WHERE blocked = 0`)).n

export async function createDraft({ fromChatId, messageId, body }) {
  const total = await audience()
  const [row] = await db.insert(broadcasts).values({ fromChatId, messageId: messageId || null, body: body || null, total }).returning()
  return row
}

export const getBroadcast = (id) => db.select().from(broadcasts).where(eq(broadcasts.id, id)).get()

export const progressText = (b) =>
  b.status === 'done'
    ? `✅ Broadcast #${b.id} finished.\nSent: ${b.sent} · Failed/blocked: ${b.failed} · Total: ${b.total}`
    : `📣 Broadcast #${b.id}: ${b.status}\nSent: ${b.sent} · Failed/blocked: ${b.failed} · Left: ~${Math.max(0, b.total - b.sent - b.failed)}`

export const progressKeyboard = (b) =>
  b.status === 'sending'
    ? { inline_keyboard: [[{ text: '▶️ Continue', callback_data: `bc:go:${b.id}` }, { text: '⏹ Stop', callback_data: `bc:x:${b.id}` }]] }
    : undefined

async function deliver(b, chat_id) {
  if (b.messageId) return api.copyMessage({ chat_id, from_chat_id: b.fromChatId, message_id: b.messageId })
  return api.sendMessage({ chat_id, text: b.body, link_preview_options: { is_disabled: true } })
}

// Sends the next batch. Returns the updated broadcast row.
export async function runBatch(id) {
  const started = Date.now()
  let b = await getBroadcast(id)
  if (!b || b.status === 'done' || b.status === 'cancelled') return b
  const rows = await db.all(sql`SELECT tg_id FROM users WHERE blocked = 0 AND tg_id > ${b.cursor} ORDER BY tg_id LIMIT ${BATCH}`)
  let { sent, failed, cursor } = b
  for (const r of rows) {
    if (Date.now() - started > TIME_BUDGET_MS) break
    try {
      await deliver(b, r.tg_id)
      sent++
    } catch (e) {
      if (e.code === 429) {                       // flood limit: wait once, retry
        await sleep(((e.parameters && e.parameters.retry_after) || 1) * 1000)
        try { await deliver(b, r.tg_id); sent++ } catch (e2) { failed++ }
      } else {
        failed++
        if (e.code === 403) await db.update(users).set({ blocked: 1 }).where(eq(users.tgId, r.tg_id))
      }
    }
    cursor = r.tg_id
    await sleep(40)                               // stay under ~25 messages/second
  }
  const more = await db.get(sql`SELECT 1 AS x FROM users WHERE blocked = 0 AND tg_id > ${cursor} LIMIT 1`)
  const status = more ? 'sending' : 'done'
  await db.update(broadcasts).set({ sent, failed, cursor, status }).where(eq(broadcasts.id, id))
  return { ...b, sent, failed, cursor, status }
}

export const cancel = (id) => db.update(broadcasts).set({ status: 'cancelled' }).where(eq(broadcasts.id, id))
