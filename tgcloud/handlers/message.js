import { api, db } from 'sdk'
import { sql, eq } from 'sdk/db'
import { touchUser, saveList, clearList, stats } from '../lib/store.js'
import { showList } from '../lib/list.js'
import { mainKeyboard, openButton, WELCOME, HELP, ADMIN_HELP } from '../lib/ui.js'
import { APP_URL, isAdmin } from '../lib/config.js'
import { supportKeyboard, recordPayment, starTotals } from '../lib/stars.js'
import { createDraft } from '../lib/broadcast.js'
import { payments } from '../schema.js'

const quiet = { parse_mode: 'HTML', disable_notification: true, link_preview_options: { is_disabled: true } }
const KIND = { breathe: '🌬 Breathe', shuffle: '🔀 Shuffle', sheep: '🐑 Sheep', sound: '🌧 Sounds', dump: '📝 Brain dump' }

export default async function (message) {
  const chat_id = message.chat.id
  const user = message.from
  if (message.chat.type !== 'private' || !user) return
  await touchUser(user)

  // ---- Stars payment completed
  if (message.successful_payment) {
    await recordPayment(user.id, message.successful_payment)
    return api.sendMessage({ chat_id, text: `Thank you for the ⭐ ${message.successful_payment.total_amount}! It keeps Sleepyhead free. Sleep well 🌙`, ...quiet })
  }

  const text = (message.text || message.caption || '').trim()
  const cmd = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : null
  const arg = cmd ? text.slice(text.indexOf(cmd) + cmd.length).replace(/^@\S+/, '').trim() : ''

  // ---- Admin
  if (isAdmin(user.id)) {
    if (cmd === '/admin') {
      const u = await db.get(sql`SELECT count(*) AS n, sum(blocked) AS b, sum(last_seen > unixepoch() - 86400) AS d FROM users`)
      const s = await starTotals()
      return api.sendMessage({ chat_id, text: `<b>Admin</b>\nUsers: ${u.n} (active 24h: ${u.d || 0}, blocked: ${u.b || 0})\nTips: ${s.n} · ⭐ ${s.stars}\n\n${ADMIN_HELP}`, ...quiet })
    }
    if (cmd === '/broadcast') {
      const src = message.reply_to_message
      if (!src && !arg) return api.sendMessage({ chat_id, text: ADMIN_HELP, ...quiet })
      const b = src
        ? await createDraft({ fromChatId: chat_id, messageId: src.message_id })
        : await createDraft({ fromChatId: chat_id, body: arg })
      // Show exactly what users will get, then ask to confirm.
      if (src) await api.copyMessage({ chat_id, from_chat_id: chat_id, message_id: src.message_id })
      else await api.sendMessage({ chat_id, text: arg, link_preview_options: { is_disabled: true } })
      return api.sendMessage({
        chat_id, ...quiet,
        text: `☝️ Preview. Send this to <b>${b.total}</b> users?`,
        reply_markup: { inline_keyboard: [[{ text: '✅ Send', callback_data: `bc:go:${b.id}` }, { text: '✖️ Cancel', callback_data: `bc:x:${b.id}` }]] },
      })
    }
    if (cmd === '/refund') {
      const [uid, charge] = arg.split(/\s+/)
      if (!uid || !charge) return api.sendMessage({ chat_id, text: 'Usage: /refund <user_id> <charge_id>', ...quiet })
      try {
        await api.refundStarPayment({ user_id: Number(uid), telegram_payment_charge_id: charge })
        await db.update(payments).set({ refunded: 1 }).where(eq(payments.chargeId, charge))
        return api.sendMessage({ chat_id, text: 'Refunded.', ...quiet })
      } catch (e) {
        return api.sendMessage({ chat_id, text: `Refund failed: ${e.description || e.message}`, ...quiet })
      }
    }
    if (cmd === '/tips') {
      const rows = await db.all(sql`SELECT tg_id, amount, charge_id, refunded FROM payments ORDER BY id DESC LIMIT 15`)
      const body = rows.length ? rows.map((r) => `${r.tg_id} · ⭐${r.amount}${r.refunded ? ' (refunded)' : ''}\n<code>${r.charge_id}</code>`).join('\n\n') : 'No tips yet.'
      return api.sendMessage({ chat_id, text: `<b>Last tips</b>\n\n${body}`, ...quiet })
    }
  }

  // ---- Everyone
  if (cmd === '/start') {
    try {
      await api.setChatMenuButton({ chat_id, menu_button: { type: 'web_app', text: 'Sleep', web_app: { url: APP_URL } } })
    } catch (e) { console.warn('menu button', e.description) }
    if (arg === 'support') return api.sendMessage({ chat_id, text: '⭐ Choose a tip:', reply_markup: supportKeyboard(), ...quiet })
    return api.sendMessage({ chat_id, text: WELCOME(user.first_name), reply_markup: mainKeyboard(), ...quiet })
  }
  if (cmd === '/support') {
    return api.sendMessage({
      chat_id, ...quiet, reply_markup: supportKeyboard(),
      text: 'Sleepyhead is free with no ads. If it helps you sleep, you can tip with Telegram Stars ⭐',
    })
  }
  if (cmd === '/paysupport') {
    return api.sendMessage({
      chat_id, ...quiet,
      text: 'Tips are voluntary donations and give no extra features. If something went wrong with a payment, describe it in a reply here and the admin will review it. Refunds are possible within 21 days.',
    })
  }
  if (cmd === '/sleep') return api.sendMessage({ chat_id, text: 'Lower your brightness, then tap:', reply_markup: { inline_keyboard: [[openButton()]] }, ...quiet })
  if (cmd === '/help') return api.sendMessage({ chat_id, text: HELP, reply_markup: mainKeyboard(), ...quiet })
  if (cmd === '/list') return showList(chat_id, user.id)
  if (cmd === '/clear') { await clearList(user.id); return api.sendMessage({ chat_id, text: 'List cleared.', ...quiet }) }
  if (cmd === '/stats') {
    const rows = await stats(user.id)
    const body = rows.length
      ? rows.map((r) => `${KIND[r.kind] || r.kind}: ${r.n}`).join('\n')
      : 'No sessions in the last 7 days yet.'
    return api.sendMessage({ chat_id, text: `<b>Last 7 days</b>\n\n${body}`, ...quiet })
  }
  if (cmd) return api.sendMessage({ chat_id, text: HELP, ...quiet })

  // ---- Plain text = brain dump
  if (message.text) {
    await saveList(user.id, text, true)
    return api.sendMessage({
      chat_id, reply_parameters: { message_id: message.message_id },
      text: 'Saved to your list. It will be here in the morning. Now put the phone down 🌙',
      reply_markup: { inline_keyboard: [[openButton('🐑 Count sheep', '#sheep')]] }, ...quiet,
    })
  }
  return api.sendMessage({ chat_id, text: 'Send me text and I will add it to your list.', ...quiet })
}
