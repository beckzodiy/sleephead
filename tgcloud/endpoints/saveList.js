import { api, EndpointError } from 'sdk'
import { touchUser, saveList } from '../lib/store.js'
import { esc } from '../lib/ui.js'

// Saves the Mini App brain dump and drops a silent copy into the bot chat,
// so the list is waiting at the top of the chat in the morning.
export default async function (input, ctx) {
  const u = ctx.initData.user
  if (typeof input.body !== 'string') throw new EndpointError('body must be text', { code: 'BAD_BODY' })
  await touchUser(u)
  const body = await saveList(u.id, input.body, false)
  if (body && input.notify !== false) {
    try {
      await api.sendMessage({
        chat_id: u.id, parse_mode: 'HTML', disable_notification: true,
        text: `<b>📝 For tomorrow</b>\n\n${esc(body)}`,
        reply_markup: { inline_keyboard: [[{ text: '🗑 Clear list', callback_data: 'clear' }]] },
      })
    } catch (e) { /* user may not have started the bot chat; fine */ }
  }
  return { saved: true, body }
}
