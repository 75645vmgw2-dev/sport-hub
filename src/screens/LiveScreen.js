import F1Screen from "./F1Screen";
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import MatchDetailScreen from './MatchDetailScreen';
import { useLanguage } from '../i18n/LanguageContext';

const H_NBA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };
const H_NHL = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.hockey.api-sports.io' };
const H_MLB = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.baseball.api-sports.io' };
const H_FOOT = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };
const H_MMA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.mma.api-sports.io' };
const H_F1 = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.formula-1.api-sports.io' };
const H_GOLF = { 'x-rapidapi-key': RAPIDAPI_GOLF_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' };

const FOOTBALL_LEAGUES = [1,2,3,39,40,45,61,62,66,78,79,81,135,136,140,141,143,253,848];
const LANG_LOCALE = {
  fr:'fr-FR', en:'en-US', es:'es-ES', pt:'pt-BR',
  de:'de-DE', it:'it-IT', ar:'ar-SA', ru:'ru-RU',
};

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function isNBALive(status) { return ['2','Q1','Q2','Q3','Q4','HT','OT','BT'].indexOf(String(status)) >= 0; }
function isNBAFinished(status) { return String(status) === '3' || String(status) === 'FT'; }
function isMLBLive(status) {
  if (!status) return false;
  if (status.startsWith('IN') && status !== 'INT') return true;
  return status === 'HT';
}
function isMLBFinished(status, statusLong) { return statusLong === 'Finished' || status === 'FT'; }

function getLiveTime(g) {
  if (!g.isLive) return null;
  const sport = g.sportKey;
  if (sport === 'NBA') {
    const q = g.status;
    if (q === 'HT') return 'HT';
    if (q === 'OT') return 'OT';
    if (q === 'BT') return 'BT';
    if (g.clock) return q + ' ' + g.clock;
    return q;
  }
  if (sport === 'NHL') {
    const p = g.status;
    if (p === 'OT') return 'OT';
    if (p === 'BT') return 'BT';
    if (g.clock) return p + ' ' + g.clock;
    return p;
  }
  if (sport === 'MLB') {
    const inning = g.inning;
    const half = g.inningHalf;
    if (inning) return (half==='top'?'▲':'▼') + ' Inn.' + inning;
    return g.status;
  }
  if (sport === 'FOOTBALL') {
    if (g.elapsed) return g.elapsed + "'";
    if (g.status === 'HT') return 'HT';
    if (g.status === 'ET') return 'ET';
    return g.status;
  }
  if (sport === 'F1') return 'LIVE';
  if (sport === 'GOLF') return 'LIVE';
  if (sport === 'MMA') {
    if (g.round) return 'R' + g.round;
    return 'LIVE';
  }
  return g.status || 'LIVE';
}

const SPORT_FILTERS = [
  { id:'all', icon:'🌐', labelKey:'sports' },
  { id:'NBA', icon:'🏀', label:'NBA' },
  { id:'NHL', icon:'🏒', label:'NHL' },
  { id:'MLB', icon:'⚾', label:'MLB' },
  { id:'NFL', icon:'🏈', label:'NFL' },
  { id:'FOOTBALL', icon:'⚽', label:'Football' },
  { id:'GOLF', icon:'⛳', label:'Golf' },
  { id:'F1', icon:'🏎', label:'F1' },
  { id:'MMA', icon:'🤼', label:'MMA' },
];

function sortGames(list) {
  return list.sort(function(a,b) {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    if (!a.isFinished && b.isFinished) return -1;
    if (a.isFinished && !b.isFinished) return 1;
    return new Date(a.date) - new Date(b.date);
  });
}

// Carte Golf — cliquable vers MatchDetailScreen
function GolfTournamentCard({ g, t, onPress }) {
  return (
    <TouchableOpacity style={[styles.card, g.isLive && { borderColor:'#2E7D32', borderWidth:1 }]} activeOpacity={0.8} onPress={() => onPress(g)}>
      <View style={styles.cardHeader}>
        <View style={[styles.sportBadge, { backgroundColor:'#2E7D32' }]}>
          <Text style={styles.sportBadgeText}>⛳ GOLF</Text>
        </View>
        <Text style={styles.leagueText}>{g.tournamentName}</Text>
        {g.isLive && <View style={styles.liveBadge}><Text style={styles.liveLabel}>● LIVE</Text></View>}
        {g.isFinished && <Text style={styles.finishedLabel}>{t('terminated')}</Text>}
        <Text style={styles.tapHint}>{t('seeDetails')} →</Text>
      </View>
      <View style={styles.leaderboardContainer}>
        {(g.players||[]).map(function(p, i) {
          return (
            <View key={i} style={styles.leaderboardRow}>
              <Text style={styles.leaderboardRank}>#{i+1}</Text>
              <Text style={styles.leaderboardName} numberOfLines={1}>{p.name}</Text>
              <Text style={[styles.leaderboardScore, {color: p.score && p.score.startsWith('-') ? '#4CAF50' : p.score === 'E' ? '#fff' : '#E53935'}]}>{p.score||'E'}</Text>
              {p.thru ? <Text style={styles.leaderboardThru}>T.{p.thru}</Text> : null}
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

// Carte F1
function F1RaceCard({ g, t, onPress }) {
  return (
    <TouchableOpacity style={[styles.card, g.isLive && { borderColor:'#E10600', borderWidth:1 }]} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={[styles.sportBadge, { backgroundColor:'#E10600' }]}>
          <Text style={styles.sportBadgeText}>🏎 F1</Text>
        </View>
        <Text style={styles.leagueText}>{g.raceName}</Text>
        {g.isLive && <View style={styles.liveBadge}><Text style={styles.liveLabel}>● LIVE</Text></View>}
        {g.isFinished && <Text style={styles.finishedLabel}>{t('terminated')}</Text>}
        {!g.isLive && !g.isFinished && g.date && <Text style={styles.upcomingDate}>{new Date(g.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</Text>}
      </View>
      <View style={styles.f1RaceInfo}>
        <Text style={styles.f1Circuit}>🏁 {g.circuit}</Text>
        <Text style={styles.f1Country}>📍 {g.country}</Text>
      </View>
      {(g.topDrivers||[]).length > 0 && (
        <View style={styles.leaderboardContainer}>
          {g.topDrivers.map(function(d, i) {
            return (
              <View key={i} style={styles.leaderboardRow}>
                <Text style={styles.leaderboardRank}>#{i+1}</Text>
                <Text style={styles.leaderboardName} numberOfLines={1}>{d.name}</Text>
                <Text style={styles.leaderboardScore}>{d.team||''}</Text>
                {d.gap ? <Text style={styles.leaderboardThru}>{d.gap}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

function GameCard({ g, onPress, onSelectSport, t, locale }) {
  const liveTime = getLiveTime(g);
  if (g.sportKey === 'GOLF') return <GolfTournamentCard g={g} t={t} onPress={onPress} />;
  if (g.sportKey === 'F1') return <F1RaceCard g={g} t={t} onPress={()=>onPress(g)} />;
  function handlePress() {
    if (g.sportKey === 'MMA' && onSelectSport) { onSelectSport({ id:'mma' }); }
    else { onPress(g); }
  }
  return (
    <TouchableOpacity style={[styles.card, g.isLive && { borderColor: g.color, borderWidth:1 }]} activeOpacity={0.8} onPress={handlePress}>
      <View style={styles.cardHeader}>
        <View style={[styles.sportBadge, { backgroundColor: g.color }]}>
          <Text style={styles.sportBadgeText}>{g.icon} {g.sport}</Text>
        </View>
        {g.league ? <Text style={styles.leagueText}>{g.league}</Text> : null}
        {g.isLive && <View style={styles.liveBadge}><Text style={styles.liveLabel}>● LIVE</Text></View>}
        {g.isLive && liveTime && (
          <View style={[styles.timeBadge, { backgroundColor: g.color+'33', borderColor: g.color+'66' }]}>
            <Text style={[styles.timeLabel, { color: g.color }]}>{liveTime}</Text>
          </View>
        )}
        {g.isFinished && <Text style={styles.finishedLabel}>{t('terminated')}</Text>}
        {!g.isLive && !g.isFinished && g.date && (
          <Text style={styles.upcomingDate}>{new Date(g.date).toLocaleTimeString(locale, {hour:'2-digit', minute:'2-digit'})}</Text>
        )}
        <Text style={styles.tapHint}>{t('seeDetails')} →</Text>
      </View>
      <View style={styles.matchRow}>
        <View style={styles.teamLeft}>
          {g.homeLogo ? <Image source={{ uri: g.homeLogo }} style={styles.logo} onError={function(){}} /> : null}
          <Text style={styles.teamName} numberOfLines={1}>{g.home}</Text>
        </View>
        <View style={styles.scoreCenter}>
          {g.isLive || g.isFinished ? (
            <Text style={[styles.scoreText, g.isLive && { color:'#ff1744' }]}>
              {g.sportKey === 'MMA' ? (g.winner ? '🏆 '+g.winner : t('terminated')) :
              String(g.homeScore||0) + ' - ' + String(g.awayScore||0)}
            </Text>
          ) : (
            <Text style={styles.vsText}>VS</Text>
          )}
        </View>
        <View style={styles.teamRight}>
          <Text style={styles.teamName} numberOfLines={1}>{g.away}</Text>
          {g.awayLogo ? <Image source={{ uri: g.awayLogo }} style={styles.logo} onError={function(){}} /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LiveScreen({ onSelectSport }) {
  const { t, language } = useLanguage();
  const locale = LANG_LOCALE[language] || 'en-US';
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showF1, setShowF1] = useState(false);
  const [sportFilter, setSportFilter] = useState('all');

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0,10);
  const today = now.toISOString().slice(0,10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0,10);
  const year = now.getFullYear();

  async function fetchFastSports() {
    let results = [];

    // NBA — aujourd'hui + demain
    try {
      const [r1, r2] = await Promise.all([
        fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&date='+today, { headers:H_NBA }),
        fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&date='+tomorrow, { headers:H_NBA }),
      ]);
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
      const seen = {};
      [...(d1.response||[]), ...(d2.response||[])].forEach(function(g) {
        if (seen[g.id]) return; seen[g.id] = true;
        results.push({ id:'nba-'+g.id, sport:'NBA', icon:'🏀', color:'#1D428A', sportKey:'NBA', home:g.teams.home.name, homeLogo:g.teams.home.logo, away:g.teams.visitors.name, awayLogo:g.teams.visitors.logo, homeScore:g.scores.home.points, awayScore:g.scores.visitors.points, homeId:g.teams.home.id, awayId:g.teams.visitors.id, status:g.status.short, clock:g.status.clock||null, isLive:isNBALive(g.status.short), isFinished:isNBAFinished(g.status.short), date:g.date.start });
      });
    } catch(e) {}

    // NHL — hier + aujourd'hui + demain (finales peuvent être n'importe quel jour)
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&date='+yesterday, { headers:H_NHL }),
        fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&date='+today, { headers:H_NHL }),
        fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&date='+tomorrow, { headers:H_NHL }),
      ]);
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      const seen = {};
      [...(d1.response||[]), ...(d2.response||[]), ...(d3.response||[])].forEach(function(g) {
        if (seen[g.id]) return; seen[g.id] = true;
        results.push({ id:'nhl-'+g.id, sport:'NHL', icon:'🏒', color:'#00B8D9', sportKey:'NHL', home:g.teams.home.name, homeLogo:g.teams.home.logo, away:g.teams.away.name, awayLogo:g.teams.away.logo, homeScore:g.scores.home, awayScore:g.scores.away, homeId:g.teams.home.id, awayId:g.teams.away.id, status:g.status.short, clock:g.status.clock||null, isLive:['P1','P2','P3','OT','BT'].indexOf(g.status.short)>=0, isFinished:['Finished','After Over Time','After Penalties'].indexOf(g.status.long)>=0, date:g.date });
      });
    } catch(e) {}

    // MLB — aujourd'hui seulement
    try {
      const res = await fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&date='+today, { headers:H_MLB });
      const data = await res.json();
      (data.response||[]).forEach(function(g) {
        results.push({ id:'mlb-'+g.id, sport:'MLB', icon:'⚾', color:'#E53935', sportKey:'MLB', home:g.teams.home.name, homeLogo:g.teams.home.logo, away:g.teams.away.name, awayLogo:g.teams.away.logo, homeScore:g.scores.home.total, awayScore:g.scores.away.total, homeId:g.teams.home.id, awayId:g.teams.away.id, status:g.status.short, inning:g.status.inning||null, inningHalf:g.status.inning_hi||null, isLive:isMLBLive(g.status.short), isFinished:isMLBFinished(g.status.short, g.status.long), date:g.date });
      });
    } catch(e) {}

    // Football — today + tomorrow pour couvrir décalage UTC/Las Vegas
    try {
      const [r1, r2] = await Promise.all([
        fetch('https://v3.football.api-sports.io/fixtures?date='+today, { headers:H_FOOT }),
        fetch('https://v3.football.api-sports.io/fixtures?date='+tomorrow, { headers:H_FOOT }),
      ]);
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
      const allFixtures = [...(d1.response||[]), ...(d2.response||[])];
      const liveStatuses = ['1H','2H','HT','ET','P','BT'];
      const finishedStatuses = ['FT','AET','PEN'];
      const seen = {};
      allFixtures.forEach(function(f) {
        if (FOOTBALL_LEAGUES.indexOf(f.league.id) < 0) return; if (seen[f.fixture.id]) return; seen[f.fixture.id] = true;
        results.push({ id:'foot-'+f.fixture.id, sport:'FOOT', icon:'⚽', color:'#4CAF50', sportKey:'FOOTBALL', league:f.league.name, home:f.teams.home.name, homeLogo:f.teams.home.logo, away:f.teams.away.name, awayLogo:f.teams.away.logo, homeScore:f.goals.home, awayScore:f.goals.away, homeId:f.teams.home.id, awayId:f.teams.away.id, status:f.fixture.status.short, elapsed:f.fixture.status.elapsed||null, isLive:liveStatuses.indexOf(f.fixture.status.short)>=0, isFinished:finishedStatuses.indexOf(f.fixture.status.short)>=0, date:f.fixture.date, fixtureId:f.fixture.id });
      });
    } catch(e) {}

    // MMA
    try {
      const res = await fetch('https://v1.mma.api-sports.io/fights?date='+today, { headers:H_MMA });
      const data = await res.json();
      (data.response||[]).forEach(function(f) {
        const isLive = f.status?.short==='LIVE';
        const isFinished = f.status?.short==='FT'||f.status?.long==='Finished';
        const winner = f.fighters?.first?.winner ? f.fighters?.first?.name : f.fighters?.second?.winner ? f.fighters?.second?.name : null;
        results.push({ id:'mma-'+f.id, sport:'MMA', icon:'🤼', color:'#9C27B0', sportKey:'MMA', league:f.category||'MMA', home:f.fighters?.first?.name||'Fighter 1', homeLogo:f.fighters?.first?.logo||null, away:f.fighters?.second?.name||'Fighter 2', awayLogo:f.fighters?.second?.logo||null, winner:winner, status:f.status?.short||'', round:f.round||null, isLive, isFinished, date:f.date });
      });
    } catch(e) {}

    return results;
  }

  async function fetchSlowSports() {
    let results = [];

    // GOLF — carte tournoi avec top 5 + données joueurs pour MatchDetailScreen
    try {
      const schedRes = await fetch('https://live-golf-data.p.rapidapi.com/schedule?orgId=1&year='+year, { headers:H_GOLF });
      const schedData = await schedRes.json();
      const nowTs = now.getTime();
      const currentTourn = (schedData.schedule||[]).find(function(t) {
        if (!t.date) return false;
        const start = t.date.start && t.date.start['$date'] ? Number(t.date.start['$date']['$numberLong']) : new Date(t.date.start).getTime();
        const end = t.date.end && t.date.end['$date'] ? Number(t.date.end['$date']['$numberLong']) : new Date(t.date.end).getTime();
        return start <= nowTs && (end + 86400000) >= nowTs;
      });
      if (currentTourn) {
        const lbRes = await fetch('https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId='+currentTourn.tournId+'&year='+year, { headers:H_GOLF });
        const lbData = await lbRes.json();
        const rows = lbData.leaderboardRows||lbData.leaderboard?.players||lbData.players||[];
        const top5 = rows.slice(0,5).map(function(p) {
          const name = p.player_name||p.playerName||((p.firstName||'')+' '+(p.lastName||'')).trim()||'?';
          const score = p.total||p.score||null;
          const thru = p.thru ? String(p.thru) : null;
          const playerId = p.playerId||p.player_id||null;
          return { name, score, thru, playerId };
        });
        if (top5.length > 0) {
          results.push({
            id: 'golf-tournament',
            sport: 'GOLF', icon: '⛳', color: '#2E7D32', sportKey: 'GOLF',
            tournamentName: currentTourn.name||'Golf PGA Tour',
            tournId: currentTourn.tournId,
            players: top5,
            allPlayers: rows.slice(0,20).map(function(p) {
              return { name: p.player_name||p.playerName||((p.firstName||'')+' '+(p.lastName||'')).trim()||'?', score: p.total||p.score||null, thru: p.thru ? String(p.thru) : null, playerId: p.playerId||p.player_id||null };
            }),
            home: currentTourn.name||'Golf PGA Tour',
            away: '',
            homeLogo: null, awayLogo: null,
            homeId: null, awayId: null,
            homeScore: null, awayScore: null,
            isLive: true, isFinished: false, date: today,
          });
        } else if (currentTourn) {
          const startTs = currentTourn.date?.start?.['$date'] ? Number(currentTourn.date.start['$date']['$numberLong']) : null;
          const startDate = startTs ? new Date(startTs).toISOString() : today+'T00:00:00Z';
          results.push({
            id: 'golf-tournament',
            sport: 'GOLF', icon: '⛳', color: '#2E7D32', sportKey: 'GOLF',
            tournamentName: currentTourn.name||'Golf PGA Tour',
            tournId: currentTourn.tournId,
            players: [], allPlayers: [],
            home: currentTourn.name||'Golf PGA Tour',
            away: '', homeLogo: null, awayLogo: null,
            homeId: null, awayId: null, homeScore: null, awayScore: null,
            isLive: false, isFinished: false, date: startDate,
          });
        }
      }
    } catch(e) {}

    // F1
    try {
      const res = await fetch('https://v1.formula-1.api-sports.io/races?season=2026&type=Race', { headers:H_F1 });
      const data = await res.json();
      const todayRaces = (data.response||[]).filter(function(r) {
        if (!r.date) return false;
        return r.date.slice(0,10) === today || r.status === 'Live';
      });
      for (const r of todayRaces) {
        const isLive = r.status === 'Live';
        const isFinished = r.status === 'Completed';
        let topDrivers = [];
        if (isLive || isFinished) {
          try {
            const lbRes = await fetch('https://v1.formula-1.api-sports.io/rankings/races?race='+r.id, { headers:H_F1 });
            const lbData = await lbRes.json();
            topDrivers = (lbData.response||[]).slice(0,5).map(function(d) {
              return { name: d.driver?.name||'', team: d.team?.name||'', gap: d.time?.behind||null };
            });
          } catch(e) {}
        }
        results.push({
          id: 'f1-'+r.id, sport: 'F1', icon: '🏎', color: '#E10600', sportKey: 'F1',
          raceName: r.competition?.name||'Formula 1',
          circuit: r.circuit?.name||'', country: r.competition?.location?.country||'',
          topDrivers, isLive, isFinished, date: r.date,
        });
      }
    } catch(e) {}

    return results;
  }

  const fetchAll = useCallback(async function() {
    try {
      const fastGames = await fetchFastSports();
      setGames(sortGames([...fastGames]));
      setLoading(false);
      const slowGames = await fetchSlowSports();
      if (slowGames.length > 0) {
        setGames(function(prev) {
          const existing = prev.filter(function(g) { return g.sportKey !== 'GOLF' && g.sportKey !== 'F1'; });
          return sortGames([...existing, ...slowGames]);
        });
      }
    } catch(e) { console.error(e); setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Adapter le golf pour MatchDetailScreen
  function handleGamePress(g) {
    if (g.sportKey === 'F1') {
      setShowF1(true);
      return;
    }
    if (g.sportKey === 'GOLF') {
      setSelectedGame({
        ...g,
        home: g.tournamentName || 'Golf PGA Tour',
        away: '',
        sport: 'GOLF',
        sportKey: 'GOLF',
      });
    } else {
      setSelectedGame(g);
    }
  }

  if (showF1) {
    return (
      <View style={{flex:1}}>
        <F1Screen onBack={()=>setShowF1(false)} />
        <TouchableOpacity onPress={()=>setShowF1(false)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← {t('allMatches')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (selectedGame) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedGame} sport={selectedGame.sportKey} color={selectedGame.color} onBack={() => setSelectedGame(null)} />
        <TouchableOpacity onPress={() => setSelectedGame(null)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← {t('allMatches')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredGames = sportFilter === 'all' ? games : games.filter(function(g) { return g.sportKey === sportFilter; });
  const liveGames = filteredGames.filter(function(g) { return g.isLive; });
  const upcomingGames = filteredGames.filter(function(g) { return !g.isLive && !g.isFinished; });
  const now24h = new Date(Date.now() - 24*3600000);
  const finishedGames = filteredGames.filter(function(g) { return g.isFinished && (!g.date || new Date(g.date) >= now24h); });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.titleWhite}>{t('today')} </Text>
          <GradientText text={new Date().toLocaleDateString(locale, {day:'numeric', month:'long'})} fontSize={22} letterSpacing={1} />
        </View>
        <View style={styles.badges}>
          {liveGames.length > 0 && (
            <View style={styles.liveBadgeCount}>
              <Text style={styles.liveBadgeCountText}>● {liveGames.length} LIVE</Text>
            </View>
          )}
          {filteredGames.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredGames.length}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersRow}>
          {SPORT_FILTERS.map(function(f) {
            const active = sportFilter === f.id;
            const label = f.label || (f.id === 'all' ? t('sports') : f.id);
            return (
              <TouchableOpacity key={f.id} style={[styles.filterBtn, active && styles.filterBtnActive]} onPress={() => setSportFilter(f.id)}>
                <Text style={styles.filterIcon}>{f.icon}</Text>
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#FF6B2B" size="large" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {liveGames.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionLabelLive}>{t('inProgress')} ({liveGames.length})</Text>
              </View>
              {liveGames.map(function(g) { return <GameCard key={g.id} g={g} onPress={handleGamePress} onSelectSport={onSelectSport} t={t} locale={locale} />; })}
            </>
          )}
          {upcomingGames.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color:'#FFD700' }]}>{t('upcoming')} ({upcomingGames.length})</Text>
              {upcomingGames.map(function(g) { return <GameCard key={g.id} g={g} onPress={handleGamePress} onSelectSport={onSelectSport} t={t} locale={locale} />; })}
            </>
          )}
          {finishedGames.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color:'#ffffff55' }]}>{t('finished')} ({finishedGames.length})</Text>
              {finishedGames.map(function(g) { return <GameCard key={g.id} g={g} onPress={handleGamePress} onSelectSport={onSelectSport} t={t} locale={locale} />; })}
            </>
          )}
          {filteredGames.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('liveNoMatch')}</Text>
              {sportFilter !== 'all' && (
                <TouchableOpacity onPress={() => setSportFilter('all')} style={styles.resetFilterBtn}>
                  <Text style={styles.resetFilterText}>{t('liveSeeAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  titleRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:20, paddingBottom:10 },
  titleLeft: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  badges: { flexDirection:'row', alignItems:'center', gap:6 },
  liveBadgeCount: { backgroundColor:'#ff174422', borderRadius:8, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:'#ff174444' },
  liveBadgeCountText: { color:'#ff1744', fontSize:10, fontWeight:'700' },
  countBadge: { backgroundColor:'#ffffff14', borderRadius:10, paddingHorizontal:8, paddingVertical:2 },
  countBadgeText: { color:'#fff', fontSize:11, fontWeight:'700' },
  filtersScroll: { maxHeight:48, marginHorizontal:16, marginBottom:8 },
  filtersRow: { flexDirection:'row', gap:6, paddingRight:16 },
  filterBtn: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:7, borderRadius:20, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  filterBtnActive: { backgroundColor:'#FF6B2B', borderColor:'#FF6B2B' },
  filterIcon: { fontSize:12 },
  filterLabel: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:11 },
  filterLabelActive: { color:'#fff' },
  sectionHeader: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:8, marginTop:4 },
  liveDot: { width:8, height:8, borderRadius:4, backgroundColor:'#ff1744' },
  sectionLabelLive: { color:'#ff1744', fontFamily:'BebasNeue', fontSize:12, letterSpacing:1.5 },
  sectionLabel: { fontFamily:'BebasNeue', fontSize:12, letterSpacing:1.5, marginBottom:8, marginTop:12 },
  scroll: { padding:16, paddingBottom:40 },
  card: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  cardHeader: { flexDirection:'row', alignItems:'center', marginBottom:10, gap:6, flexWrap:'wrap' },
  sportBadge: { borderRadius:10, paddingHorizontal:8, paddingVertical:2 },
  sportBadgeText: { color:'#fff', fontSize:9, fontWeight:'700' },
  leagueText: { color:'#ffffff66', fontSize:9, fontStyle:'italic' },
  liveBadge: { backgroundColor:'#ff174422', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  liveLabel: { color:'#ff1744', fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  timeBadge: { borderRadius:6, paddingHorizontal:6, paddingVertical:2, borderWidth:1 },
  timeLabel: { fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  finishedLabel: { color:'#ffffff55', fontSize:9 },
  upcomingDate: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  matchRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  teamLeft: { flexDirection:'row', alignItems:'center', gap:6, flex:1 },
  teamRight: { flexDirection:'row', alignItems:'center', gap:6, flex:1, justifyContent:'flex-end' },
  logo: { width:22, height:22, resizeMode:'contain' },
  teamName: { color:'#fff', fontSize:11, fontWeight:'600', flex:1 },
  scoreCenter: { alignItems:'center', paddingHorizontal:8 },
  scoreText: { color:'#fff', fontSize:16, fontFamily:'BebasNeue' },
  vsText: { color:'#FFD700', fontSize:16, fontFamily:'BebasNeue' },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40, gap:8 },
  loadingText: { color:'#ffffffcc', marginTop:10, fontFamily:'BebasNeue', fontSize:14 },
  emptyText: { color:'#ffffff88', fontSize:14, fontFamily:'BebasNeue' },
  resetFilterBtn: { backgroundColor:'#FF6B2B22', borderRadius:10, paddingHorizontal:16, paddingVertical:8, borderWidth:1, borderColor:'#FF6B2B44' },
  resetFilterText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:12 },
  backBtn: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff22', padding:16, alignItems:'center' },
  backBtnText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
  leaderboardContainer: { gap:6, marginTop:4 },
  leaderboardRow: { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:4, borderBottomWidth:1, borderBottomColor:'#ffffff0a' },
  leaderboardRank: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:13, width:28 },
  leaderboardName: { color:'#fff', fontSize:12, fontWeight:'600', flex:1 },
  leaderboardScore: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, minWidth:36, textAlign:'right' },
  leaderboardThru: { color:'#ffffff55', fontSize:10, minWidth:30, textAlign:'right' },
  f1RaceInfo: { flexDirection:'row', gap:12, marginBottom:8 },
  f1Circuit: { color:'#ffffffcc', fontSize:11 },
  f1Country: { color:'#ffffff66', fontSize:11 },
});
