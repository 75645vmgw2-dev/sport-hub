// supabase/functions/check-live-matches/index.ts
// Edge Function — vérifie les matchs en cours et envoie des notifs aux utilisateurs
// dont une équipe favorite joue actuellement.
// Déclenchée toutes les 5 minutes via pg_cron dans Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const API_SPORTS_KEY = Deno.env.get('API_SPORTS_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Traductions des messages de notif ──────────────────────────
const NOTIF_TRANSLATIONS: Record<string, { title: string; body: (team: string) => string }> = {
  fr: { title: '🔔 Match en direct !', body: (team) => `${team} vient de débuter son match. Suis le en direct !` },
  en: { title: '🔔 Live Match!', body: (team) => `${team} just kicked off. Watch it live!` },
  es: { title: '🔔 ¡Partido en vivo!', body: (team) => `${team} acaba de comenzar su partido. ¡Síguelo en vivo!` },
  pt: { title: '🔔 Jogo ao vivo!', body: (team) => `${team} acabou de começar. Acompanhe ao vivo!` },
  de: { title: '🔔 Live-Spiel!', body: (team) => `${team} hat gerade begonnen. Schau es dir live an!` },
  it: { title: '🔔 Partita in diretta!', body: (team) => `${team} ha appena iniziato. Seguila in diretta!` },
  ar: { title: '🔔 مباراة مباشرة!', body: (team) => `بدأت مباراة ${team} للتو. تابعها مباشرة!` },
  ru: { title: '🔔 Прямой эфир!', body: (team) => `Матч ${team} только что начался. Смотри вживую!` },
};

// ── Endpoints api-sports.io par sport ─────────────────────────
const SPORT_ENDPOINTS: Record<string, { url: string; host: string; teamPath: string }> = {
  basketball: {
    url: 'https://v2.nba.api-sports.io/games?live=all',
    host: 'v2.nba.api-sports.io',
    teamPath: 'teams',
  },
  hockey: {
    url: 'https://v1.hockey.api-sports.io/games?live=all',
    host: 'v1.hockey.api-sports.io',
    teamPath: 'teams',
  },
  baseball: {
    url: 'https://v1.baseball.api-sports.io/games?live=all',
    host: 'v1.baseball.api-sports.io',
    teamPath: 'teams',
  },
  nfl: {
    url: 'https://v1.american-football.api-sports.io/games?live=all',
    host: 'v1.american-football.api-sports.io',
    teamPath: 'teams',
  },
  soccer: {
    url: 'https://v3.football.api-sports.io/fixtures?live=all',
    host: 'v3.football.api-sports.io',
    teamPath: 'teams',
  },
  f1: {
    url: 'https://v1.formula-1.api-sports.io/races?live=all',
    host: 'v1.formula-1.api-sports.io',
    teamPath: 'circuit',
  },
  golf: {
    url: 'https://v1.golf.api-sports.io/tournaments?live=all',
    host: 'v1.golf.api-sports.io',
    teamPath: 'tournament',
  },
  mma: {
    url: 'https://v1.mma.api-sports.io/fights?live=all',
    host: 'v1.mma.api-sports.io',
    teamPath: 'fighters',
  },
};

// ── Récupère les équipes en cours pour un sport ────────────────
async function getLiveTeamsForSport(sport: string): Promise<string[]> {
  const endpoint = SPORT_ENDPOINTS[sport];
  if (!endpoint) return [];

  try {
    const res = await fetch(endpoint.url, {
      headers: {
        'x-rapidapi-key': API_SPORTS_KEY,
        'x-rapidapi-host': endpoint.host,
      },
    });
    const data = await res.json();
    const games = data.response || [];
    const teams: string[] = [];

    for (const game of games) {
      // NBA / NHL / MLB / NFL
      if (game.teams?.home?.name) teams.push(game.teams.home.name);
      if (game.teams?.away?.name) teams.push(game.teams.away.name);
      // Soccer
      if (game.teams?.home?.name) teams.push(game.teams.home.name);
      if (game.teams?.away?.name) teams.push(game.teams.away.name);
      // F1 — circuit
      if (game.circuit?.name) teams.push(game.circuit.name);
      // Golf — tournament
      if (game.tournament?.name) teams.push(game.tournament.name);
      // MMA — fighters
      if (game.fighters?.first?.name) teams.push(game.fighters.first.name);
      if (game.fighters?.second?.name) teams.push(game.fighters.second.name);
    }

    return [...new Set(teams)]; // déduplique
  } catch (e) {
    console.log(`Erreur fetch ${sport}:`, e);
    return [];
  }
}

// ── Envoie les notifications Expo en batch ─────────────────────
async function sendExpoPushNotifications(messages: object[]) {
  const batches = [];
  for (let i = 0; i < messages.length; i += 100) {
    batches.push(messages.slice(i, i + 100));
  }
  for (const batch of batches) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(batch),
    });
  }
}

// ── Handler principal ──────────────────────────────────────────
Deno.serve(async () => {
  try {
    console.log('🔍 check-live-matches démarré');

    // 1. Récupère tous les favoris avec leur token push
    const { data: favoritesWithTokens, error: favError } = await supabase
      .from('favorites')
      .select(`
        user_id,
        team_name,
        sport,
        push_tokens!inner(token, language)
      `);

    if (favError || !favoritesWithTokens || favoritesWithTokens.length === 0) {
      console.log('Aucun favori avec token push trouvé');
      return new Response('OK - aucun favori', { status: 200 });
    }

    // 2. Récupère les matchs en direct pour chaque sport unique
    const sports = [...new Set(favoritesWithTokens.map((f: any) => f.sport))];
    const liveTeamsBySport: Record<string, string[]> = {};

    await Promise.all(
      sports.map(async (sport: string) => {
        liveTeamsBySport[sport] = await getLiveTeamsForSport(sport);
        console.log(`${sport}: ${liveTeamsBySport[sport].length} équipes en live`);
      })
    );

    // 3. Vérifie quelles notifs ont déjà été envoyées aujourd'hui
    const today = new Date().toISOString().slice(0, 10);
    const { data: alreadySent } = await supabase
      .from('notif_sent_log')
      .select('user_id, team_name')
      .eq('date', today);

    const sentKeys = new Set(
      (alreadySent || []).map((r: any) => `${r.user_id}__${r.team_name}`)
    );

    // 4. Prépare les messages à envoyer
    const messages: object[] = [];
    const logsToInsert: object[] = [];

    for (const fav of favoritesWithTokens as any[]) {
      const liveTeams = liveTeamsBySport[fav.sport] || [];
      const isLive = liveTeams.some((t: string) =>
        t.toLowerCase().includes(fav.team_name.toLowerCase()) ||
        fav.team_name.toLowerCase().includes(t.toLowerCase())
      );

      if (!isLive) continue;

      const key = `${fav.user_id}__${fav.team_name}`;
      if (sentKeys.has(key)) continue; // déjà envoyé aujourd'hui

      const tokens = Array.isArray(fav.push_tokens) ? fav.push_tokens : [fav.push_tokens];

      for (const tokenRow of tokens) {
        const lang = tokenRow.language || 'fr';
        const translation = NOTIF_TRANSLATIONS[lang] || NOTIF_TRANSLATIONS['fr'];

        messages.push({
          to: tokenRow.token,
          sound: 'default',
          title: translation.title,
          body: translation.body(fav.team_name),
          data: { type: 'live_match', team: fav.team_name, sport: fav.sport },
        });
      }

      logsToInsert.push({
        user_id: fav.user_id,
        team_name: fav.team_name,
        sport: fav.sport,
        date: today,
      });
    }

    // 5. Envoie les notifs
    if (messages.length > 0) {
      await sendExpoPushNotifications(messages);
      console.log(`✅ ${messages.length} notifications envoyées`);
    } else {
      console.log('Aucune nouvelle notif à envoyer');
    }

    // 6. Log pour éviter les doublons
    if (logsToInsert.length > 0) {
      await supabase.from('notif_sent_log').insert(logsToInsert);
    }

    return new Response(
      JSON.stringify({ sent: messages.length, checked: sports.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('Erreur check-live-matches:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
