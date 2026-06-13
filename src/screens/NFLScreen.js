import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import { supabase } from '../api/supabase';
import NFLTeamScreen from './NFLTeamScreen';

const H_NFL = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.american-football.api-sports.io' };

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function NFLScreen({ onBack, user }) {
  const [tab, setTab] = useState('afc');
  const [standings, setStandings] = useState({ afc:[], nfc:[] });
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const C = '#1A73E8';
  const [selectedTeam, setSelectedTeam] = useState(null);

  const TABS = [
    { id:'afc', label:'AFC' },
    { id:'nfc', label:'NFC' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const standRes = await fetch(
          'https://v1.american-football.api-sports.io/standings?league=1&season=2025',
          { headers: H_NFL }
        );
        const standData = await standRes.json();
        const afc = (standData.response || []).filter(function(t) {
          return t.conference && t.conference.includes('American');
        });
        const nfc = (standData.response || []).filter(function(t) {
          return t.conference && t.conference.includes('National');
        });
        setStandings({ afc, nfc });

        if (user) {
          const { data } = await supabase.from('favorites')
            .select('*').eq('user_id', user.id).eq('sport', 'football_us');
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
        user_id: user.id, sport: 'football_us', team_name: team.name,
        league: 'NFL', logo_url: team.logo || null,
      }).select();
      if (data) setFavorites([...favorites, data[0]]);
    }
  }

  function isFav(name) { return favorites.some(function(f) { return f.team_name === name; }); }

  if (selectedTeam) {
    return <NFLTeamScreen team={selectedTeam} onBack={() => setSelectedTeam(null)} />;
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
          const wins = t.won || 0;
          const losses = t.lost || 0;
          return (
            <TouchableOpacity key={i} onPress={() => t.team && setSelectedTeam(t.team)} activeOpacity={0.8} style={[styles.tableRow, {
              backgroundColor: i % 2 === 0 ? '#16162a' : '#0d0d1a',
              borderLeftColor: i === 0 ? '#FFD700' : i < 3 ? C : '#ffffff22',
              borderLeftWidth: 3,
            }]}>
              <Text style={[styles.tableCell, { width:24, color:'#ffffff55' }]}>{String(i+1)}</Text>
              <View style={[styles.tableTeam, { flex:1 }]}>
                {t.team && t.team.logo ? <Image source={{ uri: t.team.logo }} style={styles.teamLogoSmall} /> : null}
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
        <TouchableOpacity onPress={onBack}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>NFL </Text>
          <GradientText text="2025" fontSize={22} letterSpacing={1} />
        </View>
        <View style={styles.nextSeason}>
          <Text style={styles.nextSeasonText}>🏈 Next kickoff — September 2026</Text>
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
          {tab === 'afc' && <StandingsTable data={standings.afc} />}
          {tab === 'nfc' && <StandingsTable data={standings.nfc} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { padding:16, paddingBottom:8 },
  backBtnText: { color:'#ffffff66', fontSize:16, marginBottom:6 },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  nextSeason: { backgroundColor:'#1A73E822', borderRadius:8, padding:8, marginTop:8, borderWidth:1, borderColor:'#1A73E844' },
  nextSeasonText: { color:'#1A73E8', fontSize:11, fontFamily:'BebasNeue', letterSpacing:1 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginTop:0, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  scroll: { padding:16, paddingBottom:40 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, marginBottom:4 },
  tableHeaderText: { color:'#ffffff33', fontSize:10, fontWeight:'600', textAlign:'center' },
  tableRow: { flexDirection:'row', alignItems:'center', padding:8, borderRadius:6, marginBottom:2 },
  tableTeam: { flexDirection:'row', alignItems:'center', gap:6 },
  teamLogoSmall: { width:18, height:18, resizeMode:'contain' },
  tableTeamName: { color:'#fff', fontSize:11, flex:1 },
  tableCell: { textAlign:'center', color:'#fff', fontSize:11, fontFamily:'BebasNeue' },
});