import { touchUser, getList } from '../lib/store.js'

export default async function (input, ctx) {
  const u = ctx.initData.user
  await touchUser(u)
  const l = await getList(u.id)
  return { body: l ? l.body : '', updated: l ? l.updated : null }
}
