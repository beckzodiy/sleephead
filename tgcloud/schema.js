import { table, integer, text, sql, index } from 'sdk/db'

// One row per Telegram user who has talked to the bot or opened the Mini App.
export const users = table('users', {
  tgId:     integer('tg_id').primaryKey(),
  name:     text('name'),
  lang:     text('lang'),
  created:  integer('created_at').default(sql`(unixepoch())`),
  lastSeen: integer('last_seen').default(sql`(unixepoch())`),
})

// The latest brain-dump list per user ("what do I need to do tomorrow").
export const lists = table('lists', {
  tgId:    integer('tg_id').primaryKey(),
  body:    text('body').notNull(),
  updated: integer('updated_at').default(sql`(unixepoch())`),
})

// Wind-down sessions started in the Mini App (breathe, shuffle, sheep, sound).
export const sessions = table('sessions', {
  id:      integer('id').primaryKey({ autoIncrement: true }),
  tgId:    integer('tg_id').notNull(),
  kind:    text('kind').notNull(),
  minutes: integer('minutes'),
  started: integer('started_at').default(sql`(unixepoch())`),
}, (t) => ({
  byUser: index('idx_sessions_user').on(t.tgId, t.started),
}))
