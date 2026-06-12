import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useLanguage } from '../i18n/LanguageContext';
import { ANTHROPIC_KEY, API_SPORTS_KEY } from '../api/keys';


const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
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

export default function MatchDuJourScreen({ match, onBack }) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState('info');
  const [kazmoAnalysis, setKazmoAnalysis] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);

  const langNames = {
    fr: 'français', en: 'English', es: 'español', pt: 'português',
    de: 'Deutsch', it: 'italiano', ar: 'العربية', ru: 'русский'
  };

  const TABS = [
    { id:'info', label:'📋 INFO' },
    { id:'kazmo', label:'🤖 KAZMO IA' },
    { id:'h2h', label:'⚔️ H2H' },
  ];

  async function fetchKazmoAnalysis() {
    if (kazmoAnalysis) return;
    setLoadingKazmo(true);
    try {
      const langName = langNames[language] || 'français';
      const prompt = 'Tu es Kazmo, assistant IA sportif premium.' +
        '\nFais une analyse complete du match suivant :' +
        '\n' + match.equipe_home + ' vs ' + match.equipe_away +
        '\nCompetition: ' + (match.competition || 'Non precisee') +
        '\nSport: ' + match.sport +
        '\nDate: ' + (match.date_match ? new Date(match.date_match).toLocaleDateString() : 'Non precisee') +
        '\n\nInclus dans ton analyse :' +
        '\n1. Presentation du match et son importance' +
        '\n2. Forme recente des deux equipes' +
        '\n3. Points forts et faibles de chaque equipe' +
        '\n4. Joueurs cles a surveiller' +
        '\n5. Pronostic avec pourcentage de confiance' +
        '\n6. Conseil pour les parieurs' +
        '\n\nReponds en ' + langName + ' de facon structuree et professionnelle.';

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: H_ANTHROPIC,
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          messages: [{ role:'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).map(function(c) { return c.text || ''; }).join('');
      setKazmoAnalysis(text);
    } catch(e) { console.error(e); }
    finally { setLoadingKazmo(false); }
  }

  async function fetchH2H() {}

  useEffect(() => {
    if (tab === 'kazmo') fetchKazmoAnalysis();
  }, [tab]);

  const sportColors = {
    NBA: '#1D428A', NHL: '#00B8D9', MLB: '#E53935',
    NFL: '#1A73E8', FOOTBALL: '#4CAF50', TENNIS: '#c85a19',
    F1: '#E10600', GOLF: '#2E7D32', MMA: '#9C27B0',
  };
  const color = sportColors[match.sport] || '#FF6B2B';

  const matchDate = match.date_match ? new Date(match.date_match) : null;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: color }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.sportBadge, { backgroundColor: color }]}>
            <Text style={styles.sportBadgeText}>{match.sport}</Text>
          </View>
          <Text style={styles.headerTitle}>MATCH DU JOUR</Text>
        </View>
        <View style={{ width:40 }} />
      </View>

      {/* Match card */}
      <LinearGradient
        colors={['#16162a', color + '22']}
        start={{ x:0, y:0 }} end={{ x:1, y:1 }}
        style={styles.matchCard}>

        {match.competition ? (
          <Text style={styles.competition}>{match.competition}</Text>
        ) : null}

        <View style={styles.teamsRow}>
          {/* Home */}
          <View style={styles.teamBlock}>
            {match.logo_home ? (
              <Image source={{ uri: match.logo_home }} style={styles.teamLogo} onError={function(){}} />
            ) : (
              <View style={[styles.teamLogoPlaceholder, { backgroundColor: color + '33' }]}>
                <Text style={styles.teamLogoEmoji}>🏆</Text>
              </View>
            )}
            <Text style={styles.teamName} numberOfLines={2}>{match.equipe_home}</Text>
          </View>

          {/* Score/VS */}
          <View style={styles.scoreBlock}>
            <Text style={styles.vsText}>VS</Text>
            {matchDate ? (
              <>
                <Text style={styles.matchTime}>
                  {matchDate.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                </Text>
                <Text style={styles.matchDate}>
                  {matchDate.toLocaleDateString('fr-FR', {day:'numeric', month:'long'})}
                </Text>
              </>
            ) : null}
          </View>

          {/* Away */}
          <View style={[styles.teamBlock, { alignItems:'flex-end' }]}>
            {match.logo_away ? (
              <Image source={{ uri: match.logo_away }} style={styles.teamLogo} onError={function(){}} />
            ) : (
              <View style={[styles.teamLogoPlaceholder, { backgroundColor: color + '33' }]}>
                <Text style={styles.teamLogoEmoji}>🏆</Text>
              </View>
            )}
            <Text style={[styles.teamName, { textAlign:'right' }]} numberOfLines={2}>{match.equipe_away}</Text>
          </View>
        </View>

        {match.description ? (
          <Text style={styles.description}>{match.description}</Text>
        ) : null}

      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(function(tb) {
          return (
            <TouchableOpacity key={tb.id}
              style={[styles.tabBtn, tab === tb.id && { backgroundColor: color }]}
              onPress={() => setTab(tb.id)}>
              <Text style={[styles.tabBtnText, tab === tb.id && { color:'#fff' }]}>{tb.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* TAB INFO */}
        {tab === 'info' && (
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>📋 INFORMATIONS</Text>
              {[
                { label: 'Sport', value: match.sport },
                { label: 'Competition', value: match.competition || '—' },
                { label: 'Equipe domicile', value: match.equipe_home },
                { label: 'Equipe exterieure', value: match.equipe_away },
                { label: 'Date', value: matchDate ? matchDate.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '—' },
                { label: 'Heure', value: matchDate ? matchDate.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '—' },
              ].map(function(item, i) {
                return (
                  <View key={i} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.kazmoBtn, { backgroundColor: color + '22', borderColor: color + '44' }]}
              onPress={() => setTab('kazmo')}
              activeOpacity={0.8}>
              <Text style={[styles.kazmoBtnText, { color }]}>🤖 Analyse Kazmo IA →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB KAZMO IA */}
        {tab === 'kazmo' && (
          <View style={styles.kazmoSection}>
            <View style={styles.kazmoHeader}>
              <LinearGradient colors={['#FF6B2B','#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.kazmoAvatar}>
                <Text style={styles.kazmoAvatarText}>K</Text>
              </LinearGradient>
              <View>
                <Text style={styles.kazmoName}>KAZMO IA</Text>
                <Text style={styles.kazmoSub}>Analyse exclusive du match</Text>
              </View>
            </View>

            {loadingKazmo ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FF6B2B" size="large" />
                <Text style={styles.loadingText}>Kazmo analyse le match...</Text>
              </View>
            ) : kazmoAnalysis ? (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisText}>{kazmoAnalysis}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* TAB H2H */}
        {tab === 'h2h' && (
          <View style={styles.h2hSection}>
            <View style={styles.h2hCard}>
              <Text style={styles.h2hTitle}>⚔️ HISTORIQUE H2H</Text>
              <Text style={styles.h2hSubtitle}>{match.equipe_home} vs {match.equipe_away}</Text>
              <TouchableOpacity
                style={[styles.kazmoBtn, { backgroundColor: color + '22', borderColor: color + '44', marginTop:16 }]}
                onPress={() => {
                  setTab('kazmo');
                  setKazmoAnalysis('');
                }}
                activeOpacity={0.8}>
                <Text style={[styles.kazmoBtnText, { color }]}>🤖 Demander l'historique a Kazmo →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
            padding:16, borderBottomWidth:2 },
  backBtn: { width:40, height:40, alignItems:'center', justifyContent:'center' },
  backBtnText: { color:'#FF6B2B', fontSize:24, fontWeight:'700' },
  headerCenter: { alignItems:'center', gap:4 },
  sportBadge: { borderRadius:8, paddingHorizontal:10, paddingVertical:3 },
  sportBadgeText: { color:'#fff', fontFamily:'BebasNeue', fontSize:12, letterSpacing:1 },
  headerTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:2 },
  matchCard: { margin:16, borderRadius:16, padding:16, borderWidth:1, borderColor:'#ffffff14' },
  competition: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:12, letterSpacing:2,
                 textAlign:'center', marginBottom:12 },
  teamsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  teamBlock: { flex:1, alignItems:'flex-start', gap:8 },
  teamLogo: { width:56, height:56, resizeMode:'contain' },
  teamLogoPlaceholder: { width:56, height:56, borderRadius:28, alignItems:'center', justifyContent:'center' },
  teamLogoEmoji: { fontSize:28 },
  teamName: { color:'#fff', fontFamily:'BebasNeue', fontSize:13, letterSpacing:0.5, lineHeight:16 },
  scoreBlock: { alignItems:'center', paddingHorizontal:8 },
  vsText: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:28, letterSpacing:2 },
  matchTime: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:20, letterSpacing:1 },
  matchDate: { color:'#ffffff66', fontSize:10, textAlign:'center' },
  description: { color:'#ffffffcc', fontSize:11, lineHeight:16, marginTop:12,
                 textAlign:'center', fontStyle:'italic' },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', marginHorizontal:16,
            borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:11, letterSpacing:0.5 },
  scroll: { padding:16, paddingBottom:40 },
  infoSection: { gap:12 },
  infoCard: { backgroundColor:'#16162a', borderRadius:14, padding:16,
              borderWidth:1, borderColor:'#ffffff14' },
  infoCardTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:12, letterSpacing:2, marginBottom:12 },
  infoRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
             paddingVertical:10, borderBottomWidth:1, borderBottomColor:'#ffffff0a' },
  infoLabel: { color:'#ffffff55', fontSize:12 },
  infoValue: { color:'#fff', fontSize:12, fontWeight:'600', flex:1, textAlign:'right' },
  kazmoBtn: { borderRadius:12, padding:14, alignItems:'center', borderWidth:1 },
  kazmoBtnText: { fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  kazmoSection: { gap:12 },
  kazmoHeader: { flexDirection:'row', alignItems:'center', gap:12,
                 backgroundColor:'#16162a', borderRadius:14, padding:14,
                 borderWidth:1, borderColor:'#FF6B2B33' },
  kazmoAvatar: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  kazmoAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:24, fontWeight:'900' },
  kazmoName: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1 },
  kazmoSub: { color:'#ffffff55', fontSize:10 },
  loadingBox: { alignItems:'center', padding:40, gap:12 },
  loadingText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  analysisCard: { backgroundColor:'#16162a', borderRadius:14, padding:16,
                  borderWidth:1, borderColor:'#FF6B2B22' },
  analysisText: { color:'#ffffffcc', fontSize:13, lineHeight:20 },
  h2hSection: { gap:12 },
  h2hCard: { backgroundColor:'#16162a', borderRadius:14, padding:16,
             borderWidth:1, borderColor:'#ffffff14' },
  h2hTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:14, letterSpacing:2, marginBottom:4 },
  h2hSubtitle: { color:'#ffffff55', fontSize:11 },
});