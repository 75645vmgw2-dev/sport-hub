import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import { useLanguage } from '../i18n/LanguageContext';

const TABS = [
  { id:'forme', label:'FORME' },
  { id:'leaders', label:'LEADERS' },
  { id:'compo', label:'COMPO' },
  { id:'stats', label:'STATS' },
  { id:'news', label:'NEWS' },
];
const PERIODS = [3, 5, 10];
const H_NBA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };
const H_NHL = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.hockey.api-sports.io' };
const H_MLB = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.baseball.api-sports.io' };
const H_SOCCER = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };

const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

function safeDate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (typeof date === 'object' && date.start) return date.start;
  return null;
}

function formatDate(date) {
  const d = safeDate(date);
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}); }
  catch(e) { return String(d); }
}

function PeriodSelector({ active, onSelect, color }) {
  return (
    <View style={styles.periodRow}>
      <Text style={styles.periodLabel}>Derniers :</Text>
      {PERIODS.map(function(p) {
        return (
          <TouchableOpacity key={p}
            style={[styles.periodBtn, active === p && { backgroundColor: color }]}
            onPress={() => onSelect(p)}>
            <Text style={[styles.periodBtnText, active === p && { color:'#fff' }]}>{p}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const GOLF_STATUS_MESSAGES = {
  fr: ['🔍 Recherche des données du tournoi...','📊 Analyse du leaderboard...','🏌️ Évaluation des performances...','🧠 Génération de la réponse...'],
  en: ['🔍 Searching tournament data...','📊 Analyzing leaderboard...','🏌️ Evaluating performances...','🧠 Generating response...'],
  es: ['🔍 Buscando datos del torneo...','📊 Analizando el leaderboard...','🏌️ Evaluando rendimientos...','🧠 Generando respuesta...'],
  pt: ['🔍 Buscando dados do torneio...','📊 Analisando o leaderboard...','🏌️ Avaliando desempenhos...','🧠 Gerando resposta...'],
  de: ['🔍 Turnierdaten suchen...','📊 Leaderboard analysieren...','🏌️ Leistungen bewerten...','🧠 Antwort generieren...'],
  it: ['🔍 Ricerca dati torneo...','📊 Analisi leaderboard...','🏌️ Valutazione prestazioni...','🧠 Generazione risposta...'],
  ar: ['🔍 البحث عن بيانات البطولة...','📊 تحليل لوحة المتصدرين...','🏌️ تقييم الأداء...','🧠 إنشاء الرد...'],
  ru: ['🔍 Поиск данных турнира...','📊 Анализ лидерборда...','🏌️ Оценка выступлений...','🧠 Генерация ответа...'],
};

function GolfAssistant({ match, language }) {
  const [question, setQuestion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [tab, setTab] = React.useState('short');
  const [statusIdx, setStatusIdx] = React.useState(0);
  const messages = GOLF_STATUS_MESSAGES[language] || GOLF_STATUS_MESSAGES['en'];

  React.useEffect(function() {
    if (!loading) { setStatusIdx(0); return; }
    const iv = setInterval(function() { setStatusIdx(function(p) { return (p+1) % messages.length; }); }, 3000);
    return () => clearInterval(iv);
  }, [loading, language]);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true); setResult(null);
    try {
      const leaderboard = (match.players||[]).slice(0,10).map(function(p,i) {
        return '#'+(i+1)+' '+p.name+' — '+( p.score||'E')+(p.thru?' (thru '+p.thru+')':'');
      }).join('\n');
      const prompt = 'You are Kazmo, golf expert AI.\nTournament: '+(match.tournamentName||match.home)+'\nCurrent leaderboard:\n'+leaderboard+'\n\nUser question: '+question+'\n\nReply ONLY valid JSON (no markdown):\n{"short":"2 sentences","medium":"5 sentences","long":"10 sentences"}\n\nAnswer in language: '+(language||'en');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:1000, messages:[{role:'user',content:prompt}] })
      });
      const data = await response.json();
      const text = (data.content||[]).map(function(c){return c.text||'';}).join('');
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setResult(parsed);
    } catch(e) { setResult({short:'Error: '+e.message, medium:'Error: '+e.message, long:'Error: '+e.message}); }
    finally { setLoading(false); }
  }

  return (
    <View style={styles.aiSection}>
      <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>🤖 KAZMO ASSISTANT</Text>
      </LinearGradient>
      {!result && !loading && (
        <View style={{gap:10,marginTop:8}}>
          <TextInput
            value={question} onChangeText={setQuestion}
            style={[styles.aiText,{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,borderWidth:1,borderColor:'#ffffff22',color:'#fff',minHeight:60}]}
            placeholder={language==='fr'?'Pose ta question sur le tournoi...':'Ask your question about the tournament...'}
            placeholderTextColor="#ffffff44" multiline
            blurOnSubmit={false}
          />
          <TouchableOpacity onPress={function(){require('react-native').Keyboard.dismiss();}} style={{alignSelf:'flex-end',paddingHorizontal:8,paddingVertical:4,backgroundColor:'#ffffff11',borderRadius:6}}>
            <Text style={{color:'#ffffff66',fontSize:11}}>⌨️ Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={ask} disabled={!question.trim()} style={{opacity:question.trim()?1:0.4}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:10,padding:12,alignItems:'center'}}>
              <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1}}>🔮 ANALYSER</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {loading && (
        <View style={{alignItems:'center',gap:12,marginTop:16}}>
          <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={{width:60,height:60,borderRadius:30,alignItems:'center',justifyContent:'center'}}>
            <Text style={{color:'#fff',fontSize:32,fontWeight:'900'}}>K</Text>
          </LinearGradient>
          <Text style={{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:13,letterSpacing:1,textAlign:'center'}}>{messages[statusIdx]}</Text>
          <ActivityIndicator color="#FF6B2B" size="large"/>
          <Text style={{color:'#ffffff33',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1}}>⏱ UP TO 30 SECONDS</Text>
        </View>
      )}
      {result && (
        <View style={{marginTop:8}}>
          <View style={{flexDirection:'row',backgroundColor:'#16162a',borderRadius:10,padding:4,gap:4,marginBottom:12}}>
            {[{id:'short',label:'⚡ Short'},{id:'medium',label:'📊 Medium'},{id:'long',label:'🎓 Long'}].map(function(tb){
              return(<TouchableOpacity key={tb.id} style={{flex:1,padding:8,borderRadius:8,alignItems:'center',backgroundColor:tab===tb.id?'#FF6B2B11':undefined}} onPress={()=>setTab(tb.id)}>
                <Text style={{color:tab===tb.id?'#FF6B2B':'#ffffff55',fontFamily:'BebasNeue',fontSize:11}}>{tb.label}</Text>
              </TouchableOpacity>);
            })}
          </View>
          <Text style={styles.aiText}>{tab==='short'?result.short:tab==='medium'?result.medium:result.long}</Text>
          <TouchableOpacity onPress={()=>{setResult(null);setQuestion('');}} style={[styles.refreshBtn,{marginTop:12}]}>
            <Text style={styles.refreshText}>← New question</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function AISection({ content, loading, onRefresh }) {
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#FF6B2B" size="large" />
        <Text style={styles.loadingText}>Kazmo analyse...</Text>
      </View>
    );
  }
  return (
    <View style={styles.aiSection}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>🤖 KAZMO ASSISTANT</Text>
      </LinearGradient>
      <Text style={styles.aiText}>{content}</Text>
      <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
        <Text style={styles.refreshText}>↻ Actualiser</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MatchDetailScreen({ match, sport, color, onBack }) {
  const { language } = useLanguage();
  
  const [tab, setTab] = useState('forme');
  const [period, setPeriod] = useState(5);
  const [homeForm, setHomeForm] = useState([]);
  const [awayForm, setAwayForm] = useState([]);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [aiContent, setAiContent] = useState('');
  const [news, setNews] = useState('');
  const [loadingForm, setLoadingForm] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);

  const C = color || '#FF6B2B';
  const needsAI = sport === 'NHL' || sport === 'MLB' || sport === 'TENNIS' ||
    sport === 'F1' || sport === 'GOLF' || sport === 'MMA';

  useEffect(() => { fetchForm(); }, []);

  useEffect(() => {
    if (needsAI) {
      // Pour le Golf et autres sports AI, charger dès l'onglet forme
      if ((tab === 'forme' || tab === 'leaders' || tab === 'stats' || tab === 'compo') && !aiLoaded) fetchAIPlayers();
    } else {
      if ((tab === 'leaders' || tab === 'stats' || tab === 'compo') && !playersLoaded) fetchPlayers();
    }
    if (tab === 'news' && !news) fetchNews();
  }, [tab]);

  async function fetchForm() {
    setLoadingForm(true);
    try {
      if (sport === 'NBA') await fetchNBAForm();
      else if (sport === 'NHL') await fetchNHLForm();
      else if (sport === 'MLB') await fetchMLBForm();
      else if (sport === 'SOCCER' || sport === 'FOOTBALL') await fetchSoccerForm();
      else setLoadingForm(false);
    } catch(e) { console.error(e); setLoadingForm(false); }
  }

  async function fetchPlayers() {
    setLoadingPlayers(true);
    try {
      if (sport === 'NBA') await fetchNBAPlayers();
      else if (sport === 'SOCCER' || sport === 'FOOTBALL') await fetchSoccerPlayers();
      else setLoadingPlayers(false);
    } catch(e) { console.error(e); setLoadingPlayers(false); }
  }

  async function callAnthropic(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: H_ANTHROPIC,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role:'user', content: prompt }],
      }),
    });
    const data = await response.json();
    return (data.content || []).map(function(c) { return c.text || ''; }).join('');
  }

  function buildRealContext() {
    // Golf — utiliser les données du tournoi
    if (sport === 'GOLF' && match.players && match.players.length > 0) {
      let ctx = 'Golf Tournament: ' + (match.tournamentName||match.home) + '\n';
      ctx += 'Current Leaderboard:\n';
      (match.players||[]).forEach(function(p, i) { ctx += '#'+(i+1)+'. '+p.name+' — Score: '+( p.score||'E')+' (Thru: '+(p.thru||'-')+')'+'\n'; });
      return ctx;
    }
    let context = '';
    if (homeForm && homeForm.length > 0) {
      const shown = homeForm.slice(0, 5);
      const wins = shown.filter(function(g) { return g.win; }).length;
      context += match.home + ' — ' + wins + 'V/' + (shown.length-wins) + 'D sur les 5 derniers matchs.\n';
      context += 'Résultats : ' + shown.map(function(g) {
        return (g.win?'V':'D') + ' ' + g.myScore + '-' + g.oppScore + ' vs ' + g.opp;
      }).join(', ') + '\n\n';
    }
    if (awayForm && awayForm.length > 0) {
      const shown = awayForm.slice(0, 5);
      const wins = shown.filter(function(g) { return g.win; }).length;
      context += match.away + ' — ' + wins + 'V/' + (shown.length-wins) + 'D sur les 5 derniers matchs.\n';
      context += 'Résultats : ' + shown.map(function(g) {
        return (g.win?'V':'D') + ' ' + g.myScore + '-' + g.oppScore + ' vs ' + g.opp;
      }).join(', ') + '\n\n';
    }
    if (homePlayers && homePlayers.length > 0) {
      context += 'Leaders ' + match.home + ' : ' + homePlayers.slice(0,3).map(function(p) {
        return p.name + ' (' + avg(p.pts,5) + ' ' + (p.stat1Label||'pts') + '/m)';
      }).join(', ') + '\n';
    }
    if (awayPlayers && awayPlayers.length > 0) {
      context += 'Leaders ' + match.away + ' : ' + awayPlayers.slice(0,3).map(function(p) {
        return p.name + ' (' + avg(p.pts,5) + ' ' + (p.stat1Label||'pts') + '/m)';
      }).join(', ') + '\n';
    }
    return context;
  }

  async function fetchNBAContext() {
    try {
      const standRes = await fetch(
        'https://v2.nba.api-sports.io/standings?league=standard&season=2025',
        { headers: H_NBA }
      );
      const standData = await standRes.json();
      const standings = standData.response || [];
      function getTeamStanding(teamId) {
        const t = standings.find(function(s) { return s.team.id === teamId; });
        if (!t) return null;
        const wins = typeof t.win === 'object' ? (t.win.total||0) : (t.win||0);
        const losses = typeof t.loss === 'object' ? (t.loss.total||0) : (t.loss||0);
        return { rank: t.conference?.rank||'?', conference: t.conference?.name||'?', wins, losses,
          pct: wins+losses>0 ? Math.round(wins/(wins+losses)*100) : 0 };
      }
      const homeStand = getTeamStanding(match.homeId);
      const awayStand = getTeamStanding(match.awayId);
      let context = '=== CLASSEMENT NBA 2025-26 ===\n';
      if (homeStand) context += match.home + ' : ' + homeStand.wins + 'V-' + homeStand.losses + 'D (' + homeStand.pct + '%), ' + homeStand.rank + 'e conférence ' + homeStand.conference + '\n';
      if (awayStand) context += match.away + ' : ' + awayStand.wins + 'V-' + awayStand.losses + 'D (' + awayStand.pct + '%), ' + awayStand.rank + 'e conférence ' + awayStand.conference + '\n';
      context += '\n' + buildRealContext();
      return context;
    } catch(e) { return buildRealContext(); }
  }

  async function fetchMLBContext() {
    try {
      const res = await fetch('https://v1.baseball.api-sports.io/standings?league=1&season=2026', { headers: H_MLB });
      const data = await res.json();
      const standings = data.response || [];
      function getTeamStanding(teamId) {
        for (const group of standings) {
          if (!group.teams) continue;
          const t = (group.teams||[]).find(function(t) { return t.id === teamId; });
          if (t) return t;
        }
        return null;
      }
      let context = '=== CLASSEMENT MLB 2026 ===\n';
      const homeStand = getTeamStanding(match.homeId);
      const awayStand = getTeamStanding(match.awayId);
      if (homeStand) context += match.home + ' : ' + (homeStand.won||0) + 'V-' + (homeStand.lost||0) + 'D\n';
      if (awayStand) context += match.away + ' : ' + (awayStand.won||0) + 'V-' + (awayStand.lost||0) + 'D\n';
      context += '\n' + buildRealContext();
      return context;
    } catch(e) { return buildRealContext(); }
  }

  async function fetchSoccerContext() {
    try {
      const [homeStandRes, awayStandRes] = await Promise.all([
        fetch('https://v3.football.api-sports.io/standings?season=2025&team='+match.homeId, { headers: H_SOCCER }),
        fetch('https://v3.football.api-sports.io/standings?season=2025&team='+match.awayId, { headers: H_SOCCER }),
      ]);
      const [homeStandData, awayStandData] = await Promise.all([homeStandRes.json(), awayStandRes.json()]);
      let context = '=== CLASSEMENT FOOTBALL ===\n';
      function parseStand(data, teamId) {
        const leagues = data.response || [];
        for (const league of leagues) {
          for (const group of (league.league?.standings||[])) {
            const t = group.find(function(t) { return t.team?.id === teamId; });
            if (t) return t;
          }
        }
        return null;
      }
      const homeStand = parseStand(homeStandData, match.homeId);
      const awayStand = parseStand(awayStandData, match.awayId);
      if (homeStand) context += match.home + ' : ' + homeStand.points + ' pts, ' + homeStand.rank + 'e, ' + homeStand.all?.win + 'V-' + homeStand.all?.draw + 'N-' + homeStand.all?.lose + 'D\n';
      if (awayStand) context += match.away + ' : ' + awayStand.points + ' pts, ' + awayStand.rank + 'e, ' + awayStand.all?.win + 'V-' + awayStand.all?.draw + 'N-' + awayStand.all?.lose + 'D\n';
      context += '\n' + buildRealContext();
      return context;
    } catch(e) { return buildRealContext(); }
  }

  async function fetchAIPlayers() {
    setLoadingAI(true);
    try {
      const sportNames = { NHL:'NHL hockey', MLB:'MLB baseball', TENNIS:'tennis', F1:'Formule 1', GOLF:'PGA Tour golf', MMA:'MMA UFC' };
      const sportName = sportNames[sport] || sport;
      const tabName = tab==='leaders' ? 'joueurs clés et statistiques récentes' :
        tab==='compo' ? 'compositions probables' : 'statistiques récentes';
      const context = buildRealContext();
      const prompt = 'DONNÉES RÉELLES :\n' + context +
        '\nEn te basant UNIQUEMENT sur ces données, fournis les ' + tabName +
        ' pour ' + match.home + ' vs ' + match.away + ' en ' + sportName + '. Réponds en français, sois concis.';
      const text = await callAnthropic(prompt);
      setAiContent(text);
      setAiLoaded(true);
    } catch(e) { console.error(e); }
    finally { setLoadingAI(false); }
  }

  async function fetchNBAForm() {
    const [homeRes, awayRes] = await Promise.all([
      fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&team=' + match.homeId, { headers: H_NBA }),
      fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&team=' + match.awayId, { headers: H_NBA }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    function parse(data, teamId) {
      return (data.response||[])
        .filter(function(g){return g.status.long==='Finished';})
        .sort(function(a,b){return new Date(b.date.start)-new Date(a.date.start);})
        .slice(0,10)
        .map(function(g) {
          const isHome = g.teams.home.id===teamId;
          const my = isHome?g.scores.home.points:g.scores.visitors.points;
          const opp = isHome?g.scores.visitors.points:g.scores.home.points;
          const oppTeam = isHome?g.teams.visitors:g.teams.home;
          return { date:(g.date.start||'').slice(5,10), opp:oppTeam.name||'', oppLogo:oppTeam.logo||null,
            myScore:my||0, oppScore:opp||0, win:(my||0)>(opp||0), home:isHome };
        });
    }
    setHomeForm(parse(homeData, match.homeId));
    setAwayForm(parse(awayData, match.awayId));
    setLoadingForm(false);
  }

  async function fetchNBAPlayers() {
    const [homeRes, awayRes] = await Promise.all([
      fetch('https://v2.nba.api-sports.io/players/statistics?season=2025&team=' + match.homeId, { headers: H_NBA }),
      fetch('https://v2.nba.api-sports.io/players/statistics?season=2025&team=' + match.awayId, { headers: H_NBA }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    function parse(data) {
      const stats = {};
      (data.response||[]).forEach(function(s) {
        if (!s||!s.player) return;
        const name = (s.player.firstname||'')+' '+(s.player.lastname||'');
        if (!stats[name]) stats[name] = { name, pts:[], reb:[], ast:[], stat1Label:'PTS', stat2Label:'REB', stat3Label:'AST' };
        stats[name].pts.push(Number(s.points)||0);
        stats[name].reb.push(Number(s.totReb)||0);
        stats[name].ast.push(Number(s.assists)||0);
      });
      return Object.values(stats).filter(function(p){return p.pts.length>=3;})
        .sort(function(a,b){
          const na=Math.min(5,a.pts.length), nb=Math.min(5,b.pts.length);
          return (b.pts.slice(0,nb).reduce(function(x,y){return x+y;},0)/nb||1) -
                 (a.pts.slice(0,na).reduce(function(x,y){return x+y;},0)/na||1);
        }).slice(0,12);
    }
    setHomePlayers(parse(homeData));
    setAwayPlayers(parse(awayData));
    setPlayersLoaded(true);
    setLoadingPlayers(false);
  }

  async function fetchNHLForm() {
    const [homeRes, awayRes] = await Promise.all([
      fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&team=' + match.homeId, { headers: H_NHL }),
      fetch('https://v1.hockey.api-sports.io/games?league=57&season=2025&team=' + match.awayId, { headers: H_NHL }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    function parse(data, teamId) {
      return (data.response||[])
        .filter(function(g){return ['Finished','After Over Time','After Penalties'].indexOf(g.status.long)>=0;})
        .sort(function(a,b){return new Date(b.date)-new Date(a.date);})
        .slice(0,10)
        .map(function(g) {
          const isHome = g.teams.home.id===teamId;
          const my = isHome?g.scores.home:g.scores.away;
          const opp = isHome?g.scores.away:g.scores.home;
          const oppTeam = isHome?g.teams.away:g.teams.home;
          return { date:(g.date||'').slice(5,10), opp:oppTeam.name||'', oppLogo:oppTeam.logo||null,
            myScore:my||0, oppScore:opp||0, win:(my||0)>(opp||0), home:isHome };
        });
    }
    setHomeForm(parse(homeData, match.homeId));
    setAwayForm(parse(awayData, match.awayId));
    setLoadingForm(false);
  }

  async function fetchMLBForm() {
    const [homeRes, awayRes] = await Promise.all([
      fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&team=' + match.homeId, { headers: H_MLB }),
      fetch('https://v1.baseball.api-sports.io/games?league=1&season=2026&team=' + match.awayId, { headers: H_MLB }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    function parse(data, teamId) {
      return (data.response||[])
        .filter(function(g){return g.status.long==='Finished';})
        .sort(function(a,b){return new Date(b.date)-new Date(a.date);})
        .slice(0,10)
        .map(function(g) {
          const isHome = g.teams.home.id===teamId;
          const my = isHome?g.scores.home.total:g.scores.away.total;
          const opp = isHome?g.scores.away.total:g.scores.home.total;
          const oppTeam = isHome?g.teams.away:g.teams.home;
          return { date:(g.date||'').slice(5,10), opp:oppTeam.name||'', oppLogo:oppTeam.logo||null,
            myScore:my||0, oppScore:opp||0, win:(my||0)>(opp||0), home:isHome };
        });
    }
    setHomeForm(parse(homeData, match.homeId));
    setAwayForm(parse(awayData, match.awayId));
    setLoadingForm(false);
  }

  async function fetchSoccerForm() {
    if (!match.homeId||!match.awayId) { setLoadingForm(false); return; }
    const [homeRes, awayRes] = await Promise.all([
      fetch('https://v3.football.api-sports.io/fixtures?team='+match.homeId+'&last=10', { headers: H_SOCCER }),
      fetch('https://v3.football.api-sports.io/fixtures?team='+match.awayId+'&last=10', { headers: H_SOCCER }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    function parse(data, teamId) {
      return (data.response||[]).map(function(f) {
        const isHome = f.teams.home.id===teamId;
        const my = isHome?f.goals.home:f.goals.away;
        const opp = isHome?f.goals.away:f.goals.home;
        const oppTeam = isHome?f.teams.away:f.teams.home;
        return { date:(f.fixture.date||'').slice(5,10), opp:oppTeam.name||'', oppLogo:oppTeam.logo||null,
          myScore:my||0, oppScore:opp||0, win:(my||0)>(opp||0), home:isHome };
      });
    }
    setHomeForm(parse(homeData, match.homeId));
    setAwayForm(parse(awayData, match.awayId));
    setLoadingForm(false);
  }

  async function fetchSoccerPlayers() {
    setLoadingPlayers(true);
    try {
      if (match.fixtureId && match.isFinished) {
        // Match joué — stats du match
        const res = await fetch('https://v3.football.api-sports.io/fixtures/players?fixture='+match.fixtureId, { headers: H_SOCCER });
        const data = await res.json();
        const teams = data.response||[];
        function parse(teamData) {
          if (!teamData||!teamData.players) return [];
          return teamData.players.map(function(p) {
            const s = p.statistics?.[0]||{};
            return { name:p.player?.name||'', pts:[Number(s.goals?.total)||0],
              reb:[Number(s.shots?.total)||0], ast:[Number(s.passes?.key)||0],
              stat1Label:'BTS', stat2Label:'TIR', stat3Label:'PAS' };
          }).sort(function(a,b){return (b.pts[0]||0)-(a.pts[0]||0);}).slice(0,12);
        }
        setHomePlayers(parse(teams[0]));
        setAwayPlayers(parse(teams[1]));
      } else {
        // Match à venir — effectifs des équipes
        const [homeRes, awayRes] = await Promise.all([
          fetch('https://v3.football.api-sports.io/players/squads?team='+match.homeId, { headers: H_SOCCER }),
          fetch('https://v3.football.api-sports.io/players/squads?team='+match.awayId, { headers: H_SOCCER }),
        ]);
        const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
        function parseSquad(data) {
          const players = (data.response?.[0]?.players)||[];
          return players.map(function(p) {
            return { name:p.name||'', pts:[0], reb:[0], ast:[0],
              stat1Label:'POS', stat2Label:'AGE', stat3Label:'N°',
              pos:p.position||'', age:p.age||0, number:p.number||0 };
          }).slice(0, 20);
        }
        setHomePlayers(parseSquad(homeData));
        setAwayPlayers(parseSquad(awayData));
      }
    } catch(e) { console.error(e); }
    setPlayersLoaded(true);
    setLoadingPlayers(false);
  }

  async function fetchNews() {
    setLoadingNews(true);
    try {
      let context = '';
      if (sport === 'NBA') context = await fetchNBAContext();
      else if (sport === 'MLB') context = await fetchMLBContext();
      else if (sport === 'SOCCER') context = await fetchSoccerContext();
      else context = buildRealContext();
      const matchDate = formatDate(match.date);
      const isFinished = match.isFinished;
      const isLive = match.isLive;
      let prompt = '';
      if (isFinished) {
        prompt = 'DONNÉES RÉELLES match TERMINÉ :\n' + context;
        if (match.homeScore!==null && match.awayScore!==null) {
          prompt += '\nScore final : ' + match.home + ' ' + match.homeScore + '-' + match.awayScore + ' ' + match.away + '\n';
        }
        prompt += '\nAnalyse ce résultat en 4-5 phrases. Facteurs clés, performances notables, implications. Réponds en français.';
      } else if (isLive) {
        prompt = 'DONNÉES RÉELLES match EN COURS :\n' + context;
        prompt += '\nScore actuel : ' + match.home + ' ' + match.homeScore + '-' + match.awayScore + ' ' + match.away + '\n';
        prompt += '\nAnalyse ce match en cours en 4-5 phrases. Qui domine ? Facteurs clés ? Réponds en français.';
      } else {
        prompt = 'DONNÉES RÉELLES pour prédiction du match du ' + matchDate + ' :\n' + context;
        prompt += '\nEn te basant UNIQUEMENT sur ces données réelles (pas ta mémoire), fais une prédiction pour ' +
          match.home + ' vs ' + match.away + '. Qui est favori ? Joueurs clés ? Score prédit ? 4-5 phrases en français.';
      }
      const text = await callAnthropic(prompt);
      setNews(text);
    } catch(e) { console.error(e); }
    finally { setLoadingNews(false); }
  }

  function avg(arr, n) {
    if (!arr||!arr.length) return '0.0';
    const slice = arr.slice(0,n);
    if (!slice.length) return '0.0';
    return (slice.reduce(function(a,b){return a+b;},0)/slice.length).toFixed(1);
  }

  function FormSection({ games, teamName, teamColor }) {
    const shown = (games||[]).slice(0,period);
    const wins = shown.filter(function(g){return g.win;}).length;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle,{color:teamColor}]}>{teamName}</Text>
          <View style={styles.recordRow}>
            <Text style={[styles.recordNum,{color:'#4CAF50'}]}>{wins}V</Text>
            <Text style={styles.recordSep}> · </Text>
            <Text style={[styles.recordNum,{color:'#E53935'}]}>{shown.length-wins}D</Text>
          </View>
        </View>
        <View style={styles.formBadges}>
          {shown.map(function(g,i) {
            return (
              <View key={i} style={[styles.formBadge,
                {backgroundColor:g.win?'#4CAF5033':'#E5393533', borderColor:g.win?'#4CAF50':'#E53935'}]}>
                <Text style={[styles.formBadgeText,{color:g.win?'#4CAF50':'#E53935'}]}>{g.win?'V':'D'}</Text>
              </View>
            );
          })}
        </View>
        {shown.map(function(g,i) {
          return (
            <View key={i} style={[styles.gameRow,{backgroundColor:i%2===0?'#16162a':'#0d0d1a'}]}>
              <Text style={styles.gameDate}>{g.date}</Text>
              <Text style={styles.gameAt}>{g.home?'vs':'@'}</Text>
              <View style={styles.gameOpp}>
                {g.oppLogo?<Image source={{uri:g.oppLogo}} style={styles.oppLogo} onError={function(){}} />:null}
                <Text style={styles.gameOppName} numberOfLines={1}>{g.opp}</Text>
              </View>
              <Text style={[styles.gameScore,{color:g.win?'#4CAF50':'#E53935'}]}>
                {String(g.myScore)}-{String(g.oppScore)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  function LeadersSection({ players, teamName, teamColor }) {
    const p0 = (players||[])[0];
    const l1 = p0?.stat1Label||'ST1';
    const l2 = p0?.stat2Label||'ST2';
    const l3 = p0?.stat3Label||'ST3';
    // Si c'est un effectif (pas de stats) — afficher position/numéro
    const isSquad = p0 && p0.stat1Label === 'POS';
    if (isSquad) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle,{color:teamColor,marginBottom:8}]}>{teamName} — Effectif</Text>
          {(players||[]).map(function(p,i) {
            return (
              <View key={i} style={[styles.playerRow,{backgroundColor:i%2===0?'#16162a':'#0d0d1a'}]}>
                <Text style={[styles.playerStat,{color:teamColor,width:28}]}>{p.number||'—'}</Text>
                <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.playerStat,{color:'#ffffff66',width:60,textAlign:'right',fontSize:9}]}>{p.pos}</Text>
              </View>
            );
          })}
        </View>
      );
    }
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle,{color:teamColor,marginBottom:8}]}>{teamName}</Text>
        <View style={styles.playerHeader}>
          <Text style={[styles.playerHeaderCell,{flex:1,textAlign:'left'}]}>Joueur</Text>
          <Text style={styles.playerHeaderCell}>{l1}</Text>
          <Text style={styles.playerHeaderCell}>{l2}</Text>
          <Text style={styles.playerHeaderCell}>{l3}</Text>
        </View>
        {(players||[]).map(function(p,i) {
          return (
            <View key={i} style={[styles.playerRow,{backgroundColor:i%2===0?'#16162a':'#0d0d1a'}]}>
              <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
              <Text style={[styles.playerStat,{color:'#FFD700'}]}>{avg(p.pts,period)}</Text>
              <Text style={styles.playerStat}>{avg(p.reb,period)}</Text>
              <Text style={styles.playerStat}>{avg(p.ast,period)}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  function CompoSection({ players, teamName, teamColor }) {
    const p0 = (players||[])[0];
    const isSquad = p0 && p0.stat1Label === 'POS';
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle,{color:teamColor,marginBottom:8}]}>{teamName}</Text>
        {(players||[]).map(function(p,i) {
          return (
            <View key={i} style={[styles.compoRow,{backgroundColor:i%2===0?'#16162a':'#0d0d1a'}]}>
              <Text style={styles.compoNum}>{isSquad?(p.number||'—'):(i+1)}</Text>
              <Text style={styles.compoName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.compoAvg}>{isSquad?(p.pos||''):(avg(p.pts,5)+' '+(p.stat1Label||'pts')+'/m')}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  function StatsSection({ players, teamName, teamColor }) {
    const p0 = (players||[])[0];
    const l1 = p0?.stat1Label||'PTS';
    const isSquad = p0 && p0.stat1Label === 'POS';
    if (isSquad) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle,{color:teamColor,marginBottom:8}]}>{teamName} — Effectif</Text>
          <Text style={styles.statsSubtitle}>Stats disponibles après le match</Text>
          {(players||[]).slice(0,8).map(function(p,i) {
            return (
              <View key={i} style={[styles.statsRow,{backgroundColor:i%2===0?'#16162a':'#0d0d1a'}]}>
                <Text style={styles.statsName} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.playerStat,{color:'#ffffff66',fontSize:10}]}>{p.pos}</Text>
              </View>
            );
          })}
        </View>
      );
    }
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle,{color:teamColor,marginBottom:4}]}>{teamName}</Text>
        <Text style={styles.statsSubtitle}>{l1} — {period} derniers matchs</Text>
        {(players||[]).slice(0,8).map(function(p,i) {
          const recent = (p.pts||[]).slice(0,period);
          return (
            <View key={i} style={[styles.statsRow,{backgroundColor:i%2===0?'#16162a':'#0d0d1a'}]}>
              <Text style={styles.statsName} numberOfLines={1}>{p.name}</Text>
              <View style={styles.statsCells}>
                {recent.map(function(val,j) {
                  const v = Number(val)||0;
                  return (
                    <View key={j} style={[styles.statsCell,
                      {backgroundColor:v>=25?'#FFD70033':v>=15?'#FF6B2B33':'#ffffff14'}]}>
                      <Text style={[styles.statsCellText,
                        {color:v>=25?'#FFD700':v>=15?'#FF6B2B':'#ffffffaa'}]}>{String(v)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  const dateStr = formatDate(match.date);

  return (
    <View style={styles.container}>
      <View style={styles.matchHeader}>
        <View style={styles.teamsRow}>
          <View style={styles.teamBlock}>
            {match.homeLogo ? (
              <Image source={{uri:match.homeLogo}} style={styles.teamLogo} onError={function(){}} />
            ) : (
              <View style={[styles.teamLogoPlaceholder,{backgroundColor:C+'33'}]}>
                <Text style={styles.teamLogoPlaceholderText}>{(match.home||'').slice(0,3).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.teamName} numberOfLines={2}>{match.home}</Text>
          </View>
          <View style={styles.scoreBlock}>
            {match.isFinished||match.isLive ? (
              <>
                <Text style={[styles.scoreText,match.isLive&&{color:'#ff1744'}]}>
                  {String(match.homeScore||0)}-{String(match.awayScore||0)}
                </Text>
                {match.isLive&&<Text style={styles.liveText}>● LIVE {match.status}</Text>}
                {match.isFinished&&<Text style={styles.finishedText}>TERMINÉ</Text>}
              </>
            ) : (
              <>
                <Text style={styles.vsText}>VS</Text>
                {dateStr?<Text style={styles.dateText}>{dateStr}</Text>:null}
              </>
            )}
          </View>
          <View style={styles.teamBlock}>
            {match.awayLogo ? (
              <Image source={{uri:match.awayLogo}} style={styles.teamLogo} onError={function(){}} />
            ) : (
              <View style={[styles.teamLogoPlaceholder,{backgroundColor:C+'33'}]}>
                <Text style={styles.teamLogoPlaceholderText}>{(match.away||'').slice(0,3).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.teamName} numberOfLines={2}>{match.away}</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
        <View style={styles.tabBar}>
          {TABS.map(function(t) {
            return (
              <TouchableOpacity key={t.id}
                style={[styles.tabBtn, tab===t.id&&{backgroundColor:C}]}
                onPress={() => setTab(t.id)}>
                <Text style={[styles.tabText, tab===t.id&&{color:'#fff'}]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab==='forme' && (
          <View>
            <PeriodSelector active={period} onSelect={setPeriod} color={C} />
            {loadingForm ? (
              <View style={styles.loadingBox}><ActivityIndicator color="#FF6B2B" size="large" /></View>
            ) : sport==='GOLF' ? (
              <GolfAssistant match={match} language={language} />
            ) : sport==='F1'||sport==='MMA'||sport==='TENNIS' ? (
              <AISection content={aiContent||''} loading={loadingAI}
                onRefresh={() => { setAiLoaded(false); fetchAIPlayers(); }} />
            ) : (
              <>
                <FormSection games={homeForm} teamName={match.home} teamColor={C} />
                <View style={styles.divider} />
                <FormSection games={awayForm} teamName={match.away} teamColor='#ffffffcc' />
              </>
            )}
          </View>
        )}

        {tab==='leaders' && (
          <View>
            <PeriodSelector active={period} onSelect={setPeriod} color={C} />
            {needsAI ? (
              <AISection content={aiContent} loading={loadingAI}
                onRefresh={() => { setAiLoaded(false); fetchAIPlayers(); }} />
            ) : loadingPlayers ? (
              <View style={styles.loadingBox}><ActivityIndicator color="#FF6B2B" size="large" /></View>
            ) : (
              <>
                <LeadersSection players={homePlayers} teamName={match.home} teamColor={C} />
                <View style={styles.divider} />
                <LeadersSection players={awayPlayers} teamName={match.away} teamColor='#ffffffcc' />
              </>
            )}
          </View>
        )}

        {tab==='compo' && (
          <View>
            {needsAI ? (
              <AISection content={aiContent} loading={loadingAI}
                onRefresh={() => { setAiLoaded(false); fetchAIPlayers(); }} />
            ) : loadingPlayers ? (
              <View style={styles.loadingBox}><ActivityIndicator color="#FF6B2B" size="large" /></View>
            ) : (
              <>
                <CompoSection players={homePlayers} teamName={match.home} teamColor={C} />
                <View style={styles.divider} />
                <CompoSection players={awayPlayers} teamName={match.away} teamColor='#ffffffcc' />
              </>
            )}
          </View>
        )}

        {tab==='stats' && (
          <View>
            <PeriodSelector active={period} onSelect={setPeriod} color={C} />
            {needsAI ? (
              <AISection content={aiContent} loading={loadingAI}
                onRefresh={() => { setAiLoaded(false); fetchAIPlayers(); }} />
            ) : loadingPlayers ? (
              <View style={styles.loadingBox}><ActivityIndicator color="#FF6B2B" size="large" /></View>
            ) : (
              <>
                <StatsSection players={homePlayers} teamName={match.home} teamColor={C} />
                <View style={styles.divider} />
                <StatsSection players={awayPlayers} teamName={match.away} teamColor='#ffffffcc' />
              </>
            )}
          </View>
        )}

        {tab==='news' && (
          <View style={styles.newsBox}>
            {loadingNews ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FF6B2B" size="large" />
                <Text style={styles.loadingText}>Kazmo analyse le match...</Text>
              </View>
            ) : (
              <View>
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>🤖 KAZMO ASSISTANT</Text>
                </LinearGradient>
                <Text style={styles.newsText}>{news}</Text>
                <TouchableOpacity onPress={fetchNews} style={styles.refreshBtn}>
                  <Text style={styles.refreshText}>↻ Actualiser</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  matchHeader: { padding:14, borderBottomWidth:1, borderBottomColor:'#ffffff22' },
  teamsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  teamBlock: { alignItems:'center', flex:1, gap:4 },
  teamLogo: { width:44, height:44, resizeMode:'contain' },
  teamLogoPlaceholder: { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center' },
  teamLogoPlaceholderText: { color:'#fff', fontFamily:'BebasNeue', fontSize:11 },
  teamName: { color:'#fff', fontFamily:'BebasNeue', fontSize:11, textAlign:'center' },
  scoreBlock: { alignItems:'center', paddingHorizontal:6 },
  scoreText: { fontFamily:'BebasNeue', fontSize:32, color:'#fff' },
  vsText: { fontFamily:'BebasNeue', fontSize:22, color:'#FFD700' },
  dateText: { color:'#ffffffaa', fontSize:11, marginTop:2 },
  liveText: { color:'#ff1744', fontSize:9, fontWeight:'700', marginTop:2 },
  finishedText: { color:'#ffffffaa', fontFamily:'BebasNeue', fontSize:10, marginTop:2 },
  tabScrollView: { maxHeight:42, marginVertical:6 },
  tabBar: { flexDirection:'row', paddingHorizontal:8, gap:4 },
  tabBtn: { paddingHorizontal:14, paddingVertical:7, borderRadius:8, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  tabText: { color:'#ffffffaa', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  scroll: { padding:14, paddingBottom:20 },
  periodRow: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:12 },
  periodLabel: { color:'#ffffffcc', fontSize:11 },
  periodBtn: { paddingHorizontal:12, paddingVertical:5, borderRadius:6, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff44' },
  periodBtnText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:13 },
  section: { marginBottom:8 },
  sectionHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
  sectionTitle: { fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  recordRow: { flexDirection:'row', alignItems:'center' },
  recordNum: { fontFamily:'BebasNeue', fontSize:13 },
  recordSep: { color:'#ffffff88' },
  formBadges: { flexDirection:'row', gap:3, marginBottom:6, flexWrap:'wrap' },
  formBadge: { width:22, height:22, borderRadius:11, borderWidth:1, alignItems:'center', justifyContent:'center' },
  formBadgeText: { fontSize:9, fontWeight:'700' },
  gameRow: { flexDirection:'row', alignItems:'center', padding:7, borderRadius:6, marginBottom:2, gap:4 },
  gameDate: { color:'#ffffffaa', fontSize:10, width:38 },
  gameAt: { color:'#ffffffaa', fontSize:10, width:14 },
  gameOpp: { flex:1, flexDirection:'row', alignItems:'center', gap:4 },
  oppLogo: { width:12, height:12, resizeMode:'contain' },
  gameOppName: { color:'#ffffffcc', fontSize:10, flex:1 },
  gameScore: { fontFamily:'BebasNeue', fontSize:12, width:42, textAlign:'right' },
  divider: { height:1, backgroundColor:'#ffffff22', marginVertical:12 },
  playerHeader: { flexDirection:'row', paddingHorizontal:6, marginBottom:4 },
  playerHeaderCell: { color:'#ffffffcc', fontSize:10, fontWeight:'700', width:36, textAlign:'center' },
  playerRow: { flexDirection:'row', alignItems:'center', padding:7, borderRadius:6, marginBottom:2 },
  playerName: { color:'#fff', fontSize:10, flex:1 },
  playerStat: { color:'#fff', fontSize:11, fontFamily:'BebasNeue', width:36, textAlign:'center' },
  compoRow: { flexDirection:'row', alignItems:'center', padding:7, borderRadius:6, marginBottom:2 },
  compoNum: { color:'#ffffffaa', fontSize:10, width:18 },
  compoName: { color:'#fff', fontSize:10, flex:1 },
  compoAvg: { color:'#FFD700', fontSize:10, fontFamily:'BebasNeue' },
  statsSubtitle: { color:'#ffffffcc', fontSize:10, marginBottom:6 },
  statsRow: { flexDirection:'row', alignItems:'center', padding:6, borderRadius:6, marginBottom:2, gap:6 },
  statsName: { color:'#fff', fontSize:9, width:90 },
  statsCells: { flexDirection:'row', gap:3, flex:1 },
  statsCell: { borderRadius:4, paddingHorizontal:5, paddingVertical:2, minWidth:24, alignItems:'center' },
  statsCellText: { fontSize:9, fontFamily:'BebasNeue' },
  loadingBox: { padding:30, alignItems:'center', gap:8 },
  loadingText: { color:'#ffffffaa', fontSize:11 },
  aiSection: { paddingTop:4 },
  aiBadge: { borderRadius:10, paddingHorizontal:12, paddingVertical:6, alignSelf:'flex-start', marginBottom:12 },
  aiBadgeText: { color:'#fff', fontFamily:'BebasNeue', fontSize:12, letterSpacing:1 },
  aiText: { color:'#ffffffcc', fontSize:13, lineHeight:20, marginBottom:14 },
  newsBox: { paddingTop:4 },
  newsText: { color:'#ffffffcc', fontSize:13, lineHeight:20, marginBottom:14 },
  refreshBtn: { backgroundColor:'#ffffff14', borderRadius:8, padding:10, alignItems:'center' },
  refreshText: { color:'#FF6B2B', fontSize:12, fontFamily:'BebasNeue' },
});
