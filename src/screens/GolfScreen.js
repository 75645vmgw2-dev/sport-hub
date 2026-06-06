import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { RAPIDAPI_KEY } from '../api/config';
import { supabase } from '../api/supabase';
import MatchDetailScreen from './MatchDetailScreen';

const H_GOLF = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'live-golf-data.p.rapidapi.com' };

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function formatGolfDate(date) {
  if (!date) return '-';
  if (typeof date === 'string') {
    try { return new Date(date).toLocaleDateString('fr-FR', {day:'numeric', month:'long'}); }
    catch(e) { return date; }
  }
  if (typeof date === 'object') {
    try {
      const start = date.start;
      let ts = null;
      if (start && start['$date'] && start['$date']['$numberLong']) {
        ts = Number(start['$date']['$numberLong']);
      } else if (typeof start === 'number') {
        ts = start;
      } else if (typeof start === 'string') {
        ts = new Date(start).getTime();
      }
      if (ts) {
        const d = new Date(ts);
        return d.toLocaleDateString('fr-FR', {day:'numeric', month:'long'});
      }
      if (date.weekNumber) return 'Semaine ' + String(date.weekNumber);
    } catch(e) {}
  }
  return '-';
}

function safeGolfDate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (typeof date === 'object') {
    try {
      const start = date.start;
      if (start && start['$date'] && start['$date']['$numberLong']) {
        return new Date(Number(start['$date']['$numberLong'])).toISOString();
      }
    } catch(e) {}
  }
  return null;
}

export default function GolfScreen({ onBack, user }) {
  const [tab, setTab] = useState('schedule');
  const [schedule, setSchedule] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const C = '#2E7D32';

  const TABS = [
    { id:'schedule', label:'📅 Calendrier' },
    { id:'leaderboard', label:'🏆 Classement' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const schedRes = await fetch(
          'https://live-golf-data.p.rapidapi.com/schedule?orgId=1&year=2026',
          { headers: H_GOLF }
        );
        const schedData = await schedRes.json();
        setSchedule(schedData.schedule || schedData || []);

        try {
          const lbRes = await fetch(
            'https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=014&year=2026',
            { headers: H_GOLF }
          );
          const lbData = await lbRes.json();
          const players = lbData.leaderboard?.players || lbData.players || [];
          setLeaderboard(players.slice(0, 30));
        } catch(e) {}

        if (user) {
          const { data } = await supabase.from('favorites')
            .select('*').eq('user_id', user.id).eq('sport', 'golf');
          setFavorites(data || []);
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
        user_id: user.id, sport: 'golf', team_name: name, league: 'PGA Tour',
      }).select();
      if (data) setFavorites([...favorites, data[0]]);
    }
  }

  function isFav(name) { return favorites.some(function(f) { return f.team_name === name; }); }

  function buildTournamentMatch(t, i) {
    return {
      id: t.tournId || i,
      home: t.name || t.tournamentName || 'Tournoi Golf',
      away: 'PGA Tour 2026',
      homeLogo: null, awayLogo: null,
      homeId: null, awayId: null,
      homeScore: 0, awayScore: 0,
      isLive: t.status === 'In Progress' || t.current === true,
      isFinished: t.status === 'Finished' || t.completed === true,
      status: t.status || '',
      date: safeGolfDate(t.date),
      tournamentName: t.name || t.tournamentName,
      purse: t.purse,
    };
  }

  if (selectedTournament) {
    return (
      <View style={{ flex:1 }}>
        <MatchDetailScreen match={selectedTournament} sport="GOLF" color={C} onBack={() => setSelectedTournament(null)} />
        <TouchableOpacity onPress={() => setSelectedTournament(null)} style={styles.backToScreen}>
          <Text style={styles.backToScreenText}>← Retour Golf</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>GOLF </Text>
          <GradientText text="PGA" fontSize={22} letterSpacing={1} />
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

          {tab === 'schedule' && (
            <View>
              {(!schedule || schedule.length === 0) ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Calendrier non disponible</Text></View>
              ) : (Array.isArray(schedule) ? schedule : []).slice(0, 20).map(function(t, i) {
                const isFinished = t.status === 'Finished' || t.completed === true;
                const isCurrent = t.status === 'In Progress' || t.current === true;
                const dateStr = formatGolfDate(t.date);
                return (
                  <TouchableOpacity key={i}
                    style={[styles.tournCard, isCurrent && { borderColor: C, borderWidth:1 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTournament(buildTournamentMatch(t, i))}>
                    <View style={styles.tournHeader}>
                      {isCurrent ? <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>● EN COURS</Text></View> : null}
                      {isFinished ? <Text style={styles.finishedLabel}>Terminé</Text> : null}
                      <Text style={styles.tapHint}>Voir détails →</Text>
                    </View>
                    <Text style={styles.tournName}>{t.name || 'Tournoi'}</Text>
                    <Text style={styles.tournDate}>🗓 {dateStr}</Text>
                    {t.purse ? <Text style={styles.tournPurse}>💰 {String(t.purse)}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'leaderboard' && (
            <View>
              {leaderboard.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Classement non disponible</Text></View>
              ) : (
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { width:32 }]}>#</Text>
                    <Text style={[styles.tableHeaderText, { flex:1, textAlign:'left' }]}>Joueur</Text>
                    <Text style={[styles.tableHeaderText, { width:40 }]}>Score</Text>
                    <Text style={[styles.tableHeaderText, { width:32 }]}>★</Text>
                  </View>
                  {leaderboard.map(function(p, i) {
                    const name = p.name || ((p.firstName||'') + ' ' + (p.lastName||'')) || '-';
                    const score = p.total || p.score || p.toPar || '-';
                    return (
                      <View key={i} style={[styles.tableRow, {
                        backgroundColor: i % 2 === 0 ? '#16162a' : '#0d0d1a',
                        borderLeftColor: i === 0 ? '#FFD700' : i < 3 ? C : '#ffffff22',
                        borderLeftWidth: 3,
                      }]}>
                        <Text style={[styles.tableCell, { width:32, color:'#ffffff55' }]}>{String(p.position || p.pos || i+1)}</Text>
                        <Text style={[styles.tableTeamName, { flex:1 }]} numberOfLines={1}>{name}</Text>
                        <Text style={[styles.tableCell, { width:40, color:'#FFD700' }]}>{String(score)}</Text>
                        <TouchableOpacity onPress={() => toggleFavorite(name)} style={{ width:32, alignItems:'center' }}>
                          <Text style={{ fontSize:16, color: isFav(name) ? '#FFD700' : '#ffffff33' }}>★</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
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
  header: { padding:16, paddingBottom:8 },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginTop:0, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  scroll: { padding:16, paddingBottom:40 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  tournCard: { backgroundColor:'#16162a', borderRadius:12, padding:14, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  tournHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  liveBadge: { backgroundColor:'#2E7D3222', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  liveBadgeText: { color:'#4CAF50', fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  finishedLabel: { color:'#ffffff44', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  tournName: { color:'#fff', fontFamily:'BebasNeue', fontSize:15, letterSpacing:0.5, marginBottom:4 },
  tournDate: { color:'#ffffff88', fontSize:11, marginBottom:2 },
  tournPurse: { color:'#FFD700', fontSize:11, marginTop:2 },
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