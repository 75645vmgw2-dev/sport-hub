import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { API_SPORTS_KEY, SEASONS, SEASON_LABELS } from '../api/config';
import { supabase } from '../api/supabase';
import MatchDetailScreen from './MatchDetailScreen';
import SoccerTeamScreen from './SoccerTeamScreen';

const H_FOOT = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const FS = SEASONS.FOOTBALL;

const COUNTRIES = [
  {
    id: 'europe', name: 'Competitions Europeennes', flag: '⭐', color: '#1a1aff',
    leagues: [
      { id:'ucl', name:'Champions League', leagueId:2, season:FS, color:'#1a1aff' },
      { id:'uel', name:'Europa League', leagueId:3, season:FS, color:'#ff6600' },
      { id:'uecl', name:'Conference League', leagueId:848, season:FS, color:'#00cc44' },
    ]
  },
  {
    id: 'england', name: 'Angleterre', flag: '🇬🇧', color: '#cc0000',
    leagues: [
      { id:'pl', name:'Premier League', leagueId:39, season:FS, color:'#3d195b' },
      { id:'championship', name:'Championship', leagueId:40, season:FS, color:'#6a0dad' },
      { id:'facup', name:'FA Cup', leagueId:45, season:FS, color:'#ff0000' },
    ]
  },
  {
    id: 'france', name: 'France', flag: '🇫🇷', color: '#003b8a',
    leagues: [
      { id:'ligue1', name:'Ligue 1', leagueId:61, season:FS, color:'#003b8a' },
      { id:'ligue2', name:'Ligue 2', leagueId:62, season:FS, color:'#0055a4' },
      { id:'coupefrance', name:'Coupe de France', leagueId:66, season:FS, color:'#002395' },
    ]
  },
  {
    id: 'spain', name: 'Espagne', flag: '🇪🇸', color: '#ee1f21',
    leagues: [
      { id:'laliga', name:'La Liga', leagueId:140, season:FS, color:'#ee1f21' },
      { id:'segundadiv', name:'Segunda Division', leagueId:141, season:FS, color:'#c60b1e' },
      { id:'copadelrey', name:'Copa del Rey', leagueId:143, season:FS, color:'#aa151b' },
    ]
  },
  {
    id: 'germany', name: 'Allemagne', flag: '🇩🇪', color: '#d4021d',
    leagues: [
      { id:'bundesliga', name:'Bundesliga', leagueId:78, season:FS, color:'#d4021d' },
      { id:'bundesliga2', name:'2. Bundesliga', leagueId:79, season:FS, color:'#333333' },
      { id:'dfbpokal', name:'DFB Pokal', leagueId:81, season:FS, color:'#333333' },
    ]
  },
  {
    id: 'italy', name: 'Italie', flag: '🇮🇹', color: '#1a56db',
    leagues: [
      { id:'seriea', name:'Serie A', leagueId:135, season:FS, color:'#1a56db' },
      { id:'serieb', name:'Serie B', leagueId:136, season:FS, color:'#009246' },
    ]
  },
  {
    id: 'usa', name: 'USA', flag: '🇺🇸', color: '#002040',
    leagues: [
      { id:'mls', name:'MLS', leagueId:253, season:FS, color:'#002040' },
    ]
  },
];

const WC_LEAGUE = { id:'wc', name:'Coupe du Monde 2026', leagueId:1, season:2026, color:'#006341' };

export default function SoccerScreen({ onBack, user }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [tab, setTab] = useState('matchs');
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState([]);
  const [wcGroups, setWcGroups] = useState([]);
  const [wcFixtures, setWcFixtures] = useState([]);
  const [wcTab, setWcTab] = useState('matchs');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const C = '#4CAF50';

  useEffect(() => {
    async function fetchFavs() {
      if (user) {
        const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('sport', 'soccer');
        setFavorites(data || []);
      }
    }
    fetchFavs();
  }, [user]);

  async function selectLeague(league) {
    setSelectedLeague(league);
    setLoading(true);
    setTab('matchs');
    setSelectedMatch(null);
    setSelectedTeam(null);
    if (league.id === 'wc') {
      await loadWorldCup();
    } else {
      await loadLeague(league);
    }
    setLoading(false);
  }

  async function loadWorldCup() {
    try {
      const today = new Date().toISOString().slice(0,10);
      const to = new Date(Date.now() + 7*86400000).toISOString().slice(0,10);
      const [fixRes, standRes] = await Promise.all([
        fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&from='+today+'&to='+to, { headers:H_FOOT }),
        fetch('https://v3.football.api-sports.io/standings?league=1&season=2026', { headers:H_FOOT }),
      ]);
      const [fixData, standData] = await Promise.all([fixRes.json(), standRes.json()]);
      setWcFixtures(fixData.response || []);
      const allGroups = standData.response?.[0]?.league?.standings || [];
      setWcGroups(allGroups);
      if (allGroups.length > 0) setSelectedGroup(0);
    } catch(e) {}
  }

  async function loadLeague(league) {
    try {
      const today = new Date().toISOString().slice(0,10);
      const to = new Date(Date.now() + 7*86400000).toISOString().slice(0,10);
      const [fixRes, standRes] = await Promise.all([
        fetch('https://v3.football.api-sports.io/fixtures?league='+league.leagueId+'&season='+league.season+'&from='+today+'&to='+to, { headers:H_FOOT }),
        fetch('https://v3.football.api-sports.io/standings?league='+league.leagueId+'&season='+league.season, { headers:H_FOOT }),
      ]);
      const [fixData, standData] = await Promise.all([fixRes.json(), standRes.json()]);
      setFixtures(fixData.response || []);
      setStandings(standData.response?.[0]?.league?.standings?.[0] || []);
    } catch(e) {}
  }

  async function toggleFavorite(team) {
    if (!user) return;
    const existing = favorites.find(function(f) { return f.team_name === team.name; });
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites(favorites.filter(function(f) { return f.id !== existing.id; }));
    } else {
      const { data } = await supabase.from('favorites').insert({
        user_id: user.id, sport: 'soccer', team_name: team.name,
        league: selectedLeague ? selectedLeague.name : 'Football',
        logo_url: team.logo || null, team_id: team.id || null,
      }).select();
      if (data) setFavorites([...favorites, data[0]]);
    }
  }

  function isFav(name) { return favorites.some(function(f) { return f.team_name === name; }); }

  function buildMatch(f) {
    return {
      id: f.fixture.id,
      home: f.teams.home.name, homeLogo: f.teams.home.logo,
      away: f.teams.away.name, awayLogo: f.teams.away.logo,
      homeId: f.teams.home.id, awayId: f.teams.away.id,
      homeScore: f.goals.home, awayScore: f.goals.away,
      isLive: ['1H','2H','HT','ET','P'].indexOf(f.fixture.status.short) >= 0,
      isFinished: ['FT','AET','PEN'].indexOf(f.fixture.status.short) >= 0,
      status: f.fixture.status.short, date: f.fixture.date,
      fixtureId: f.fixture.id,
    };
  }

  if (selectedTeam) {
    return <SoccerTeamScreen team={selectedTeam} league={selectedLeague} onBack={() => setSelectedTeam(null)} />;
  }

  if (selectedMatch) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedMatch} sport="SOCCER" color={selectedLeague ? selectedLeague.color : C} onBack={() => setSelectedMatch(null)} />
        <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.backToScreen}>
          <Text style={styles.backToScreenText}>← Back Football</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function FixtureCard({ f, color }) {
    const isLive = ['1H','2H','HT','ET','P'].indexOf(f.fixture.status.short) >= 0;
    const isFinished = ['FT','AET','PEN'].indexOf(f.fixture.status.short) >= 0;
    return (
      <TouchableOpacity style={[styles.matchCard, isLive && { borderColor:color, borderWidth:1 }]}
        activeOpacity={0.8} onPress={() => setSelectedMatch(buildMatch(f))}>
        <View style={styles.matchCardHeader}>
          {f.league?.round ? <Text style={styles.roundLabel}>{f.league.round}</Text> : null}
          {isLive ? <Text style={styles.liveLabel}>● LIVE {f.fixture.status.elapsed}'</Text> : null}
          {isFinished ? <Text style={styles.finishedLabel}>Termine</Text> : null}
          {!isLive && !isFinished ? (
            <Text style={styles.dateLabel}>
              {new Date(f.fixture.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}
              {' · '}
              {new Date(f.fixture.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
            </Text>
          ) : null}
          <Text style={styles.tapHint}>See details →</Text>
        </View>
        <View style={styles.matchTeams}>
          <View style={styles.matchTeamLeft}>
            {f.teams.home.logo ? <Image source={{ uri:f.teams.home.logo }} style={styles.matchLogo} onError={function(){}} /> : null}
            <Text style={styles.matchTeamName} numberOfLines={1}>{f.teams.home.name}</Text>
          </View>
          <Text style={[styles.matchScore, isLive && { color:'#ff1744' }]}>
            {isFinished || isLive ? String(f.goals.home||0)+' - '+String(f.goals.away||0) : 'VS'}
          </Text>
          <View style={styles.matchTeamRight}>
            <Text style={styles.matchTeamName} numberOfLines={1}>{f.teams.away.name}</Text>
            {f.teams.away.logo ? <Image source={{ uri:f.teams.away.logo }} style={styles.matchLogo} onError={function(){}} /> : null}
          </View>
        </View>
        {f.fixture.venue?.name ? <Text style={styles.venueText}>📍 {f.fixture.venue.name}, {f.fixture.venue.city}</Text> : null}
      </TouchableOpacity>
    );
  }

  function GroupTable({ group }) {
    const groupName = group[0]?.group || 'Groupe';
    const color = selectedLeague?.color || '#006341';
    return (
      <View style={styles.groupCard}>
        <Text style={[styles.groupTitle, { color }]}>{groupName}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex:1, textAlign:'left' }]}>Equipe</Text>
          <Text style={[styles.tableHeaderText, { width:24 }]}>MJ</Text>
          <Text style={[styles.tableHeaderText, { width:24 }]}>V</Text>
          <Text style={[styles.tableHeaderText, { width:24 }]}>N</Text>
          <Text style={[styles.tableHeaderText, { width:24 }]}>D</Text>
          <Text style={[styles.tableHeaderText, { width:28 }]}>Pts</Text>
          <Text style={[styles.tableHeaderText, { width:32 }]}>★</Text>
        </View>
        {group.map(function(t, i) {
          return (
            <TouchableOpacity key={i}
              style={[styles.tableRow, {
                backgroundColor: i%2===0 ? '#16162a' : '#0d0d1a',
                borderLeftColor: i<2 ? color : '#ffffff14', borderLeftWidth:3,
              }]}
              onPress={() => setSelectedTeam(t.team)}>
              <View style={[styles.tableTeam, { flex:1 }]}>
                {t.team.logo ? <Image source={{ uri:t.team.logo }} style={styles.teamLogoSmall} onError={function(){}} /> : null}
                <Text style={styles.tableTeamName} numberOfLines={1}>{t.team.name}</Text>
              </View>
              <Text style={[styles.tableCell, { width:24, color:'#ffffff88' }]}>{String(t.all.played)}</Text>
              <Text style={[styles.tableCell, { width:24 }]}>{String(t.all.win)}</Text>
              <Text style={[styles.tableCell, { width:24, color:'#ffffff66' }]}>{String(t.all.draw)}</Text>
              <Text style={[styles.tableCell, { width:24, color:'#ffffff44' }]}>{String(t.all.lose)}</Text>
              <Text style={[styles.tableCell, { width:28, color:'#FFD700', fontWeight:'700' }]}>{String(t.points)}</Text>
              <TouchableOpacity onPress={() => toggleFavorite(t.team)} style={{ width:32, alignItems:'center' }}>
                <Text style={{ fontSize:14, color: isFav(t.team.name) ? '#FFD700' : '#ffffff33' }}>★</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // === PAGE LIGUE ===
  if (selectedLeague) {
    const isWC = selectedLeague.id === 'wc';
    const color = selectedLeague.color;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedLeague(null); }}>
            <Text style={styles.backBtnText}>← {selectedCountry ? selectedCountry.name : 'Football'}</Text>
          </TouchableOpacity>
          <Text style={styles.leagueTitle}>{selectedLeague.name}</Text>
        </View>

        {isWC ? (
          <View style={{ flex:1 }}>
            <View style={styles.tabBar}>
              {[{id:'matchs',label:'Matchs'},{id:'groupes',label:'Groupes'}].map(function(t) {
                return (
                  <TouchableOpacity key={t.id} style={[styles.tabBtn, wcTab===t.id&&{backgroundColor:color}]} onPress={() => setWcTab(t.id)}>
                    <Text style={[styles.tabBtnText, wcTab===t.id&&{color:'#fff'}]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {loading ? <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View> : (
              <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {wcTab === 'matchs' && (
                  wcFixtures.length === 0 ?
                    <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de matchs cette semaine</Text></View> :
                    wcFixtures.map(function(f) { return <FixtureCard key={f.fixture.id} f={f} color={color} />; })
                )}
                {wcTab === 'groupes' && (
                  <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
                      <View style={styles.groupSelector}>
                        {wcGroups.map(function(group, i) {
                          const gName = group[0]?.group?.replace('Group ','') || String.fromCharCode(65+i);
                          return (
                            <TouchableOpacity key={i} style={[styles.groupBtn, selectedGroup===i&&{backgroundColor:color}]} onPress={() => setSelectedGroup(i)}>
                              <Text style={[styles.groupBtnText, selectedGroup===i&&{color:'#fff'}]}>{gName}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                    {selectedGroup !== null && wcGroups[selectedGroup] && <GroupTable group={wcGroups[selectedGroup]} />}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={{ flex:1 }}>
            <View style={styles.tabBar}>
              {[{id:'matchs',label:'Matchs'},{id:'classement',label:'Classement'}].map(function(t) {
                return (
                  <TouchableOpacity key={t.id} style={[styles.tabBtn, tab===t.id&&{backgroundColor:color}]} onPress={() => setTab(t.id)}>
                    <Text style={[styles.tabBtnText, tab===t.id&&{color:'#fff'}]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {loading ? <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View> : (
              <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {tab === 'matchs' && (
                  fixtures.length === 0 ?
                    <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de matchs cette semaine</Text></View> :
                    fixtures.map(function(f) { return <FixtureCard key={f.fixture.id} f={f} color={color} />; })
                )}
                {tab === 'classement' && (
                  <View>
                    <Text style={styles.seasonLabel}>SAISON {SEASON_LABELS.FOOTBALL}</Text>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { width:24 }]}>#</Text>
                      <Text style={[styles.tableHeaderText, { flex:1, textAlign:'left' }]}>Equipe</Text>
                      <Text style={[styles.tableHeaderText, { width:28 }]}>MJ</Text>
                      <Text style={[styles.tableHeaderText, { width:28 }]}>V</Text>
                      <Text style={[styles.tableHeaderText, { width:28 }]}>D</Text>
                      <Text style={[styles.tableHeaderText, { width:32 }]}>Pts</Text>
                      <Text style={[styles.tableHeaderText, { width:32 }]}>★</Text>
                    </View>
                    {standings.map(function(t, i) {
                      return (
                        <TouchableOpacity key={i}
                          style={[styles.tableRow, {
                            backgroundColor: i%2===0 ? '#16162a' : '#0d0d1a',
                            borderLeftColor: i===0 ? '#FFD700' : i<4 ? color : '#ffffff22', borderLeftWidth:3,
                          }]}
                          onPress={() => setSelectedTeam(t.team)}>
                          <Text style={[styles.tableCell, { width:24, color:'#ffffff55' }]}>{String(t.rank)}</Text>
                          <View style={[styles.tableTeam, { flex:1 }]}>
                            {t.team.logo ? <Image source={{ uri:t.team.logo }} style={styles.teamLogoSmall} onError={function(){}} /> : null}
                            <Text style={styles.tableTeamName} numberOfLines={1}>{t.team.name}</Text>
                          </View>
                          <Text style={[styles.tableCell, { width:28, color:'#ffffff55' }]}>{String(t.all.played)}</Text>
                          <Text style={[styles.tableCell, { width:28 }]}>{String(t.all.win)}</Text>
                          <Text style={[styles.tableCell, { width:28, color:'#ffffff44' }]}>{String(t.all.lose)}</Text>
                          <Text style={[styles.tableCell, { width:32, color:'#FFD700' }]}>{String(t.points)}</Text>
                          <TouchableOpacity onPress={() => toggleFavorite(t.team)} style={{ width:32, alignItems:'center' }}>
                            <Text style={{ fontSize:16, color: isFav(t.team.name) ? '#FFD700' : '#ffffff33' }}>★</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  // === PAGE PAYS ===
  if (selectedCountry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedCountry(null)}>
            <Text style={styles.backBtnText}>← Football</Text>
          </TouchableOpacity>
          <Text style={styles.leagueTitle}>{selectedCountry.flag} {selectedCountry.name}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {selectedCountry.leagues.map(function(l) {
            return (
              <TouchableOpacity key={l.id}
                style={[styles.leagueCard, { borderLeftColor:l.color }]}
                activeOpacity={0.8}
                onPress={() => selectLeague(l)}>
                <View style={[styles.leagueColorDot, { backgroundColor:l.color }]} />
                <Text style={styles.leagueName}>{l.name}</Text>
                <Text style={styles.leagueArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // === PAGE PRINCIPALE ===
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>FOOT</Text>
          <GradientText text="BALL" fontSize={22} letterSpacing={1} />
        </View>
      </View>

      <TouchableOpacity style={styles.wcBanner} activeOpacity={0.8} onPress={() => selectLeague(WC_LEAGUE)}>
        <LinearGradient colors={['#006341','#004d30']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.wcBannerGradient}>
          <View style={styles.wcBannerContent}>
            <Text style={styles.wcBannerIcon}>🌍</Text>
            <View>
              <Text style={styles.wcBannerTitle}>COUPE DU MONDE 2026</Text>
              <Text style={styles.wcBannerSub}>USA · Canada · Mexique · 11 juin - 19 juillet</Text>
            </View>
            <Text style={styles.wcBannerArrow}>›</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>PAYS ET COMPETITIONS</Text>
        {COUNTRIES.map(function(country) {
          return (
            <TouchableOpacity key={country.id}
              style={[styles.countryCard, { borderLeftColor:country.color }]}
              activeOpacity={0.8}
              onPress={() => setSelectedCountry(country)}>
              <Text style={styles.countryFlag}>{country.flag}</Text>
              <View style={{ flex:1 }}>
                <Text style={styles.countryName}>{country.name}</Text>
                <Text style={styles.countryLeagues}>
                  {country.leagues.map(function(l) { return l.name; }).join(' · ')}
                </Text>
              </View>
              <Text style={styles.leagueArrow}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { padding:16, paddingBottom:8 },
  backBtnText: { color:'#ffffff66', fontSize:14, marginBottom:6 },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  leagueTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:1 },
  wcBanner: { marginHorizontal:16, marginBottom:12, borderRadius:14, overflow:'hidden' },
  wcBannerGradient: { borderRadius:14 },
  wcBannerContent: { flexDirection:'row', alignItems:'center', padding:16, gap:12 },
  wcBannerIcon: { fontSize:32 },
  wcBannerTitle: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1 },
  wcBannerSub: { color:'#ffffffcc', fontSize:10, marginTop:2 },
  wcBannerArrow: { color:'#ffffff55', fontSize:24, marginLeft:'auto' },
  sectionLabel: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  seasonLabel: { color:'#ffffff44', fontFamily:'BebasNeue', fontSize:10, letterSpacing:2, marginBottom:8 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginTop:0, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  scroll: { padding:16, paddingBottom:40 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  countryCard: { backgroundColor:'#16162a', borderRadius:12, padding:14, marginBottom:8, borderLeftWidth:3, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#ffffff0a', gap:12 },
  countryFlag: { fontSize:24 },
  countryName: { color:'#fff', fontFamily:'BebasNeue', fontSize:15, letterSpacing:0.5 },
  countryLeagues: { color:'#ffffff55', fontSize:9, marginTop:2 },
  leagueColorDot: { width:8, height:8, borderRadius:4 },
  leagueCard: { backgroundColor:'#16162a', borderRadius:12, padding:16, marginBottom:8, borderLeftWidth:3, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#ffffff0a', gap:10 },
  leagueName: { color:'#fff', fontFamily:'BebasNeue', fontSize:16, letterSpacing:0.5, flex:1 },
  leagueArrow: { color:'#ffffff33', fontSize:22 },
  groupSelector: { flexDirection:'row', gap:6, paddingHorizontal:2 },
  groupBtn: { width:36, height:36, borderRadius:18, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22', alignItems:'center', justifyContent:'center' },
  groupBtnText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:13 },
  groupCard: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:12, borderWidth:1, borderColor:'#ffffff14' },
  groupTitle: { fontFamily:'BebasNeue', fontSize:14, letterSpacing:2, marginBottom:8 },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:4, paddingVertical:4, marginBottom:4 },
  tableHeaderText: { color:'#ffffff55', fontSize:9, fontWeight:'600', textAlign:'center' },
  tableRow: { flexDirection:'row', alignItems:'center', padding:7, borderRadius:6, marginBottom:2 },
  tableTeam: { flexDirection:'row', alignItems:'center', gap:6 },
  teamLogoSmall: { width:18, height:18, resizeMode:'contain' },
  tableTeamName: { color:'#fff', fontSize:11, flex:1 },
  tableCell: { textAlign:'center', color:'#fff', fontSize:11, fontFamily:'BebasNeue' },
  matchCard: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  matchCardHeader: { flexDirection:'row', alignItems:'center', marginBottom:8, gap:6, flexWrap:'wrap' },
  roundLabel: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:10, letterSpacing:0.5 },
  liveLabel: { color:'#ff1744', fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  finishedLabel: { color:'#ffffff44', fontSize:10 },
  dateLabel: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  matchTeams: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  matchTeamLeft: { flexDirection:'row', alignItems:'center', gap:6, flex:1 },
  matchTeamRight: { flexDirection:'row', alignItems:'center', gap:6, flex:1, justifyContent:'flex-end' },
  matchLogo: { width:28, height:28, resizeMode:'contain' },
  matchTeamName: { color:'#fff', fontSize:12, fontWeight:'600', flex:1 },
  matchScore: { fontFamily:'BebasNeue', fontSize:22, color:'#fff', marginHorizontal:8 },
  venueText: { color:'#ffffff44', fontSize:9, marginTop:6 },
  emptyBox: { padding:20, backgroundColor:'#16162a', borderRadius:12, alignItems:'center' },
  emptyText: { color:'#ffffff66', fontSize:13, fontFamily:'BebasNeue' },
  backToScreen: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff14', padding:16, alignItems:'center' },
  backToScreenText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});
