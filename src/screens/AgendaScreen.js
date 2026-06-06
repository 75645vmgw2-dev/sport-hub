import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useLanguage } from '../i18n/LanguageContext';
import { API_SPORTS_KEY, SEASONS, SEASON_LABELS } from '../api/config';
import MatchDetailScreen from './MatchDetailScreen';

const H_FOOT = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };
const H_NBA  = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };
const H_NHL  = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.hockey.api-sports.io' };
const H_MLB  = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.baseball.api-sports.io' };
const H_MMA  = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.mma.api-sports.io' };
const H_F1   = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.formula-1.api-sports.io' };

const FOOTBALL_LEAGUES = [1, 2, 3, 39, 61, 140, 78, 135, 94, 253, 307];

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const SPORT_COLORS = {
  wc:'#006341', foot:'#4CAF50', nba:'#1D428A', nhl:'#00B8D9',
  mlb:'#E53935', mma:'#9C27B0', f1:'#E10600',
};

const SPORT_FILTERS = [
  { id:'all', label:'Tout', icon:'🌐' },
  { id:'nba', label:'NBA', icon:'🏀' },
  { id:'nhl', label:'NHL', icon:'🏒' },
  { id:'mlb', label:'MLB', icon:'⚾' },
  { id:'foot', label:'Football', icon:'⚽' },
  { id:'wc', label:'CdM', icon:'🌍' },
  { id:'f1', label:'F1', icon:'🏎' },
  { id:'mma', label:'MMA', icon:'🤼' },
];

function isNBALive(status) { return ['2','Q1','Q2','Q3','Q4','HT','OT','BT'].indexOf(String(status)) >= 0; }
function isNBAFinished(status) { return String(status) === '3' || String(status) === 'FT'; }
function isMLBLive(status) {
  if (!status) return false;
  if (status.startsWith('IN') && status !== 'INT') return true;
  return status === 'HT';
}
function isMLBFinished(status, statusLong) {
  return statusLong === 'Finished' || status === 'FT';
}

export default function AgendaScreen() {
  const { t } = useLanguage();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [tab, setTab] = useState('24h');
  const [sportFilter, setSportFilter] = useState('all');

  const TABS = [
    { id:'24h', label:'24H' },
    { id:'72h', label:'72H' },
    { id:'7j', label:'7J' },
    { id:'30j', label:'30J' },
    { id:'done', label:'✅ Termines' },
  ];

  useEffect(() => { fetchAllEvents(); }, []);

  function dateRange(days) {
    const now = new Date();
    const dates = [];
    for (let i = 0; i <= days; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      dates.push(d.toISOString().slice(0,10));
    }
    return dates;
  }

  async function fetchAllEvents() {
    setLoading(true);
    try {
      const now = new Date();
      const today = now.toISOString().slice(0,10);
      const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0,10);
      const in30 = new Date(now.getTime() + 30*86400000).toISOString().slice(0,10);
      let events = [];

      // FOOTBALL — ligues premium
      try {
        const res = await fetch(
          'https://v3.football.api-sports.io/fixtures?from=' + yesterday + '&to=' + in30,
          { headers: H_FOOT }
        );
        const data = await res.json();
        const liveStatuses = ['1H','2H','HT','ET','P','BT'];
        const finishedStatuses = ['FT','AET','PEN'];
        (data.response||[]).forEach(function(f) {
          if (FOOTBALL_LEAGUES.indexOf(f.league.id) < 0) return;
          const isWC = f.league.id === 1;
          events.push({
            id: 'foot-' + f.fixture.id,
            sport: isWC ? 'wc' : 'foot',
            icon: isWC ? '🌍' : '⚽',
            competition: f.league.name,
            round: f.league.round,
            home: f.teams.home.name, homeLogo: f.teams.home.logo,
            away: f.teams.away.name, awayLogo: f.teams.away.logo,
            homeId: f.teams.home.id, awayId: f.teams.away.id,
            homeScore: f.goals.home, awayScore: f.goals.away,
            date: f.fixture.date,
            venue: f.fixture.venue?.name, city: f.fixture.venue?.city,
            isLive: liveStatuses.indexOf(f.fixture.status.short) >= 0,
            isFinished: finishedStatuses.indexOf(f.fixture.status.short) >= 0,
            status: f.fixture.status.short,
            fixtureId: f.fixture.id, sportKey:'SOCCER',
          });
        });
      } catch(e) {}

      // NBA
      try {
        const [r1, r2] = await Promise.all([
          fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&from='+yesterday+'&to='+in30, { headers:H_NBA }),
          fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&team=31', { headers:H_NBA }),
        ]);
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        const combined = [...(d1.response||[]), ...(d2.response||[])];
        const seen = {};
        combined.forEach(function(g) {
          if (seen[g.id]) return;
          seen[g.id] = true;
          const d = (g.date?.start||'').slice(0,10);
          if (d < yesterday || d > in30) return;
          events.push({
            id:'nba-'+g.id, sport:'nba', icon:'🏀',
            competition:'NBA 2025-26', round:'',
            home:g.teams.home.name, homeLogo:g.teams.home.logo,
            away:g.teams.visitors.name, awayLogo:g.teams.visitors.logo,
            homeId:g.teams.home.id, awayId:g.teams.visitors.id,
            homeScore:g.scores.home.points, awayScore:g.scores.visitors.points,
            date:g.date?.start, venue:g.arena?.name, city:g.arena?.city,
            isLive:isNBALive(g.status.short),
            isFinished:isNBAFinished(g.status.short),
            status:g.status.short, sportKey:'NBA',
          });
        });
      } catch(e) {}

      // NHL
      try {
        const res = await fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&from='+yesterday+'&to='+in30, { headers:H_NHL });
        const data = await res.json();
        (data.response||[]).forEach(function(g) {
          events.push({
            id:'nhl-'+g.id, sport:'nhl', icon:'🏒',
            competition:'NHL 2025-26', round:'',
            home:g.teams.home.name, homeLogo:g.teams.home.logo,
            away:g.teams.away.name, awayLogo:g.teams.away.logo,
            homeId:g.teams.home.id, awayId:g.teams.away.id,
            homeScore:g.scores.home, awayScore:g.scores.away,
            date:g.date, venue:null, city:null,
            isLive:['P1','P2','P3','OT','BT'].indexOf(g.status.short)>=0,
            isFinished:['Finished','After Over Time','After Penalties'].indexOf(g.status.long)>=0,
            status:g.status.short, sportKey:'NHL',
          });
        });
      } catch(e) {}

      // MLB — aujourd'hui + hier
      try {
        const [r1, r2] = await Promise.all([
          fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&date='+today, { headers:H_MLB }),
          fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&date='+yesterday, { headers:H_MLB }),
        ]);
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        [...(d1.response||[]), ...(d2.response||[])].forEach(function(g) {
          const exists = events.find(function(e) { return e.id === 'mlb-'+g.id; });
          if (exists) return;
          events.push({
            id:'mlb-'+g.id, sport:'mlb', icon:'⚾',
            competition:'MLB 2026', round:'Saison reguliere',
            home:g.teams.home.name, homeLogo:g.teams.home.logo,
            away:g.teams.away.name, awayLogo:g.teams.away.logo,
            homeId:g.teams.home.id, awayId:g.teams.away.id,
            homeScore:g.scores.home.total, awayScore:g.scores.away.total,
            date:g.date, venue:null, city:null,
            isLive:isMLBLive(g.status.short),
            isFinished:isMLBFinished(g.status.short, g.status.long),
            status:g.status.short, sportKey:'MLB',
          });
        });
      } catch(e) {}

      // MMA — saison 2026
      try {
        const res = await fetch('https://v1.mma.api-sports.io/fights?season=2026', { headers:H_MMA });
        const data = await res.json();
        (data.response||[]).forEach(function(f) {
          const d = (f.date||'').slice(0,10);
          if (d < yesterday || d > in30) return;
          const isLive = f.status?.short === 'LIVE';
          const isFinished = f.status?.short === 'FT' || f.status?.long === 'Finished';
          events.push({
            id:'mma-'+f.id, sport:'mma', icon:'🤼',
            competition: f.category || 'MMA', round: f.is_main ? 'MAIN EVENT' : '',
            home: f.fighters?.first?.name || 'Fighter 1', homeLogo: f.fighters?.first?.logo || null,
            away: f.fighters?.second?.name || 'Fighter 2', awayLogo: f.fighters?.second?.logo || null,
            homeId: f.fighters?.first?.id, awayId: f.fighters?.second?.id,
            homeScore: f.fighters?.first?.winner ? 1 : 0,
            awayScore: f.fighters?.second?.winner ? 1 : 0,
            date: f.date, venue: null, city: null,
            isLive, isFinished,
            status: f.status?.short || '', sportKey:'MMA',
          });
        });
      } catch(e) {}

      // F1
      try {
        const res = await fetch('https://v1.formula-1.api-sports.io/races?season=2026', { headers:H_F1 });
        const data = await res.json();
        (data.response||[]).forEach(function(r) {
          const d = (r.date||'').slice(0,10);
          if (d < yesterday || d > in30) return;
          const isFinished = r.status === 'Completed' || r.status === 'Finished';
          const isLive = r.status === 'Started' || r.status === 'Active';
          events.push({
            id:'f1-'+r.id, sport:'f1', icon:'🏎',
            competition: r.competition?.name || 'Formula 1',
            round: r.type || 'Course',
            home: r.circuit?.name || 'Circuit', homeLogo: null,
            away: r.competition?.location?.country || '', awayLogo: null,
            homeId: null, awayId: null,
            homeScore: null, awayScore: null,
            date: r.date, venue: r.circuit?.name, city: r.competition?.location?.city,
            isLive, isFinished,
            status: r.status || '', sportKey:'F1',
          });
        });
      } catch(e) {}

      events.sort(function(a,b) { return new Date(a.date) - new Date(b.date); });
      setAllEvents(events);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  function getFilteredEvents() {
    const now = new Date();
    let base = allEvents;

    // Filtre sport
    if (sportFilter !== 'all') {
      base = base.filter(function(e) { return e.sport === sportFilter; });
    }

    if (tab === 'done') {
      const limit = new Date(now.getTime() - 24*3600000);
      return base.filter(function(e) {
        return e.isFinished && new Date(e.date) >= limit;
      }).reverse();
    }

    const hours = { '24h':24, '72h':72, '7j':7*24, '30j':30*24 }[tab] || 24;
    const limit = new Date(now.getTime() + hours*3600000);
    return base.filter(function(e) {
      if (e.isFinished) return false;
      const d = new Date(e.date);
      return d >= new Date(now.getTime() - 3600000) && d <= limit;
    });
  }

  function buildMatch(e) {
    return {
      id: e.fixtureId || e.id,
      home:e.home, homeLogo:e.homeLogo,
      away:e.away, awayLogo:e.awayLogo,
      homeId:e.homeId, awayId:e.awayId,
      homeScore:e.homeScore, awayScore:e.awayScore,
      isLive:e.isLive, isFinished:e.isFinished,
      status:e.status, date:e.date, fixtureId:e.fixtureId,
    };
  }

  if (selectedMatch) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedMatch.match} sport={selectedMatch.sportKey} color={SPORT_COLORS[selectedMatch.sport]||'#FF6B2B'} onBack={() => setSelectedMatch(null)} />
        <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.backToScreen}>
          <Text style={styles.backToScreenText}>← Retour Agenda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filtered = getFilteredEvents();
  const grouped = {};
  filtered.forEach(function(e) {
    const d = new Date(e.date);
    const key = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>AGENDA </Text>
          <GradientText text="KAZMO" fontSize={22} letterSpacing={1} />
        </View>
      </View>

      {/* Onglets temps */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
        <View style={styles.tabBar}>
          {TABS.map(function(tb) {
            return (
              <TouchableOpacity key={tb.id}
                style={[styles.tabBtn, tab === tb.id && { backgroundColor:'#FF6B2B' }]}
                onPress={() => setTab(tb.id)}>
                <Text style={[styles.tabBtnText, tab === tb.id && { color:'#fff' }]}>{tb.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Filtres sport */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersRow}>
          {SPORT_FILTERS.map(function(f) {
            const active = sportFilter === f.id;
            return (
              <TouchableOpacity key={f.id}
                style={[styles.filterBtn, active && styles.filterBtnActive]}
                onPress={() => setSportFilter(f.id)}>
                <Text style={styles.filterIcon}>{f.icon}</Text>
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{f.label}</Text>
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
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{tab === 'done' ? '✅' : '🗓'}</Text>
          <Text style={styles.emptyText}>Aucun match dans cette periode</Text>
          {sportFilter !== 'all' && (
            <TouchableOpacity onPress={() => setSportFilter('all')} style={styles.resetFilterBtn}>
              <Text style={styles.resetFilterText}>Voir tous les sports</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>
            {filtered.length} {filtered.length > 1 ? t('matches') : t('match')}
          </Text>
          {Object.keys(grouped).map(function(dateKey) {
            return (
              <View key={dateKey}>
                <View style={styles.dateSeparator}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateLabel}>{dateKey.toUpperCase()}</Text>
                  <View style={styles.dateLine} />
                </View>
                {grouped[dateKey].map(function(e) {
                  const color = SPORT_COLORS[e.sport] || '#FF6B2B';
                  return (
                    <TouchableOpacity key={e.id}
                      style={[styles.eventCard, e.isLive && { borderColor:color, borderWidth:1 }]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedMatch({ match:buildMatch(e), sport:e.sport, sportKey:e.sportKey })}>
                      <View style={styles.eventCardHeader}>
                        <View style={[styles.sportBadge, { backgroundColor:color }]}>
                          <Text style={styles.sportBadgeText}>{e.icon} {e.competition}</Text>
                        </View>
                        {e.isLive && <Text style={styles.liveLabel}>● LIVE</Text>}
                        {e.isFinished && <Text style={styles.finishedLabel}>Termine</Text>}
                        <Text style={styles.tapHint}>Voir →</Text>
                      </View>
                      {e.round ? <Text style={styles.roundText}>{e.round}</Text> : null}
                      <View style={styles.teamsRow}>
                        <View style={styles.teamLeft}>
                          {e.homeLogo ? <Image source={{ uri:e.homeLogo }} style={styles.teamLogo} onError={function(){}} /> : null}
                          <Text style={styles.teamName} numberOfLines={1}>{e.home}</Text>
                        </View>
                        <View style={styles.scoreBox}>
                          {e.isLive || e.isFinished ? (
                            <Text style={[styles.scoreText, e.isLive && { color:'#ff1744' }]}>
                              {e.homeScore !== null ? String(e.homeScore||0)+' - '+String(e.awayScore||0) : 'EN COURS'}
                            </Text>
                          ) : (
                            <Text style={styles.timeText}>
                              {new Date(e.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                            </Text>
                          )}
                        </View>
                        <View style={styles.teamRight}>
                          <Text style={styles.teamName} numberOfLines={1}>{e.away}</Text>
                          {e.awayLogo ? <Image source={{ uri:e.awayLogo }} style={styles.teamLogo} onError={function(){}} /> : null}
                        </View>
                      </View>
                      {e.venue ? <Text style={styles.venueText}>📍 {e.venue}{e.city ? ', '+e.city : ''}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { padding:20, paddingBottom:8 },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  tabScrollView: { maxHeight:42, marginHorizontal:16, marginBottom:4 },
  tabBar: { flexDirection:'row', gap:6 },
  tabBtn: { paddingHorizontal:16, paddingVertical:8, borderRadius:10, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  tabBtnText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  filtersScroll: { maxHeight:44, marginHorizontal:16, marginBottom:8 },
  filtersRow: { flexDirection:'row', gap:6, paddingRight:16 },
  filterBtn: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:7, borderRadius:20, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  filterBtnActive: { backgroundColor:'#FF6B2B', borderColor:'#FF6B2B' },
  filterIcon: { fontSize:12 },
  filterLabel: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:11 },
  filterLabelActive: { color:'#fff' },
  scroll: { padding:16, paddingBottom:40 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40, gap:10 },
  loadingText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:13 },
  emptyIcon: { fontSize:40 },
  emptyText: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:14, textAlign:'center' },
  resetFilterBtn: { backgroundColor:'#FF6B2B22', borderRadius:10, paddingHorizontal:16, paddingVertical:8, borderWidth:1, borderColor:'#FF6B2B44' },
  resetFilterText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:12 },
  countLabel: { color:'#ffffff44', fontFamily:'BebasNeue', fontSize:11, letterSpacing:1, marginBottom:8 },
  dateSeparator: { flexDirection:'row', alignItems:'center', gap:8, marginVertical:10 },
  dateLine: { flex:1, height:1, backgroundColor:'#ffffff22' },
  dateLabel: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2 },
  eventCard: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  eventCardHeader: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' },
  sportBadge: { borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  sportBadgeText: { color:'#fff', fontSize:9, fontWeight:'700' },
  liveLabel: { color:'#ff1744', fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  finishedLabel: { color:'#ffffff44', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  roundText: { color:'#ffffff66', fontSize:10, fontFamily:'BebasNeue', letterSpacing:1, marginBottom:6 },
  teamsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  teamLeft: { flexDirection:'row', alignItems:'center', gap:6, flex:1 },
  teamRight: { flexDirection:'row', alignItems:'center', gap:6, flex:1, justifyContent:'flex-end' },
  teamLogo: { width:28, height:28, resizeMode:'contain' },
  teamName: { color:'#fff', fontSize:12, fontWeight:'600', flex:1 },
  scoreBox: { alignItems:'center', paddingHorizontal:8 },
  scoreText: { fontFamily:'BebasNeue', fontSize:22, color:'#fff' },
  timeText: { fontFamily:'BebasNeue', fontSize:16, color:'#FFD700' },
  venueText: { color:'#ffffff44', fontSize:9, marginTop:6 },
  backToScreen: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff14', padding:16, alignItems:'center' },
  backToScreenText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});
