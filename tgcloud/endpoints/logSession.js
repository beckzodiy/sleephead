import { EndpointError } from 'sdk'
import { touchUser, logSession } from '../lib/store.js'

const KINDS = ['breathe', 'shuffle', 'sheep', 'sound', 'dump']

export default async function (input, ctx) {
  if (!KINDS.includes(input.kind)) throw new EndpointError('unknown kind', { code: 'BAD_KIND' })
  const u = ctx.initData.user
  await touchUser(u)
  await logSession(u.id, input.kind, Math.max(0, Math.min(600, Number(input.minutes) || 0)))
  return { ok: true }
}
