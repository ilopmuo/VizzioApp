import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, full_name, password } = req.body

  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return res.status(400).json({ error: error.message })

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: data.user.id,
    full_name,
    role: 'empleado',
  })

  if (profileError) return res.status(400).json({ error: profileError.message })

  return res.status(200).json({ success: true })
}
