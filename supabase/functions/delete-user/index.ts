import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Validar que quien llama es un director
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: corsHeaders })
    }
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    if (perfil?.rol !== 'director') {
      return new Response(JSON.stringify({ error: 'Solo el director puede eliminar usuarios' }), { status: 403, headers: corsHeaders })
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      return new Response(JSON.stringify({ error: deleteAuthError.message }), { status: 500, headers: corsHeaders })
    }

    const { error: deleteProfileError } = await supabase
      .from('perfiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      return new Response(JSON.stringify({ error: deleteProfileError.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})