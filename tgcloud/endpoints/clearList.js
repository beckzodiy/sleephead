import { clearList } from '../lib/store.js'

export default async function (input, ctx) {
  await clearList(ctx.initData.user.id)
  return { cleared: true }
}
