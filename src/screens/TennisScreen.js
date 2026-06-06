import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { RAPIDAPI_KEY } from '../api/config';
import { supabase } from '../api/supabase';
import MatchDetailScreen from './MatchDetailScreen';

const H_TEN = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'tennisapi1.p.rapidapi.com' };

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function TennisScreen({ onBack, user }) {
  const [tab, setTab] = useState('matchs');
  const [atpMatches, setAtpMatches] = useState([]);
  const [atpRankings, setAtpRankings] = useState([]);
  const [wtaRankings, setWtaRankings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const C = '#c85a19';

  const TABS = [
    { id:'matchs', label:'Matchs' },
    { id:'rankAtp', label:'ATP' },
    { id:'rankWta', label:'WTA' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const atpRes = await fetch(
          'https://tennisapi1.p.rapidapi.com/api/tennis/tournament/2480/season/85951/events/next/0',
          { headers: H_TEN }
        );
        const atpData = await atpRes.json();
        setAtpMatches(atpData.events || []);

        const rankAtpRes = await fetch(
          'https://tennisapi1.p.rapidapi.com/api/tennis/rankings/atp',
          { headers: H_TEN }
        );
        const rankAtpData = await rankAtpRes.json();
        setAtpRankings(rankAtpData.rankings?.slice(0,30) || []);

        const rankWtaRes = await fetch(
          'https://tennisapi1.p.rapidapi.com/api/tennis/rankings/wta',
          { headers: H_TEN }
        );
        const rankWtaData = await rankWtaRes.json();
        setWtaRankings(rankWtaData.rankings?.slice(0,30) || []);

        if (user) {
          const { data } = await supabase.from('favorites')
            .select('*').eq('user_id', user.id).eq('sport', 'tennis');
          setFavorites(data || []);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [user]);

  async function toggleFavorite(playerName) {
    if (!user) return;
    const existing = favorites.find(function(f) { return f.team_name === playerName; });
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites(favorites.filter(function(f) { return f.id !== existing.id; }));
    } else {
      const { data } = await supabase.from('favorites').insert({
        user_id: user.id, sport: 'tennis', team_name: playerName, league: 'ATP/WTA',
      }).select();
      if (data) setFavorites([...favorites, data[0]]);
    }
  }

  function isFav(name) { return favorites.some(function(f) { return f.team_name === name; }); }

  function buildMatch(m) {
    return {
      id: m.id,
      home: m.homeTeam?.name || 'Joueur 1',
      away: m.awayTeam?.name || 'Joueur 2',
      homeLogo: null, awayLogo: null,
      homeId: m.homeTeam?.id, awayId: m.awayTeam?.id,
      homeScore: m.homeScore?.current || 0,
      awayScore: m.awayScore?.current || 0,
      isLive: m.status?.type === 'inprogress',
      isFinished: m.status?.type === 'finished',
      status: m.status?.description || '',
      date: m.startTimestamp ? new Date(m.startTimestamp * 1000).toISOString() : null,
    };
  }

  if (selectedMatch) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedMatch} sport="TENNIS" color={C} onBack={() => setSelectedMatch(null)} />
        <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.backToScreen}>
          <Text style={styles.backToScreenText}>← Retour Tennis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function RankingTable({ data, title }) {
    return (
      <View>
        <Text style={styles.rankTitle}>{title}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width:32 }]}>#</Text>
          <Text style={[styles.tableHeaderText, { flex:1, textAlign:'left' }]}>Joueur</Text>
          <Text style={[styles.tableHeaderText, { width:52 }]}>Pts</Text>
          <Text style={[styles.tableHeaderText, { width:32 }]}>★</Text>
        </View>
        {data.map(function(p, i) {
          return (
            <View key={i} style={[styles.tableRow, {
              backgroundColor: i % 2 === 0 ? '#16162a' : '#0d0d1a',
              borderLeftColor: i === 0 ? '#FFD700' : i < 3 ? C : '#ffffff22',
              borderLeftWidth: 3,
            }]}>
              <Text style={[styles.tableCell, { width:32, color:'#ffffff55' }]}>{String(p.ranking)}</Text>
              <Text style={[styles.tableTeamName, { flex:1 }]} numberOfLines={1}>{p.team?.name}</Text>
              <Text style={[styles.tableCell, { width:52, color:'#FFD700' }]}>{String(p.points || 0)}</Text>
              <TouchableOpacity onPress={() => toggleFavorite(p.team?.name)} style={{ width:32, alignItems:'center' }}>
                <Text style={{ fontSize:16, color: isFav(p.team?.name) ? '#FFD700' : '#ffffff33' }}>★</Text>
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
          <Text style={styles.titleWhite}>TENNIS </Text>
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

          {tab === 'matchs' && (
            <View>
              {atpMatches.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de matchs disponibles</Text></View>
              ) : atpMatches.map(function(m) {
                const isLive = m.status?.type === 'inprogress';
                const isFinished = m.status?.type === 'finished';
                return (
                  <TouchableOpacity key={m.id}
                    style={[styles.matchCard, isLive && { borderColor: C, borderWidth:1 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedMatch(buildMatch(m))}>
                    <View style={styles.matchCardHeader}>
                      <View style={[styles.sportBadge, { backgroundColor: C }]}>
                        <Text style={styles.sportBadgeText}>🎾 Roland Garros ATP</Text>
                      </View>
                      {isLive ? <Text style={styles.liveLabel}>● LIVE</Text> : null}
                      {isFinished ? <Text style={styles.finishedLabel}>Terminé</Text> : null}
                      {m.roundInfo?.name ? <Text style={styles.dateLabel}>{m.roundInfo.name}</Text> : null}
                      <Text style={styles.tapHint}>Voir détails →</Text>
                    </View>
                    <View style={styles.matchTeams}>
                      <Text style={styles.matchTeamName} numberOfLines={1}>{m.homeTeam?.name}</Text>
                      <Text style={[styles.matchScore, isLive && { color:'#ff1744' }]}>
                        {isFinished || isLive
                          ? String(m.homeScore?.current||0) + ' - ' + String(m.awayScore?.current||0)
                          : 'VS'}
                      </Text>
                      <Text style={[styles.matchTeamName, { textAlign:'right' }]} numberOfLines={1}>{m.awayTeam?.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'rankAtp' && <RankingTable data={atpRankings} title="🎾 CLASSEMENT ATP" />}
          {tab === 'rankWta' && <RankingTable data={wtaRankings} title="🎾 CLASSEMENT WTA" />}

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
  rankTitle: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:13, letterSpacing:2, marginBottom:8 },
  matchCard: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  matchCardHeader: { flexDirection:'row', alignItems:'center', marginBottom:8, gap:8, flexWrap:'wrap' },
  sportBadge: { borderRadius:8, paddingHorizontal:8, paddingVertical:2 },
  sportBadgeText: { color:'#fff', fontSize:9, fontWeight:'700' },
  liveLabel: { color:'#ff1744', fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  finishedLabel: { color:'#ffffff44', fontSize:10 },
  dateLabel: { color:'#ffffff66', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  matchTeams: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  matchTeamName: { color:'#fff', fontSize:11, fontWeight:'600', flex:1 },
  matchScore: { fontFamily:'BebasNeue', fontSize:20, color:'#fff', marginHorizontal:8 },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, marginBottom:4 },
  tableHeaderText: { color:'#ffffff33', fontSize:10, fontWeight:'600', textAlign:'center' },
  tableRow: { flexDirection:'row', alignItems:'center', padding:8, borderRadius:6, marginBottom:2 },
  tableTeamName: { color:'#fff', fontSize:11 },
  tableCell: { textAlign:'center', color:'#fff', fontSize:11, fontFamily:'BebasNeue' },
  emptyBox: { padding:20, backgroundColor:'#16162a', borderRadius:12, alignItems:'center' },
  emptyText: { color:'#ffffff44', fontSize:13, fontFamily:'BebasNeue' },
  backToScreen: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff14', padding:16, alignItems:'center' },
  backToScreenText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});