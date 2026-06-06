import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { API_SPORTS_KEY } from '../api/config';
import { supabase } from '../api/supabase';
import MatchDetailScreen from './MatchDetailScreen';

const H_NBA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function NBAScreen({ onBack, user }) {
  const [tab, setTab] = useState('finales');
  const [standings, setStandings] = useState({ east:[], west:[] });
  const [finalesGames, setFinalesGames] = useState([]);
  const [liveGames, setLiveGames] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const C = '#1D428A';

  const TABS = [
    { id:'finales', label:'🏆 Finales' },
    { id:'live', label:'🔴 Live' },
    { id:'east', label:'Est' },
    { id:'west', label:'Ouest' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const standRes = await fetch(
          'https://v2.nba.api-sports.io/standings?league=standard&season=2025',
          { headers: H_NBA }
        );
        const standData = await standRes.json();
        const east = (standData.response || [])
          .filter(function(t) { return t.conference.name === 'east'; })
          .sort(function(a,b) { return a.conference.rank - b.conference.rank; });
        const west = (standData.response || [])
          .filter(function(t) { return t.conference.name === 'west'; })
          .sort(function(a,b) { return a.conference.rank - b.conference.rank; });
        setStandings({ east, west });

        const finRes = await fetch(
          'https://v2.nba.api-sports.io/games?league=standard&season=2025&team=31',
          { headers: H_NBA }
        );
        const finData = await finRes.json();
        const finales = (finData.response || [])
          .filter(function(g) {
            return g.stage === 3 && (
              g.teams.home.id === 24 || g.teams.visitors.id === 24
            );
          })
          .sort(function(a,b) { return new Date(a.date.start) - new Date(b.date.start); });
        setFinalesGames(finales);

        const today = new Date().toISOString().slice(0,10);
        const liveRes = await fetch(
          'https://v2.nba.api-sports.io/games?league=standard&season=2025&date=' + today,
          { headers: H_NBA }
        );
        const liveData = await liveRes.json();
        setLiveGames(liveData.response || []);

        if (user) {
          const { data } = await supabase.from('favorites')
            .select('*').eq('user_id', user.id).eq('sport', 'basketball');
          setFavorites(data || []);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [user]);

  async function toggleFavorite(team) {
    if (!user) return;
    const existing = favorites.find(function(f) { return f.team_name === team.name; });
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites(favorites.filter(function(f) { return f.id !== existing.id; }));
    } else {
      const { data } = await supabase.from('favorites').insert({
        user_id: user.id, sport: 'basketball', team_name: team.name,
        league: 'NBA', logo_url: team.logo || null, team_id: team.id || null,
      }).select();
      if (data) setFavorites([...favorites, data[0]]);
    }
  }

  function isFavorite(teamName) {
    return favorites.some(function(f) { return f.team_name === teamName; });
  }

  function buildMatch(g) {
    return {
      id: g.id,
      home: g.teams.home.name,
      away: g.teams.visitors.name,
      homeLogo: g.teams.home.logo,
      awayLogo: g.teams.visitors.logo,
      homeId: g.teams.home.id,
      awayId: g.teams.visitors.id,
      homeScore: g.scores.home.points,
      awayScore: g.scores.visitors.points,
      isLive: ['Q1','Q2','Q3','Q4','HT','OT'].indexOf(g.status.short) >= 0,
      isFinished: g.status.long === 'Finished',
      status: g.status.short,
      date: g.date.start,
    };
  }

  let sasWins = 0;
  let nykWins = 0;
  let nykLogo = null;

  finalesGames.forEach(function(g) {
    if (!nykLogo) {
      if (g.teams.home.id === 24) nykLogo = g.teams.home.logo;
      else if (g.teams.visitors.id === 24) nykLogo = g.teams.visitors.logo;
    }
    if (g.status.long === 'Finished') {
      const homeSas = g.teams.home.id === 31;
      const sasScore = homeSas ? g.scores.home.points : g.scores.visitors.points;
      const nykScore = homeSas ? g.scores.visitors.points : g.scores.home.points;
      if (sasScore > nykScore) sasWins++;
      else nykWins++;
    }
  });

  if (selectedMatch) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen
          match={selectedMatch}
          sport="NBA"
          color={C}
          onBack={() => setSelectedMatch(null)}
        />
        <TouchableOpacity
          onPress={() => setSelectedMatch(null)}
          style={styles.backToNBA}>
          <Text style={styles.backToNBAText}>← Retour NBA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function StandingsTable({ data }) {
    return (
      <View>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width:24 }]}>#</Text>
          <Text style={[styles.tableHeaderText, { flex:1, textAlign:'left' }]}>Équipe</Text>
          <Text style={[styles.tableHeaderText, { width:32 }]}>V</Text>
          <Text style={[styles.tableHeaderText, { width:32 }]}>D</Text>
          <Text style={[styles.tableHeaderText, { width:40 }]}>%</Text>
          <Text style={[styles.tableHeaderText, { width:32 }]}>★</Text>
        </View>
        {data.map(function(t, i) {
          const wins = typeof t.win === 'object' ? (t.win.total || 0) : (t.win || 0);
          const losses = typeof t.loss === 'object' ? (t.loss.total || 0) : (t.loss || 0);
          const total = wins + losses;
          const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
          return (
            <View key={i} style={[styles.tableRow, {
              backgroundColor: i % 2 === 0 ? '#16162a' : '#0d0d1a',
              borderLeftColor: i === 0 ? '#FFD700' : i < 6 ? C : '#ffffff22',
              borderLeftWidth: 3,
            }]}>
              <Text style={[styles.tableCell, { width:24, color:'#ffffff55' }]}>{String(t.conference.rank)}</Text>
              <View style={[styles.tableTeam, { flex:1 }]}>
                {t.team.logo ? <Image source={{ uri: t.team.logo }} style={styles.teamLogoSmall} onError={function(){}} /> : null}
                <Text style={styles.tableTeamName} numberOfLines={1}>{t.team.name}</Text>
              </View>
              <Text style={[styles.tableCell, { width:32 }]}>{String(wins)}</Text>
              <Text style={[styles.tableCell, { width:32, color:'#ffffff44' }]}>{String(losses)}</Text>
              <Text style={[styles.tableCell, { width:40, color:'#FFD700' }]}>{String(pct) + '%'}</Text>
              <TouchableOpacity onPress={() => toggleFavorite(t.team)} style={{ width:32, alignItems:'center' }}>
                <Text style={{ fontSize:16, color: isFavorite(t.team.name) ? '#FFD700' : '#ffffff33' }}>★</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>NBA </Text>
          <GradientText text="2025" fontSize={22} letterSpacing={1} />
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(function(t) {
          return (
            <TouchableOpacity key={t.id} style={[styles.tabBtn, tab === t.id && { backgroundColor: C }]} onPress={() => setTab(t.id)}>
              <Text style={[styles.tabBtnText, tab === t.id && { color:'#fff' }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {tab === 'finales' && (
            <View>
              <View style={styles.finalesCard}>
                <Text style={styles.finalesTitle}>🏆 FINALES NBA 2026</Text>
                <Text style={styles.finalesSub}>Best of 7</Text>
                <View style={styles.finalesTeams}>
                  <View style={styles.finalesTeam}>
                    <View style={[styles.logoPlaceholder, { backgroundColor:'#C0392B22', borderColor:'#C0392B44' }]}>
                      <Text style={[styles.logoPlaceholderText, { color:'#C0392B' }]}>SAS</Text>
                    </View>
                    <Text style={styles.finalesTeamName}>SPURS</Text>
                    <Text style={[styles.finalesScore, { color:'#C0392B' }]}>{String(sasWins)}</Text>
                  </View>
                  <View style={styles.finalesMiddle}>
                    <Text style={styles.finalesVs}>-</Text>
                    <Text style={styles.finalesSerieLabel}>VICTOIRES</Text>
                  </View>
                  <View style={styles.finalesTeam}>
                    {nykLogo ? (
                      <Image source={{ uri: nykLogo }} style={styles.finalesLogo} onError={function(){}} />
                    ) : (
                      <View style={[styles.logoPlaceholder, { backgroundColor:'#1D428A22', borderColor:'#1D428A44' }]}>
                        <Text style={[styles.logoPlaceholderText, { color:'#1D428A' }]}>NYK</Text>
                      </View>
                    )}
                    <Text style={styles.finalesTeamName}>KNICKS</Text>
                    <Text style={[styles.finalesScore, { color:C }]}>{String(nykWins)}</Text>
                  </View>
                </View>
              </View>

              {finalesGames.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Pas de données pour les finales</Text>
                </View>
              ) : finalesGames.map(function(g, i) {
                const isLive = ['Q1','Q2','Q3','Q4','HT','OT'].indexOf(g.status.short) >= 0;
                const isFinished = g.status.long === 'Finished';
                const homeScore = g.scores.home.points;
                const awayScore = g.scores.visitors.points;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.matchCard, isLive && { borderColor: C, borderWidth:1 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedMatch(buildMatch(g))}>
                    <View style={styles.matchCardHeader}>
                      <Text style={styles.matchLabel}>MATCH {i+1}</Text>
                      <Text style={styles.matchDateLabel}>
                        {new Date(g.date.start).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}
                      </Text>
                      {isLive ? <Text style={styles.liveLabel}>● LIVE {g.status.short}</Text> : null}
                      {isFinished ? <Text style={styles.finishedLabel}>Terminé</Text> : null}
                      <Text style={styles.tapHint}>Voir détails →</Text>
                    </View>
                    <View style={styles.matchTeams}>
                      <View style={styles.matchTeamLeft}>
                        {g.teams.home.logo ? <Image source={{ uri: g.teams.home.logo }} style={styles.matchLogo} onError={function(){}} /> : null}
                        <Text style={styles.matchTeamName} numberOfLines={1}>{g.teams.home.name}</Text>
                      </View>
                      <Text style={[styles.matchScore, isLive && { color:'#ff1744' }]}>
                        {isFinished || isLive
                          ? String(homeScore || 0) + ' - ' + String(awayScore || 0)
                          : 'VS'}
                      </Text>
                      <View style={styles.matchTeamRight}>
                        <Text style={styles.matchTeamName} numberOfLines={1}>{g.teams.visitors.name}</Text>
                        {g.teams.visitors.logo ? <Image source={{ uri: g.teams.visitors.logo }} style={styles.matchLogo} onError={function(){}} /> : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'live' && (
            <View>
              {liveGames.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de match aujourd'hui</Text></View>
              ) : liveGames.map(function(g) {
                const isLive = ['Q1','Q2','Q3','Q4','HT','OT'].indexOf(g.status.short) >= 0;
                const isFinished = g.status.long === 'Finished';
                const homeScore = g.scores.home.points || 0;
                const awayScore = g.scores.visitors.points || 0;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.matchCard, isLive && { borderColor: C, borderWidth:1 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedMatch(buildMatch(g))}>
                    <View style={styles.matchCardHeader}>
                      {isLive ? <Text style={styles.liveLabel}>● LIVE {g.status.short}</Text> : null}
                      {isFinished ? <Text style={styles.finishedLabel}>Terminé</Text> : null}
                      {!isLive && !isFinished ? <Text style={styles.matchDateLabel}>
                        {new Date(g.date.start).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                      </Text> : null}
                      <Text style={styles.tapHint}>Voir détails →</Text>
                    </View>
                    <View style={styles.matchTeams}>
                      <View style={styles.matchTeamLeft}>
                        {g.teams.home.logo ? <Image source={{ uri: g.teams.home.logo }} style={styles.matchLogo} onError={function(){}} /> : null}
                        <Text style={styles.matchTeamName} numberOfLines={1}>{g.teams.home.name}</Text>
                      </View>
                      <Text style={[styles.matchScore, isLive && { color:'#ff1744' }]}>
                        {String(homeScore) + ' - ' + String(awayScore)}
                      </Text>
                      <View style={styles.matchTeamRight}>
                        <Text style={styles.matchTeamName} numberOfLines={1}>{g.teams.visitors.name}</Text>
                        {g.teams.visitors.logo ? <Image source={{ uri: g.teams.visitors.logo }} style={styles.matchLogo} onError={function(){}} /> : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'east' && <StandingsTable data={standings.east} />}
          {tab === 'west' && <StandingsTable data={standings.west} />}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { padding:16, paddingBottom:8 },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginTop:0, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  scroll: { padding:16, paddingBottom:40 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  finalesCard: { backgroundColor:'#16162a', borderRadius:14, padding:16, borderWidth:1, borderColor:'#FFD70033', marginBottom:16 },
  finalesTitle: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:14, letterSpacing:2, textAlign:'center', marginBottom:2 },
  finalesSub: { color:'#ffffff33', fontSize:10, textAlign:'center', marginBottom:14 },
  finalesTeams: { flexDirection:'row', justifyContent:'space-around', alignItems:'center' },
  finalesTeam: { alignItems:'center', gap:6, flex:1 },
  finalesLogo: { width:56, height:56, resizeMode:'contain', marginBottom:4 },
  logoPlaceholder: { width:56, height:56, borderRadius:28, borderWidth:1, alignItems:'center', justifyContent:'center', marginBottom:4 },
  logoPlaceholderText: { fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  finalesTeamName: { color:'#fff', fontFamily:'BebasNeue', fontSize:13, letterSpacing:1 },
  finalesScore: { fontFamily:'BebasNeue', fontSize:40 },
  finalesMiddle: { alignItems:'center', gap:4 },
  finalesVs: { color:'#ffffff22', fontFamily:'BebasNeue', fontSize:28 },
  finalesSerieLabel: { color:'#ffffff33', fontSize:8, letterSpacing:1 },
  matchCard: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  matchCardHeader: { flexDirection:'row', alignItems:'center', marginBottom:8, gap:8, flexWrap:'wrap' },
  matchLabel: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:11, letterSpacing:1 },
  matchDateLabel: { color:'#ffffff55', fontSize:10 },
  liveLabel: { color:'#ff1744', fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  finishedLabel: { color:'#ffffff44', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  matchTeams: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  matchTeamLeft: { flexDirection:'row', alignItems:'center', gap:6, flex:1 },
  matchTeamRight: { flexDirection:'row', alignItems:'center', gap:6, flex:1, justifyContent:'flex-end' },
  matchLogo: { width:24, height:24, resizeMode:'contain' },
  matchTeamName: { color:'#fff', fontSize:11, fontWeight:'600', flex:1 },
  matchScore: { fontFamily:'BebasNeue', fontSize:22, color:'#fff', marginHorizontal:8 },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, marginBottom:4 },
  tableHeaderText: { color:'#ffffff33', fontSize:10, fontWeight:'600', textAlign:'center' },
  tableRow: { flexDirection:'row', alignItems:'center', padding:8, borderRadius:6, marginBottom:2 },
  tableTeam: { flexDirection:'row', alignItems:'center', gap:6 },
  teamLogoSmall: { width:18, height:18, resizeMode:'contain' },
  tableTeamName: { color:'#fff', fontSize:11, flex:1 },
  tableCell: { textAlign:'center', color:'#fff', fontSize:11, fontFamily:'BebasNeue' },
  emptyBox: { padding:20, backgroundColor:'#16162a', borderRadius:12, alignItems:'center' },
  emptyText: { color:'#ffffff44', fontSize:13, fontFamily:'BebasNeue' },
  backToNBA: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff14', padding:16, alignItems:'center' },
  backToNBAText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});
