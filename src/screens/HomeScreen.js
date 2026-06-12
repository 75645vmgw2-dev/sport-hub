import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import { useLanguage } from '../i18n/LanguageContext';
import { supabase } from '../api/supabase';
import AdminScreen from './AdminScreen';
import MatchDuJourScreen from './MatchDuJourScreen';
import KazmoPredictScreen from './KazmoPredictScreen';

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const SPORTS_BASE = [
  { id:'basketball', icon:'🏀', name:'NBA', color:'#1D428A' },
  { id:'hockey', icon:'🏒', name:'NHL', color:'#00B8D9' },
  { id:'baseball', icon:'⚾', name:'MLB', color:'#E53935' },
  { id:'nfl', icon:'🏈', name:'NFL', color:'#1A73E8' },
  { id:'soccer', icon:'⚽', name:'FOOTBALL', color:'#4CAF50' },
  { id:'f1', icon:'🏎', name:'F1', color:'#E10600' },
  { id:'golf', icon:'⛳', name:'GOLF', color:'#2E7D32' },
  { id:'mma', icon:'🤼', name:'MMA', color:'#9C27B0' },
];

function isNBALive(status) { return ['2','Q1','Q2','Q3','Q4','HT','OT','BT'].indexOf(String(status)) >= 0; }
function isNBAFinished(status) { return String(status) === '3' || String(status) === 'FT'; }
function isMLBLive(status) {
  if (!status) return false;
  if (status.startsWith('IN') && status !== 'INT') return true;
  return status === 'HT';
}
function isMLBFinished(status, statusLong) { return statusLong === 'Finished' || status === 'FT'; }

function isInGMTWindow(heureDebut, heureFin) {
  const now = new Date();
  const gmtHour = now.getUTCHours();
  const gmtMin = now.getUTCMinutes();
  const nowMinutes = gmtHour * 60 + gmtMin;
  function parseGMT(str) {
    if (!str) return 0;
    const parts = str.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
  }
  const debut = parseGMT(heureDebut || '00:00');
  const fin = parseGMT(heureFin || '23:30');
  if (debut <= fin) { return nowMinutes >= debut && nowMinutes <= fin; }
  else { return nowMinutes >= debut || nowMinutes <= fin; }
}

export default function HomeScreen({ user, onGoToLive, onSelectSport }) {
  const { t, language } = useLanguage();
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [liveGames, setLiveGames] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const [loadingLive, setLoadingLive] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [matchDuJour, setMatchDuJour] = useState(null);
  const [showMatchDuJour, setShowMatchDuJour] = useState(false);
  const [showPredict, setShowPredict] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);

  useEffect(() => {
    fetchGames();
    fetchMatchDuJour();
    fetchActiveEvent();
    const interval = setInterval(fetchGames, 30000);
    const intervalMDJ = setInterval(fetchMatchDuJour, 60000);
    const intervalEvent = setInterval(fetchActiveEvent, 60000);
    return () => { clearInterval(interval); clearInterval(intervalMDJ); clearInterval(intervalEvent); };
  }, []);

  async function fetchActiveEvent() {
    try {
      const now = new Date().toISOString().slice(0,10);
      const { data } = await supabase
        .from('kazmo_events')
        .select('*')
        .eq('actif', true)
        .lte('date_debut', now)
        .gte('date_fin', now)
        .limit(1)
        .single();
      setActiveEvent(data || null);
    } catch(e) { setActiveEvent(null); }
  }

  async function fetchMatchDuJour() {
    try {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth()+1).padStart(2,'0');
      const d = String(now.getUTCDate()).padStart(2,'0');
      const todayGMT = y + '-' + m + '-' + d;
      const { data } = await supabase.from('match_du_jour').select('*').eq('actif', true).eq('date_affichage', todayGMT).single();
      if (data) {
        if (isInGMTWindow(data.heure_debut_gmt, data.heure_fin_gmt)) { setMatchDuJour(data); }
        else { setMatchDuJour(null); }
      } else { setMatchDuJour(null); }
    } catch(e) { setMatchDuJour(null); }
  }

  function handleLogoTap() {
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 5) { logoTapCount.current = 0; setShowAdmin(true); }
    else { logoTapTimer.current = setTimeout(function() { logoTapCount.current = 0; }, 2000); }
  }

  async function fetchGames() {
    try {
      const now = new Date();
      const today = now.toISOString().slice(0,10);
      const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0,10);
      let all = [];

      try {
        const [r1, r2] = await Promise.all([
          fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&date='+today, { headers:{'x-rapidapi-key':API_SPORTS_KEY,'x-rapidapi-host':'v2.nba.api-sports.io'} }),
          fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&date='+tomorrow, { headers:{'x-rapidapi-key':API_SPORTS_KEY,'x-rapidapi-host':'v2.nba.api-sports.io'} }),
        ]);
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        const combined = [...(d1.response||[]), ...(d2.response||[])];
        const seen = {};
        combined.forEach(function(g) {
          if (seen[g.id]) return; seen[g.id] = true;
          all.push({ id:'nba-'+g.id, sport:'NBA', icon:'🏀', color:'#1D428A', home:g.teams.home.name, away:g.teams.visitors.name, homeScore:g.scores.home.points, awayScore:g.scores.visitors.points, isLive:isNBALive(g.status.short), isFinished:isNBAFinished(g.status.short), status:g.status.short, date:g.date.start });
        });
      } catch(e) {}

      try {
        const r = await fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&date='+today, { headers:{'x-rapidapi-key':API_SPORTS_KEY,'x-rapidapi-host':'v1.hockey.api-sports.io'} });
        const d = await r.json();
        (d.response||[]).forEach(function(g) {
          all.push({ id:'nhl-'+g.id, sport:'NHL', icon:'🏒', color:'#00B8D9', home:g.teams.home.name, away:g.teams.away.name, homeScore:g.scores.home, awayScore:g.scores.away, isLive:['P1','P2','P3','OT','BT'].indexOf(g.status.short)>=0, isFinished:['Finished','After Over Time','After Penalties'].indexOf(g.status.long)>=0, status:g.status.short, date:g.date });
        });
      } catch(e) {}

      try {
        const r = await fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&date='+today, { headers:{'x-rapidapi-key':API_SPORTS_KEY,'x-rapidapi-host':'v1.baseball.api-sports.io'} });
        const d = await r.json();
        (d.response||[]).forEach(function(g) {
          all.push({ id:'mlb-'+g.id, sport:'MLB', icon:'⚾', color:'#E53935', home:g.teams.home.name, away:g.teams.away.name, homeScore:g.scores.home.total, awayScore:g.scores.away.total, isLive:isMLBLive(g.status.short), isFinished:isMLBFinished(g.status.short, g.status.long), status:g.status.short, date:g.date });
        });
      } catch(e) {}

      try {
        const r = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&from='+today+'&to='+tomorrow, { headers:{'x-rapidapi-key':API_SPORTS_KEY,'x-rapidapi-host':'v3.football.api-sports.io'} });
        const d = await r.json();
        (d.response||[]).forEach(function(f) {
          all.push({ id:'wc-'+f.fixture.id, sport:'WC', icon:'🌍', color:'#006341', home:f.teams.home.name, away:f.teams.away.name, homeScore:f.goals.home, awayScore:f.goals.away, isLive:['1H','2H','HT','ET','P','BT'].indexOf(f.fixture.status.short)>=0, isFinished:['FT','AET','PEN'].indexOf(f.fixture.status.short)>=0, status:f.fixture.status.short, date:f.fixture.date });
        });
      } catch(e) {}

      const live = all.filter(function(g) { return g.isLive; });
      const upcoming = all.filter(function(g) { return !g.isFinished && !g.isLive; }).sort(function(a,b) { return new Date(a.date) - new Date(b.date); });
      setLiveGames(live);
      setUpcomingGames(upcoming.slice(0,3));
      setTotalGames(all.filter(function(g) { return !g.isFinished; }).length);
    } catch(e) { console.error(e); }
    finally { setLoadingLive(false); }
  }

  // Grille des sports : 8 fixes + 1 dynamique si événement actif
  const SPORTS = [...SPORTS_BASE];
  if (activeEvent) {
    SPORTS.push({ id:'event_special', icon:activeEvent.icon, name:activeEvent.nom.toUpperCase().slice(0,10), color:'#FF6B2B', isEvent:true });
  }

  const displayGames = liveGames.length > 0 ? liveGames.slice(0,3) : upcomingGames;

  if (showAdmin) return <AdminScreen onClose={() => setShowAdmin(false)} adminUser={user} />;
  if (showMatchDuJour && matchDuJour) return <MatchDuJourScreen match={matchDuJour} onBack={() => setShowMatchDuJour(false)} />;
  if (showPredict) return <KazmoPredictScreen onBack={() => setShowPredict(false)} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity activeOpacity={1} onPress={handleLogoTap}>
          <View style={styles.header}>
            <Image source={require('../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.tagline}>{t('tagline')}</Text>
          </View>
        </TouchableOpacity>

        {matchDuJour && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => setShowMatchDuJour(true)} style={styles.matchDuJourBtn}>
            <LinearGradient colors={['#1a1a2e','#FF6B2B22']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.matchDuJourCard}>
              <View style={styles.matchDuJourHeader}>
                <View style={styles.matchDuJourBadge}>
                  <Text style={styles.matchDuJourBadgeText}>⭐ {t('match').toUpperCase()} DU JOUR</Text>
                </View>
                <Text style={styles.matchDuJourSport}>{matchDuJour.sport}</Text>
              </View>
              <View style={styles.matchDuJourTeams}>
                {matchDuJour.logo_home ? <Image source={{uri:matchDuJour.logo_home}} style={styles.matchDuJourLogo} onError={function(){}} /> : null}
                <Text style={styles.matchDuJourTeam} numberOfLines={1}>{matchDuJour.equipe_home}</Text>
                <Text style={styles.matchDuJourVs}>VS</Text>
                <Text style={[styles.matchDuJourTeam,{textAlign:'right'}]} numberOfLines={1}>{matchDuJour.equipe_away}</Text>
                {matchDuJour.logo_away ? <Image source={{uri:matchDuJour.logo_away}} style={styles.matchDuJourLogo} onError={function(){}} /> : null}
              </View>
              {matchDuJour.competition ? <Text style={styles.matchDuJourComp}>{matchDuJour.competition}</Text> : null}
              <Text style={styles.matchDuJourArrow}>{t('kazmoAssistant')} →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.liveSectionHeader}>
          <Text style={styles.sectionTitle}>
            {liveGames.length > 0 ? '🔴 LIVE' : '📅 ' + t('upcoming')}
          </Text>
          {totalGames > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalGames} {t('matches')}</Text>
            </View>
          )}
        </View>

        {loadingLive ? (
          <View style={styles.loadingBox}><ActivityIndicator color="#FF6B2B" size="small" /></View>
        ) : displayGames.length === 0 ? (
          <View style={styles.noGamesBox}><Text style={styles.noGamesText}>{t('noMatchesToday')}</Text></View>
        ) : (
          <View style={styles.liveList}>
            {displayGames.map(function(g) {
              return (
                <TouchableOpacity key={g.id}
                  style={[styles.liveCard, g.isLive && { borderColor:g.color, borderWidth:1 }]}
                  activeOpacity={0.8} onPress={onGoToLive}>
                  <View style={styles.liveCardLeft}>
                    <View style={[styles.sportBadge, { backgroundColor:g.color }]}>
                      <Text style={styles.sportBadgeText}>{g.icon} {g.sport}</Text>
                    </View>
                    <Text style={styles.liveMatchText} numberOfLines={1}>{g.home} vs {g.away}</Text>
                  </View>
                  <View style={styles.liveCardRight}>
                    {g.isLive ? (
                      <>
                        <Text style={[styles.liveScore, { color:'#ff1744' }]}>{String(g.homeScore||0)}-{String(g.awayScore||0)}</Text>
                        <View style={styles.livePulse}><Text style={styles.livePulseText}>● LIVE</Text></View>
                      </>
                    ) : (
                      <Text style={styles.upcomingTime}>{new Date(g.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {totalGames > 3 && (
              <TouchableOpacity style={styles.seeAllBtn} onPress={onGoToLive}>
                <Text style={styles.seeAllText}>{t('seeAll')} {totalGames} {t('matches')} →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPredict(true)} style={styles.predictBtn}>
          <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.predictGradient}>
            <Text style={styles.predictIcon}>🎯</Text>
            <View style={{ flex:1 }}>
              <Text style={styles.predictTitle}>{t('kazmoPredict')}</Text>
              <Text style={styles.predictSub}>{t('kazmoPredictSub')}</Text>
            </View>
            <Text style={styles.predictArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop:12 }]}>{t('sports')}</Text>
        <View style={styles.grid}>
          {SPORTS.map(function(s) {
            return (
              <TouchableOpacity key={s.id}
                style={[styles.sportCard, { borderTopColor:s.color, borderTopWidth:2 }, s.isEvent&&styles.sportCardEvent]}
                activeOpacity={0.7}
                onPress={() => onSelectSport && onSelectSport(s)}>
                {s.isEvent && (
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>LIVE</Text>
                  </View>
                )}
                <Text style={styles.sportIcon}>{s.icon}</Text>
                <Text style={styles.sportName}>{s.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  scroll: { padding:14, paddingBottom:80 },
  header: { alignItems:'center', marginBottom:14 },
  logoImage: { width:120, height:120, borderRadius:24, marginBottom:6 },
  tagline: { color:'#ffffffcc', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4, textAlign:'center' },
  matchDuJourBtn: { marginBottom:14 },
  matchDuJourCard: { borderRadius:14, padding:16, borderWidth:1, borderColor:'#FF6B2B33' },
  matchDuJourHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  matchDuJourBadge: { backgroundColor:'#FF6B2B22', borderRadius:8, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:'#FF6B2B44' },
  matchDuJourBadgeText: { color:'#FF6B2B', fontSize:10, fontWeight:'700', fontFamily:'BebasNeue', letterSpacing:1 },
  matchDuJourSport: { color:'#ffffff66', fontSize:10, fontFamily:'BebasNeue', letterSpacing:1 },
  matchDuJourTeams: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:8, gap:6 },
  matchDuJourLogo: { width:28, height:28, resizeMode:'contain' },
  matchDuJourTeam: { color:'#fff', fontFamily:'BebasNeue', fontSize:15, letterSpacing:0.5, flex:1 },
  matchDuJourVs: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:18, paddingHorizontal:4 },
  matchDuJourComp: { color:'#ffffff55', fontSize:10, marginBottom:8 },
  matchDuJourArrow: { color:'#FF6B2B', fontSize:11, fontWeight:'700' },
  liveSectionHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
  sectionTitle: { color:'#ffffffcc', fontSize:11, letterSpacing:2, fontFamily:'BebasNeue' },
  countBadge: { backgroundColor:'#ff174422', borderRadius:10, paddingHorizontal:8, paddingVertical:2 },
  countText: { color:'#ff1744', fontSize:10, fontWeight:'700' },
  loadingBox: { padding:16, alignItems:'center' },
  noGamesBox: { padding:12, backgroundColor:'#16162a', borderRadius:10, alignItems:'center' },
  noGamesText: { color:'#ffffffcc', fontSize:11 },
  liveList: { gap:5, marginBottom:6 },
  liveCard: { backgroundColor:'#16162a', borderRadius:10, padding:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderColor:'#ffffff14' },
  liveCardLeft: { flex:1, gap:3 },
  sportBadge: { borderRadius:8, paddingHorizontal:6, paddingVertical:2, alignSelf:'flex-start' },
  sportBadgeText: { color:'#fff', fontSize:9, fontWeight:'700' },
  liveMatchText: { color:'#fff', fontSize:11, fontWeight:'600' },
  liveCardRight: { alignItems:'flex-end', gap:3 },
  liveScore: { fontFamily:'BebasNeue', fontSize:18 },
  upcomingTime: { fontFamily:'BebasNeue', fontSize:16, color:'#FFD700' },
  livePulse: { backgroundColor:'#ff174422', borderRadius:6, paddingHorizontal:6, paddingVertical:1 },
  livePulseText: { color:'#ff1744', fontSize:9, fontWeight:'700' },
  seeAllBtn: { backgroundColor:'#ffffff0a', borderRadius:10, padding:10, alignItems:'center' },
  seeAllText: { color:'#FF6B2B', fontSize:11, fontWeight:'700' },
  predictBtn: { marginBottom:14, borderRadius:14, overflow:'hidden' },
  predictGradient: { flexDirection:'row', alignItems:'center', padding:16, gap:12 },
  predictIcon: { fontSize:28 },
  predictTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:20, letterSpacing:1 },
  predictSub: { color:'#ffffff88', fontSize:10, marginTop:2 },
  predictArrow: { color:'#fff', fontSize:28 },
  grid: { flexDirection:'row', flexWrap:'wrap', gap:7 },
  sportCard: { width:'31%', backgroundColor:'#16162a', borderRadius:10, padding:10, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#ffffff0a', aspectRatio:0.95 },
  sportCardEvent: { borderColor:'#FF6B2B44', backgroundColor:'#FF6B2B11' },
  sportIcon: { fontSize:24, marginBottom:4 },
  sportName: { color:'#fff', fontFamily:'BebasNeue', fontSize:10, letterSpacing:0.5, textAlign:'center' },
  eventBadge: { position:'absolute', top:4, right:4, backgroundColor:'#ff1744', borderRadius:4, paddingHorizontal:4, paddingVertical:1 },
  eventBadgeText: { color:'#fff', fontSize:7, fontWeight:'700' },
});
