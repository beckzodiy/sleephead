import { api } from 'sdk'
import { clearList } from '../lib/store.js'
import { showList } from '../lib/list.js'
import { HELP, mainKeyboard } from '../lib/ui.js'
import { isAdmin } from '../lib/config.js'
import { sendTipInvoice, supportKeyboard } from '../lib/stars.js'
import { runBatch, cancel, getBroadcast, progressText, progressKeyboard } from '../lib/broadcast.js'

export default async function (q) {
  const chat_id = q.message && q.message.chat.id
  const message_id = q.message && q.message.message_id
  const tgId = q.from.id
  const data = q.data || ''

  if (data === 'list') {
    await api.answerCallbackQuery({ callback_query_id: q.id })
    return showList(chat_id, tgId)
  }
  if (data === 'clear') {
    await clearList(tgId)
    await api.answerCallbackQuery({ callback_query_id: q.id, text: 'List cleared' })
    try { await api.editMessageText({ chat_id, message_id, text: '🗑 List cleared.' }) } catch (e) {}
    return
  }
  if (data === 'help') {
    await api.answerCallbackQuery({ callback_query_id: q.id })
    return api.sendMessage({ chat_id, text: HELP, parse_mode: 'HTML', reply_markup: mainKeyboard(), disable_notification: true })
  }
  if (data === 'support') {
    await api.answerCallbackQuery({ callback_query_id: q.id })
    return api.sendMessage({ chat_id, text: 'Sleepyhead is free with no ads. If it helps you sleep, you can tip with Telegram Stars ⭐', reply_markup: supportKeyboard(), disable_notification: true })
  }
  if (data.startsWith('tip:')) {
    await api.answerCallbackQuery({ callback_query_id: q.id })
    return sendTipInvoice(chat_id, data.slice(4))
  }

  // ---- Admin broadcast controls
  if (data.startsWith('bc:')) {
    if (!isAdmin(tgId)) return api.answerCallbackQuery({ callback_query_id: q.id, text: 'Admins only' })
    const [, action, idStr] = data.split(':')
    const id = Number(idStr)
    if (action === 'x') {
      await cancel(id)
      await api.answerCallbackQuery({ callback_query_id: q.id, text: 'Stopped' })
      const b = await getBroadcast(id)
      try { await api.editMessageText({ chat_id, message_id, text: progressText(b) }) } catch (e) {}
      return
    }
    if (action === 'go') {
      await api.answerCallbackQuery({ callback_query_id: q.id, text: 'Sending…' })
      try { await api.editMessageText({ chat_id, message_id, text: `📣 Broadcast #${id}: sending…` }) } catch (e) {}
      const b = await runBatch(id)
      try { await api.editMessageText({ chat_id, message_id, text: progressText(b), reply_markup: progressKeyboard(b) }) } catch (e) {}
      return
    }
  }
  return api.answerCallbackQuery({ callback_query_id: q.id })
}
