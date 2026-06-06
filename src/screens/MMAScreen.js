import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { API_SPORTS_KEY } from '../api/config';
import { supabase } from '../api/supabase';
import MatchDetailScreen from './MatchDetailScreen';

const H_MMA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.mma.api-sports.io' };

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function MMAScreen({ onBack, user }) {
  const [tab, setTab] = useState('upcoming');
  const [upcomingFights, setUpcomingFights] = useState([]);
  const [finishedFights, setFinishedFights] = useState([]);
  const [liveFights, setLiveFights] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFight, setSelectedFight] = useState(null);
  const C = '#9C27B0';

  const TABS = [
    { id:'upcoming', label:'🤼 A venir' },
    { id:'live', label:'🔴 Live' },
    { id:'finished', label:'✅ Terminés' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          'https://v1.mma.api-sports.io/fights?season=2026',
          { headers: H_MMA }
        );
        const data = await res.json();
        const fights = data.response || [];

        const upcoming = fights.filter(function(f) {
          return f.status?.short === 'NS' || f.status?.long === 'Not Started';
        }).sort(function(a,b) { return new Date(a.date) - new Date(b.date); }).slice(0, 30);

        const live = fights.filter(function(f) {
          return f.status?.short === 'LIVE' || f.status?.long === 'Live';
        });

        const finished = fights.filter(function(f) {
          return f.status?.short === 'FT' || f.status?.long === 'Finished';
        }).sort(function(a,b) { return new Date(b.date) - new Date(a.date); }).slice(0, 30);

        setUpcomingFights(upcoming);
        setLiveFights(live);
        setFinishedFights(finished);

        if (user) {
          const { data: favs } = await supabase.from('favorites')
            .select('*').eq('user_id', user.id).eq('sport', 'mma');
          setFavorites(favs || []);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [user]);

  async function toggleFavorite(name) {
    if (!user) return;
    const existing = favorites.find(function(f) { return f.team_name === name; });
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites(favorites.filter(function(f) { return f.id !== existing.id; }));
    } else {
      const { data } = await supabase.from('favorites').insert({
        user_id: user.id, sport: 'mma', team_name: name, league: 'UFC',
      }).select();
      if (data) setFavorites([...favorites, data[0]]);
    }
  }

  function isFav(name) { return favorites.some(function(f) { return f.team_name === name; }); }

  function buildFightMatch(f) {
    return {
      id: f.id,
      home: f.fighters?.first?.name || 'Fighter 1',
      away: f.fighters?.second?.name || 'Fighter 2',
      homeLogo: f.fighters?.first?.logo || null,
      awayLogo: f.fighters?.second?.logo || null,
      homeId: f.fighters?.first?.id,
      awayId: f.fighters?.second?.id,
      homeScore: f.fighters?.first?.winner ? 1 : 0,
      awayScore: f.fighters?.second?.winner ? 1 : 0,
      isLive: f.status?.short === 'LIVE',
      isFinished: f.status?.short === 'FT' || f.status?.long === 'Finished',
      status: f.status?.short || '',
      date: f.date || null,
      category: f.category,
      eventName: f.slug,
      isMain: f.is_main,
    };
  }

  if (selectedFight) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedFight} sport="MMA" color={C} onBack={() => setSelectedFight(null)} />
        <TouchableOpacity onPress={() => setSelectedFight(null)} style={styles.backToScreen}>
          <Text style={styles.backToScreenText}>← Retour MMA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function FightCard({ f }) {
    const isLive = f.status?.short === 'LIVE';
    const isFinished = f.status?.short === 'FT' || f.status?.long === 'Finished';
    const winner = isFinished ? (f.fighters?.first?.winner ? f.fighters?.first?.name : f.fighters?.second?.name) : null;
    return (
      <TouchableOpacity
        style={[styles.fightCard, isLive && { borderColor: C, borderWidth:1 }]}
        activeOpacity={0.8}
        onPress={() => setSelectedFight(buildFightMatch(f))}>
        <View style={styles.fightHeader}>
          {f.is_main && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>MAIN EVENT</Text></View>}
          {isLive && <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>● LIVE</Text></View>}
          {isFinished && <Text style={styles.finishedLabel}>Terminé</Text>}
          {f.category ? <Text style={styles.categoryText}>{f.category}</Text> : null}
          <Text style={styles.tapHint}>Voir détails →</Text>
        </View>
        {f.slug ? <Text style={styles.eventSlug} numberOfLines={1}>{f.slug}</Text> : null}
        <View style={styles.fightRow}>
          <View style={styles.fighter}>
            {f.fighters?.first?.logo ? (
              <Image source={{ uri: f.fighters.first.logo }} style={styles.fighterLogo} onError={function(){}} />
            ) : (
              <View style={styles.fighterLogoPlaceholder}><Text style={styles.fighterLogoText}>🤼</Text></View>
            )}
            <Text style={[styles.fighterName,
              winner && winner === f.fighters?.first?.name && { color:'#FFD700' }]}
              numberOfLines={2}>{f.fighters?.first?.name}</Text>
            {winner === f.fighters?.first?.name && <Text style={styles.winnerBadge}>GAGNANT</Text>}
          </View>

          <View style={styles.fightCenter}>
            <Text style={styles.vsText}>VS</Text>
            {f.date ? (
              <Text style={styles.fightDate}>
                {new Date(f.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}
              </Text>
            ) : null}
          </View>

          <View style={[styles.fighter, { alignItems:'flex-end' }]}>
            {f.fighters?.second?.logo ? (
              <Image source={{ uri: f.fighters.second.logo }} style={styles.fighterLogo} onError={function(){}} />
            ) : (
              <View style={styles.fighterLogoPlaceholder}><Text style={styles.fighterLogoText}>🤼</Text></View>
            )}
            <Text style={[styles.fighterName, { textAlign:'right' },
              winner && winner === f.fighters?.second?.name && { color:'#FFD700' }]}
              numberOfLines={2}>{f.fighters?.second?.name}</Text>
            {winner === f.fighters?.second?.name && <Text style={[styles.winnerBadge, { alignSelf:'flex-end' }]}>GAGNANT</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const displayFights = tab === 'upcoming' ? upcomingFights :
                        tab === 'live' ? liveFights : finishedFights;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>MMA </Text>
          <GradientText text="UFC" fontSize={22} letterSpacing={1} />
        </View>
        <Text style={styles.subtitle}>
          {upcomingFights.length} à venir · {finishedFights.length} terminés
        </Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(function(t) {
          return (
            <TouchableOpacity key={t.id}
              style={[styles.tabBtn, tab === t.id && { backgroundColor: C }]}
              onPress={() => setTab(t.id)}>
              <Text style={[styles.tabBtnText, tab === t.id && { color:'#fff' }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {displayFights.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {tab === 'live' ? 'Pas de combat en cours' :
                 tab === 'upcoming' ? 'Pas de combat à venir' : 'Pas de combat terminé'}
              </Text>
            </View>
          ) : displayFights.map(function(f) {
            return <FightCard key={f.id} f={f} />;
          })}
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
  subtitle: { color:'#ffffff44', fontSize:10, marginTop:2, fontFamily:'BebasNeue', letterSpacing:1 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginTop:4, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  scroll: { padding:16, paddingBottom:40 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  fightCard: { backgroundColor:'#16162a', borderRadius:12, padding:14, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  fightHeader: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' },
  mainBadge: { backgroundColor:'#FFD70022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  mainBadgeText: { color:'#FFD700', fontSize:8, fontWeight:'700', fontFamily:'BebasNeue' },
  liveBadge: { backgroundColor:'#9C27B022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  liveBadgeText: { color:'#9C27B0', fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  finishedLabel: { color:'#ffffff44', fontSize:9 },
  categoryText: { color:'#ffffff66', fontSize:9, fontFamily:'BebasNeue' },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  eventSlug: { color:'#ffffff55', fontSize:10, marginBottom:8, fontStyle:'italic' },
  fightRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  fighter: { flex:1, alignItems:'flex-start', gap:4 },
  fighterLogo: { width:40, height:40, resizeMode:'contain', borderRadius:20 },
  fighterLogoPlaceholder: { width:40, height:40, borderRadius:20, backgroundColor:'#9C27B022', alignItems:'center', justifyContent:'center' },
  fighterLogoText: { fontSize:20 },
  fighterName: { color:'#fff', fontSize:11, fontFamily:'BebasNeue', letterSpacing:0.5 },
  winnerBadge: { backgroundColor:'#FFD70022', borderRadius:4, paddingHorizontal:4, paddingVertical:1, alignSelf:'flex-start' },
  fightCenter: { alignItems:'center', paddingHorizontal:8 },
  vsText: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:18 },
  fightDate: { color:'#ffffff66', fontSize:9, marginTop:2 },
  emptyBox: { padding:20, backgroundColor:'#16162a', borderRadius:12, alignItems:'center' },
  emptyText: { color:'#ffffff44', fontSize:13, fontFamily:'BebasNeue' },
  backToScreen: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff14', padding:16, alignItems:'center' },
  backToScreenText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});