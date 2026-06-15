import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const H_GOLF = {
  'x-rapidapi-key': RAPIDAPI_GOLF_KEY,
  'x-rapidapi-host': 'live-golf-data.p.rapidapi.com'
};

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

function parseDate(v) {
  if (!v) return null;
  if (typeof v === 'string') return new Date(v);
  if (typeof v === 'number') return new Date(v);
  if (v['$date']) {
    const d = v['$date'];
    if (d['$numberLong']) return new Date(Number(d['$numberLong']));
    if (typeof d === 'string') return new Date(d);
    if (typeof d === 'number') return new Date(d);
  }
  if (v['$numberLong']) return new Date(Number(v['$numberLong']));
  return null;
}

function formatDate(v) {
  const d = parseDate(v);
  if (!d) return '';
  try { return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}); }
  catch(e) { return ''; }
}

function mongoVal(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v;
  if (v['$numberInt']) return parseInt(v['$numberInt']);
  if (v['$numberDouble']) return parseFloat(v['$numberDouble']);
  if (v['$numberLong']) return parseInt(v['$numberLong']);
  return v;
}

function getScoreColor(score) {
  if (!score) return '#fff';
  const s = String(score);
  if (s.startsWith('-')) return '#4CAF50';
  if (s.startsWith('+')) return '#E53935';
  if (s === 'E') return '#FFD700';
  return '#fff';
}

// Extrait les joueurs du leaderboard quelle que soit la structure
function extractPlayers(data) {
  if (data.leaderboardRows && data.leaderboardRows.length > 0) return data.leaderboardRows;
  if (data.leaderboard?.players && data.leaderboard.players.length > 0) return data.leaderboard.players;
  if (data.players && data.players.length > 0) return data.players;
  return [];
}

// Extrait le nom d'un joueur quelle que soit la structure
function getPlayerName(p) {
  return p.player_name || p.playerName || ((p.firstName||'')+' '+(p.lastName||'')).trim() || '?';
}

// ============ PLAYER SEARCH MODAL ============
function PlayerSearchModal({ rankings, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = search.length < 2 ? [] : rankings.filter(function(p) {
    return p.fullName.toLowerCase().includes(search.toLowerCase());
  }).slice(0,8);

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🔍 RECHERCHER UN JOUEUR</Text>
          <TextInput value={search} onChangeText={setSearch} style={styles.searchInput}
            placeholder="Tapez un nom (ex: Scheffler, McIlroy...)" placeholderTextColor="#ffffff44" autoFocus />
          <ScrollView style={{maxHeight:300}}>
            {filtered.map(function(p, i) {
              return (
                <TouchableOpacity key={i} style={styles.searchResult}
                  onPress={() => { onSelect({id:p.playerId, name:p.fullName, rank:p.rank, points:p.totalPoints}); onClose(); }}>
                  <View style={styles.searchResultAvatar}>
                    <Text style={styles.searchResultAvatarText}>⛳</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={styles.searchResultName}>{p.fullName}</Text>
                    <Text style={styles.searchResultCountry}>Rang #{p.rank}</Text>
                  </View>
                  <Text style={styles.searchResultArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
            {search.length >= 2 && filtered.length === 0 && (
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

// ============ PLAYER SCREEN ============
function GolfPlayerScreen({ player, schedule, onBack, user }) {
  const [isFav, setIsFav] = React.useState(false);
  React.useEffect(function() {
    if (!user) return;
    supabase.from('favorites').select('id').eq('user_id', user.id).eq('sport', 'golf').eq('team_name', player.name).single()
      .then(function({data}) { setIsFav(!!data); });
  }, []);
  async function toggleFav() {
    if (!user) return;
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('sport', 'golf').eq('team_name', player.name);
      setIsFav(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, sport: 'golf', team_name: player.name, team_id: player.playerId||player.id, team_logo: null });
      setIsFav(true);
    }
  }
  const [loading, setLoading] = useState(true);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [kazmoAnalysis, setKazmoAnalysis] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [tab, setTab] = useState('info');
  const [nbMatchs, setNbMatchs] = useState(5);
  const C = '#2E7D32';

  useEffect(() => { fetchRecentResults(); }, [nbMatchs]);

  async function fetchRecentResults() {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const now = new Date();
      const past = (schedule||[]).filter(function(t) {
        if (!t.date) return false;
        const end = parseDate(t.date.end) || parseDate(t.date.start);
        return end && end < now;
      }).sort(function(a,b){
        const aEnd = parseDate(a.date.end)||parseDate(a.date.start)||new Date(0);
        const bEnd = parseDate(b.date.end)||parseDate(b.date.start)||new Date(0);
        return bEnd - aEnd;
      }).slice(0, nbMatchs);


      const results = await Promise.all(past.map(async function(t) {
        try {
          const res = await fetch('https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId='+t.tournId+'&year='+year, { headers:H_GOLF });
          const data = await res.json();
          const players = extractPlayers(data);
          const found = players.find(function(p){
            const pName = getPlayerName(p);
            return String(p.playerId)===String(player.id) ||
                   pName.toLowerCase()===player.name.toLowerCase() ||
                   pName.toLowerCase().includes(player.name.split(' ')[1]?.toLowerCase()||'XXXXX');
          });
          const endDate = parseDate(t.date?.end);
          return {
            name: t.name||'Tournoi',
            date: endDate ? endDate.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : '',
            position: found ? (mongoVal(found.position)||mongoVal(found.pos)||'?') : null,
            score: found ? (found.total||found.score||'E') : null,
            played: !!found,
          };
        } catch(e) {
          return { name:t.name||'Tournoi', date:'', position:null, score:null, played:false };
        }
      }));
      setRecentTournaments(results);
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function fetchKazmo() {
    if (kazmoAnalysis) return;
    setLoadingKazmo(true);
    try {
      const recentStr = recentTournaments.filter(function(t){return t.played;}).slice(0,5).map(function(t){
        return t.name+': #'+t.position+' ('+t.score+')';
      }).join('\n');
      const prompt = 'Tu es Kazmo, assistant IA sportif premium.\nAnalyse le golfeur : '+player.name+'\n\nStats:\n- Classement mondial: #'+player.rank+'\n- Points: '+(player.points?Number(player.points).toFixed(2):'?')+'\n\nRésultats récents:\n'+(recentStr||'Non disponible')+'\n\nFais une analyse complète : style de jeu, points forts, majeurs gagnés, forme actuelle, perspectives. Answer in language: ' + (language||'en') + '.';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body:JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:800, messages:[{role:'user',content:prompt}] }),
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
          model:'claude-sonnet-4-5', max_tokens:400,
          system:'Tu es Kazmo, expert golf sur '+player.name+'. Réponds en français de façon concise.',
          messages:newHistory,
        }),
      });
      const data = await res.json();
      const answer = (data.content||[]).map(function(c){return c.text||'';}).join('');
      setChatHistory(function(prev){return[...prev,{role:'assistant',content:answer}];});
    } catch(e) {}
    finally { setLoadingChat(false); }
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
            <Text style={styles.playerAvatarText}>⛳</Text>
          </View>
          <View style={{flex:1}}>
            <Text style={styles.headerTitle} numberOfLines={1}>{player.name}</Text>
            <Text style={styles.headerSub}>PGA Tour</Text>
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true}>

        {tab === 'info' && (
          <View>
            <Text style={styles.sectionTitle}>STATS & CLASSEMENT</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard,{borderColor:'#FFD70044'}]}>
                <Text style={[styles.statValue,{color:'#FFD700'}]}>#{player.rank||'?'}</Text>
                <Text style={styles.statLabel}>Classement</Text>
              </View>
              <View style={[styles.statCard,{borderColor:C+'44'}]}>
                <Text style={[styles.statValue,{color:C,fontSize:18}]}>{player.points?Number(player.points).toFixed(1):'?'}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>
          </View>
        )}

        {tab === 'forme' && (
          <View>
            <View style={styles.nbMatchsRow}>
              <Text style={styles.sectionTitle}>TOURNOIS RÉCENTS</Text>
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
            {loading ? (
              <View style={styles.center}><ActivityIndicator color="#FF6B2B" /></View>
            ) : recentTournaments.length === 0 ? (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de données</Text></View>
            ) : recentTournaments.map(function(t, i) {
              return (
                <View key={i} style={[styles.tournResultCard,{
                  borderLeftColor: t.played?(parseInt(t.position)<=10?'#4CAF50':'#FFD700'):'#ffffff44',
                  borderLeftWidth:3
                }]}>
                  <View style={styles.tournResultHeader}>
                    <Text style={styles.tournResultDate}>{t.date}</Text>
                    {t.played&&t.position ? (
                      <View style={[styles.positionBadge,{backgroundColor:parseInt(t.position)<=10?'#4CAF5022':'#FFD70022'}]}>
                        <Text style={[styles.positionText,{color:parseInt(t.position)<=10?'#4CAF50':'#FFD700'}]}>#{t.position}</Text>
                      </View>
                    ) : (
                      <Text style={styles.notPlayedText}>Non participé</Text>
                    )}
                    {t.score ? <Text style={[styles.tournScore,{color:getScoreColor(t.score)}]}>{t.score}</Text> : null}
                  </View>
                  <Text style={styles.tournResultName} numberOfLines={1}>{t.name}</Text>
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
    </SafeAreaView>
  );
}

// ============ MAIN SCREEN ============
export default function GolfScreen({ onBack, user }) {
  const [tab, setTab] = useState('schedule');
  const [schedule, setSchedule] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const C = '#2E7D32';

  const TABS = [
    { id:'schedule', label:'📅 Calendrier' },
    { id:'leaderboard', label:'🏆 En cours' },
    { id:'rankings', label:'🌍 Classement' },
  ];

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const [schedRes, rankRes] = await Promise.all([
        fetch('https://live-golf-data.p.rapidapi.com/schedule?orgId=1&year='+year, { headers:H_GOLF }),
        fetch('https://live-golf-data.p.rapidapi.com/stats?year='+year+'&statId=186', { headers:H_GOLF }),
      ]);
      const [schedData, rankData] = await Promise.all([schedRes.json(), rankRes.json()]);

      const now = new Date();
      const allTournaments = (schedData.schedule||[]).sort(function(a,b){
        const aDate = parseDate(a.date?.start) || new Date(0);
        const bDate = parseDate(b.date?.start) || new Date(0);
        return aDate - bDate;
      });

      const current = allTournaments.find(function(t) {
        if (!t.date) return false;
        const start = parseDate(t.date.start);
        const end = parseDate(t.date.end);
        return start && end && start <= now && (end.getTime() + 86400000) >= now.getTime();
      });

      const upcoming = allTournaments.filter(function(t) {
        if (!t.date) return false;
        const start = parseDate(t.date.start);
        return start && start > now;
      });

      const currentYear = now.getFullYear();
      const past = allTournaments.filter(function(t) {
        if (!t.date) return false;
        const end = parseDate(t.date.end || t.date.start);
        return end && end < now && end.getFullYear() === currentYear;
      }).reverse();

      setSchedule([...(current?[{...current,isCurrent:true}]:[]), ...upcoming.slice(0,12), ...past]);
      setCurrentTournament(current||null);

      const rawRankings = (rankData.rankings||[]).slice(0,100).map(function(r) {
        return {
          playerId: r.playerId,
          fullName: r.fullName||((r.firstName||'')+' '+(r.lastName||'')),
          rank: mongoVal(r.rank),
          previousRank: mongoVal(r.previousRank),
          totalPoints: mongoVal(r.totalPoints),
        };
      });
      setRankings(rawRankings);

      if (current) await fetchLeaderboard(current.tournId, year);

    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchLeaderboard(tournId, year) {
    setLoadingLeaderboard(true);
    try {
      const y = year || new Date().getFullYear();
      const res = await fetch('https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId='+tournId+'&year='+y, { headers:H_GOLF });
      const data = await res.json();
      setLeaderboard(extractPlayers(data).slice(0,30));
    } catch(e) {}
    finally { setLoadingLeaderboard(false); }
  }

  if (selectedPlayer) {
    return <GolfPlayerScreen player={selectedPlayer} schedule={schedule} onBack={() => setSelectedPlayer(null)} user={user} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header,{borderBottomColor:C}]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>⛳</Text>
          <View>
            <Text style={styles.headerTitle}>GOLF</Text>
            <Text style={styles.headerSub}>PGA Tour · Majeurs</Text>
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
              onPress={() => setTab(tb.id)}>
              <Text style={[styles.tabBtnText, tab===tb.id&&{color:'#fff'}]}>{tb.label}</Text>
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
              <Text style={styles.sectionTitle}>CALENDRIER {new Date().getFullYear()}</Text>
              {schedule.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Calendrier non disponible</Text></View>
              ) : schedule.map(function(t, i) {
                const isCurrent = t.isCurrent;
                const start = t.date?.start ? formatDate(t.date.start) : '';
                const end = t.date?.end ? formatDate(t.date.end) : '';
                const purseNum = t.purse ? Number(String(t.purse).replace(/[^0-9.]/g,'')) : 0;
                return (
                  <TouchableOpacity key={i}
                    style={[styles.tournCard, isCurrent&&{borderColor:C,borderWidth:1}]}
                    onPress={() => { if(t.tournId){ fetchLeaderboard(t.tournId); setTab('leaderboard'); } }}>
                    <View style={styles.tournHeader}>
                      {isCurrent && (
                        <View style={[styles.liveBadge,{backgroundColor:C+'33',borderColor:C+'66'}]}>
                          <Text style={[styles.liveBadgeText,{color:C}]}>⛳ LIVE</Text>
                        </View>
                      )}
                      {purseNum > 0 ? (
                        <View style={styles.purseBadge}>
                          <Text style={styles.purseText}>${(purseNum/1000000).toFixed(1)}M</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.tournName, isCurrent&&{color:'#4CAF50'}]}>{t.name||'Tournoi'}</Text>
                    <Text style={styles.tournDate}>🗓 {start}{end&&end!==start?' - '+end:''}</Text>
                    {t.course?.name ? <Text style={styles.tournCourse}>📍 {t.course.name}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'leaderboard' && (
            <View>
              <Text style={styles.sectionTitle}>{currentTournament?currentTournament.name:'LEADERBOARD'}</Text>
              {loadingLeaderboard ? (
                <View style={styles.center}><ActivityIndicator color="#FF6B2B" /></View>
              ) : leaderboard.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de tournoi en cours</Text></View>
              ) : (
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText,{width:35}]}>#</Text>
                    <Text style={[styles.tableHeaderText,{flex:1,textAlign:'left'}]}>Joueur</Text>
                    <Text style={[styles.tableHeaderText,{width:45}]}>Score</Text>
                    <Text style={[styles.tableHeaderText,{width:50}]}>Trou</Text>
                    <Text style={[styles.tableHeaderText,{width:20}]}> </Text>
                  </View>
                  {leaderboard.map(function(p, i) {
                    const name = getPlayerName(p);
                    const score = p.total||p.score||'E';
                    const thru = p.thru||'';
                    const pos = mongoVal(p.position)||mongoVal(p.pos)||(i+1);
                    const pid = p.playerId||p.id||null;
                    const rankInfo = rankings.find(function(r){return String(r.playerId)===String(pid);});
                    return (
                      <TouchableOpacity key={i}
                        onPress={() => pid&&setSelectedPlayer({id:pid,name,rank:rankInfo?rankInfo.rank:'?',points:rankInfo?rankInfo.totalPoints:'?'})}
                        style={[styles.tableRow,{
                          backgroundColor:i%2===0?'#16162a':'#0d0d1a',
                          borderLeftColor:i===0?'#FFD700':i<3?C:'#ffffff22',
                          borderLeftWidth:3,
                        }]}>
                        <Text style={[styles.tableCell,{width:35,color:'#ffffff55'}]}>{pos}</Text>
                        <Text style={[styles.tableTeamName,{flex:1}]} numberOfLines={1}>{name}</Text>
                        <Text style={[styles.tableCell,{width:45,color:getScoreColor(score),fontFamily:'BebasNeue',fontSize:14}]}>{score}</Text>
                        <Text style={[styles.tableCell,{width:50,color:'#ffffff55',fontSize:9}]}>{thru?'Trou '+thru:''}</Text>
                        <Text style={styles.rankArrow}>›</Text>
                      </TouchableOpacity>
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
              <Text style={styles.sectionTitle}>CLASSEMENT MONDIAL</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText,{width:35}]}>#</Text>
                <Text style={[styles.tableHeaderText,{flex:1,textAlign:'left'}]}>Joueur</Text>
                <Text style={[styles.tableHeaderText,{width:65}]}>Points</Text>
                <Text style={[styles.tableHeaderText,{width:20}]}> </Text>
              </View>
              {rankings.map(function(r, i) {
                return (
                  <TouchableOpacity key={i}
                    onPress={() => setSelectedPlayer({id:r.playerId,name:r.fullName,rank:r.rank,points:r.totalPoints})}
                    style={[styles.tableRow,{
                      backgroundColor:i%2===0?'#16162a':'#0d0d1a',
                      borderLeftColor:i===0?'#FFD700':i<3?C:'#ffffff22',
                      borderLeftWidth:3,
                    }]}>
                    <Text style={[styles.tableCell,{width:35}]}>{r.rank||i+1}</Text>
                    <View style={{flex:1}}>
                      <Text style={styles.tableTeamName} numberOfLines={1}>{r.fullName}</Text>
                      {r.previousRank&&r.previousRank!==r.rank ? (
                        <Text style={[styles.rankTrend,{color:r.rank<r.previousRank?'#4CAF50':'#E53935'}]}>
                          {r.rank<r.previousRank?'▲':'▼'} #{r.previousRank}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.tableCell,{width:65,color:C}]}>
                      {r.totalPoints?Number(r.totalPoints).toFixed(2):'?'}
                    </Text>
                    <Text style={styles.rankArrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </ScrollView>
      )}

      {showSearch && (
        <PlayerSearchModal rankings={rankings} onSelect={function(p){setSelectedPlayer(p);}} onClose={() => setShowSearch(false)} />
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
  playerAvatarText: { fontSize:24 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginBottom:8, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:11 },
  scroll: { padding:16, paddingBottom:40 },
  center: { padding:40, alignItems:'center', justifyContent:'center', gap:8 },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  emptyBox: { backgroundColor:'#16162a', borderRadius:12, padding:20, alignItems:'center' },
  emptyText: { color:'#ffffff55', fontSize:12 },
  tournCard: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  tournHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  liveBadge: { borderRadius:6, paddingHorizontal:6, paddingVertical:2, borderWidth:1 },
  liveBadgeText: { fontFamily:'BebasNeue', fontSize:9, fontWeight:'700' },
  purseBadge: { backgroundColor:'#FFD70022', borderRadius:6, paddingHorizontal:8, paddingVertical:2, marginLeft:'auto' },
  purseText: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:10 },
  tournName: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:0.5, marginBottom:3 },
  tournDate: { color:'#ffffff88', fontSize:10, marginBottom:2 },
  tournCourse: { color:'#ffffff55', fontSize:9 },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, marginBottom:4 },
  tableHeaderText: { color:'#ffffff33', fontSize:10, fontWeight:'600', textAlign:'center' },
  tableRow: { flexDirection:'row', alignItems:'center', padding:10, borderRadius:6, marginBottom:2 },
  tableTeamName: { color:'#fff', fontSize:12, fontWeight:'600' },
  tableCell: { textAlign:'center', color:'#fff', fontSize:11, fontFamily:'BebasNeue' },
  rankArrow: { color:'#FF6B2B', fontSize:16, marginLeft:4 },
  rankTrend: { fontSize:9, marginTop:1 },
  searchBarBtn: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:12, borderWidth:1, borderColor:'#ffffff22' },
  searchBarIcon: { fontSize:16 },
  searchBarText: { color:'#ffffff44', fontSize:13 },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 },
  statCard: { flex:1, minWidth:'45%', backgroundColor:'#16162a', borderRadius:12, padding:14, alignItems:'center', borderWidth:1 },
  statValue: { fontFamily:'BebasNeue', fontSize:28, letterSpacing:1 },
  statLabel: { color:'#ffffff66', fontSize:9, fontFamily:'BebasNeue', letterSpacing:1, marginTop:2 },
  nbMatchsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  nbMatchsBtns: { flexDirection:'row', gap:6 },
  nbBtn: { width:36, height:28, borderRadius:8, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22', alignItems:'center', justifyContent:'center' },
  nbBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12 },
  tournResultCard: { backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  tournResultHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  tournResultDate: { color:'#ffffff55', fontSize:10, flex:1 },
  positionBadge: { borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  positionText: { fontSize:10, fontWeight:'700', fontFamily:'BebasNeue' },
  notPlayedText: { color:'#ffffff66', fontSize:10 },
  tournScore: { fontFamily:'BebasNeue', fontSize:14 },
  tournResultName: { color:'#fff', fontSize:12, fontWeight:'600' },
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
  searchResultAvatar: { width:36, height:36, borderRadius:18, backgroundColor:'#2E7D3233', alignItems:'center', justifyContent:'center' },
  searchResultAvatarText: { fontSize:18 },
  searchResultName: { color:'#fff', fontSize:13, fontWeight:'600' },
  searchResultCountry: { color:'#ffffff55', fontSize:10, marginTop:2 },
  searchResultArrow: { color:'#FF6B2B', fontSize:20 },
  noResults: { color:'#ffffff44', fontSize:12, textAlign:'center', padding:20 },
  cancelBtn: { backgroundColor:'#ffffff0a', borderRadius:12, padding:14, alignItems:'center', marginTop:8 },
  cancelBtnText: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:14 },
});
