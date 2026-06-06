import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { API_SPORTS_KEY } from '../api/config';
import { supabase } from '../api/supabase';
import MatchDetailScreen from './MatchDetailScreen';

const H_F1 = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.formula-1.api-sports.io' };

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function safeDate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (typeof date === 'object' && date.start) return date.start;
  return null;
}

function formatDate(date) {
  const d = safeDate(date);
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});
  } catch(e) { return String(d); }
}

export default function F1Screen({ onBack, user }) {
  const [tab, setTab] = useState('races');
  const [races, setRaces] = useState([]);
  const [driverStandings, setDriverStandings] = useState([]);
  const [teamStandings, setTeamStandings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState(null);
  const C = '#E10600';

  const TABS = [
    { id:'races', label:'🏁 Courses' },
    { id:'drivers', label:'Pilotes' },
    { id:'teams', label:'Écuries' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const racesRes = await fetch('https://v1.formula-1.api-sports.io/races?season=2026', { headers: H_F1 });
        const racesData = await racesRes.json();
        setRaces(racesData.response || []);

        const driverRes = await fetch('https://v1.formula-1.api-sports.io/rankings/drivers?season=2026', { headers: H_F1 });
        const driverData = await driverRes.json();
        setDriverStandings(driverData.response || []);

        const teamRes = await fetch('https://v1.formula-1.api-sports.io/rankings/teams?season=2026', { headers: H_F1 });
        const teamData = await teamRes.json();
        setTeamStandings(teamData.response || []);

        if (user) {
          const { data } = await supabase.from('favorites')
            .select('*').eq('user_id', user.id).eq('sport', 'f1');
          setFavorites(data || []);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [user]);

  async function toggleFavorite(name, logo) {
    if (!user) return;
    const existing = favorites.find(function(f) { return f.team_name === name; });
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites(favorites.filter(function(f) { return f.id !== existing.id; }));
    } else {
      const { data } = await supabase.from('favorites').insert({
        user_id: user.id, sport: 'f1', team_name: name,
        league: 'Formula 1', logo_url: logo || null,
      }).select();
      if (data) setFavorites([...favorites, data[0]]);
    }
  }

  function isFav(name) { return favorites.some(function(f) { return f.team_name === name; }); }

  function buildRaceMatch(r) {
    return {
      id: r.id,
      home: r.competition?.name || r.name || 'Grand Prix',
      away: 'Formula 1 · ' + (r.circuit?.name || ''),
      homeLogo: null, awayLogo: null,
      homeId: null, awayId: null,
      homeScore: 0, awayScore: 0,
      isLive: r.status === 'Live',
      isFinished: r.status === 'Finished',
      status: r.status || '',
      date: safeDate(r.date),
      raceName: r.competition?.name || r.name,
      circuit: r.circuit?.name,
      country: r.competition?.location?.country,
    };
  }

  if (selectedRace) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedRace} sport="F1" color={C} onBack={() => setSelectedRace(null)} />
        <TouchableOpacity onPress={() => setSelectedRace(null)} style={styles.backToScreen}>
          <Text style={styles.backToScreenText}>← Retour F1</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>FORMULA </Text>
          <GradientText text="1" fontSize={22} letterSpacing={1} />
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

          {tab === 'races' && (
            <View>
              {races.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de données disponibles</Text></View>
              ) : races.map(function(r, i) {
                const isFinished = r.status === 'Finished';
                const isNext = !isFinished && i === races.findIndex(function(x) { return x.status !== 'Finished'; });
                const isLive = r.status === 'Live';
                return (
                  <TouchableOpacity key={r.id || i}
                    style={[styles.raceCard, (isNext || isLive) && { borderColor: C, borderWidth:1 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedRace(buildRaceMatch(r))}>
                    <View style={styles.raceCardHeader}>
                      <Text style={styles.raceRound}>GP {i+1}</Text>
                      {isLive ? <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>● LIVE</Text></View> : null}
                      {isNext ? <View style={styles.nextBadge}><Text style={styles.nextBadgeText}>PROCHAIN</Text></View> : null}
                      {isFinished ? <Text style={styles.finishedLabel}>Terminé</Text> : null}
                      <Text style={styles.tapHint}>Voir détails →</Text>
                    </View>
                    <Text style={styles.raceName}>{r.competition?.name || r.name}</Text>
                    <Text style={styles.raceLocation}>📍 {r.circuit?.name} · {r.competition?.location?.country}</Text>
                    <Text style={styles.raceDate}>🗓 {formatDate(r.date)}</Text>
                    {isFinished && r.winner && (
                      <View style={styles.winnerRow}>
                        <Text style={styles.winnerText}>🏆 {r.winner.name}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'drivers' && (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width:32 }]}>#</Text>
                <Text style={[styles.tableHeaderText, { flex:1, textAlign:'left' }]}>Pilote</Text>
                <Text style={[styles.tableHeaderText, { width:40 }]}>Pts</Text>
                <Text style={[styles.tableHeaderText, { width:32 }]}>★</Text>
              </View>
              {driverStandings.map(function(d, i) {
                return (
                  <View key={i} style={[styles.tableRow, {
                    backgroundColor: i % 2 === 0 ? '#16162a' : '#0d0d1a',
                    borderLeftColor: i === 0 ? '#FFD700' : i < 3 ? C : '#ffffff22',
                    borderLeftWidth: 3,
                  }]}>
                    <Text style={[styles.tableCell, { width:32, color:'#ffffff55' }]}>{String(d.position || i+1)}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={styles.tableTeamName} numberOfLines={1}>{d.driver?.name}</Text>
                      <Text style={styles.tableSubText}>{d.team?.name}</Text>
                    </View>
                    <Text style={[styles.tableCell, { width:40, color:'#FFD700' }]}>{String(d.points || 0)}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite(d.driver?.name, null)} style={{ width:32, alignItems:'center' }}>
                      <Text style={{ fontSize:16, color: isFav(d.driver?.name) ? '#FFD700' : '#ffffff33' }}>★</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'teams' && (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width:32 }]}>#</Text>
                <Text style={[styles.tableHeaderText, { flex:1, textAlign:'left' }]}>Écurie</Text>
                <Text style={[styles.tableHeaderText, { width:40 }]}>Pts</Text>
                <Text style={[styles.tableHeaderText, { width:32 }]}>★</Text>
              </View>
              {teamStandings.map(function(t, i) {
                return (
                  <View key={i} style={[styles.tableRow, {
                    backgroundColor: i % 2 === 0 ? '#16162a' : '#0d0d1a',
                    borderLeftColor: i === 0 ? '#FFD700' : i < 3 ? C : '#ffffff22',
                    borderLeftWidth: 3,
                  }]}>
                    <Text style={[styles.tableCell, { width:32, color:'#ffffff55' }]}>{String(t.position || i+1)}</Text>
                    <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:6 }}>
                      {t.team?.logo ? <Image source={{ uri: t.team.logo }} style={styles.teamLogoSmall} onError={function(){}} /> : null}
                      <Text style={styles.tableTeamName} numberOfLines={1}>{t.team?.name}</Text>
                    </View>
                    <Text style={[styles.tableCell, { width:40, color:'#FFD700' }]}>{String(t.points || 0)}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite(t.team?.name, t.team?.logo)} style={{ width:32, alignItems:'center' }}>
                      <Text style={{ fontSize:16, color: isFav(t.team?.name) ? '#FFD700' : '#ffffff33' }}>★</Text>
                    </TouchableOpacity>
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
  header: { padding:16, paddingBottom:8 },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginTop:0, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  scroll: { padding:16, paddingBottom:40 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  raceCard: { backgroundColor:'#16162a', borderRadius:12, padding:14, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  raceCardHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' },
  raceRound: { color:'#ffffff88', fontFamily:'BebasNeue', fontSize:11, letterSpacing:1 },
  liveBadge: { backgroundColor:'#E1060022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  liveBadgeText: { color:'#E10600', fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  nextBadge: { backgroundColor:'#E1060022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  nextBadgeText: { color:'#E10600', fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  finishedLabel: { color:'#ffffff44', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  raceName: { color:'#fff', fontFamily:'BebasNeue', fontSize:16, letterSpacing:0.5, marginBottom:4 },
  raceLocation: { color:'#ffffff88', fontSize:11, marginBottom:2 },
  raceDate: { color:'#ffffff66', fontSize:11, marginBottom:4 },
  winnerRow: { backgroundColor:'#FFD70022', borderRadius:8, padding:6, marginTop:4 },
  winnerText: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:12, letterSpacing:1 },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, marginBottom:4 },
  tableHeaderText: { color:'#ffffff33', fontSize:10, fontWeight:'600', textAlign:'center' },
  tableRow: { flexDirection:'row', alignItems:'center', padding:8, borderRadius:6, marginBottom:2 },
  tableTeamName: { color:'#fff', fontSize:11, flex:1 },
  tableSubText: { color:'#ffffff44', fontSize:9 },
  tableCell: { textAlign:'center', color:'#fff', fontSize:11, fontFamily:'BebasNeue' },
  teamLogoSmall: { width:18, height:18, resizeMode:'contain' },
  emptyBox: { padding:20, backgroundColor:'#16162a', borderRadius:12, alignItems:'center' },
  emptyText: { color:'#ffffff44', fontSize:13, fontFamily:'BebasNeue' },
  backToScreen: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff14', padding:16, alignItems:'center' },
  backToScreenText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});