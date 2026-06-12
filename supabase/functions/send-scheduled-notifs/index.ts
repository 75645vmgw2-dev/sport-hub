import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  try {
    const now = new Date().toISOString()

    const { data: notifs, error } = await supabase
      .from('notif_scheduled')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_at', now)

    if (error) throw error
    if (!notifs || notifs.length === 0) {
      return new Response(JSON.stringify({ message: 'Aucune notif a envoyer' }), { status: 200 })
    }

    for (const notif of notifs) {
      let query = supabase.from('push_tokens').select('token, language')
      if (notif.lang_filter && notif.lang_filter.length > 0) {
        query = query.in('language', notif.lang_filter)
      }
      if (notif.sport_filter && notif.sport_filter.length > 0) {
        query = query.overlaps('sports_interests', notif.sport_filter)
      }
      const { data: tokens } = await query

      if (!tokens || tokens.length === 0) {
        await supabase.from('notif_scheduled').update({ sent: true, sent_at: now }).eq('id', notif.id)
        continue
      }

      const messages = tokens.map((t: any) => {
        const lang = t.language || 'fr'
        const titre = notif['titre_' + lang] || notif.titre
        const corps = notif['corps_' + lang] || notif.corps
        return {
          to: t.token,
          sound: 'default',
          title: titre,
          body: corps,
          data: { type: 'kazmo_scheduled' }
        }
      })

      let sent = 0
      for (let i = 0; i < messages.length; i += 100) {
        const batch = messages.slice(i, i + 100)
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(batch)
        })
        sent += batch.length
      }

      await supabase.from('notif_scheduled').update({ sent: true, sent_at: now }).eq('id', notif.id)
      await supabase.from('notif_sent_log').insert({
        titre: notif.titre,
        corps: notif.corps,
        lang_filter: notif.lang_filter,
        sport_filter: notif.sport_filter,
        sent_count: sent,
        sent_at: now,
      })
    }

    return new Response(JSON.stringify({ message: 'OK', processed: notifs.length }), { status: 200 })

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
