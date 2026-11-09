import { api, db } from 'sdk'
import { sql } from 'sdk/db'
import { payments } from '../schema.js'
import { STAR_AMOUNTS } from './config.js'

// Telegram Stars: currency "XTR", no provider token, exactly one price.
export function invoice(amount) {
  amount = Math.round(Number(amount))
  if (!STAR_AMOUNTS.includes(amount)) amount = 100
  return {
    title: 'Support Sleepyhead',
    description: `A ${amount}-Star tip to keep Sleepyhead free, ad-free and sleepy. Thank you!`,
    payload: `tip:${amount}`,
    currency: 'XTR',
    prices: [{ label: 'Tip', amount }],
  }
}

export const supportKeyboard = () => ({
  inline_keyboard: [
    STAR_AMOUNTS.slice(0, 2).map((a) => ({ text: `⭐ ${a}`, callback_data: `tip:${a}` })),
    STAR_AMOUNTS.slice(2).map((a) => ({ text: `⭐ ${a}`, callback_data: `tip:${a}` })),
  ],
})

export async function sendTipInvoice(chat_id, amount) {
  return api.sendInvoice({ chat_id, ...invoice(amount), disable_notification: true })
}

export async function recordPayment(tgId, p) {
  await db.insert(payments)
    .values({ tgId, amount: p.total_amount, chargeId: p.telegram_payment_charge_id })
    .onConflictDoNothing({ target: payments.chargeId })
}

export async function starTotals() {
  return db.get(sql`SELECT count(*) AS n, coalesce(sum(amount),0) AS stars FROM payments WHERE refunded = 0`)
}
