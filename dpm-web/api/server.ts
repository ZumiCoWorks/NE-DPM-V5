import 'dotenv/config'
import express from 'express'
import supabase from './lib/supabase'

const app = express()
const port = process.env.PORT || 5174

app.get('/health', (_req, res) => res.json({ ok: true }))

app.get('/version', (_req, res) => {
  res.json({ name: 'dpm-api', env: process.env.NODE_ENV || 'development' })
})

// Example admin endpoint: list first 5 profiles
app.get('/profiles', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(5)
    if (error) return res.status(500).json({ error })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${port}`)
})
