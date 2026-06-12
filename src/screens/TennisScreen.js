import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const H_TENNIS = {
  'x-rapidapi-key': RAPIDAPI_GOLF_KEY,
  'x-rapidapi-host': 'tennisapi1.p.rapidapi.com'
};

const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

const SEASON_IDS = { 2480: 85951 };

const ROUND_ORDER = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32', 'Round of 64', 'Round of 128'];

function getRoundLabel(name) {
  const map = {
    'Final': '🏆 Finale',
    'Semifinals': '🥈 Demi-finales',
    'Quarterfinals': '⚡ Quarts de finale',
    'Round of 16': '🎾 Huitièmes de finale',
    'Round of 32': '🎾 32èmes de finale',
    'Round of 64': '🎾 64èmes de finale',
    'Round of 128': '🎾 128èmes de finale',
  };
  return map[name] || name;
}

const GRAND_SLAMS = [
  { id:2480, name:'Roland Garros', city:'Paris', surface:'Clay', flag:'🇫🇷' },
  { id:2417, name:'Wimbledon', city:'London', surface:'Grass', flag:'🇬🇧' },
  { id:2393, name:'US Open', city:'New York', surface:'Hard', flag:'🇺🇸' },
  { id:2577, name:'Australian Open', city:'Melbourne', surface:'Hard', flag:'🇦🇺' },
];

const MASTERS_1000 = [
  { id:2562, name:'Indian Wells', city:'Indian Wells', surface:'Hard', flag:'🇺🇸' },
  { id:2563, name:'Miami Open', city:'Miami', surface:'Hard', flag:'🇺🇸' },
  { id:2564, name:'Monte-Carlo', city:'Monaco', surface:'Clay', flag:'🇲🇨' },
  { id:2565, name:'Madrid Open', city:'Madrid', surface:'Clay', flag:'🇪🇸' },
  { id:2566, name:'Rome', city:'Rome', surface:'Clay', flag:'🇮🇹' },
  { id:2567, name:'Canada', city:'Montreal', surface:'Hard', flag:'🇨🇦' },
  { id:2568, name:'Cincinnati', city:'Cincinnati', surface:'Hard', flag:'🇺🇸' },
  { id:2569, name:'Shanghai', city:'Shanghai', surface:'Hard', flag:'🇨🇳' },
  { id:2570, name:'Paris Masters', city:'Paris', surface:'Hard', flag:'🇫🇷' },
];

const ATP_250_500 = [
  { id:2483, name:'Stuttgart', city:'Stuttgart', surface:'Grass', flag:'🇩🇪' },
  { id:2493, name:'Halle', city:'Halle', surface:'Grass', flag:'🇩🇪' },
  { id:2407, name:'Barcelona', city:'Barcelona', surface:'Clay', flag:'🇪🇸' },
  { id:2428, name:'Vienna', city:'Vienna', surface:'Hard', flag:'🇦' },
  { id:2406, name:'Basel', city:'Basel', surface:'Hard', flag:'🇨🇭' },
  { id:2420, name:'Doha', city:'Doha', surface:'Hard', flag:'🇶🇦' },
  { id:2389, name:'Dubai', city:'Dubai', surface:'Hard', flag:'🇦🇪' },
  { id:2362, name:'Eastbourne', city:'Eastbourne', surface:'Grass', flag:'🇬🇧' },
  { id:2689, name:'Nottingham', city:'Nottingham', surface:'Grass', flag:'🇬🇧' },
];

function isMatchFinished(desc) {
  return desc==='Ended'||desc==='Finished'||desc==='Retired'||desc==='Walkover';
}

function isMatchLive(desc) {
  return desc==='In progress'||desc==='Live';
}

function getSurfaceIcon(surface) {
  if (!surface) return '🎾';
  const s = surface.toLowerCase();
  if (s.includes('clay')||s.includes('red')) return '🟤';
  if (s.includes('grass')) return '💚';
  if (s.includes('hard')||s.includes('hardcourt')) return '🔵';
  return '🎾';
}

function getSurfaceLabel(surface) {
  if (!surface) return '';
  const s = surface.toLowerCase();
  if (s.includes('clay')||s.includes('red')) return 'Terre';
  if (s.includes('grass')) return 'Gazon';
  if (s.includes('hard')||s.includes('hardcourt')) return 'Dur';
  return surface;
}

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function PlayerSearchModal({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setResults([]); return; }
    const timer = setTimeout(() => { searchPlayer(search); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  async function searchPlayer(query) {
    setLoading(true);
    try {
      const res = await fetch('https://tennisapi1.p.rapidapi.com/api/tennis/search/'+encodeURIComponent(query), { headers:H_TENNIS });
      const data = await res.json();
      const players = (data.results||[])
        .filter(function(r){ return r.type==='team'; })
        .map(function(r){ return { id:r.entity?.id||r.id, name:r.entity?.name||r.name||'?', country:r.entity?.country?.name||'' }; })
        .filter(function(p){ return p.id && p.name !== '?'; })
        .slice(0,8);
      setResults(players);
    } catch(e) {}
    finally { setLoading(false); }
  }

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🔍 RECHERCHER UN JOUEUR</Text>
          <TextInput value={search} onChangeText={setSearch} style={styles.searchInput}
            placeholder="Tapez un nom (ex: Sinner, Djokovic...)" placeholderTextColor="#ffffff44" autoFocus />
          {loading && <ActivityIndicator color="#FF6B2B" style={{marginVertical:10}} />}
          <ScrollView style={{maxHeight:300}}>
            {results.map(function(p, i) {
              return (
                <TouchableOpacity key={i} style={styles.searchResult} onPress={() => { onSelect(p); onClose(); }}>
                  <View style={styles.searchResultAvatar}>
                    <Text style={styles.searchResultAvatarText}>{p.name[0]}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={styles.searchResultName}>{p.name}</Text>
                    {p.country ? <Text style={styles.searchResultCountry}>{p.country}</Text> : null}
                  </View>
                  <Text style={styles.searchResultArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
            {search.length >= 2 && !loading && results.length === 0 && (
              <Text style={styles.noResults}>Aucun joueur trouvé</Text>
            )}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function TennisPlayerScreen({ player, onBack }) {
  const [loading, setLoading] = useState(true);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [kazmoAnalysis, setKazmoAnalysis] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [tab, setTab] = useState('info');
  const [nbMatchs, setNbMatchs] = useState(5);
  const C = '#c85a19';

  useEffect(() => { fetchPlayerData(); }, []);

  async function fetchPlayerData() {
    setLoading(true);
    try {
      const infoRes = await fetch('https://tennisapi1.p.rapidapi.com/api/tennis/player/'+player.id+'/rankings', { headers:H_TENNIS });
      const infoData = await infoRes.json();
      setPlayerInfo((infoData.rankings||[])[0] || null);
    } catch(e) {}
    try {
      const matchRes = await fetch('https://tennisapi1.p.rapidapi.com/api/tennis/player/'+player.id+'/events/previous/0', { headers:H_TENNIS });
      const matchData = await matchRes.json();
      const allMatches = (matchData.events||[]).filter(function(e){
        const desc = e.status?.description||'';
        const p1 = e.homeTeam?.name||'';
        const p2 = e.awayTeam?.name||'';
        return isMatchFinished(desc) && !p1.includes('/') && !p2.includes('/');
      }).sort(function(a,b){return (b.startTimestamp||0)-(a.startTimestamp||0);});
      setRecentMatches(allMatches.slice(0,10));
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function fetchKazmo() {
    if (kazmoAnalysis) return;
    setLoadingKazmo(true);
    try {
      const rank = playerInfo?.ranking || '?';
      const points = playerInfo?.points || '?';
      const bestRank = playerInfo?.bestRanking || '?';
      const recentResults = recentMatches.slice(0,5).map(function(e) {
        const isHome = e.homeTeam?.name === player.name;
        const opp = isHome ? e.awayTeam?.name : e.homeTeam?.name;
        const won = (isHome && e.winnerCode===1) || (!isHome && e.winnerCode===2);
        return (won?'V':'D')+' vs '+opp+' ('+e.tournament?.name+')';
      }).join('\n');
      const prompt = 'Tu es Kazmo, assistant IA sportif premium.\nAnalyse le joueur de tennis : '+player.name+'\n\nStats:\n- Classement: #'+rank+'\n- Points: '+points+'\n- Meilleur classement: #'+bestRank+'\n\nDerniers matchs:\n'+recentResults+'\n\nFais une analyse complète en français.';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:600, messages:[{role:'user',content:prompt}] }),
      });
      const data = await res.json();
      setKazmoAnalysis((data.content||[]).map(function(c){return c.text||'';}).join(''));
    } catch(e) {}
    finally { setLoadingKazmo(false); }
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput('');
    setLoadingChat(true);
    const newHistory = [...chatHistory, {role:'user',content:question}];
    setChatHistory(newHistory);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body:JSON.stringify({
          model:'claude-haiku-4-5-20251001', max_tokens:400,
          system:'Tu es Kazmo, expert tennis sur '+player.name+'. Réponds en français de façon concise.',
          messages:newHistory,
        }),
      });
      const data = await res.json();
      const answer = (data.content||[]).map(function(c){return c.text||'';}).join('');
      setChatHistory(function(prev){return[...prev,{role:'assistant',content:answer}];});
    } catch(e) {}
    finally { setLoadingChat(false); }
  }

  function getMatchResult(event) {
    const isHome = event.homeTeam?.name === player.name;
    const opp = isHome ? event.awayTeam?.name : event.homeTeam?.name;
    const won = (isHome && event.winnerCode===1) || (!isHome && event.winnerCode===2);
    const s = event.homeScore;
    const a = event.awayScore;
    const sets = [];
    if (s && a) {
      ['period1','period2','period3','period4','period5'].forEach(function(p) {
        if (s[p]!==undefined&&a[p]!==undefined) {
          if (isHome) sets.push(s[p]+'-'+a[p]);
          else sets.push(a[p]+'-'+s[p]);
        }
      });
    }
    return { opp, won, sets:sets.join(' '), tournament:event.tournament?.name||'', surface:event.groundType||'' };
  }

  const TABS = [
    { id:'info', label:'📊 Stats' },
    { id:'forme', label:'📈 Forme' },
    { id:'kazmo', label:'🤖 Kazmo' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header,{borderBottomColor:C}]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.playerAvatar,{backgroundColor:C+'33'}]}>
            <Text style={styles.playerAvatarText}>{player.name[0]}</Text>
          </View>
          <View style={{flex:1}}>
            <Text style={styles.headerTitle} numberOfLines={1}>{player.name}</Text>
            <Text style={styles.headerSub}>{player.country||'Tennis'}</Text>
          </View>
        </View>
        <View style={{width:40}} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map(function(tb) {
          return (
            <TouchableOpacity key={tb.id}
              style={[styles.tabBtn, tab===tb.id&&{backgroundColor:C}]}
              onPress={() => { setTab(tb.id); if(tb.id==='kazmo') fetchKazmo(); }}>
              <Text style={[styles.tabBtnText, tab===tb.id&&{color:'#fff'}]}>{tb.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {tab === 'info' && (
            <View>
              <Text style={styles.sectionTitle}>CLASSEMENT & STATS</Text>
              {playerInfo ? (
                <View>
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard,{borderColor:'#FFD70044'}]}>
                      <Text style={[styles.statValue,{color:'#FFD700'}]}>#{playerInfo.ranking||'?'}</Text>
                      <Text style={styles.statLabel}>Classement</Text>
                    </View>
                    <View style={[styles.statCard,{borderColor:'#c85a1944'}]}>
                      <Text style={[styles.statValue,{color:'#c85a19'}]}>{(playerInfo.points||0).toLocaleString()}</Text>
                      <Text style={styles.statLabel}>Points</Text>
                    </View>
                    <View style={[styles.statCard,{borderColor:'#4CAF5044'}]}>
                      <Text style={[styles.statValue,{color:'#4CAF50'}]}>#{playerInfo.bestRanking||'?'}</Text>
                      <Text style={styles.statLabel}>Meilleur</Text>
                    </View>
                    <View style={[styles.statCard,{borderColor:'#1565C044'}]}>
                      <Text style={[styles.statValue,{color:'#1565C0'}]}>{playerInfo.tournamentsPlayed||'?'}</Text>
                      <Text style={styles.statLabel}>Tournois</Text>
                    </View>
                  </View>
                  {playerInfo.country?.name ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>🌍 Pays</Text>
                      <Text style={styles.infoValue}>{playerInfo.country.name}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Stats non disponibles</Text></View>
              )}
            </View>
          )}

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
              {recentMatches.slice(0,nbMatchs).length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de matchs récents</Text></View>
              ) : recentMatches.slice(0,nbMatchs).map(function(event, i) {
                const result = getMatchResult(event);
                const date = event.startTimestamp ? new Date(event.startTimestamp*1000).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : '';
                return (
                  <View key={i} style={[styles.matchResultCard,{borderLeftColor:result.won?'#4CAF50':'#E53935',borderLeftWidth:3}]}>
                    <View style={styles.matchResultHeader}>
                      <Text style={styles.matchResultDate}>{date}</Text>
                      <View style={[styles.winLossBadge,{backgroundColor:result.won?'#4CAF5022':'#E5393522'}]}>
                        <Text style={[styles.winLossText,{color:result.won?'#4CAF50':'#E53935'}]}>{result.won?'V':'D'}</Text>
                      </View>
                      <Text style={styles.matchResultSurface}>{getSurfaceIcon(result.surface)} {getSurfaceLabel(result.surface)}</Text>
                    </View>
                    <Text style={styles.matchResultOpp} numberOfLines={1}>vs {result.opp}</Text>
                    {result.sets ? <Text style={styles.matchResultSets}>{result.sets}</Text> : null}
                    <Text style={styles.matchResultTournament} numberOfLines={1}>{result.tournament}</Text>
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
                <View style={{flex:1}}>
                  <Text style={styles.kazmoName}>KAZMO IA</Text>
                  <Text style={styles.kazmoSub}>Analyse de {player.name}</Text>
                </View>
              </View>
              {loadingKazmo ? (
                <View style={styles.center}><ActivityIndicator color="#FF6B2B" /></View>
              ) : kazmoAnalysis ? (
                <View style={styles.analysisCard}>
                  <Text style={styles.analysisText}>{kazmoAnalysis}</Text>
                </View>
              ) : null}
              <Text style={[styles.sectionTitle,{marginTop:16}]}>POSER UNE QUESTION</Text>
              {chatHistory.map(function(msg,i) {
                const isUser = msg.role==='user';
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
                <View style={[styles.chatMsg,styles.chatMsgKazmo]}>
                  <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.chatAvatar}>
                    <Text style={styles.chatAvatarText}>K</Text>
                  </LinearGradient>
                  <View style={[styles.chatBubble,styles.chatBubbleKazmo]}>
                    <ActivityIndicator color="#FF6B2B" size="small" />
                  </View>
                </View>
              )}
              <View style={styles.chatInputRow}>
                <TextInput value={chatInput} onChangeText={setChatInput} style={styles.chatInput}
                  placeholder={'Question sur '+player.name+'...'} placeholderTextColor="#ffffff44"
                  multiline maxLength={300} />
                <TouchableOpacity onPress={sendChat} disabled={loadingChat||!chatInput.trim()} style={styles.chatSendBtn}>
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

export default function TennisScreen({ onBack, user }) {
  const [tab, setTab] = useState('matches');
  const [selectedCategory, setSelectedCategory] = useState('GRAND CHELEM');
  const [selectedTournament, setSelectedTournament] = useState(GRAND_SLAMS[0]);
  const [matches, setMatches] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [rankings, setRankings] = useState({ atp:[], wta:[] });
  const [rankTab, setRankTab] = useState('atp');
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [currentSeasonName, setCurrentSeasonName] = useState('');
  const C = '#c85a19';

  const CATEGORIES = [
    { id:'GRAND CHELEM', label:'🏆 Grand Chelem', color:'#FFD700', tournaments:GRAND_SLAMS },
    { id:'MASTERS 1000', label:'⭐ Masters 1000', color:'#FF6B2B', tournaments:MASTERS_1000 },
    { id:'ATP 250/500', label:'🎾 ATP 250/500', color:'#1565C0', tournaments:ATP_250_500 },
  ];

  const TABS = [
    { id:'matches', label:'🎾 Matchs' },
    { id:'rankings', label:'🏆 Classements' },
  ];

  useEffect(() => {
    loadMatchesForTournament(GRAND_SLAMS[0]);
  }, []);

  async function fetchRankings() {
    try {
      const atpRes = await fetch('https://tennisapi1.p.rapidapi.com/api/tennis/rankings/atp', { headers:H_TENNIS });
      const atpData = await atpRes.json();
      setRankings(function(prev){ return {...prev, atp:(atpData.rankings||[]).slice(0,50)}; });
    } catch(e) {}
    try {
      const wtaRes = await fetch('https://tennisapi1.p.rapidapi.com/api/tennis/rankings/wta', { headers:H_TENNIS });
      const wtaData = await wtaRes.json();
      setRankings(function(prev){ return {...prev, wta:(wtaData.rankings||[]).slice(0,50)}; });
    } catch(e) {}
  }

  async function loadMatchesForTournament(tournament) {
    setLoadingMatches(true);
    setLoading(true);
    setMatches([]);
    setSelectedRound(null);
    setCurrentSeasonName('');
    try {
      const seasonId = SEASON_IDS[tournament.id] || await getSeasonId(tournament.id);
      if (!seasonId) { return; }

      const res = await fetch(
        'https://tennisapi1.p.rapidapi.com/api/tennis/tournament/'+tournament.id+'/season/'+seasonId+'/events/last/0',
        { headers:H_TENNIS }
      );
      const data = await res.json();

      if (data.events?.[0]?.tournament?.name) {
        setCurrentSeasonName(data.events[0].tournament.name);
      }

      // Filtre simples uniquement — exclut doubles (/ dans le nom)
      const events = (data.events||[]).filter(function(e) {
        const p1 = e.homeTeam?.name||'';
        const p2 = e.awayTeam?.name||'';
        return !p1.includes('/')&&!p2.includes('/');
      });

      setMatches(events);

      // Sélectionne automatiquement le round le plus récent
      const roundNames = events.map(function(e){ return e.roundInfo?.name||''; }).filter(Boolean);
      const uniqueRounds = [...new Set(roundNames)];
      const sorted = ROUND_ORDER.filter(function(r){ return uniqueRounds.indexOf(r) >= 0; });
      if (sorted.length > 0) setSelectedRound(sorted[0]);
      else if (uniqueRounds.length > 0) setSelectedRound(uniqueRounds[0]);

    } catch(e) {}
    finally { setLoadingMatches(false); setLoading(false); }
  }

  async function getSeasonId(tournamentId) {
    try {
      const res = await fetch('https://tennisapi1.p.rapidapi.com/api/tennis/tournament/'+tournamentId+'/seasons', { headers:H_TENNIS });
      const data = await res.json();
      return data.seasons?.[0]?.id || null;
    } catch(e) { return null; }
  }

  function getScoreDisplay(event) {
    const s = event.homeScore;
    const a = event.awayScore;
    if (!s||!a) return null;
    const sets = [];
    ['period1','period2','period3','period4','period5'].forEach(function(p) {
      if (s[p]!==undefined&&a[p]!==undefined) sets.push(s[p]+'-'+a[p]);
    });
    return sets.length>0?sets.join('  '):null;
  }

  function getPlayerFromEvent(event, isHome) {
    const team = isHome ? event.homeTeam : event.awayTeam;
    return { id:team?.id, name:team?.name||'?', country:team?.country?.name||'' };
  }

  function getMatchStatus(event) {
    const desc = event.status?.description||'';
    if (isMatchLive(desc)) return {label:'LIVE', isLive:true, isFinished:false};
    if (isMatchFinished(desc)) return {label:desc==='Retired'?'Abandon':desc==='Walkover'?'Walkover':t('finished'), isLive:false, isFinished:true};
    if (event.startTimestamp) {
      const d = new Date(event.startTimestamp*1000);
      return {label:d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}), isLive:false, isFinished:false};
    }
    return {label:'À venir', isLive:false, isFinished:false};
  }

  const activeCat = CATEGORIES.find(function(c){return c.id===selectedCategory;})||CATEGORIES[0];

  // Rounds triés du plus récent au plus ancien
  const allRoundNames = [...new Set(matches.map(function(e){ return e.roundInfo?.name||''; }).filter(Boolean))];
  const rounds = ROUND_ORDER.filter(function(r){ return allRoundNames.indexOf(r) >= 0; });
  const otherRounds = allRoundNames.filter(function(r){ return ROUND_ORDER.indexOf(r) < 0; });
  const allRounds = [...rounds, ...otherRounds];

  // Matchs du round sélectionné
  const roundMatches = selectedRound
    ? matches.filter(function(e){ return e.roundInfo?.name === selectedRound; })
    : [];

  if (selectedPlayer) {
    return <TennisPlayerScreen player={selectedPlayer} onBack={() => setSelectedPlayer(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header,{borderBottomColor:C}]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>🎾</Text>
          <View>
            <Text style={styles.headerTitle}>TENNIS</Text>
            <Text style={styles.headerSub}>ATP · WTA · Grand Slam</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(function(tb) {
          return (
            <TouchableOpacity key={tb.id}
              style={[styles.tabBtn, tab===tb.id&&{backgroundColor:C}]}
              onPress={() => { setTab(tb.id); if(tb.id==='rankings'&&rankings.atp.length===0) fetchRankings(); }}>
              <Text style={[styles.tabBtnText, tab===tb.id&&{color:'#fff'}]}>{tb.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#FF6B2B" size="large" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {tab === 'matches' && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
                <View style={{flexDirection:'row', gap:8}}>
                  {CATEGORIES.map(function(cat) {
                    const active = selectedCategory===cat.id;
                    return (
                      <TouchableOpacity key={cat.id}
                        style={[styles.catBtn, active&&{backgroundColor:cat.color,borderColor:cat.color}]}
                        onPress={() => setSelectedCategory(cat.id)}>
                        <Text style={[styles.catBtnText, active&&{color:'#fff'}]}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
                <View style={{flexDirection:'row', gap:8}}>
                  {activeCat.tournaments.map(function(t, i) {
                    const active = selectedTournament?.id===t.id;
                    return (
                      <TouchableOpacity key={i}
                        style={[styles.tournBtn, active&&{backgroundColor:activeCat.color,borderColor:activeCat.color}]}
                        onPress={() => { setSelectedTournament(t); loadMatchesForTournament(t); }}>
                        <Text style={styles.tournBtnFlag}>{t.flag||'🎾'}</Text>
                        <Text style={[styles.tournBtnName, active&&{color:'#fff'}]} numberOfLines={1}>{t.name}</Text>
                        <Text style={[styles.tournBtnSurface, active&&{color:'#ffffff88'}]}>{getSurfaceIcon(t.surface||'')} {t.surface}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {selectedTournament && (
                <View style={[styles.selectedTournBanner,{borderColor:activeCat.color+'44'}]}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                    <Text style={{fontSize:20}}>{selectedTournament.flag||'🎾'}</Text>
                    <View style={{flex:1}}>
                      <Text style={styles.selectedTournName}>{currentSeasonName||selectedTournament.name}</Text>
                      <Text style={styles.selectedTournCity}>{selectedTournament.city} · {getSurfaceIcon(selectedTournament.surface||'')} {selectedTournament.surface}</Text>
                    </View>
                    <View style={[styles.catBadge,{backgroundColor:activeCat.color+'33',borderColor:activeCat.color+'55'}]}>
                      <Text style={[styles.catBadgeText,{color:activeCat.color}]}>{selectedCategory}</Text>
                    </View>
                  </View>
                </View>
              )}

              {loadingMatches ? (
                <View style={styles.center}><ActivityIndicator color="#FF6B2B" /></View>
              ) : allRounds.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Pas de matchs disponibles</Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.sectionLabel}>TABLEAU DU TOURNOI</Text>

                  {allRounds.map(function(round) {
                    const isActive = selectedRound === round;
                    const count = matches.filter(function(e){ return e.roundInfo?.name === round; }).length;
                    return (
                      <View key={round}>
                        <TouchableOpacity
                          style={[styles.roundCard, isActive&&{borderColor:activeCat.color, backgroundColor:activeCat.color+'11'}]}
                          onPress={() => setSelectedRound(isActive ? null : round)}>
                          <View style={{flex:1}}>
                            <Text style={[styles.roundCardName, isActive&&{color:activeCat.color}]}>{getRoundLabel(round)}</Text>
                            <Text style={styles.roundCardCount}>{count} match{count>1?'s':''}</Text>
                          </View>
                          <Text style={[styles.roundCardArrow, isActive&&{color:activeCat.color}]}>{isActive?'▼':'›'}</Text>
                        </TouchableOpacity>

                        {isActive && roundMatches.map(function(event, i) {
                          const p1 = getPlayerFromEvent(event, true);
                          const p2 = getPlayerFromEvent(event, false);
                          const status = getMatchStatus(event);
                          const score = getScoreDisplay(event);
                          return (
                            <View key={i} style={[styles.matchCard, status.isLive&&{borderColor:activeCat.color,borderWidth:1}]}>
                              <View style={styles.matchCardHeader}>
                                {status.isLive && (
                                  <View style={[styles.liveBadge,{backgroundColor:activeCat.color+'33',borderColor:activeCat.color+'66'}]}>
                                    <Text style={[styles.liveLabel,{color:activeCat.color}]}>● LIVE</Text>
                                  </View>
                                )}
                                {status.isFinished && <Text style={styles.finishedLabel}>✅ {status.label}</Text>}
                                {!status.isLive&&!status.isFinished && <Text style={styles.timeLabel}>📅 {status.label}</Text>}
                              </View>
                              <View style={styles.matchPlayers}>
                                <TouchableOpacity style={styles.playerRow} onPress={() => p1.id&&setSelectedPlayer(p1)}>
                                  <Text style={[styles.playerName, status.isFinished&&event.winnerCode===1&&{color:'#4CAF50',fontWeight:'700'}]} numberOfLines={1}>{p1.name}</Text>
                                  {status.isFinished&&event.winnerCode===1&&<Text style={styles.winnerMark}>✓</Text>}
                                  {p1.id&&<Text style={styles.playerArrow}>›</Text>}
                                </TouchableOpacity>
                                {score ? (
                                  <Text style={[styles.setScore, status.isLive&&{color:activeCat.color}]}>{score}</Text>
                                ) : (
                                  <Text style={styles.vsText}>VS</Text>
                                )}
                                <TouchableOpacity style={styles.playerRow} onPress={() => p2.id&&setSelectedPlayer(p2)}>
                                  <Text style={[styles.playerName, status.isFinished&&event.winnerCode===2&&{color:'#4CAF50',fontWeight:'700'}]} numberOfLines={1}>{p2.name}</Text>
                                  {status.isFinished&&event.winnerCode===2&&<Text style={styles.winnerMark}>✓</Text>}
                                  {p2.id&&<Text style={styles.playerArrow}>›</Text>}
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {tab === 'rankings' && (
            <View>
              <TouchableOpacity style={styles.searchBarBtn} onPress={() => setShowSearch(true)}>
                <Text style={styles.searchBarIcon}>🔍</Text>
                <Text style={styles.searchBarText}>Rechercher un joueur...</Text>
              </TouchableOpacity>
              <View style={styles.rankTabRow}>
                {['atp','wta'].map(function(rt) {
                  return (
                    <TouchableOpacity key={rt}
                      style={[styles.rankTabBtn, rankTab===rt&&{backgroundColor:rt==='atp'?'#1565C0':'#AD1457'}]}
                      onPress={() => setRankTab(rt)}>
                      <Text style={[styles.rankTabText, rankTab===rt&&{color:'#fff'}]}>
                        {rt==='atp'?'👨 ATP':'👩 WTA'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {rankings[rankTab].length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Appuyez sur l'onglet Classements pour charger</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText,{width:30}]}>#</Text>
                    <Text style={[styles.tableHeaderText,{flex:1,textAlign:'left'}]}>Joueur</Text>
                    <Text style={[styles.tableHeaderText,{width:70}]}>Points</Text>
                    <Text style={[styles.tableHeaderText,{width:20}]}> </Text>
                  </View>
                  {(rankings[rankTab]||[]).map(function(r, i) {
                    const player = r.player||r.team||{};
                    const name = player.name||r.rowName||'?';
                    const points = r.points||0;
                    const country = player.country?.alpha2||'';
                    const playerId = player.id||null;
                    const rankColor = rankTab==='atp'?'#1565C0':'#AD1457';
                    return (
                      <TouchableOpacity key={i}
                        onPress={() => playerId&&setSelectedPlayer({id:playerId, name, country:player.country?.name||''})}
                        style={[styles.rankRow, {
                          backgroundColor: i%2===0?'#16162a':'#0d0d1a',
                          borderLeftColor: i===0?'#FFD700':i<3?rankColor:'#ffffff22',
                          borderLeftWidth:3,
                        }]}>
                        <Text style={[styles.rankNum,{width:30}]}>{i+1}</Text>
                        <View style={{flex:1}}>
                          <Text style={styles.rankName} numberOfLines={1}>{name}</Text>
                          {country?<Text style={styles.rankCountry}>{country}</Text>:null}
                        </View>
                        <Text style={[styles.rankPoints,{width:70,color:rankColor}]}>{points.toLocaleString()}</Text>
                        <Text style={styles.rankArrow}>›</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

        </ScrollView>
      )}

      {showSearch && (
        <PlayerSearchModal onSelect={function(p){ setSelectedPlayer(p); }} onClose={() => setShowSearch(false)} />
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
  headerIcon: { fontSize:32 },
  headerTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:20, letterSpacing:1 },
  headerSub: { color:'#ffffff66', fontSize:10 },
  searchBtn: { width:40, height:40, alignItems:'center', justifyContent:'center' },
  searchBtnText: { fontSize:20 },
  playerAvatar: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  playerAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:22 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginBottom:8, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12 },
  scroll: { padding:16, paddingBottom:40 },
  center: { padding:40, alignItems:'center', justifyContent:'center', gap:8 },
  loadingText: { color:'#ffffff88', fontFamily:'BebasNeue', fontSize:12, letterSpacing:1 },
  catBtn: { paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  catBtnText: { color:'#ffffff88', fontFamily:'BebasNeue', fontSize:11, letterSpacing:0.5 },
  tournBtn: { backgroundColor:'#16162a', borderRadius:12, padding:10, alignItems:'center', borderWidth:1, borderColor:'#ffffff22', width:110 },
  tournBtnFlag: { fontSize:20, marginBottom:2 },
  tournBtnName: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:10, textAlign:'center', marginBottom:2 },
  tournBtnSurface: { color:'#ffffff55', fontSize:8, textAlign:'center' },
  selectedTournBanner: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:12, borderWidth:1 },
  selectedTournName: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  selectedTournCity: { color:'#ffffff66', fontSize:10, marginTop:2 },
  catBadge: { borderRadius:8, paddingHorizontal:8, paddingVertical:3, borderWidth:1 },
  catBadgeText: { fontFamily:'BebasNeue', fontSize:9, letterSpacing:1 },
  sectionLabel: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  roundCard: { flexDirection:'row', alignItems:'center', backgroundColor:'#16162a', borderRadius:12, padding:14, marginBottom:6, borderWidth:1, borderColor:'#ffffff22' },
  roundCardName: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:0.5 },
  roundCardCount: { color:'#ffffff55', fontSize:10, marginTop:2 },
  roundCardArrow: { color:'#ffffff55', fontSize:18, fontWeight:'700' },
  emptyBox: { backgroundColor:'#16162a', borderRadius:12, padding:20, alignItems:'center' },
  emptyText: { color:'#ffffff55', fontSize:12, textAlign:'center' },
  matchCard: { backgroundColor:'#0d0d1a', borderRadius:12, padding:12, marginBottom:6, marginLeft:12, borderWidth:1, borderColor:'#ffffff14' },
  matchCardHeader: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap' },
  liveBadge: { borderRadius:6, paddingHorizontal:6, paddingVertical:2, borderWidth:1 },
  liveLabel: { fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  finishedLabel: { color:'#4CAF50', fontSize:10 },
  timeLabel: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:10 },
  matchPlayers: { gap:6 },
  playerRow: { flexDirection:'row', alignItems:'center', gap:6 },
  playerName: { color:'#fff', fontSize:13, fontWeight:'600', flex:1 },
  playerArrow: { color:'#FF6B2B', fontSize:16 },
  winnerMark: { color:'#4CAF50', fontSize:12, fontWeight:'700' },
  setScore: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:2, textAlign:'center', marginVertical:4 },
  vsText: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:16, textAlign:'center', marginVertical:4 },
  searchBarBtn: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:12, borderWidth:1, borderColor:'#ffffff22' },
  searchBarIcon: { fontSize:16 },
  searchBarText: { color:'#ffffff44', fontSize:13 },
  rankTabRow: { flexDirection:'row', backgroundColor:'#16162a', borderRadius:10, padding:4, gap:4, marginBottom:12 },
  rankTabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  rankTabText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12 },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, marginBottom:4 },
  tableHeaderText: { color:'#ffffff33', fontSize:10, fontWeight:'600', textAlign:'center' },
  rankRow: { flexDirection:'row', alignItems:'center', padding:10, borderRadius:6, marginBottom:2 },
  rankNum: { color:'#ffffff55', fontSize:11, fontFamily:'BebasNeue', textAlign:'center' },
  rankName: { color:'#fff', fontSize:12, fontWeight:'600' },
  rankCountry: { color:'#ffffff55', fontSize:9, marginTop:1 },
  rankPoints: { fontFamily:'BebasNeue', fontSize:13, textAlign:'center' },
  rankArrow: { color:'#FF6B2B', fontSize:16, marginLeft:4 },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 },
  statCard: { flex:1, minWidth:'45%', backgroundColor:'#16162a', borderRadius:12, padding:14, alignItems:'center', borderWidth:1 },
  statValue: { fontFamily:'BebasNeue', fontSize:28, letterSpacing:1 },
  statLabel: { color:'#ffffff66', fontSize:9, fontFamily:'BebasNeue', letterSpacing:1, marginTop:2 },
  infoRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:6 },
  infoLabel: { color:'#ffffff88', fontSize:11 },
  infoValue: { color:'#fff', fontSize:12, fontWeight:'600' },
  nbMatchsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  nbMatchsBtns: { flexDirection:'row', gap:6 },
  nbBtn: { width:36, height:28, borderRadius:8, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22', alignItems:'center', justifyContent:'center' },
  nbBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12 },
  matchResultCard: { backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  matchResultHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  matchResultDate: { color:'#ffffff55', fontSize:10, flex:1 },
  winLossBadge: { borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  winLossText: { fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  matchResultSurface: { color:'#ffffff88', fontSize:10 },
  matchResultOpp: { color:'#fff', fontSize:13, fontWeight:'600', marginBottom:3 },
  matchResultSets: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:14, letterSpacing:2, marginBottom:3 },
  matchResultTournament: { color:'#ffffff55', fontSize:10 },
  kazmoHeader: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#16162a', borderRadius:14, padding:14, borderWidth:1, borderColor:'#FF6B2B33', marginBottom:12 },
  kazmoAvatar: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  kazmoAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:24, fontWeight:'900' },
  kazmoName: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1 },
  kazmoSub: { color:'#ffffff55', fontSize:10 },
  analysisCard: { backgroundColor:'#16162a', borderRadius:14, padding:16, borderWidth:1, borderColor:'#FF6B2B22', marginBottom:12 },
  analysisText: { color:'#ffffffcc', fontSize:13, lineHeight:20 },
  chatMsg: { flexDirection:'row', alignItems:'flex-end', gap:8, marginBottom:8 },
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
  modalOverlay: { flex:1, backgroundColor:'#000000aa', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'#16162a', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, maxHeight:'80%' },
  modalTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:16, letterSpacing:2, textAlign:'center', marginBottom:12 },
  searchInput: { backgroundColor:'#0d0d1a', borderRadius:10, padding:12, color:'#fff', fontSize:13, borderWidth:1, borderColor:'#ffffff22', marginBottom:8 },
  searchResult: { flexDirection:'row', alignItems:'center', gap:10, padding:12, borderBottomWidth:1, borderBottomColor:'#ffffff0a' },
  searchResultAvatar: { width:36, height:36, borderRadius:18, backgroundColor:'#c85a1933', alignItems:'center', justifyContent:'center' },
  searchResultAvatarText: { color:'#c85a19', fontFamily:'BebasNeue', fontSize:16 },
  searchResultName: { color:'#fff', fontSize:13, fontWeight:'600' },
  searchResultCountry: { color:'#ffffff55', fontSize:10, marginTop:2 },
  searchResultArrow: { color:'#FF6B2B', fontSize:20 },
  noResults: { color:'#ffffff44', fontSize:12, textAlign:'center', padding:20 },
  cancelBtn: { backgroundColor:'#ffffff0a', borderRadius:12, padding:14, alignItems:'center', marginTop:8 },
  cancelBtnText: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:14 },
});
