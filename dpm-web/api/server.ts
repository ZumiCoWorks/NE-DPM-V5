import 'dotenv/config'
import express from 'express'
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ name: 'dpm-api', env: process.env.NODE_ENV || 'development' })
})

// Example admin endpoint: list first 5 profiles
app.get('/profiles', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(5)
    if (error) return res.status(500).json({ error })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

const PORT = process.env.PORT || 5176
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})