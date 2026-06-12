import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import { supabase } from '../api/supabase';
import MatchDetailScreen from './MatchDetailScreen';
import MLBTeamScreen from './MLBTeamScreen';

const H_MLB = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.baseball.api-sports.io' };

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function MLBScreen({ onBack, user }) {
  const [tab, setTab] = useState('live');
  const [liveGames, setLiveGames] = useState([]);
  const [standings, setStandings] = useState({ al:[], nl:[] });
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const C = '#E53935';

  const TABS = [
    { id:'live', label:'🔴 Live' },
    { id:'al', label:'AL' },
    { id:'nl', label:'NL' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date().toISOString().slice(0,10);
        const liveRes = await fetch(
          'https://v1.baseball.api-sports.io/games?league=1&season=2026&date=' + today,
          { headers: H_MLB }
        );
        const liveData = await liveRes.json();
        setLiveGames(liveData.response || []);

        const standRes = await fetch(
          'https://v1.baseball.api-sports.io/standings?league=1&season=2026',
          { headers: H_MLB }
        );
        const standData = await standRes.json();
        let al = [];
        let nl = [];
        (standData.response || []).forEach(function(group) {
          if (!Array.isArray(group)) return;
          group.forEach(function(t) {
            const gname = (t.group && t.group.name || '').toLowerCase();
            if (gname.includes('american')) al.push(t);
            else if (gname.includes('national')) nl.push(t);
          });
        });
        setStandings({ al, nl });

        if (user) {
          const { data } = await supabase.from('favorites')
            .select('*').eq('user_id', user.id).eq('sport', 'baseball');
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
        user_id: user.id, sport: 'baseball', team_name: team.name,
        league: 'MLB', logo_url: team.logo || null, team_id: team.id || null,
      }).select();
      if (data) setFavorites([...favorites, data[0]]);
    }
  }

  function isFav(name) { return favorites.some(function(f) { return f.team_name === name; }); }

  function buildMatch(g) {
    return {
      id: g.id,
      home: g.teams.home.name, homeLogo: g.teams.home.logo,
      away: g.teams.away.name, awayLogo: g.teams.away.logo,
      homeId: g.teams.home.id, awayId: g.teams.away.id,
      homeScore: g.scores.home.total, awayScore: g.scores.away.total,
      isLive: g.status.short === 'IN_PROGRESS',
      isFinished: g.status.long === 'Finished',
      status: g.status.short, date: g.date,
    };
  }

  if (selectedTeam) {
    return <MLBTeamScreen team={selectedTeam} onBack={() => setSelectedTeam(null)} />;
  }

  if (selectedMatch) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedMatch} sport="MLB" color={C} onBack={() => setSelectedMatch(null)} />
        <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.backToScreen}>
          <Text style={styles.backToScreenText}>← Back</Text>
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
          <Text style={[styles.tableHeaderText, { width:32 }]}>★</Text>
        </View>
        {data.map(function(t, i) {
          const wins = t.games && t.games.win ? (typeof t.games.win === 'object' ? t.games.win.total || 0 : t.games.win) : 0;
          const losses = t.games && t.games.lose ? (typeof t.games.lose === 'object' ? t.games.lose.total || 0 : t.games.lose) : 0;
          return (
            <TouchableOpacity key={i} onPress={() => t.team && setSelectedTeam(t.team)} activeOpacity={0.8} style={[styles.tableRow, {
              backgroundColor: i % 2 === 0 ? '#16162a' : '#0d0d1a',
              borderLeftColor: i === 0 ? '#FFD700' : i < 3 ? C : '#ffffff22',
              borderLeftWidth: 3,
            }]}>
              <Text style={[styles.tableCell, { width:24, color:'#ffffff55' }]}>{String(i+1)}</Text>
              <View style={[styles.tableTeam, { flex:1 }]}>
                {t.team && t.team.logo ? <Image source={{ uri: t.team.logo }} style={styles.teamLogoSmall} onError={function(){}} /> : null}
                <Text style={styles.tableTeamName} numberOfLines={1}>{t.team ? t.team.name : '-'}</Text>
              </View>
              <Text style={[styles.tableCell, { width:32 }]}>{String(wins)}</Text>
              <Text style={[styles.tableCell, { width:32, color:'#ffffff44' }]}>{String(losses)}</Text>
              <TouchableOpacity onPress={() => t.team && toggleFavorite(t.team)} style={{ width:32, alignItems:'center' }}>
                <Text style={{ fontSize:16, color: isFav(t.team && t.team.name) ? '#FFD700' : '#ffffff33' }}>★</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>MLB </Text>
          <GradientText text="2026" fontSize={22} letterSpacing={1} />
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

          {tab === 'live' && (
            <View>
              {liveGames.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de match aujourd'hui</Text></View>
              ) : liveGames.map(function(g) {
                const isLive = g.status.short === 'IN_PROGRESS';
                const isFinished = g.status.long === 'Finished';
                return (
                  <TouchableOpacity key={g.id}
                    style={[styles.matchCard, isLive && { borderColor: C, borderWidth:1 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedMatch(buildMatch(g))}>
                    <View style={styles.matchCardHeader}>
                      {isLive ? <Text style={styles.liveLabel}>● LIVE Inn.{g.status.inning}</Text> : null}
                      {isFinished ? <Text style={styles.finishedLabel}>Terminé</Text> : null}
                      {!isLive && !isFinished ? <Text style={styles.dateLabel}>
                        {new Date(g.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                      </Text> : null}
                      <Text style={styles.tapHint}>Voir détails →</Text>
                    </View>
                    <View style={styles.matchTeams}>
                      <View style={styles.matchTeamLeft}>
                        {g.teams.home.logo ? <Image source={{ uri: g.teams.home.logo }} style={styles.matchLogo} onError={function(){}} /> : null}
                        <Text style={styles.matchTeamName} numberOfLines={1}>{g.teams.home.name}</Text>
                      </View>
                      <Text style={[styles.matchScore, isLive && { color:'#ff1744' }]}>
                        {isFinished || isLive
                          ? String(g.scores.home.total||0) + ' - ' + String(g.scores.away.total||0)
                          : 'VS'}
                      </Text>
                      <View style={styles.matchTeamRight}>
                        <Text style={styles.matchTeamName} numberOfLines={1}>{g.teams.away.name}</Text>
                        {g.teams.away.logo ? <Image source={{ uri: g.teams.away.logo }} style={styles.matchLogo} onError={function(){}} /> : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'al' && <StandingsTable data={standings.al} />}
          {tab === 'nl' && <StandingsTable data={standings.nl} />}

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
  matchCard: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  matchCardHeader: { flexDirection:'row', alignItems:'center', marginBottom:8, gap:8 },
  liveLabel: { color:'#ff1744', fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  finishedLabel: { color:'#ffffff44', fontSize:10 },
  dateLabel: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:11 },
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
  backToScreen: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff14', padding:16, alignItems:'center' },
  backToScreenText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});