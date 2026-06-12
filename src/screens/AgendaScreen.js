import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useLanguage } from '../i18n/LanguageContext';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import MatchDetailScreen from './MatchDetailScreen';
import MMAScreen from './MMAScreen';
import F1Screen from './F1Screen';
import GolfScreen from './GolfScreen';

const H_FOOT = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };
const H_NBA  = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };
const H_NHL  = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.hockey.api-sports.io' };
const H_MLB  = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.baseball.api-sports.io' };
const H_MMA  = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.mma.api-sports.io' };
const H_F1   = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.formula-1.api-sports.io' };
const H_GOLF = { 'x-rapidapi-key': RAPIDAPI_GOLF_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' };

const FOOTBALL_LEAGUES_CONFIG = [
  { league:1, season:2026 },
  { league:2, season:2025 },
  { league:39, season:2025 },
  { league:61, season:2025 },
  { league:140, season:2025 },
  { league:78, season:2025 },
  { league:135, season:2025 },
  { league:253, season:2025 },
];

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

const SPORT_COLORS = {
  wc:'#006341', foot:'#4CAF50', nba:'#1D428A', nhl:'#00B8D9',
  mlb:'#E53935', nfl:'#1A73E8', mma:'#9C27B0', f1:'#E10600', golf:'#2E7D32',
};

// Dates Coupe du Monde 2026
const WC_START = new Date('2026-06-11');
const WC_END = new Date('2026-07-19');

function isNBALive(status) { return ['2','Q1','Q2','Q3','Q4','HT','OT','BT'].indexOf(String(status)) >= 0; }
function isNBAFinished(status) { return String(status) === '3' || String(status) === 'FT'; }
function isMLBLive(status) {
  if (!status) return false;
  if (status.startsWith('IN') && status !== 'INT') return true;
  return status === 'HT';
}
function isMLBFinished(status, statusLong) { return statusLong === 'Finished' || status === 'FT'; }

function parseGolfDate(v) {
  if (!v) return null;
  if (typeof v === 'string') return new Date(v);
  if (v['$date'] && v['$date']['$numberLong']) return new Date(Number(v['$date']['$numberLong']));
  return null;
}

// Bannière Coupe du Monde
function WorldCupBanner({ onPress }) {
  const now = new Date();
  const isLive = now >= WC_START && now <= WC_END;
  const daysLeft = Math.ceil((WC_START - now) / 86400000);
  if (now > WC_END) return null;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{marginHorizontal:16, marginBottom:10}}>
      <LinearGradient colors={['#006341','#006341cc']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:14,padding:14,borderWidth:1,borderColor:'#00634188'}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <View style={{flex:1}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}>
              {isLive ? (
                <View style={{backgroundColor:'#ff174422',borderRadius:6,paddingHorizontal:8,paddingVertical:2,borderWidth:1,borderColor:'#ff174444'}}>
                  <Text style={{color:'#ff1744',fontFamily:'BebasNeue',fontSize:10,fontWeight:'700'}}>● EN COURS</Text>
                </View>
              ) : (
                <View style={{backgroundColor:'#FFD70022',borderRadius:6,paddingHorizontal:8,paddingVertical:2,borderWidth:1,borderColor:'#FFD70044'}}>
                  <Text style={{color:'#FFD700',fontFamily:'BebasNeue',fontSize:10}}>⏰ DANS {daysLeft}J</Text>
                </View>
              )}
              <Text style={{color:'#ffffff88',fontSize:10}}>USA · Canada · Mexique</Text>
            </View>
            <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:20,letterSpacing:1}}>🌍 COUPE DU MONDE 2026</Text>
            <Text style={{color:'#ffffff88',fontSize:11,marginTop:2}}>48 équipes · 104 matchs · 16 juin → 19 juil.</Text>
          </View>
          <Text style={{fontSize:32}}>⚽</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function AgendaScreen() {
  const { t, language } = useLanguage();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);
  const [tab, setTab] = useState('7j');
  const [sportFilter, setSportFilter] = useState('all');

  const locale = LANG_LOCALE[language] || 'en-US';

  const TABS = [
    { id:'24h', label:'24H' },
    { id:'72h', label:'72H' },
    { id:'7j', label:'7J' },
    { id:'30j', label:'30J' },
    { id:'done', label:'✅' },
  ];

  const SPORT_FILTERS = [
    { id:'all', icon:'🌐', labelKey:'all' },
    { id:'wc', icon:'🌍', label:'Mondial' },
    { id:'nba', icon:'🏀', label:'NBA' },
    { id:'nhl', icon:'🏒', label:'NHL' },
    { id:'mlb', icon:'⚾', label:'MLB' },
    { id:'nfl', icon:'🏈', label:'NFL' },
    { id:'foot', icon:'⚽', label:'Football' },
    { id:'golf', icon:'⛳', label:'Golf' },
    { id:'f1', icon:'🏎', label:'F1' },
    { id:'mma', icon:'🤼', label:'MMA' },
  ];

  useEffect(() => { fetchAllEvents(); }, []);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0,10);
  const in30 = new Date(now.getTime() + 30*86400000).toISOString().slice(0,10);
  const year = now.getFullYear();

  async function fetchFastSports() {
    const results = [];

    try {
      const res = await fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&team=31', { headers:H_NBA });
      const data = await res.json();
      const seen = {};
      (data.response||[]).filter(function(g){ return g.stage===3&&(g.teams.home.id===24||g.teams.visitors.id===24); })
        .forEach(function(g) {
          if (seen[g.id]) return; seen[g.id]=true;
          results.push({ id:'nba-'+g.id, sport:'nba', icon:'🏀', competition:'NBA Finales 2026', round:'Best of 7', home:g.teams.home.name, homeLogo:g.teams.home.logo, away:g.teams.visitors.name, awayLogo:g.teams.visitors.logo, homeId:g.teams.home.id, awayId:g.teams.visitors.id, homeScore:g.scores.home.points, awayScore:g.scores.visitors.points, date:g.date?.start, isLive:isNBALive(g.status.short), isFinished:isNBAFinished(g.status.short), status:g.status.short, sportKey:'NBA' });
        });
    } catch(e) {}

    try {
      const res = await fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&team=676', { headers:H_NHL });
      const data = await res.json();
      const yesterdayD = new Date(now.getTime()-86400000);
      const in30D = new Date(now.getTime()+30*86400000);
      const seen = {};
      (data.response||[]).filter(function(g){ const d=new Date(g.date); return d>=yesterdayD&&d<=in30D; })
        .forEach(function(g) {
          if (seen[g.id]) return; seen[g.id]=true;
          results.push({ id:'nhl-'+g.id, sport:'nhl', icon:'🏒', competition:'NHL Finales 2026', round:'Stanley Cup Finals', home:g.teams.home.name, homeLogo:g.teams.home.logo, away:g.teams.away.name, awayLogo:g.teams.away.logo, homeId:g.teams.home.id, awayId:g.teams.away.id, homeScore:g.scores.home, awayScore:g.scores.away, date:g.date, isLive:['P1','P2','P3','OT','BT'].indexOf(g.status.short)>=0, isFinished:['Finished','After Over Time','After Penalties'].indexOf(g.status.long)>=0, status:g.status.short, sportKey:'NHL' });
        });
    } catch(e) {}

    try {
      const today = now.toISOString().slice(0,10);
      const tom = new Date(now.getTime()+86400000).toISOString().slice(0,10);
      const [r1,r2,r3] = await Promise.all([
        fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&date='+yesterday, {headers:H_MLB}),
        fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&date='+today, {headers:H_MLB}),
        fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&date='+tom, {headers:H_MLB}),
      ]);
      const [d1,d2,d3] = await Promise.all([r1.json(),r2.json(),r3.json()]);
      const seen = {};
      [...(d1.response||[]),...(d2.response||[]),...(d3.response||[])].forEach(function(g){
        if (seen[g.id]) return; seen[g.id]=true;
        results.push({ id:'mlb-'+g.id, sport:'mlb', icon:'⚾', competition:'MLB 2026', round:'', home:g.teams.home.name, homeLogo:g.teams.home.logo, away:g.teams.away.name, awayLogo:g.teams.away.logo, homeId:g.teams.home.id, awayId:g.teams.away.id, homeScore:g.scores.home.total, awayScore:g.scores.away.total, date:g.date, isLive:isMLBLive(g.status.short), isFinished:isMLBFinished(g.status.short,g.status.long), status:g.status.short, sportKey:'MLB' });
      });
    } catch(e) {}

    try {
      const res = await fetch('https://v1.mma.api-sports.io/fights?season=2026', {headers:H_MMA});
      const data = await res.json();
      (data.response||[]).forEach(function(f){
        const d=(f.date||'').slice(0,10);
        if (d<yesterday||d>in30) return;
        const winner = f.fighters?.first?.winner?f.fighters?.first?.name:f.fighters?.second?.winner?f.fighters?.second?.name:null;
        results.push({ id:'mma-'+f.id, sport:'mma', icon:'🤼', competition:f.category||'MMA', round:f.is_main?'MAIN EVENT':'', home:f.fighters?.first?.name||'Fighter 1', homeLogo:f.fighters?.first?.logo||null, away:f.fighters?.second?.name||'Fighter 2', awayLogo:f.fighters?.second?.logo||null, homeId:f.fighters?.first?.id, awayId:f.fighters?.second?.id, winner:winner, date:f.date, isLive:f.status?.short==='LIVE', isFinished:f.status?.short==='FT'||f.status?.long==='Finished', status:f.status?.short||'', sportKey:'MMA' });
      });
    } catch(e) {}

    try {
      const res = await fetch('https://v1.formula-1.api-sports.io/races?season=2026&type=Race', {headers:H_F1});
      const data = await res.json();
      (data.response||[]).forEach(function(r){
        if (!r.date) return;
        const dStr = r.date.slice(0,10);
        if (dStr<yesterday||dStr>in30) return;
        results.push({ id:'f1-'+r.id, sport:'f1', icon:'🏎', competition:r.competition?.name||'Formula 1', round:'Grand Prix', home:r.circuit?.name||'Circuit', homeLogo:null, away:r.competition?.location?.country||'', awayLogo:null, homeId:null, awayId:null, homeScore:null, awayScore:null, date:r.date, venue:r.circuit?.name, city:r.competition?.location?.city, isLive:r.status==='Live', isFinished:r.status==='Completed', status:r.status||'', sportKey:'F1' });
      });
    } catch(e) {}

    try {
      const nowTs = now.getTime();
      const in30Ts = now.getTime()+30*86400000;
      const yesterdayTs = now.getTime()-86400000;
      const schedRes = await fetch('https://live-golf-data.p.rapidapi.com/schedule?orgId=1&year='+year, {headers:H_GOLF});
      const schedData = await schedRes.json();
      (schedData.schedule||[]).forEach(function(tg){
        if (!tg.date) return;
        const start = parseGolfDate(tg.date.start);
        const end = parseGolfDate(tg.date.end);
        if (!start||!end) return;
        const startTs=start.getTime(); const endTs=end.getTime();
        if (endTs<yesterdayTs||startTs>in30Ts) return;
        const isLive = startTs<=nowTs&&endTs>=nowTs;
        const isFinished = endTs<nowTs;
        results.push({ id:'golf-'+tg.tournId, sport:'golf', icon:'⛳', competition:'PGA Tour', round:tg.name||'Golf', home:tg.name||'Tournament', homeLogo:null, away:tg.course?.name||'', awayLogo:null, homeId:null, awayId:null, homeScore:null, awayScore:null, date:start.toISOString(), venue:tg.course?.name||null, city:null, isLive, isFinished, status:isLive?'LIVE':isFinished?'FT':'NS', sportKey:'GOLF' });
      });
    } catch(e) {}

    return results;
  }

  async function fetchFootballFast() {
    const liveStatuses = ['1H','2H','HT','ET','P','BT'];
    const finishedStatuses = ['FT','AET','PEN'];
    const seen = {};
    const results = [];
    const responses = await Promise.allSettled(
      FOOTBALL_LEAGUES_CONFIG.map(function(cfg){
        return fetch('https://v3.football.api-sports.io/fixtures?league='+cfg.league+'&season='+cfg.season+'&from='+yesterday+'&to='+in30, {headers:H_FOOT}).then(function(r){return r.json();});
      })
    );
    responses.forEach(function(res){
      if (res.status !== 'fulfilled') return;
      (res.value.response||[]).forEach(function(f){
        if (seen[f.fixture.id]) return; seen[f.fixture.id]=true;
        // Marquer les matchs de la CdM avec sport 'wc'
        const isWC = f.league.id === 1;
        results.push({ id:'foot-'+f.fixture.id, sport:isWC?'wc':'foot', icon:isWC?'🌍':'⚽', competition:f.league.name, round:f.league.round, home:f.teams.home.name, homeLogo:f.teams.home.logo, away:f.teams.away.name, awayLogo:f.teams.away.logo, homeId:f.teams.home.id, awayId:f.teams.away.id, homeScore:f.goals.home, awayScore:f.goals.away, date:f.fixture.date, venue:f.fixture.venue?.name, city:f.fixture.venue?.city, isLive:liveStatuses.indexOf(f.fixture.status.short)>=0, isFinished:finishedStatuses.indexOf(f.fixture.status.short)>=0, status:f.fixture.status.short, fixtureId:f.fixture.id, sportKey:'SOCCER' });
      });
    });
    return results;
  }

  async function fetchAllEvents() {
    setLoading(true);
    setLoadingExtra(false);
    setAllEvents([]);
    try {
      const fastResults = await fetchFastSports();
      const sorted1 = [...fastResults].sort(function(a,b){return new Date(a.date)-new Date(b.date);});
      setAllEvents(sorted1);
      setLoading(false);
      setLoadingExtra(true);

      const foot = await fetchFootballFast();

      setAllEvents(function(prev){
        const all = [...prev, ...foot];
        all.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
        return all;
      });

    } catch(e) { console.log('fetchAllEvents error:', e.message); }
    finally { setLoading(false); setLoadingExtra(false); }
  }

  function getFilteredEvents() {
    const now = new Date();
    let base = allEvents;
    if (sportFilter !== 'all') {
      base = base.filter(function(e){
        if (sportFilter === 'wc') return e.sport === 'wc';
        if (sportFilter === 'foot') return e.sport === 'foot';
        return e.sport === sportFilter;
      });
    }
    if (tab === 'done') {
      const limit = new Date(now.getTime() - 48*3600000);
      return base.filter(function(e){ return e.isFinished && new Date(e.date) >= limit; }).reverse();
    }
    const hours = {'24h':24,'72h':72,'7j':7*24,'30j':30*24}[tab]||24;
    const limit = new Date(now.getTime()+hours*3600000);
    return base.filter(function(e){
      if (e.isFinished) return false;
      const d = new Date(e.date);
      return d >= new Date(now.getTime()-3600000) && d <= limit;
    });
  }

  function buildMatch(e) {
    return { id:e.fixtureId||e.id, home:e.home, homeLogo:e.homeLogo, away:e.away, awayLogo:e.awayLogo, homeId:e.homeId, awayId:e.awayId, homeScore:e.homeScore, awayScore:e.awayScore, isLive:e.isLive, isFinished:e.isFinished, status:e.status, date:e.date, fixtureId:e.fixtureId };
  }

  function handleEventPress(e) {
    if (e.sportKey === 'MMA') { setSelectedSport({type:'mma'}); }
    else if (e.sportKey === 'F1') { setSelectedSport({type:'f1'}); }
    else if (e.sportKey === 'GOLF') { setSelectedSport({type:'golf'}); }
    else { setSelectedMatch({match:buildMatch(e), sport:e.sport, sportKey:e.sportKey}); }
  }

  if (selectedSport) {
    const back = () => setSelectedSport(null);
    if (selectedSport.type === 'mma') return (<View style={{flex:1}}><MMAScreen onBack={back} /><TouchableOpacity onPress={back} style={styles.backToScreen}><Text style={styles.backToScreenText}>← {t('backToHome')}</Text></TouchableOpacity></View>);
    if (selectedSport.type === 'f1') return (<View style={{flex:1}}><F1Screen onBack={back} /><TouchableOpacity onPress={back} style={styles.backToScreen}><Text style={styles.backToScreenText}>← {t('backToHome')}</Text></TouchableOpacity></View>);
    if (selectedSport.type === 'golf') return (<View style={{flex:1}}><GolfScreen onBack={back} /><TouchableOpacity onPress={back} style={styles.backToScreen}><Text style={styles.backToScreenText}>← {t('backToHome')}</Text></TouchableOpacity></View>);
  }

  if (selectedMatch) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedMatch.match} sport={selectedMatch.sportKey} color={SPORT_COLORS[selectedMatch.sport]||'#FF6B2B'} onBack={() => setSelectedMatch(null)} />
        <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.backToScreen}>
          <Text style={styles.backToScreenText}>← {t('backToHome')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filtered = getFilteredEvents();
  const grouped = {};
  filtered.forEach(function(e) {
    const d = new Date(e.date);
    const key = d.toLocaleDateString(locale, {weekday:'long', day:'numeric', month:'long'});
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>{t('agendaTitle').split(' ')[0]} </Text>
          <GradientText text={t('agendaTitle').split(' ').slice(1).join(' ')} fontSize={22} letterSpacing={1} />
        </View>
      </View>

      {/* Bannière Coupe du Monde */}
      <WorldCupBanner onPress={() => setSportFilter('wc')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
        <View style={styles.tabBar}>
          {TABS.map(function(tb) {
            return (
              <TouchableOpacity key={tb.id} style={[styles.tabBtn, tab===tb.id&&{backgroundColor:'#FF6B2B'}]} onPress={() => setTab(tb.id)}>
                <Text style={[styles.tabBtnText, tab===tb.id&&{color:'#fff'}]}>{tb.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersRow}>
          {SPORT_FILTERS.map(function(f) {
            const active = sportFilter===f.id;
            const label = f.label || (f.id==='all' ? t('sports') : f.id);
            const isWC = f.id === 'wc';
            return (
              <TouchableOpacity key={f.id} style={[styles.filterBtn, active&&styles.filterBtnActive, isWC&&!active&&styles.filterBtnWC]} onPress={() => setSportFilter(f.id)}>
                <Text style={styles.filterIcon}>{f.icon}</Text>
                <Text style={[styles.filterLabel, active&&styles.filterLabelActive, isWC&&!active&&{color:'#4CAF50'}]}>{label}</Text>
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {loadingExtra && (
            <View style={styles.loadingExtraRow}>
              <ActivityIndicator color="#FF6B2B" size="small" />
              <Text style={styles.loadingExtraText}>⚽ Chargement Football...</Text>
            </View>
          )}
          {filtered.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>{tab==='done'?'✅':'🗓'}</Text>
              <Text style={styles.emptyText}>{t('agendaNoMatch')}</Text>
              {sportFilter !== 'all' && (
                <TouchableOpacity onPress={() => setSportFilter('all')} style={styles.resetFilterBtn}>
                  <Text style={styles.resetFilterText}>{t('agendaSeeAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.countLabel}>{filtered.length} {filtered.length>1?t('matches'):t('match')}</Text>
              {Object.keys(grouped).map(function(dateKey) {
                return (
                  <View key={dateKey}>
                    <View style={styles.dateSeparator}>
                      <View style={styles.dateLine} />
                      <Text style={styles.dateLabel}>{dateKey.toUpperCase()}</Text>
                      <View style={styles.dateLine} />
                    </View>
                    {grouped[dateKey].map(function(e) {
                      const isWC = e.sport === 'wc';
                      const color = isWC ? '#006341' : (SPORT_COLORS[e.sport]||'#FF6B2B');
                      return (
                        <TouchableOpacity key={e.id} style={[styles.eventCard, e.isLive&&{borderColor:color,borderWidth:1}, isWC&&styles.eventCardWC]} activeOpacity={0.8} onPress={() => handleEventPress(e)}>
                          <View style={styles.eventCardHeader}>
                            <View style={[styles.sportBadge,{backgroundColor:color}]}>
                              <Text style={styles.sportBadgeText}>{e.icon} {e.competition}</Text>
                            </View>
                            {isWC && <View style={styles.wcBadge}><Text style={styles.wcBadgeText}>🏆 MONDIAL</Text></View>}
                            {e.isLive && <Text style={styles.liveLabel}>● LIVE</Text>}
                            {e.isFinished && <Text style={styles.finishedLabel}>{t('terminated')}</Text>}
                            <Text style={styles.tapHint}>{t('seeDetails')} →</Text>
                          </View>
                          {e.round ? <Text style={styles.roundText}>{e.round}</Text> : null}
                          <View style={styles.teamsRow}>
                            <View style={styles.teamLeft}>
                              {e.homeLogo ? <Image source={{uri:e.homeLogo}} style={styles.teamLogo} onError={function(){}} /> : null}
                              <Text style={styles.teamName} numberOfLines={1}>{e.home}</Text>
                            </View>
                            <View style={styles.scoreBox}>
                              {e.isLive||e.isFinished ? (
                                <Text style={[styles.scoreText, e.isLive&&{color:'#ff1744'}]}>
                                  {e.sportKey==='MMA'?(e.winner?'🏆 '+e.winner:t('terminated')):e.homeScore!==null?String(e.homeScore||0)+' - '+String(e.awayScore||0):t('inProgress')}
                                </Text>
                              ) : (
                                <Text style={styles.timeText}>{new Date(e.date).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})}</Text>
                              )}
                            </View>
                            <View style={styles.teamRight}>
                              <Text style={styles.teamName} numberOfLines={1}>{e.away}</Text>
                              {e.awayLogo ? <Image source={{uri:e.awayLogo}} style={styles.teamLogo} onError={function(){}} /> : null}
                            </View>
                          </View>
                          {e.venue ? <Text style={styles.venueText}>📍 {e.venue}{e.city?', '+e.city:''}</Text> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}
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
  tabScrollView: { maxHeight:56, marginHorizontal:16, marginBottom:4 },
  tabBar: { flexDirection:'row', gap:6 },
  tabBtn: { paddingHorizontal:16, paddingVertical:8, borderRadius:10, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  tabBtnText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  filtersScroll: { maxHeight:56, marginHorizontal:16, marginBottom:8 },
  filtersRow: { flexDirection:'row', gap:6, paddingRight:16 },
  filterBtn: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:7, borderRadius:20, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  filterBtnActive: { backgroundColor:'#FF6B2B', borderColor:'#FF6B2B' },
  filterBtnWC: { borderColor:'#006341' },
  filterIcon: { fontSize:12 },
  filterLabel: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:11 },
  filterLabelActive: { color:'#fff' },
  scroll: { padding:16, paddingBottom:40 },
  loadingExtraRow: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#16162a', borderRadius:10, padding:10, marginBottom:12 },
  loadingExtraText: { color:'#ffffff88', fontSize:11 },
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
  eventCardWC: { borderColor:'#00634133', backgroundColor:'#00634111' },
  eventCardHeader: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' },
  sportBadge: { borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  sportBadgeText: { color:'#fff', fontSize:9, fontWeight:'700' },
  wcBadge: { backgroundColor:'#FFD70022', borderRadius:6, paddingHorizontal:6, paddingVertical:2, borderWidth:1, borderColor:'#FFD70044' },
  wcBadgeText: { color:'#FFD700', fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
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
