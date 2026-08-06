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
    const body = await req.json()
    const { email, password, cedula, nombre, rol, categoria_voluntariado, especialidad, area_voluntariado, activo } = body

    if (!email || !password || !cedula || !nombre || !rol) {
      return new Response(JSON.stringify({ error: 'Faltan datos obligatorios' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Validar que quien llama es director o administrador
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
    if (perfil?.rol !== 'director' && perfil?.rol !== 'administrador') {
      return new Response(JSON.stringify({ error: 'Solo el director o administrador puede crear usuarios' }), { status: 403, headers: corsHeaders })
    }

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        cedula,
        nombre,
        rol,
        categoria_voluntariado: categoria_voluntariado ?? null,
        especialidad: especialidad ?? '',
        area_voluntariado: area_voluntariado ?? '',
      },
    })
    if (createError || !newUser?.user?.id) {
      return new Response(JSON.stringify({ error: createError?.message ?? 'No se pudo crear el usuario' }), { status: 500, headers: corsHeaders })
    }

    const userId = newUser.user.id
    const { error: updateProfileError } = await supabase
      .from('perfiles')
      .update({
        rol,
        activo: activo ?? true,
        categoria_voluntariado: categoria_voluntariado ?? null,
        especialidad: especialidad ?? '',
        area_voluntariado: area_voluntariado ?? '',
      })
      .eq('id', userId)

    if (updateProfileError) {
      return new Response(JSON.stringify({ error: updateProfileError.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true, userId }), { status: 200, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})