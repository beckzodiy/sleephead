import { api } from 'sdk'
import { clearList } from '../lib/store.js'
import { showList } from '../lib/list.js'
import { HELP, mainKeyboard } from '../lib/ui.js'

export default async function (q) {
  const chat_id = q.message && q.message.chat.id
  const tgId = q.from.id
  if (q.data === 'list') {
    await api.answerCallbackQuery({ callback_query_id: q.id })
    return showList(chat_id, tgId)
  }
  if (q.data === 'clear') {
    await clearList(tgId)
    await api.answerCallbackQuery({ callback_query_id: q.id, text: 'List cleared' })
    try { await api.editMessageText({ chat_id, message_id: q.message.message_id, text: '🗑 List cleared.' }) } catch (e) {}
    return
  }
  if (q.data === 'help') {
    await api.answerCallbackQuery({ callback_query_id: q.id })
    return api.sendMessage({ chat_id, text: HELP, parse_mode: 'HTML', reply_markup: mainKeyboard(), disable_notification: true })
  }
  return api.answerCallbackQuery({ callback_query_id: q.id })
}
