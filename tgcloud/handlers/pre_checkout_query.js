import { api } from 'sdk'

// Telegram asks us to confirm every Stars payment within 10 seconds.
export default async function (q) {
  const ok = typeof q.invoice_payload === 'string' && q.invoice_payload.startsWith('tip:') && q.currency === 'XTR'
  await api.answerPreCheckoutQuery(ok
    ? { pre_checkout_query_id: q.id, ok: true }
    : { pre_checkout_query_id: q.id, ok: false, error_message: 'This payment link is out of date. Please send /support again.' })
}
