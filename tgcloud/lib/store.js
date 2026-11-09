import { db } from 'sdk'
import { eq, desc, sql } from 'sdk/db'
import { users, lists, sessions } from '../schema.js'
import { MAX_LIST } from './config.js'

export async function touchUser(u) {
  if (!u || !u.id) return
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || null
  await db.insert(users)
    .values({ tgId: u.id, name, lang: u.language_code || null })
    .onConflictDoUpdate({ target: users.tgId, set: { name, lang: u.language_code || null, lastSeen: sql`(unixepoch())`, blocked: 0 } })
}

export async function getList(tgId) {
  return db.select().from(lists).where(eq(lists.tgId, tgId)).get()
}

export async function saveList(tgId, body, append = false) {
  body = String(body || '').trim()
  if (append) {
    const old = await getList(tgId)
    if (old && old.body) body = old.body + '\n' + body
  }
  body = body.slice(-MAX_LIST)
  if (!body) return clearList(tgId)
  await db.insert(lists).values({ tgId, body })
    .onConflictDoUpdate({ target: lists.tgId, set: { body, updated: sql`(unixepoch())` } })
  return body
}

export async function clearList(tgId) {
  await db.delete(lists).where(eq(lists.tgId, tgId))
  return ''
}

export async function logSession(tgId, kind, minutes) {
  await db.insert(sessions).values({ tgId, kind, minutes: minutes || null })
}

export async function stats(tgId) {
  const since = Math.floor(Date.now() / 1000) - 7 * 86400
  const rows = await db.all(sql`SELECT kind, count(*) AS n FROM sessions
    WHERE tg_id = ${tgId} AND started_at >= ${since} GROUP BY kind ORDER BY n DESC`)
  return rows
}
