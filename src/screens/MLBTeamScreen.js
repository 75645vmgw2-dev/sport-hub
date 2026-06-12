import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { API_SPORTS_KEY } from '../api/config';
import { useLanguage } from '../i18n/LanguageContext';

const H_MLB = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.baseball.api-sports.io' };
const ANTHROPIC_KEY = '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';
const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

export default function MLBTeamScreen({ team, onBack }) {
  const { language } = useLanguage();
  const [tab, setTab] = useState('forme');
  const [recentGames, setRecentGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kazmoAnalysis, setKazmoAnalysis] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [nbMatchs, setNbMatchs] = useState(5);

  const C = '#E53935';
  const langNames = {
    fr:'français', en:'English', es:'español', pt:'português',
    de:'Deutsch', it:'italiano', ar:'العربية', ru:'русский'
  };

  useEffect(() => { fetchTeamData(); }, []);

  async function fetchTeamData() {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const from = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
      const to = new Date(Date.now() + 30*86400000).toISOString().slice(0,10);
      const [recentRes, upcomingRes, playersRes] = await Promise.all([
        fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&team='+team.id+'&from='+from+'&to='+today, { headers:H_MLB }),
        fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&team='+team.id+'&from='+today+'&to='+to, { headers:H_MLB }),
        fetch('https://v1.baseball.api-sports.io/players?team='+team.id+'&season=2026', { headers:H_MLB }),
      ]);
      const [recentData, upcomingData, playersData] = await Promise.all([
        recentRes.json(), upcomingRes.json(), playersRes.json()
      ]);
      const finished = (recentData.response||[]).filter(function(g){
        return g.status.long === 'Finished';
      }).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
      setRecentGames(finished);
      setUpcomingGames((upcomingData.response||[]).slice(0,5));
      setPlayers((playersData.response||[]).slice(0,20));
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function fetchKazmoAnalysis() {
    if (kazmoAnalysis) return;
    setLoadingKazmo(true);
    try {
      const langName = langNames[language] || 'français';
      const prompt = 'Tu es Kazmo, assistant IA sportif premium.\n' +
        'Fais une analyse complete de lequipe MLB : ' + team.name + '\n\n' +
        'Inclus : 1. Presentation 2. Saison 2026 3. Points forts/faibles 4. Joueurs cles 5. Perspectives\n\n' +
        'Reponds en ' + langName + ' de facon structuree.';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:800, messages:[{role:'user',content:prompt}] }),
      });
      const data = await response.json();
      setKazmoAnalysis((data.content||[]).map(function(c){return c.text||'';}).join(''));
    } catch(e) {}
    finally { setLoadingKazmo(false); }
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput('');
    setLoadingChat(true);
    const newHistory = [...chatHistory, { role:'user', content:question }];
    setChatHistory(newHistory);
    try {
      const langName = langNames[language] || 'français';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body: JSON.stringify({
          model:'claude-sonnet-4-5', max_tokens:500,
          system:'Tu es Kazmo, expert MLB sur '+team.name+'. Reponds en '+langName+' de facon concise.',
          messages: newHistory.map(function(m){return{role:m.role,content:m.content};}),
        }),
      });
      const data = await response.json();
      const answer = (data.content||[]).map(function(c){return c.text||'';}).join('');
      setChatHistory(function(prev){return[...prev,{role:'assistant',content:answer}];});
    } catch(e) {}
    finally { setLoadingChat(false); }
  }

  const recentSliced = recentGames.slice(0, nbMatchs);

  const TABS = [
    { id:'forme', label:'📊 Forme' },
    { id:'prochains', label:'📅 Prochains' },
    { id:'joueurs', label:'👥 Joueurs' },
    { id:'kazmo', label:'🤖 Kazmo' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor:C }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {team.logo ? (
            <Image source={{ uri:team.logo }} style={styles.headerLogo} onError={function(){}} />
          ) : (
            <View style={[styles.headerLogoPlaceholder,{backgroundColor:C+'33'}]}>
              <Text style={styles.headerLogoText}>{team.name.slice(0,2).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTeamName}>{team.name}</Text>
            <Text style={styles.headerLeague}>MLB 2026</Text>
          </View>
        </View>
        <View style={{ width:40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
        <View style={styles.tabBar}>
          {TABS.map(function(tb) {
            return (
              <TouchableOpacity key={tb.id}
                style={[styles.tabBtn, tab===tb.id&&{backgroundColor:C}]}
                onPress={() => { setTab(tb.id); if(tb.id==='kazmo') fetchKazmoAnalysis(); }}>
                <Text style={[styles.tabBtnText, tab===tb.id&&{color:'#fff'}]}>{tb.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {tab === 'forme' && (
            <View>
              <View style={styles.nbMatchsRow}>
                <Text style={styles.sectionTitle}>DERNIERS MATCHS</Text>
                <View style={styles.nbMatchsBtns}>
                  {[3,5,10].map(function(n) {
                    return (
                      <TouchableOpacity key={n}
                        style={[styles.nbBtn, nbMatchs===n&&{backgroundColor:C}]}
                        onPress={() => setNbMatchs(n)}>
                        <Text style={[styles.nbBtnText, nbMatchs===n&&{color:'#fff'}]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {recentSliced.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de matchs recents</Text></View>
              ) : recentSliced.map(function(g, i) {
                const isHome = g.teams.home.id === team.id;
                const myScore = isHome ? g.scores.home.total : g.scores.away.total;
                const oppScore = isHome ? g.scores.away.total : g.scores.home.total;
                const oppName = isHome ? g.teams.away.name : g.teams.home.name;
                const oppLogo = isHome ? g.teams.away.logo : g.teams.home.logo;
                const win = (myScore||0) > (oppScore||0);
                return (
                  <View key={i} style={[styles.gameCard,{borderLeftColor:win?'#4CAF50':'#E53935',borderLeftWidth:3}]}>
                    <View style={styles.gameCardRow}>
                      <Text style={styles.gameCardDate}>{(g.date||'').slice(0,10)}</Text>
                      <Text style={styles.gameCardLocation}>{isHome?'🏠 Domicile':'✈️ Exterieur'}</Text>
                      <View style={[styles.winLossBadge,{backgroundColor:win?'#4CAF5022':'#E5393522'}]}>
                        <Text style={[styles.winLossText,{color:win?'#4CAF50':'#E53935'}]}>{win?'V':'D'}</Text>
                      </View>
                    </View>
                    <View style={styles.gameCardTeams}>
                      {oppLogo ? <Image source={{ uri:oppLogo }} style={styles.gameCardLogo} onError={function(){}} /> : null}
                      <Text style={styles.gameCardOpp} numberOfLines={1}>vs {oppName}</Text>
                      <Text style={[styles.gameCardScore,{color:win?'#4CAF50':'#E53935'}]}>
                        {myScore||0} - {oppScore||0}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'prochains' && (
            <View>
              <Text style={styles.sectionTitle}>PROCHAINS MATCHS</Text>
              {upcomingGames.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de matchs a venir</Text></View>
              ) : upcomingGames.map(function(g, i) {
                const isHome = g.teams.home.id === team.id;
                const oppName = isHome ? g.teams.away.name : g.teams.home.name;
                const oppLogo = isHome ? g.teams.away.logo : g.teams.home.logo;
                const matchDate = new Date(g.date);
                return (
                  <View key={i} style={styles.upcomingCard}>
                    <View style={styles.gameCardRow}>
                      <Text style={styles.gameCardDate}>
                        {matchDate.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
                      </Text>
                      <Text style={styles.gameCardLocation}>{isHome?'🏠 Domicile':'✈️ Exterieur'}</Text>
                      <Text style={[styles.upcomingTime,{color:C}]}>
                        {matchDate.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                      </Text>
                    </View>
                    <View style={styles.gameCardTeams}>
                      {oppLogo ? <Image source={{ uri:oppLogo }} style={styles.gameCardLogo} onError={function(){}} /> : null}
                      <Text style={styles.gameCardOpp} numberOfLines={1}>vs {oppName}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'joueurs' && (
            <View>
              <Text style={styles.sectionTitle}>EFFECTIF</Text>
              {players.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Effectif non disponible</Text></View>
              ) : players.map(function(p, i) {
                return (
                  <View key={i} style={styles.playerRow}>
                    {p.photo ? (
                      <Image source={{ uri:p.photo }} style={styles.playerPhoto} onError={function(){}} />
                    ) : (
                      <View style={[styles.playerPhotoPlaceholder,{backgroundColor:C+'33'}]}>
                        <Text style={styles.playerPhotoText}>{(p.name||'?')[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex:1 }}>
                      <Text style={styles.playerName}>{p.name}</Text>
                      <Text style={styles.playerInfo}>{p.position||'?'}{p.nationality?' · '+p.nationality:''}</Text>
                    </View>
                    <Text style={[styles.playerStatVal,{color:C}]}>{p.number||''}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'kazmo' && (
            <View>
              <View style={styles.kazmoHeader}>
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.kazmoAvatar}>
                  <Text style={styles.kazmoAvatarText}>K</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.kazmoName}>KAZMO IA</Text>
                  <Text style={styles.kazmoSub}>Analyse de {team.name}</Text>
                </View>
              </View>
              {loadingKazmo ? (
                <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View>
              ) : kazmoAnalysis ? (
                <View style={styles.analysisCard}>
                  <Text style={styles.analysisText}>{kazmoAnalysis}</Text>
                </View>
              ) : null}
              <Text style={[styles.sectionTitle,{marginTop:20}]}>POSER UNE QUESTION</Text>
              {chatHistory.length > 0 && (
                <View style={styles.chatHistory}>
                  {chatHistory.map(function(msg, i) {
                    const isUser = msg.role === 'user';
                    return (
                      <View key={i} style={[styles.chatMsg, isUser?styles.chatMsgUser:styles.chatMsgKazmo]}>
                        {!isUser && (
                          <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.chatAvatar}>
                            <Text style={styles.chatAvatarText}>K</Text>
                          </LinearGradient>
                        )}
                        <View style={[styles.chatBubble, isUser?styles.chatBubbleUser:styles.chatBubbleKazmo]}>
                          <Text style={styles.chatText}>{msg.content}</Text>
                        </View>
                      </View>
                    );
                  })}
                  {loadingChat && (
                    <View style={styles.chatMsgKazmo}>
                      <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.chatAvatar}>
                        <Text style={styles.chatAvatarText}>K</Text>
                      </LinearGradient>
                      <View style={[styles.chatBubble,styles.chatBubbleKazmo]}>
                        <ActivityIndicator color="#FF6B2B" size="small" />
                      </View>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.chatInputRow}>
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  style={styles.chatInput}
                  placeholder={'Question sur '+team.name+'...'}
                  placeholderTextColor="#ffffff44"
                  multiline maxLength={300}
                />
                <TouchableOpacity onPress={sendChat} disabled={loadingChat||!chatInput.trim()} activeOpacity={0.85} style={styles.chatSendBtn}>
                  <LinearGradient
                    colors={loadingChat||!chatInput.trim()?['#444','#555']:['#FF6B2B','#FFD600']}
                    start={{x:0,y:0}} end={{x:1,y:0}} style={styles.chatSendBtnGradient}>
                    <Text style={styles.chatSendBtnText}>→</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:2 },
  backBtn: { width:40, height:40, alignItems:'center', justifyContent:'center' },
  backBtnText: { color:'#FF6B2B', fontSize:24, fontWeight:'700' },
  headerCenter: { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  headerLogo: { width:48, height:48, resizeMode:'contain' },
  headerLogoPlaceholder: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  headerLogoText: { color:'#fff', fontFamily:'BebasNeue', fontSize:16 },
  headerTeamName: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:1 },
  headerLeague: { color:'#ffffff66', fontSize:10, marginTop:2 },
  tabScrollView: { maxHeight:42, marginHorizontal:16, marginTop:8, marginBottom:4 },
  tabBar: { flexDirection:'row', gap:6 },
  tabBtn: { paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:10 },
  scroll: { padding:16, paddingBottom:40 },
  center: { padding:40, alignItems:'center', justifyContent:'center' },
  nbMatchsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  nbMatchsBtns: { flexDirection:'row', gap:6 },
  nbBtn: { width:36, height:28, borderRadius:8, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22', alignItems:'center', justifyContent:'center' },
  nbBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12 },
  emptyBox: { backgroundColor:'#16162a', borderRadius:12, padding:20, alignItems:'center' },
  emptyText: { color:'#ffffff55', fontSize:12 },
  gameCard: { backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  gameCardRow: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap' },
  gameCardDate: { color:'#ffffff55', fontSize:10, flex:1 },
  gameCardLocation: { color:'#ffffff88', fontSize:9 },
  winLossBadge: { borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  winLossText: { fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  gameCardTeams: { flexDirection:'row', alignItems:'center', gap:8 },
  gameCardLogo: { width:28, height:28, resizeMode:'contain' },
  gameCardOpp: { color:'#fff', fontSize:12, fontWeight:'600', flex:1 },
  gameCardScore: { fontFamily:'BebasNeue', fontSize:18 },
  upcomingCard: { backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  upcomingTime: { fontFamily:'BebasNeue', fontSize:14 },
  playerRow: { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#16162a', borderRadius:10, padding:10, marginBottom:6, borderWidth:1, borderColor:'#ffffff0a' },
  playerPhoto: { width:36, height:36, borderRadius:18, resizeMode:'cover' },
  playerPhotoPlaceholder: { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  playerPhotoText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14 },
  playerName: { color:'#fff', fontSize:12, fontWeight:'600' },
  playerInfo: { color:'#ffffff55', fontSize:10, marginTop:2 },
  playerStatVal: { color:'#fff', fontFamily:'BebasNeue', fontSize:16 },
  kazmoHeader: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#16162a', borderRadius:14, padding:14, borderWidth:1, borderColor:'#FF6B2B33', marginBottom:12 },
  kazmoAvatar: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  kazmoAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:24, fontWeight:'900' },
  kazmoName: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1 },
  kazmoSub: { color:'#ffffff55', fontSize:10 },
  analysisCard: { backgroundColor:'#16162a', borderRadius:14, padding:16, borderWidth:1, borderColor:'#FF6B2B22', marginBottom:12 },
  analysisText: { color:'#ffffffcc', fontSize:13, lineHeight:20 },
  chatHistory: { gap:12, marginBottom:12 },
  chatMsg: { flexDirection:'row', alignItems:'flex-end', gap:8 },
  chatMsgUser: { justifyContent:'flex-end' },
  chatMsgKazmo: { justifyContent:'flex-start' },
  chatAvatar: { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
  chatAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14 },
  chatBubble: { maxWidth:'75%', borderRadius:12, padding:10 },
  chatBubbleUser: { backgroundColor:'#FF6B2B22', borderColor:'#FF6B2B44', borderWidth:1 },
  chatBubbleKazmo: { backgroundColor:'#16162a', borderColor:'#ffffff14', borderWidth:1 },
  chatText: { color:'#fff', fontSize:12, lineHeight:18 },
  chatInputRow: { flexDirection:'row', gap:8, alignItems:'flex-end', marginTop:8 },
  chatInput: { flex:1, backgroundColor:'#16162a', borderRadius:12, padding:12, color:'#fff', fontSize:13, borderWidth:1, borderColor:'#ffffff22', maxHeight:100 },
  chatSendBtn: { width:48, height:48 },
  chatSendBtnGradient: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  chatSendBtnText: { color:'#fff', fontSize:20, fontWeight:'700' },
});
