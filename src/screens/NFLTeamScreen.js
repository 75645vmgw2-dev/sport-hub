import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import { useLanguage } from '../i18n/LanguageContext';

const H_NFL = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.american-football.api-sports.io' };

const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

export default function NFLTeamScreen({ team, onBack }) {
  const { language } = useLanguage();
  const [tab, setTab] = useState('joueurs');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kazmoAnalysis, setKazmoAnalysis] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const C = '#1A73E8';
  const langNames = {
    fr:'français', en:'English', es:'español', pt:'português',
    de:'Deutsch', it:'italiano', ar:'العربية', ru:'русский'
  };

  useEffect(() => { fetchTeamData(); }, []);

  async function fetchTeamData() {
    setLoading(true);
    try {
      const res = await fetch('https://v1.american-football.api-sports.io/players?team='+team.id+'&season=2025', { headers:H_NFL });
      const data = await res.json();
      setPlayers((data.response||[]).slice(0,25));
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function fetchKazmoAnalysis() {
    if (kazmoAnalysis) return;
    setLoadingKazmo(true);
    try {
      const langName = langNames[language] || 'français';
      const prompt = 'Tu es Kazmo, assistant IA sportif premium.\n' +
        'Fais une analyse complete de lequipe NFL : ' + team.name + '\n\n' +
        'Inclus : 1. Presentation 2. Saison 2025 3. Points forts/faibles 4. Joueurs cles 5. Perspectives saison 2026\n\n' +
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
          system:'Tu es Kazmo, expert NFL sur '+team.name+'. Reponds en '+langName+' de facon concise.',
          messages: newHistory.map(function(m){return{role:m.role,content:m.content};}),
        }),
      });
      const data = await response.json();
      const answer = (data.content||[]).map(function(c){return c.text||'';}).join('');
      setChatHistory(function(prev){return[...prev,{role:'assistant',content:answer}];});
    } catch(e) {}
    finally { setLoadingChat(false); }
  }

  const TABS = [
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
            <Text style={styles.headerLeague}>NFL 2025-26</Text>
          </View>
        </View>
        <View style={{ width:40 }} />
      </View>

      <View style={styles.nextSeasonBanner}>
        <Text style={styles.nextSeasonText}>🏈 Prochain kickoff — Septembre 2026</Text>
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
                      <Text style={styles.playerInfo}>{p.position||'?'}{p.college?' · '+p.college:''}</Text>
                    </View>
                    <Text style={[styles.playerNumber,{color:C}]}>#{p.number||''}</Text>
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
  nextSeasonBanner: { backgroundColor:'#1A73E811', borderRadius:8, margin:16, marginBottom:8, padding:10, borderWidth:1, borderColor:'#1A73E833' },
  nextSeasonText: { color:'#1A73E8', fontSize:11, fontFamily:'BebasNeue', letterSpacing:1, textAlign:'center' },
  tabScrollView: { maxHeight:42, marginHorizontal:16, marginTop:4, marginBottom:4 },
  tabBar: { flexDirection:'row', gap:6 },
  tabBtn: { paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:10 },
  scroll: { padding:16, paddingBottom:40 },
  center: { padding:40, alignItems:'center', justifyContent:'center' },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  emptyBox: { backgroundColor:'#16162a', borderRadius:12, padding:20, alignItems:'center' },
  emptyText: { color:'#ffffff55', fontSize:12 },
  playerRow: { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#16162a', borderRadius:10, padding:10, marginBottom:6, borderWidth:1, borderColor:'#ffffff0a' },
  playerPhoto: { width:36, height:36, borderRadius:18, resizeMode:'cover' },
  playerPhotoPlaceholder: { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  playerPhotoText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14 },
  playerName: { color:'#fff', fontSize:12, fontWeight:'600' },
  playerInfo: { color:'#ffffff55', fontSize:10, marginTop:2 },
  playerNumber: { fontFamily:'BebasNeue', fontSize:18 },
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
