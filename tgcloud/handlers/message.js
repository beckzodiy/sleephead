import { api } from 'sdk'
import { touchUser, saveList, clearList, stats } from '../lib/store.js'
import { showList } from '../lib/list.js'
import { mainKeyboard, openButton, WELCOME, HELP } from '../lib/ui.js'
import { APP_URL } from '../lib/config.js'

const quiet = { parse_mode: 'HTML', disable_notification: true, link_preview_options: { is_disabled: true } }

const KIND = { breathe: '🌬 Breathe', shuffle: '🔀 Shuffle', sheep: '🐑 Sheep', sound: '🌧 Sounds', dump: '📝 Brain dump' }

export default async function (message) {
  const chat_id = message.chat.id
  const user = message.from
  if (message.chat.type !== 'private' || !user) return
  await touchUser(user)

  const text = (message.text || '').trim()
  const cmd = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : null

  if (cmd === '/start') {
    // Put an "Open" button next to the message field for this chat.
    try {
      await api.setChatMenuButton({ chat_id, menu_button: { type: 'web_app', text: 'Sleep', web_app: { url: APP_URL } } })
    } catch (e) { console.warn('menu button', e.description) }
    return api.sendMessage({ chat_id, text: WELCOME(user.first_name), reply_markup: mainKeyboard(), ...quiet })
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

  // Plain text = brain dump. Add it to the list, reply quietly, no follow-up questions.
  if (text) {
    await saveList(user.id, text, true)
    return api.sendMessage({
      chat_id, reply_to_message_id: message.message_id,
      text: 'Saved to your list. It will be here in the morning. Now put the phone down 🌙',
      reply_markup: { inline_keyboard: [[openButton('🐑 Count sheep', '#sheep')]] }, ...quiet,
    })
  }
  return api.sendMessage({ chat_id, text: 'Send me text and I will add it to your list.', ...quiet })
}
