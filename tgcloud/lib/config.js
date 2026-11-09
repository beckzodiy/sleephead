// Where the Mini App lives. Telegram hosts ./public here on every `push`.
export const APP_URL = 'https://app8749832663.tgcloud.ai/'
export const MAX_LIST = 3500   // stay under Telegram's 4096-char message limit

// Telegram user IDs allowed to broadcast and see admin stats.
export const ADMIN_IDS = [5092483247]
export const isAdmin = (id) => ADMIN_IDS.includes(Number(id))

export const STAR_AMOUNTS = [25, 100, 250, 1000]
