export const API_SPORTS_KEY = '25ec321febd869f280179a40232674e7';
export const RAPIDAPI_KEY = '7dd9989aa7mshb92a76c5f12079ap1647a6jsn59bbe08e126e';
export const SUPABASE_URL = 'https://pjbjhuoujsfubqlfjlmg.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_UlxUc-dTLG4QWlNHdrDv_g_s4K3W1PB';

// Calcul automatique des saisons selon la date
function getCurrentSeasons() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Football européen : saison commence en août
  // Août-décembre → saison = année en cours
  // Janvier-juillet → saison = année précédente
  const footballSeason = month >= 8 ? year : year - 1;
  const footballLabel = footballSeason + '-' + String(footballSeason + 1).slice(2);

  // NBA/NHL : saison commence en octobre
  // Octobre-décembre → saison = année en cours
  // Janvier-septembre → saison = année précédente
  const nbaSeason = month >= 10 ? year : year - 1;
  const nbaLabel = nbaSeason + '-' + String(nbaSeason + 1).slice(2);

  // NFL : saison commence en septembre
  const nflSeason = month >= 9 ? year : year - 1;
  const nflLabel = nflSeason + '-' + String(nflSeason + 1).slice(2);

  // MLB : saison = année en cours (mars-novembre)
  const mlbSeason = year;
  const mlbLabel = String(year);

  // Coupe du Monde 2026
  const cdmSeason = 2026;

  return {
    seasons: {
      NBA: nbaSeason,
      NHL: nbaSeason,
      MLB: mlbSeason,
      NFL: nflSeason,
      FOOTBALL: footballSeason,
      CdM: cdmSeason,
    },
    labels: {
      NBA: nbaLabel,
      NHL: nbaLabel,
      MLB: mlbLabel,
      NFL: nflLabel,
      FOOTBALL: footballLabel,
      CdM: '2026',
    }
  };
}

const { seasons, labels } = getCurrentSeasons();
export const SEASONS = seasons;
export const SEASON_LABELS = labels;
