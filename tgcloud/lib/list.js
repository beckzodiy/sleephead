import { api } from 'sdk'
import { getList } from './store.js'
import { listKeyboard, esc } from './ui.js'

const quiet = { parse_mode: 'HTML', disable_notification: true }

export async function showList(chat_id, tgId) {
  const l = await getList(tgId)
  if (!l) return api.sendMessage({ chat_id, text: 'Your list is empty. Text me anything to add to it.', ...quiet })
  return api.sendMessage({ chat_id, text: `<b>📝 Your list</b>\n\n${esc(l.body)}`, reply_markup: listKeyboard(), ...quiet })
}

