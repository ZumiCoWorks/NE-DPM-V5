import fetch from 'node-fetch'

const API = process.env.API_URL || 'http://localhost:3002/api'

async function check(path, opts = {}) {
  const url = `${API}${path}`
  const res = await fetch(url, { ...opts })
  const text = await res.text()
  const ok = res.ok
  console.log(`${ok ? 'OK' : 'FAIL'} ${path} ${res.status}`)
  if (!ok) console.log(text)
  return ok
}

async function main() {
  await check('/health')
  await check('/dashboard/stats', { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN || ''}` } })
  await check('/events', { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN || ''}` } })
  await check('/venues', { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN || ''}` } })
}

main().catch(err => {
  console.error('Smoke test error:', err)
  process.exit(1)
})
