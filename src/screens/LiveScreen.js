import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { API_SPORTS_KEY, SEASONS, SEASON_LABELS } from '../api/config';
import MatchDetailScreen from './MatchDetailScreen';
import { useLanguage } from '../i18n/LanguageContext';

const H_NBA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };
const H_NHL = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.hockey.api-sports.io' };
const H_MLB = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.baseball.api-sports.io' };
const H_FOOT = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };
const H_MMA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.mma.api-sports.io' };
const H_F1 = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.formula-1.api-sports.io' };

// Ligues football premium uniquement
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

function isNBALive(status) {
  return ['2','Q1','Q2','Q3','Q4','HT','OT','BT'].indexOf(String(status)) >= 0;
}
function isNBAFinished(status) {
  return String(status) === '3' || String(status) === 'FT';
}
function isMLBLive(status) {
  if (!status) return false;
  if (status.startsWith('IN') && status !== 'INT') return true;
  if (status === 'HT') return true;
  return false;
}
function isMLBFinished(status, statusLong) {
  if (statusLong === 'Finished') return true;
  if (status === 'FT') return true;
  return false;
}

const SPORT_FILTERS = [
  { id:'all', label:'Tout', icon:'🌐' },
  { id:'NBA', label:'NBA', icon:'🏀' },
  { id:'NHL', label:'NHL', icon:'🏒' },
  { id:'MLB', label:'MLB', icon:'⚾' },
  { id:'FOOTBALL', label:'Football', icon:'⚽' },
  { id:'F1', label:'F1', icon:'🏎' },
  { id:'MMA', label:'MMA', icon:'🤼' },
];

function GameCard({ g, onPress, t }) {
  return (
    <TouchableOpacity
      style={[styles.card, g.isLive && { borderColor: g.color, borderWidth:1 }]}
      activeOpacity={0.8}
      onPress={() => onPress(g)}>
      <View style={styles.cardHeader}>
        <View style={[styles.sportBadge, { backgroundColor: g.color }]}>
          <Text style={styles.sportBadgeText}>{g.icon} {g.sport}</Text>
        </View>
        {g.league ? <Text style={styles.leagueText}>{g.league}</Text> : null}
        {g.isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveLabel}>● LIVE</Text>
          </View>
        )}
        {g.isFinished && <Text style={styles.finishedLabel}>{t('terminated')}</Text>}
        {!g.isLive && !g.isFinished && g.date && (
          <Text style={styles.upcomingDate}>
            {new Date(g.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
          </Text>
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
              {String(g.homeScore||0)} - {String(g.awayScore||0)}
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

export default function LiveScreen() {
  const { t } = useLanguage();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [sportFilter, setSportFilter] = useState('all');

  const fetchAll = useCallback(async () => {
    try {
      const now = new Date();
      const today = now.toISOString().slice(0,10);
      const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0,10);
      let allGames = [];

      // NBA
      try {
        const [r1, r2] = await Promise.all([
          fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&date=' + today, { headers: H_NBA }),
          fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&date=' + tomorrow, { headers: H_NBA }),
        ]);
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        const combined = [...(d1.response||[]), ...(d2.response||[])];
        const seen = {};
        combined.forEach(function(g) {
          if (seen[g.id]) return;
          seen[g.id] = true;
          allGames.push({
            id:'nba-'+g.id, sport:'NBA', icon:'🏀', color:'#1D428A', sportKey:'NBA',
            home:g.teams.home.name, homeLogo:g.teams.home.logo,
            away:g.teams.visitors.name, awayLogo:g.teams.visitors.logo,
            homeScore:g.scores.home.points, awayScore:g.scores.visitors.points,
            homeId:g.teams.home.id, awayId:g.teams.visitors.id,
            status:g.status.short,
            isLive:isNBALive(g.status.short),
            isFinished:isNBAFinished(g.status.short),
            date:g.date.start,
          });
        });
      } catch(e) {}

      // NHL
      try {
        const res = await fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&date='+today, { headers:H_NHL });
        const data = await res.json();
        (data.response||[]).forEach(function(g) {
          allGames.push({
            id:'nhl-'+g.id, sport:'NHL', icon:'🏒', color:'#00B8D9', sportKey:'NHL',
            home:g.teams.home.name, homeLogo:g.teams.home.logo,
            away:g.teams.away.name, awayLogo:g.teams.away.logo,
            homeScore:g.scores.home, awayScore:g.scores.away,
            homeId:g.teams.home.id, awayId:g.teams.away.id,
            status:g.status.short,
            isLive:['P1','P2','P3','OT','BT'].indexOf(g.status.short)>=0,
            isFinished:['Finished','After Over Time','After Penalties'].indexOf(g.status.long)>=0,
            date:g.date,
          });
        });
      } catch(e) {}

      // MLB
      try {
        const res = await fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&date='+today, { headers:H_MLB });
        const data = await res.json();
        (data.response||[]).forEach(function(g) {
          allGames.push({
            id:'mlb-'+g.id, sport:'MLB', icon:'⚾', color:'#E53935', sportKey:'MLB',
            home:g.teams.home.name, homeLogo:g.teams.home.logo,
            away:g.teams.away.name, awayLogo:g.teams.away.logo,
            homeScore:g.scores.home.total, awayScore:g.scores.away.total,
            homeId:g.teams.home.id, awayId:g.teams.away.id,
            status:g.status.short,
            isLive:isMLBLive(g.status.short),
            isFinished:isMLBFinished(g.status.short, g.status.long),
            date:g.date,
          });
        });
      } catch(e) {}

      // FOOTBALL — ligues premium uniquement
      try {
        const res = await fetch('https://v3.football.api-sports.io/fixtures?date='+today, { headers:H_FOOT });
        const data = await res.json();
        const liveStatuses = ['1H','2H','HT','ET','P','BT'];
        const finishedStatuses = ['FT','AET','PEN'];
        (data.response||[]).forEach(function(f) {
          if (FOOTBALL_LEAGUES.indexOf(f.league.id) < 0) return;
          allGames.push({
            id:'foot-'+f.fixture.id, sport:'FOOT', icon:'⚽', color:'#4CAF50', sportKey:'FOOTBALL',
            league: f.league.name,
            home:f.teams.home.name, homeLogo:f.teams.home.logo,
            away:f.teams.away.name, awayLogo:f.teams.away.logo,
            homeScore:f.goals.home, awayScore:f.goals.away,
            homeId:f.teams.home.id, awayId:f.teams.away.id,
            status:f.fixture.status.short,
            isLive:liveStatuses.indexOf(f.fixture.status.short)>=0,
            isFinished:finishedStatuses.indexOf(f.fixture.status.short)>=0,
            date:f.fixture.date, fixtureId:f.fixture.id,
          });
        });
      } catch(e) {}

      // F1
      try {
        const res = await fetch('https://v1.formula-1.api-sports.io/races?date='+today, { headers:H_F1 });
        const data = await res.json();
        (data.response||[]).forEach(function(r) {
          const isLive = r.status === 'Started' || r.status === 'Active';
          const isFinished = r.status === 'Completed' || r.status === 'Finished';
          allGames.push({
            id:'f1-'+r.id, sport:'F1', icon:'🏎', color:'#E10600', sportKey:'F1',
            league: r.competition?.name || 'F1',
            home: r.circuit?.name || 'Circuit', homeLogo: null,
            away: r.type || 'Course', awayLogo: null,
            homeScore: null, awayScore: null,
            status: r.status || '',
            isLive, isFinished,
            date: r.date,
          });
        });
      } catch(e) {}

      // MMA
      try {
        const res = await fetch('https://v1.mma.api-sports.io/fights?date='+today, { headers:H_MMA });
        const data = await res.json();
        (data.response||[]).forEach(function(f) {
          const isLive = f.status?.short === 'LIVE';
          const isFinished = f.status?.short === 'FT' || f.status?.long === 'Finished';
          allGames.push({
            id:'mma-'+f.id, sport:'MMA', icon:'🤼', color:'#9C27B0', sportKey:'MMA',
            league: f.category || 'MMA',
            home: f.fighters?.first?.name || 'Fighter 1', homeLogo: f.fighters?.first?.logo || null,
            away: f.fighters?.second?.name || 'Fighter 2', awayLogo: f.fighters?.second?.logo || null,
            homeScore: f.fighters?.first?.winner ? 1 : 0,
            awayScore: f.fighters?.second?.winner ? 1 : 0,
            status: f.status?.short || '',
            isLive, isFinished,
            date: f.date,
          });
        });
      } catch(e) {}

      allGames.sort(function(a,b) {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        if (!a.isFinished && b.isFinished) return -1;
        if (a.isFinished && !b.isFinished) return 1;
        return new Date(a.date) - new Date(b.date);
      });

      setGames(allGames);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

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
  const finishedGames = filteredGames.filter(function(g) { return g.isFinished; });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.titleWhite}>{t('today')} </Text>
          <GradientText text={new Date().toLocaleDateString('fr-FR', {day:'numeric', month:'long'})} fontSize={22} letterSpacing={1} />
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
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {liveGames.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionLabelLive}>EN DIRECT ({liveGames.length})</Text>
              </View>
              {liveGames.map(function(g) { return <GameCard key={g.id} g={g} onPress={setSelectedGame} t={t} />; })}
            </>
          )}
          {upcomingGames.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color:'#FFD700' }]}>A VENIR ({upcomingGames.length})</Text>
              {upcomingGames.map(function(g) { return <GameCard key={g.id} g={g} onPress={setSelectedGame} t={t} />; })}
            </>
          )}
          {finishedGames.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color:'#ffffff55' }]}>TERMINES ({finishedGames.length})</Text>
              {finishedGames.map(function(g) { return <GameCard key={g.id} g={g} onPress={setSelectedGame} t={t} />; })}
            </>
          )}
          {filteredGames.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Aucun match aujourd'hui</Text>
              {sportFilter !== 'all' && (
                <TouchableOpacity onPress={() => setSportFilter('all')} style={styles.resetFilterBtn}>
                  <Text style={styles.resetFilterText}>Voir tous les sports</Text>
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
  filterBtn: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:7,
               borderRadius:20, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
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
  finishedLabel: { color:'#ffffff55', fontSize:9 },
  upcomingDate: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  matchRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  teamLeft: { flexDirection:'row', alignItems:'center', gap:6, flex:1 },
  teamRight: { flexDirection:'row', alignItems:'center', gap:6, flex:1, justifyContent:'flex-end' },
  logo: { width:22, height:22, resizeMode:'contain' },
  teamName: { color:'#fff', fontSize:11, fontWeight:'600', flex:1 },
  scoreCenter: { alignItems:'center', paddingHorizontal:8 },
  scoreText: { color:'#fff', fontSize:22, fontFamily:'BebasNeue' },
  vsText: { color:'#FFD700', fontSize:16, fontFamily:'BebasNeue' },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40, gap:8 },
  loadingText: { color:'#ffffffcc', marginTop:10, fontFamily:'BebasNeue', fontSize:14 },
  emptyText: { color:'#ffffff88', fontSize:14, fontFamily:'BebasNeue' },
  resetFilterBtn: { backgroundColor:'#FF6B2B22', borderRadius:10, paddingHorizontal:16, paddingVertical:8, borderWidth:1, borderColor:'#FF6B2B44' },
  resetFilterText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:12 },
  backBtn: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff22', padding:16, alignItems:'center' },
  backBtnText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});
