import { table, integer, text, sql, index } from 'sdk/db'

// One row per Telegram user who has talked to the bot or opened the Mini App.
export const users = table('users', {
  tgId:     integer('tg_id').primaryKey(),
  name:     text('name'),
  lang:     text('lang'),
  created:  integer('created_at').default(sql`(unixepoch())`),
  lastSeen: integer('last_seen').default(sql`(unixepoch())`),
  blocked:  integer('blocked').default(0),   // 1 = user blocked the bot (skip in broadcasts)
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

// Telegram Stars tips.
export const payments = table('payments', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  tgId:     integer('tg_id').notNull(),
  amount:   integer('amount').notNull(),               // in Stars (XTR)
  chargeId: text('charge_id').unique().notNull(),      // telegram_payment_charge_id, needed for refunds
  refunded: integer('refunded').default(0),
  created:  integer('created_at').default(sql`(unixepoch())`),
})

// Admin broadcasts, sent in batches so a big audience never times out one run.
export const broadcasts = table('broadcasts', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  fromChatId: integer('from_chat_id').notNull(),
  messageId:  integer('message_id'),                  // copied message (any type), or…
  body:       text('body'),                            // …plain text
  status:     text('status').default('draft'),         // draft | sending | done | cancelled
  cursor:     integer('cursor').default(0),            // last tg_id processed
  sent:       integer('sent').default(0),
  failed:     integer('failed').default(0),
  total:      integer('total').default(0),
  created:    integer('created_at').default(sql`(unixepoch())`),
})
