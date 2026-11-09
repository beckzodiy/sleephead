import { api } from 'sdk'
import { invoice } from '../lib/stars.js'
import { touchUser } from '../lib/store.js'

// Mini App: returns a Stars invoice link to open with Telegram.WebApp.openInvoice().
export default async function (input, ctx) {
  await touchUser(ctx.initData.user)
  const link = await api.createInvoiceLink(invoice(input.amount))
  return { link }
}
