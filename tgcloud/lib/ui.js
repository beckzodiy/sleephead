import { APP_URL } from './config.js'

export const openButton = (text = '🌙 Open Sleepyhead', path = '') =>
  ({ text, web_app: { url: APP_URL + path } })

export const mainKeyboard = () => ({
  inline_keyboard: [
    [openButton()],
    [openButton('🐑 Count sheep', '#sheep'), openButton('🌬 Breathe', '#breathe')],
    [{ text: '📝 My list', callback_data: 'list' }, { text: '❓ Help', callback_data: 'help' }],
  ],
})

export const listKeyboard = () => ({
  inline_keyboard: [[
    { text: '🗑 Clear list', callback_data: 'clear' },
    openButton('🌙 Wind down'),
  ]],
})

export const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

export const WELCOME = (name) => `<b>Hi${name ? ' ' + esc(name) : ''}. Sleepyhead helps you fall asleep.</b>

Open the app, lower your brightness, and pick one:
• <b>Brain dump</b>: get tomorrow's to-dos out of your head
• <b>Breathe</b>: slow 6-breaths-a-minute pacer
• <b>Count sheep</b>: they come at random times, so you just wait
• <b>Shuffle</b>: calm random words to drift on

Or just <b>text me</b> whatever is on your mind. I'll keep it on your list for the morning.`

export const HELP = `<b>Commands</b>
/sleep: open the app
/list: show your list
/clear: clear your list
/stats: your last 7 nights

Any other message is added to your list. Write it, then put the phone down.`
