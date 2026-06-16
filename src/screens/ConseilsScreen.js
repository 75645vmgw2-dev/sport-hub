import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Image, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useLanguage } from '../i18n/LanguageContext';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent = function() {};
try {
  const SpeechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = SpeechModule.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = SpeechModule.useSpeechRecognitionEvent;
} catch(e) {}

const H_NBA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };
const H_SOCCER = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };

const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

// Mapping langue → locale pour la reconnaissance vocale
const SPEECH_LOCALES = {
  fr: 'fr-FR', en: 'en-US', es: 'es-ES', pt: 'pt-BR',
  de: 'de-DE', it: 'it-IT', ar: 'ar-SA', ru: 'ru-RU',
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

// ── Bouton microphone réutilisable ──────────────────────────────
function MicButton({ onResult, language, size = 'normal' }) {
  const [listening, setListening] = useState(false);
  const locale = SPEECH_LOCALES[language] || 'fr-FR';

  useSpeechRecognitionEvent('result', function(event) {
    const transcript = event.results?.[0]?.transcript || '';
    if (transcript) {
      onResult(transcript);
      setListening(false);
    }
  });

  useSpeechRecognitionEvent('end', function() {
    setListening(false);
  });

  useSpeechRecognitionEvent('error', function() {
    setListening(false);
  });

  async function toggleListening() {
    if (!ExpoSpeechRecognitionModule) {
      alert('Dictée vocale disponible uniquement sur appareil réel.');
      return;
    }
    if (listening) {
      await ExpoSpeechRecognitionModule.stop();
      setListening(false);
    } else {
      try {
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) return;
        await ExpoSpeechRecognitionModule.start({ lang: locale, interimResults: false });
        setListening(true);
      } catch(e) {
        setListening(false);
      }
    }
  }

  const btnSize = size === 'small' ? 36 : 48;
  const iconSize = size === 'small' ? 16 : 20;

  return (
    <TouchableOpacity onPress={toggleListening} style={{ width:btnSize, height:btnSize }}>
      <LinearGradient
        colors={listening ? ['#E53935', '#FF1744'] : ['#FF6B2B', '#FFD600']}
        start={{x:0,y:0}} end={{x:1,y:0}}
        style={[styles.micBtn, { width:btnSize, height:btnSize, borderRadius:btnSize/2 }]}>
        <Text style={{ fontSize:iconSize }}>{listening ? '⏹' : '🎤'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const SPORTS = [
  { id:'nba', label:'NBA', icon:'🏀', color:'#1D428A' },
  { id:'nhl', label:'NHL', icon:'🏒', color:'#00B8D9' },
  { id:'mlb', label:'MLB', icon:'⚾', color:'#E53935' },
  { id:'nfl', label:'NFL', icon:'🏈', color:'#1A73E8' },
  { id:'soccer', label:'Football', icon:'⚽', color:'#4CAF50' },
  { id:'f1', label:'F1', icon:'🏎', color:'#E10600' },
  { id:'golf', label:'Golf', icon:'⛳', color:'#2E7D32' },
  { id:'mma', label:'MMA', icon:'🤼', color:'#9C27B0' },
];

const TEAMS_HARDCODED = {
  nhl: ['Anaheim Ducks','Boston Bruins','Buffalo Sabres','Calgary Flames','Carolina Hurricanes','Chicago Blackhawks','Colorado Avalanche','Columbus Blue Jackets','Dallas Stars','Detroit Red Wings','Edmonton Oilers','Florida Panthers','Los Angeles Kings','Minnesota Wild','Montreal Canadiens','Nashville Predators','New Jersey Devils','New York Islanders','New York Rangers','Ottawa Senators','Philadelphia Flyers','Pittsburgh Penguins','San Jose Sharks','Seattle Kraken','St. Louis Blues','Tampa Bay Lightning','Toronto Maple Leafs','Vancouver Canucks','Vegas Golden Knights','Washington Capitals','Winnipeg Jets'],
  mlb: ['Arizona Diamondbacks','Atlanta Braves','Baltimore Orioles','Boston Red Sox','Chicago Cubs','Chicago White Sox','Cincinnati Reds','Cleveland Guardians','Colorado Rockies','Detroit Tigers','Houston Astros','Kansas City Royals','Los Angeles Angels','Los Angeles Dodgers','Miami Marlins','Milwaukee Brewers','Minnesota Twins','New York Mets','New York Yankees','Oakland Athletics','Philadelphia Phillies','Pittsburgh Pirates','San Diego Padres','San Francisco Giants','Seattle Mariners','St. Louis Cardinals','Tampa Bay Rays','Texas Rangers','Toronto Blue Jays','Washington Nationals'],
  nfl: ['Arizona Cardinals','Atlanta Falcons','Baltimore Ravens','Buffalo Bills','Carolina Panthers','Chicago Bears','Cincinnati Bengals','Cleveland Browns','Dallas Cowboys','Denver Broncos','Detroit Lions','Green Bay Packers','Houston Texans','Indianapolis Colts','Jacksonville Jaguars','Kansas City Chiefs','Las Vegas Raiders','Los Angeles Chargers','Los Angeles Rams','Miami Dolphins','Minnesota Vikings','New England Patriots','New Orleans Saints','New York Giants','New York Jets','Philadelphia Eagles','Pittsburgh Steelers','San Francisco 49ers','Seattle Seahawks','Tampa Bay Buccaneers','Tennessee Titans','Washington Commanders'],
  f1: ['Max Verstappen','Lewis Hamilton','Charles Leclerc','Lando Norris','Oscar Piastri','George Russell','Fernando Alonso','Red Bull Racing','Ferrari','McLaren','Mercedes','Aston Martin'],
  golf: ['Scottie Scheffler','Rory McIlroy','Jon Rahm','Viktor Hovland','Xander Schauffele','Collin Morikawa','Patrick Cantlay','Wyndham Clark'],
  mma: ['Jon Jones','Islam Makhachev','Leon Edwards','Alex Pereira','Conor McGregor','Kamaru Usman','Israel Adesanya','Dustin Poirier','Charles Oliveira','Sean O\'Malley'],
};

const REQUIRES_OPPONENT = ['pronostic', 'h2h', 'pari'];
const SHOWS_OPPONENT = ['pronostic', 'h2h', 'pari', 'analyse', 'tendance'];

function TeamPickerModal({ sport, onSelect, onClose, title }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadTeams(); }, [sport]);

  async function loadTeams() {
    setLoading(true);
    try {
      if (sport.id === 'nba') {
        const res = await fetch('https://v2.nba.api-sports.io/teams?league=standard', { headers: H_NBA });
        const data = await res.json();
        setTeams((data.response||[]).filter(function(t){return t.nbaFranchise===true;}).map(function(t){return {name:t.name,logo:t.logo};}).sort(function(a,b){return a.name.localeCompare(b.name);}));
      } else if (sport.id === 'soccer') {
        const res = await fetch('https://v3.football.api-sports.io/teams?league=1&season=2026', { headers: H_SOCCER });
        const data = await res.json();
        setTeams((data.response||[]).map(function(t){return {name:t.team.name,logo:t.team.logo};}).sort(function(a,b){return a.name.localeCompare(b.name);}));
      } else {
        setTeams((TEAMS_HARDCODED[sport.id]||[]).map(function(n){return {name:n,logo:null};}));
      }
    } catch(e) {
      setTeams((TEAMS_HARDCODED[sport.id]||[]).map(function(n){return {name:n,logo:null};}));
    }
    finally { setLoading(false); }
  }

  const filtered = teams.filter(function(t){return t.name.toLowerCase().includes(search.toLowerCase());});

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput value={search} onChangeText={setSearch} style={styles.searchInput} placeholder="Rechercher..." placeholderTextColor="#ffffff44" />
          {loading ? <View style={{padding:20,alignItems:'center'}}><ActivityIndicator color="#FF6B2B" /></View> : (
            <ScrollView style={{maxHeight:400}}>
              {filtered.map(function(team,i){
                return (
                  <TouchableOpacity key={i} style={styles.teamOption} onPress={() => {onSelect(team.name); onClose();}}>
                    {team.logo ? <Image source={{uri:team.logo}} style={styles.teamOptionLogo} onError={function(){}} /> : <View style={styles.teamOptionLogoPlaceholder}><Text style={{fontSize:16}}>{sport.icon}</Text></View>}
                    <Text style={styles.teamOptionText}>{team.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

async function callAnthropic(messages, system) {
  const body = {
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages,
    // Web search désactivé — trop lent
  };
  if (system) body.system = system;
  const response = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:H_ANTHROPIC, body:JSON.stringify(body) });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return (data.content||[]).map(function(c){return c.text||'';}).join('');
}

async function searchNBATeam(name) {
  try {
    const res = await fetch('https://v2.nba.api-sports.io/teams?search='+encodeURIComponent(name), {headers:H_NBA});
    const data = await res.json();
    return (data.response||[])[0]||null;
  } catch(e) {return null;}
}

async function getNBARecentGames(teamId, n) {
  try {
    const res = await fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&team='+teamId, {headers:H_NBA});
    const data = await res.json();
    return (data.response||[]).filter(function(g){return g.status.long==='Finished';}).sort(function(a,b){return new Date(b.date.start)-new Date(a.date.start);}).slice(0,n);
  } catch(e) {return [];}
}

async function getNBAPlayerStats(teamId) {
  try {
    const res = await fetch('https://v2.nba.api-sports.io/players/statistics?season=2025&team='+teamId, {headers:H_NBA});
    const data = await res.json();
    const stats = {};
    (data.response||[]).forEach(function(s){
      if (!s||!s.player) return;
      const name = (s.player.firstname||'')+' '+(s.player.lastname||'');
      if (!stats[name]) stats[name]={name,pts:[],reb:[],ast:[]};
      stats[name].pts.push(Number(s.points)||0);
      stats[name].reb.push(Number(s.totReb)||0);
      stats[name].ast.push(Number(s.assists)||0);
    });
    return Object.values(stats).filter(function(p){return p.pts.length>=3;}).map(function(p){
      const n=Math.min(5,p.pts.length);
      return {name:p.name,avgPts:(p.pts.slice(0,n).reduce(function(a,b){return a+b;},0)/n).toFixed(1),avgReb:(p.reb.slice(0,n).reduce(function(a,b){return a+b;},0)/n).toFixed(1),avgAst:(p.ast.slice(0,n).reduce(function(a,b){return a+b;},0)/n).toFixed(1)};
    }).sort(function(a,b){return Number(b.avgPts)-Number(a.avgPts);}).slice(0,5);
  } catch(e) {return [];}
}

async function searchSoccerTeam(name) {
  try {
    const res = await fetch('https://v3.football.api-sports.io/teams?search='+encodeURIComponent(name), {headers:H_SOCCER});
    const data = await res.json();
    return (data.response||[])[0]?.team||null;
  } catch(e) {return null;}
}

async function getSoccerRecentGames(teamId, n) {
  try {
    const res = await fetch('https://v3.football.api-sports.io/fixtures?team='+teamId+'&last='+n, {headers:H_SOCCER});
    const data = await res.json();
    return data.response||[];
  } catch(e) {return [];}
}

function formatNBAGames(games, teamId) {
  if (!games.length) return 'Pas de matchs disponibles';
  return games.map(function(g){
    const isHome=g.teams.home.id===teamId;
    const my=isHome?g.scores.home.points:g.scores.visitors.points;
    const opp=isHome?g.scores.visitors.points:g.scores.home.points;
    const oppName=isHome?g.teams.visitors.name:g.teams.home.name;
    return ((my||0)>(opp||0)?'V':'D')+' '+(my||0)+'-'+(opp||0)+' '+(isHome?'vs':'@')+' '+oppName;
  }).join('\n');
}

function formatNBAPlayers(players) {
  if (!players.length) return 'Stats non disponibles';
  return players.map(function(p){return p.name+': '+p.avgPts+'pts / '+p.avgReb+'reb / '+p.avgAst+'ast';}).join('\n');
}

function formatSoccerGames(games, teamId) {
  if (!games.length) return 'Pas de matchs disponibles';
  return games.map(function(f){
    const isHome=f.teams.home.id===teamId;
    const my=isHome?f.goals.home:f.goals.away;
    const opp=isHome?f.goals.away:f.goals.home;
    const oppName=isHome?f.teams.away.name:f.teams.home.name;
    const result=(my||0)>(opp||0)?'V':(my||0)===(opp||0)?'N':'D';
    return result+' '+(my||0)+'-'+(opp||0)+' '+(isHome?'vs':'@')+' '+oppName;
  }).join('\n');
}

function getQuickQuestions(language) {
  const q = {
    fr: ['🏀 Qui va gagner les Finales NBA ?','⚽ Meilleure équipe en ce moment ?','🏒 Analyse des Finales NHL','🏎 Pronostic prochain GP F1','🤼 Prochain grand combat MMA ?','⭐ Meilleur joueur NBA cette saison ?'],
    en: ['🏀 Who will win the NBA Finals?','⚽ Best team right now?','🏒 NHL Finals analysis','🏎 Prediction for next F1 GP','🤼 Next big MMA fight?','⭐ Best NBA player this season?'],
    es: ['🏀 ¿Quién ganará las Finales NBA?','⚽ ¿Mejor equipo ahora mismo?','🏒 Análisis Finales NHL','🏎 Pronóstico próximo GP F1','🤼 ¿Próximo gran combate MMA?','⭐ ¿Mejor jugador NBA esta temporada?'],
    pt: ['🏀 Quem vai ganhar as Finais NBA?','⚽ Melhor time agora?','🏒 Análise das Finais NHL','🏎 Previsão próximo GP F1','🤼 Próxima grande luta MMA?','⭐ Melhor jogador NBA esta temporada?'],
    de: ['🏀 Wer gewinnt die NBA Finals?','⚽ Bestes Team gerade?','🏒 NHL Finals Analyse','🏎 Prognose nächster F1 GP','🤼 Nächster großer MMA-Kampf?','⭐ Bester NBA-Spieler diese Saison?'],
    it: ['🏀 Chi vincerà le Finali NBA?','⚽ Squadra migliore in questo momento?','🏒 Analisi Finali NHL','🏎 Pronostico prossimo GP F1','🤼 Prossimo grande combattimento MMA?','⭐ Miglior giocatore NBA questa stagione?'],
    ar: ['🏀 من سيفوز بنهائيات NBA؟','⚽ أفضل فريق الآن؟','🏒 تحليل نهائيات NHL','🏎 توقع سباق F1 القادم','🤼 المباراة الكبيرة القادمة في MMA؟','⭐ أفضل لاعب NBA هذا الموسم؟'],
    ru: ['🏀 Kto pobeditsya v finale NBA?','⚽ Luchshaya komanda seychas?','🏒 Analiz finala NHL','🏎 Prognoz sleduyushchego GP F1','🤼 Sleduyushchiy bolshoy boy MMA?','⭐ Luchshiy igrok NBA v etom sezone?'],
  };
  return q[language] || q['fr'];
}

// ── ChatScreen avec dictée vocale ───────────────────────────────
function ChatScreen({ t, language }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    setMessages([{ role:'assistant', content:t('chatWelcome') }]);
  }, [language]);

  const quickQuestions = getQuickQuestions(language);
  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  const systemPrompt = {
    fr: 'Tu es Kazmo, expert sportif IA premium. Nous sommes le '+today+'. Tu connais tous les sports. Réponds toujours en français de façon concise et engageante. Utilise des emojis.',
    en: 'You are Kazmo, a premium AI sports expert. Today is '+today+'. You know all sports. Always reply in English concisely and engagingly. Use emojis.',
    es: 'Eres Kazmo, experto deportivo IA premium. Hoy es '+today+'. Conoces todos los deportes. Responde siempre en español de forma concisa. Usa emojis.',
    pt: 'Você é Kazmo, especialista esportivo IA premium. Hoje é '+today+'. Conhece todos os esportes. Responda sempre em português de forma concisa. Use emojis.',
    de: 'Du bist Kazmo, ein KI-Sportexperte. Heute ist '+today+'. Du kennst alle Sportarten. Antworte immer auf Deutsch, prägnant und mit Emojis.',
    it: 'Sei Kazmo, esperto sportivo IA premium. Oggi è '+today+'. Conosci tutti gli sport. Rispondi sempre in italiano in modo conciso. Usa emoji.',
    ar: 'أنت كازمو، خبير رياضي ذكاء اصطناعي. اليوم هو '+today+'. تعرف جميع الرياضات. أجب دائماً بالعربية بإيجاز. استخدم الرموز التعبيرية.',
    ru: 'Ty Kazmo, premium sportivnyy IA-ekspert. Segodnya '+today+'. Ty znayesh vse vidy sporta. Vsegda otveychay po-russki kratko i s emodziami.',
  }[language] || 'Tu es Kazmo, expert sportif IA premium. Nous sommes le '+today+'. Réponds en français de façon concise. Utilise des emojis.';

  async function sendMessage(text) {
    const question = (text || input).trim();
    if (!question || loading) return;
    setInput('');
    const newMessages = [...messages, {role:'user', content:question}];
    setMessages(newMessages);
    setLoading(true);
    try {
      const apiMessages = newMessages.map(function(m){return {role:m.role, content:m.content};});
      const answer = await callAnthropic(apiMessages, systemPrompt);
      setMessages(function(prev){return [...prev, {role:'assistant', content:answer}];});
    } catch(e) {
      setMessages(function(prev){return [...prev, {role:'assistant', content:'❌ Erreur, réessaie !'}];});
    }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (scrollRef.current) setTimeout(function(){scrollRef.current.scrollToEnd({animated:true});}, 100);
  }, [messages]);


  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={90}>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">
        {messages.length <= 1 && (
          <View style={styles.quickQuestions}>
            <Text style={styles.quickQuestionsLabel}>{t('chatQuickLabel').toUpperCase()}</Text>
            {quickQuestions.map(function(q, i){
              return (
                <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => sendMessage(q)}>
                  <Text style={styles.quickBtnText}>{q}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {messages.map(function(msg, i){
          const isUser = msg.role === 'user';
          return (
            <View key={i} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowKazmo]}>
              {!isUser && (
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.kazmoAvatar}>
                  <Text style={styles.kazmoAvatarText}>K</Text>
                </LinearGradient>
              )}
              <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleKazmo]}>
                <Text style={styles.msgText}>{msg.content}</Text>
              </View>
            </View>
          );
        })}
        {loading && (
          <View style={[styles.msgRow, styles.msgRowKazmo]}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.kazmoAvatar}>
              <Text style={styles.kazmoAvatarText}>K</Text>
            </LinearGradient>
            <View style={[styles.msgBubble, styles.msgBubbleKazmo]}>
              <ActivityIndicator color="#FF6B2B" size="small" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Zone de saisie avec bouton micro */}
      <View style={{backgroundColor:'#0d0d1a',paddingHorizontal:8,paddingTop:4,borderTopWidth:1,borderTopColor:'#ffffff11'}}>
        <TouchableOpacity onPress={Keyboard.dismiss} style={{alignSelf:'flex-end',paddingHorizontal:10,paddingVertical:3,marginBottom:4}}>
          <Text style={{color:'#ffffff44',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1}}>⌨️ CLOSE</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chatInputRow}>
        <MicButton onResult={function(text){ setInput(function(prev){ return prev + (prev ? ' ' : '') + text; }); }} language={language} />
        <TextInput value={input} onChangeText={setInput} style={styles.chatInput} placeholder={t('chatPlaceholder')} placeholderTextColor="#ffffff44" multiline maxLength={500} returnKeyType="send" onSubmitEditing={() => sendMessage()} blurOnSubmit={false} />
        <TouchableOpacity onPress={() => sendMessage()} disabled={loading || !input.trim()} style={styles.chatSendBtn}>
          <LinearGradient colors={loading||!input.trim()?['#333','#444']:['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.chatSendBtnGradient}>
            <Text style={styles.chatSendBtnText}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── ConseilsGuides avec dictée vocale sur les champs équipe ─────
function ConseilsGuides({ t, language }) {
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [conseil, setConseil] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [showPicker1, setShowPicker1] = useState(false);
  const [showPicker2, setShowPicker2] = useState(false);

  const langNames = {fr:'français',en:'English',es:'español',pt:'português',de:'Deutsch',it:'italiano',ar:'العربية',ru:'русский'};

  const CONSEIL_TYPES = [
    { id:'analyse', label:t('typeAnalyse'), icon:'📊', desc:t('typeAnalyseDesc') },
    { id:'pronostic', label:t('typePronostic'), icon:'🎯', desc:t('typePronosticDesc') },
    { id:'pari', label:t('typePari'), icon:'💰', desc:t('typePariDesc') },
    { id:'joueur', label:t('typeJoueur'), icon:'⭐', desc:t('typeJoueurDesc') },
    { id:'tendance', label:t('typeTendance'), icon:'📈', desc:t('typeTendanceDesc') },
    { id:'h2h', label:t('typeH2H'), icon:'⚔️', desc:t('typeH2HDesc') },
  ];

  function isGenerateDisabled() {
    if (!team1.trim()) return true;
    if (loading) return true;
    if (selectedType && REQUIRES_OPPONENT.indexOf(selectedType.id) >= 0 && !team2.trim()) return true;
    return false;
  }

  async function buildContextData() {
    const sport = selectedSport.id;
    let context = '';
    try {
      if (sport === 'nba') {
        setLoadingStatus('Recherche équipe NBA...');
        const t1 = await searchNBATeam(team1.trim());
        let t2data = null;
        if (team2.trim()) t2data = await searchNBATeam(team2.trim());
        if (t1) {
          setLoadingStatus('Récupération matchs récents...');
          const games1 = await getNBARecentGames(t1.id, 5);
          setLoadingStatus('Récupération stats joueurs...');
          const players1 = await getNBAPlayerStats(t1.id);
          context += '=== '+t1.name+' ===\nDerniers matchs:\n'+formatNBAGames(games1,t1.id)+'\nTop joueurs:\n'+formatNBAPlayers(players1)+'\n\n';
        }
        if (t2data) {
          setLoadingStatus('Récupération données adversaire...');
          const games2 = await getNBARecentGames(t2data.id, 5);
          const players2 = await getNBAPlayerStats(t2data.id);
          context += '=== '+t2data.name+' ===\nDerniers matchs:\n'+formatNBAGames(games2,t2data.id)+'\nTop joueurs:\n'+formatNBAPlayers(players2)+'\n\n';
        }
      } else if (sport === 'soccer') {
        setLoadingStatus('Recherche équipe Football...');
        const t1 = await searchSoccerTeam(team1.trim());
        let t2data = null;
        if (team2.trim()) t2data = await searchSoccerTeam(team2.trim());
        if (t1) {
          setLoadingStatus('Récupération matchs récents...');
          const games1 = await getSoccerRecentGames(t1.id, 5);
          context += '=== '+t1.name+' ===\nDerniers matchs:\n'+formatSoccerGames(games1,t1.id)+'\n\n';
        }
        if (t2data) {
          setLoadingStatus('Récupération données adversaire...');
          const games2 = await getSoccerRecentGames(t2data.id, 5);
          context += '=== '+t2data.name+' ===\nDerniers matchs:\n'+formatSoccerGames(games2,t2data.id)+'\n\n';
        }
      }
    } catch(e) {}
    return context;
  }

  async function generateConseil() {
    if (isGenerateDisabled()) return;
    setLoading(true); setConseil(''); setError('');
    try {
      const sportName = selectedSport.label;
      const langName = langNames[language] || 'français';
      const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
      const context = await buildContextData();
      setLoadingStatus(t('analyzing'));
      const hasRealData = context.length > 0;
      const dataSection = hasRealData ? '\n\nDONNEES REELLES API:\n'+context : '';
      const opponent = team2.trim() ? ' vs '+team2.trim() : '';
      let prompt = '';
      if (selectedType.id==='analyse') prompt = 'Nous sommes le '+today+'. Tu es un expert sportif. Analyse '+team1.trim()+opponent+' en '+sportName+'.'+dataSection+'\nInclus: forme recente, points forts/faibles, joueurs cles, conclusion.\nReponds en '+langName+'.';
      else if (selectedType.id==='pronostic') prompt = 'Nous sommes le '+today+'. Tu es un expert en pronostics sportifs.'+dataSection+'\nDonne un pronostic POUR LE MATCH '+team1.trim()+' VS '+team2.trim()+' en '+sportName+'.\nChoisis UN SEUL vainqueur. Inclus: qui va gagner, % confiance, 3 raisons, risques.\nReponds en '+langName+'.';
      else if (selectedType.id==='pari') prompt = 'Nous sommes le '+today+'. Tu es un consultant en paris sportifs.'+dataSection+'\nDonne le meilleur conseil de pari pour '+team1.trim()+' VS '+team2.trim()+' en '+sportName+'.\nInclus: type de pari, cote approximative, niveau de risque, justification.\nReponds en '+langName+'.';
      else if (selectedType.id==='joueur') prompt = 'Nous sommes le '+today+'. Tu es un scout sportif expert.'+dataSection+'\nIdentifie le joueur cle a surveiller pour '+team1.trim()+(opponent?opponent:' en '+sportName)+'.\nInclus: nom, poste, stats recentes, pourquoi il sera decisif.\nReponds en '+langName+'.';
      else if (selectedType.id==='tendance') prompt = 'Nous sommes le '+today+'. Tu es un analyste de donnees sportives.'+dataSection+'\nAnalyse les tendances de '+team1.trim()+(opponent?opponent:'')+' en '+sportName+'.\nInclus: serie en cours, moyenne sur 5 matchs, domicile/exterieur.\nReponds en '+langName+'.';
      else if (selectedType.id==='h2h') prompt = 'Nous sommes le '+today+'. Tu es un expert en statistiques sportives.'+dataSection+'\nAnalyse lhistorique entre '+team1.trim()+' et '+team2.trim()+' en '+sportName+'.\nInclus: bilan general, derniers resultats, tendances, qui a lavantage.\nReponds en '+langName+'.';
      const text = await callAnthropic([{role:'user',content:prompt}]);
      setConseil(text);
      setHistory(function(prev){return [{id:Date.now(),sport:selectedSport,type:selectedType,team1:team1.trim(),team2:team2.trim(),conseil:text,hasRealData,date:new Date().toLocaleDateString('fr-FR')},...prev.slice(0,4)];});
    } catch(e) { setError('Erreur: '+e.message); }
    finally { setLoading(false); setLoadingStatus(''); }
  }

  function reset() { setStep(1); setSelectedSport(null); setSelectedType(null); setTeam1(''); setTeam2(''); setConseil(''); setError(''); }
  function goBack() {
    if (conseil) { setConseil(''); return; }
    if (step===3) { setStep(2); setSelectedType(null); setTeam1(''); setTeam2(''); }
    else if (step===2) { setStep(1); setSelectedSport(null); }
  }

  const showBack = step > 1 || conseil;
  const requiresOpponent = selectedType && REQUIRES_OPPONENT.indexOf(selectedType.id) >= 0;
  const showsOpponent = selectedType && SHOWS_OPPONENT.indexOf(selectedType.id) >= 0;

  return (
    <View style={{flex:1}}>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" onScrollBeginDrag={Keyboard.dismiss}>
      {showBack && (
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← {t('cancel')}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepBadge, step>=1&&{backgroundColor:'#FF6B2B'}]}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>{t('chooseSport')}</Text>
          {selectedSport && <Text style={styles.stepDone}>{selectedSport.icon} {selectedSport.label} ✓</Text>}
        </View>
        {(!selectedSport || step===1) && (
          <View style={styles.sportsGrid}>
            {SPORTS.map(function(s) {
              const active = selectedSport?.id === s.id;
              return (
                <TouchableOpacity key={s.id}
                  style={[styles.sportCard, active && {borderColor:s.color, backgroundColor:s.color+'22'}]}
                  activeOpacity={0.7}
                  onPress={() => { setSelectedSport(s); setTeam1(''); setTeam2(''); setStep(2); }}>
                  <LinearGradient
                    colors={active ? [s.color+'88', s.color+'44'] : ['#16162a','#0d0d1a']}
                    start={{x:0,y:0}} end={{x:1,y:1}}
                    style={styles.sportCardGradient}>
                    <Text style={styles.sportCardIcon}>{s.icon}</Text>
                    <Text style={[styles.sportCardLabel, active&&{color:'#fff'}]}>{s.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {selectedSport && (
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, step>=2&&{backgroundColor:'#FF6B2B'}]}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>{t('chooseType')}</Text>
            {selectedType && <Text style={styles.stepDone}>{selectedType.icon} ✓</Text>}
          </View>
          {(!selectedType || step===2) && (
            <View style={styles.typesList}>
              {CONSEIL_TYPES.map(function(ct) {
                const needsTwo = REQUIRES_OPPONENT.indexOf(ct.id) >= 0;
                return (
                  <TouchableOpacity key={ct.id}
                    style={[styles.typeCard, selectedType?.id===ct.id&&{borderColor:'#FF6B2B',backgroundColor:'#FF6B2B11'}]}
                    activeOpacity={0.8}
                    onPress={() => { setSelectedType(ct); setStep(3); }}>
                    <View style={styles.typeCardLeft}>
                      <Text style={styles.typeIcon}>{ct.icon}</Text>
                      <View style={styles.typeCardInfo}>
                        <Text style={styles.typeLabel}>{ct.label}</Text>
                        <Text style={styles.typeDesc}>{ct.desc}</Text>
                      </View>
                    </View>
                    {needsTwo && <View style={styles.twoTeamsBadge}><Text style={styles.twoTeamsText}>{t('twoTeamsBadge')}</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {selectedSport && selectedType && (
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, step>=3&&{backgroundColor:'#FF6B2B'}]}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>{requiresOpponent ? t('twoTeams') : t('chooseTeam')}</Text>
          </View>
          {(selectedSport.id==='nba'||selectedSport.id==='soccer') && (
            <View style={styles.realDataBadge}><Text style={styles.realDataText}>✅ Real API Data — {selectedSport.label}</Text></View>
          )}

          {/* Équipe 1 avec micro */}
          <Text style={styles.fieldLabel}>{selectedType?.id==='joueur'?t('typeJoueur'):t('homeTeam')}</Text>
          <View style={styles.pickerWithMic}>
            <TouchableOpacity style={[styles.pickerBtnFlex, !team1&&{borderColor:'#FF6B2B44'}]} onPress={() => setShowPicker1(true)}>
              <Text style={team1?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{team1||t('chooseTeam')+'...'}</Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
            <MicButton onResult={setTeam1} language={language} size="small" />
          </View>

          {showsOpponent && (
            <View style={{marginTop:12}}>
              <Text style={styles.fieldLabel}>{requiresOpponent?t('opponent')+' *':t('opponent')+' ('+t('cancel')+')'}</Text>
              {/* Équipe 2 avec micro */}
              <View style={styles.pickerWithMic}>
                <TouchableOpacity style={[styles.pickerBtnFlex, requiresOpponent&&!team2&&{borderColor:'#FF6B2B44'}]} onPress={() => setShowPicker2(true)}>
                  <Text style={team2?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{team2||t('opponent')+'...'}</Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
                <MicButton onResult={setTeam2} language={language} size="small" />
              </View>
            </View>
          )}

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          <TouchableOpacity onPress={generateConseil} disabled={isGenerateDisabled()} activeOpacity={0.85} style={{marginTop:12}}>
            <LinearGradient colors={isGenerateDisabled()?['#444','#555']:['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.generateBtn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>🔮 {t('generate')}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {loading && loadingStatus ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#FF6B2B" size="large" />
          <Text style={styles.loadingText}>{loadingStatus}</Text>
        </View>
      ) : null}

      {conseil ? (
        <View style={styles.conseilCard}>
          <View style={styles.conseilHeader}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>🔮 {t('conseils')}</Text>
            </LinearGradient>
            <View style={[styles.sportMini,{backgroundColor:selectedSport?.color}]}>
              <Text style={styles.sportMiniText}>{selectedSport?.icon} {selectedSport?.label}</Text>
            </View>
          </View>
          <View style={styles.conseilMeta}>
            <Text style={styles.conseilMetaText}>{selectedType?.icon} {selectedType?.label}</Text>
            <Text style={styles.conseilMetaTeam}>{team1}{team2?' vs '+team2:''}</Text>
          </View>
          <Text style={styles.conseilText}>{conseil}</Text>
          <View style={styles.conseilActions}>
            <TouchableOpacity onPress={generateConseil} style={styles.refreshBtn}><Text style={styles.refreshBtnText}>↻ {t('regenerate')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={reset} style={styles.newBtn}><Text style={styles.newBtnText}>+ {t('newAdvice')}</Text></TouchableOpacity>
          </View>
        </View>
      ) : null}

      {history.length > 0 && !conseil && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>{t('recentHistory')}</Text>
          {history.map(function(h){
            return (
              <TouchableOpacity key={h.id} style={styles.historyCard} activeOpacity={0.8}
                onPress={() => { setSelectedSport(h.sport); setSelectedType(h.type); setTeam1(h.team1); setTeam2(h.team2); setConseil(h.conseil); setStep(3); }}>
                <View style={[styles.historyIcon,{backgroundColor:h.sport.color+'33'}]}><Text>{h.sport.icon}</Text></View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTeam}>{h.team1}{h.team2?' vs '+h.team2:''}</Text>
                  <Text style={styles.historyType}>{h.type.icon} {h.type.label} · {h.date}{h.hasRealData?' · ✅':''}</Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {showPicker1 && selectedSport && (
        <TeamPickerModal sport={selectedSport} title={t('chooseTeam')} onSelect={function(name){setTeam1(name);}} onClose={() => setShowPicker1(false)} />
      )}
      {showPicker2 && selectedSport && (
        <TeamPickerModal sport={selectedSport} title={t('opponent')} onSelect={function(name){setTeam2(name);}} onClose={() => setShowPicker2(false)} />
      )}
    </ScrollView>
    </View>
  );
}

export default function ConseilsScreen({ userPlan='free', user, onUpgrade, planLoading=false }) {
  const { t, language } = useLanguage();

  if (planLoading) {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:'#080814',alignItems:'center',justifyContent:'center'}}>
        <ActivityIndicator color="#FF6B2B" size="large" />
      </SafeAreaView>
    );
  }

  if (userPlan === 'free') {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:'#080814',alignItems:'center',justifyContent:'center',padding:24}}>
        <Text style={{fontSize:40,marginBottom:16}}>🔮</Text>
        <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:24,letterSpacing:2,marginBottom:8,textAlign:'center'}}>KAZMO PRO FEATURE</Text>
        <Text style={{color:'#ffffff88',fontSize:13,textAlign:'center',marginBottom:24,lineHeight:20}}>Tips & Analysis are available with KAZMO Pro or Elite. Upgrade to get unlimited AI sports analysis.</Text>
        <TouchableOpacity onPress={onUpgrade} activeOpacity={0.85} style={{borderRadius:14,overflow:'hidden',width:'100%',marginBottom:12}}>
          <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={{padding:16,alignItems:'center',borderRadius:14}}>
            <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1}}>⭐ UPGRADE TO PRO</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>null} style={{padding:12}}>
          <Text style={{color:'#ffffff44',fontSize:13,textDecorationLine:'underline'}}>Maybe later</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  const [mainTab, setMainTab] = useState('chat');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>KAZMO </Text>
          <GradientText text="IA" fontSize={22} letterSpacing={1} />
        </View>
        <Text style={styles.subtitle}>{t('conseilsSubtitle')}</Text>
      </View>

      <View style={styles.mainTabBar}>
        <TouchableOpacity style={[styles.mainTabBtn, mainTab==='chat' && styles.mainTabBtnActive]} onPress={() => setMainTab('chat')}>
          <Text style={[styles.mainTabBtnText, mainTab==='chat' && styles.mainTabBtnTextActive]}>💬 {t('chatTab')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mainTabBtn, mainTab==='conseils' && styles.mainTabBtnActive]} onPress={() => setMainTab('conseils')}>
          <Text style={[styles.mainTabBtnText, mainTab==='conseils' && styles.mainTabBtnTextActive]}>🔮 {t('conseilsTab')}</Text>
        </TouchableOpacity>
      </View>

      {mainTab === 'chat' ? (
        <ChatScreen t={t} language={language} />
      ) : (
        <ConseilsGuides t={t} language={language} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { padding:20, paddingBottom:10 },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  subtitle: { color:'#ffffff66', fontSize:11, marginTop:2, fontFamily:'BebasNeue', letterSpacing:1 },
  mainTabBar: { flexDirection:'row', margin:16, marginTop:4, marginBottom:8, backgroundColor:'#16162a', borderRadius:12, padding:4, gap:4 },
  mainTabBtn: { flex:1, paddingVertical:10, borderRadius:10, alignItems:'center' },
  mainTabBtnActive: { backgroundColor:'#FF6B2B' },
  mainTabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:13, letterSpacing:0.5 },
  mainTabBtnTextActive: { color:'#fff' },
  chatScroll: { padding:16, paddingBottom:16 },
  quickQuestions: { marginBottom:16 },
  quickQuestionsLabel: { color:'#ffffff44', fontFamily:'BebasNeue', fontSize:10, letterSpacing:2, marginBottom:8 },
  quickBtn: { backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:6, borderWidth:1, borderColor:'#ffffff14' },
  quickBtnText: { color:'#ffffffcc', fontSize:13 },
  msgRow: { flexDirection:'row', alignItems:'flex-end', gap:8, marginBottom:10 },
  msgRowUser: { justifyContent:'flex-end' },
  msgRowKazmo: { justifyContent:'flex-start' },
  kazmoAvatar: { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
  kazmoAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14 },
  msgBubble: { maxWidth:'78%', borderRadius:14, padding:12 },
  msgBubbleUser: { backgroundColor:'#FF6B2B22', borderWidth:1, borderColor:'#FF6B2B44' },
  msgBubbleKazmo: { backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff14' },
  msgText: { color:'#fff', fontSize:13, lineHeight:20 },
  chatInputRow: { flexDirection:'row', alignItems:'flex-end', gap:8, padding:16, paddingTop:8, borderTopWidth:1, borderTopColor:'#ffffff0a', backgroundColor:'#080814' },
  chatInput: { flex:1, backgroundColor:'#16162a', borderRadius:12, padding:12, color:'#fff', fontSize:13, borderWidth:1, borderColor:'#ffffff22', maxHeight:100 },
  chatSendBtn: { width:48, height:48 },
  chatSendBtnGradient: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  chatSendBtnText: { color:'#fff', fontSize:20, fontWeight:'700' },
  micBtn: { alignItems:'center', justifyContent:'center' },
  scroll: { padding:16, paddingBottom:40 },
  backBtn: { marginBottom:12 },
  backBtnText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  stepCard: { backgroundColor:'#16162a', borderRadius:14, padding:16, marginBottom:12, borderWidth:1, borderColor:'#ffffff14' },
  stepHeader: { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  stepBadge: { width:24, height:24, borderRadius:12, backgroundColor:'#ffffff22', alignItems:'center', justifyContent:'center' },
  stepBadgeText: { color:'#fff', fontSize:11, fontWeight:'700' },
  stepTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1, flex:1 },
  stepDone: { color:'#4CAF50', fontSize:11 },
  sportsGrid: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  sportCard: { width:'30%', borderRadius:12, borderWidth:1, borderColor:'#ffffff22', overflow:'hidden' },
  sportCardGradient: { padding:12, alignItems:'center', gap:6 },
  sportCardIcon: { fontSize:28 },
  sportCardLabel: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:0.5 },
  typesList: { gap:8 },
  typeCard: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#0d0d1a', borderRadius:12, padding:12, borderWidth:1, borderColor:'#ffffff14' },
  typeCardLeft: { flexDirection:'row', alignItems:'center', gap:10, flex:1 },
  typeIcon: { fontSize:22 },
  typeCardInfo: { flex:1 },
  typeLabel: { color:'#fff', fontFamily:'BebasNeue', fontSize:13, letterSpacing:0.5 },
  typeDesc: { color:'#ffffffcc', fontSize:10, marginTop:2 },
  twoTeamsBadge: { backgroundColor:'#FFD70022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  twoTeamsText: { color:'#FFD700', fontSize:9, fontFamily:'BebasNeue' },
  realDataBadge: { backgroundColor:'#4CAF5022', borderRadius:8, padding:8, marginBottom:10, borderWidth:1, borderColor:'#4CAF5044' },
  realDataText: { color:'#4CAF50', fontSize:10, fontFamily:'BebasNeue', letterSpacing:0.5 },
  fieldLabel: { color:'#ffffffcc', fontSize:11, fontFamily:'BebasNeue', letterSpacing:1, marginBottom:6 },
  pickerWithMic: { flexDirection:'row', alignItems:'center', gap:8 },
  pickerBtnFlex: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#0d0d1a', borderRadius:10, padding:14, borderWidth:1, borderColor:'#ffffff22' },
  pickerBtn: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#0d0d1a', borderRadius:10, padding:14, borderWidth:1, borderColor:'#ffffff22' },
  pickerBtnText: { color:'#fff', fontSize:14, flex:1 },
  pickerBtnPlaceholder: { color:'#ffffff44', fontSize:14, flex:1 },
  pickerArrow: { color:'#ffffff55', fontSize:12 },
  errorBox: { backgroundColor:'#E5393522', borderRadius:8, padding:10, marginTop:8, borderWidth:1, borderColor:'#E5393544' },
  errorText: { color:'#E53935', fontSize:11 },
  generateBtn: { borderRadius:12, padding:16, alignItems:'center' },
  generateBtnText: { color:'#fff', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1 },
  loadingCard: { backgroundColor:'#16162a', borderRadius:14, padding:30, alignItems:'center', gap:12, marginBottom:12 },
  loadingText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:13, letterSpacing:1, textAlign:'center' },
  conseilCard: { backgroundColor:'#16162a', borderRadius:14, padding:16, marginBottom:12, borderWidth:1, borderColor:'#FF6B2B33' },
  conseilHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' },
  aiBadge: { borderRadius:10, paddingHorizontal:10, paddingVertical:5 },
  aiBadgeText: { color:'#fff', fontFamily:'BebasNeue', fontSize:11, letterSpacing:1 },
  sportMini: { borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  sportMiniText: { color:'#fff', fontSize:9, fontWeight:'700' },
  conseilMeta: { marginBottom:12, gap:2 },
  conseilMetaText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:12, letterSpacing:1 },
  conseilMetaTeam: { color:'#ffffffcc', fontSize:12, fontWeight:'600' },
  conseilText: { color:'#fff', fontSize:13, lineHeight:22, marginBottom:16 },
  conseilActions: { flexDirection:'row', gap:8 },
  refreshBtn: { flex:1, backgroundColor:'#ffffff0a', borderRadius:10, padding:10, alignItems:'center' },
  refreshBtnText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:12 },
  newBtn: { flex:1, backgroundColor:'#FF6B2B22', borderRadius:10, padding:10, alignItems:'center', borderWidth:1, borderColor:'#FF6B2B44' },
  newBtnText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:12 },
  historySection: { marginTop:8 },
  historyTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  historyCard: { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:6, borderWidth:1, borderColor:'#ffffff0a' },
  historyIcon: { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  historyInfo: { flex:1 },
  historyTeam: { color:'#fff', fontSize:12, fontWeight:'600' },
  historyType: { color:'#ffffffcc', fontSize:10, marginTop:2 },
  historyArrow: { color:'#ffffff55', fontSize:20 },
  modalOverlay: { flex:1, backgroundColor:'#000000aa', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'#16162a', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, maxHeight:'85%' },
  modalTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:2, textAlign:'center', marginBottom:12 },
  searchInput: { backgroundColor:'#0d0d1a', borderRadius:10, padding:12, color:'#fff', fontSize:13, borderWidth:1, borderColor:'#ffffff22', marginBottom:12 },
  teamOption: { flexDirection:'row', alignItems:'center', gap:12, padding:12, borderBottomWidth:1, borderBottomColor:'#ffffff0a' },
  teamOptionLogo: { width:32, height:32, resizeMode:'contain' },
  teamOptionLogoPlaceholder: { width:32, height:32, borderRadius:16, backgroundColor:'#ffffff11', alignItems:'center', justifyContent:'center' },
  teamOptionText: { color:'#fff', fontSize:13, flex:1 },
  cancelBtn: { backgroundColor:'#ffffff0a', borderRadius:12, padding:14, alignItems:'center', marginTop:8 },
  cancelBtnText: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:14 },
  keyboardToolbar: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff14', padding:8, alignItems:'flex-end' },
  keyboardDismissBtn: { paddingHorizontal:16, paddingVertical:6, backgroundColor:'#FF6B2B22', borderRadius:8, borderWidth:1, borderColor:'#FF6B2B44' },
  keyboardDismissText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:13, letterSpacing:0.5 },
});
