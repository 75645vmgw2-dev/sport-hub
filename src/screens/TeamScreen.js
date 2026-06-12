import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, TextInput, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { API_SPORTS_KEY, SEASONS, SEASON_LABELS } from '../api/config';
import { useLanguage } from '../i18n/LanguageContext';

const ANTHROPIC_KEY = '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';
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

const NBA_ESPN = {
  'Atlanta Hawks': 'atl', 'Boston Celtics': 'bos', 'Brooklyn Nets': 'bkn',
  'Charlotte Hornets': 'cha', 'Chicago Bulls': 'chi', 'Cleveland Cavaliers': 'cle',
  'Dallas Mavericks': 'dal', 'Denver Nuggets': 'den', 'Detroit Pistons': 'det',
  'Golden State Warriors': 'gsw', 'Houston Rockets': 'hou', 'Indiana Pacers': 'ind',
  'LA Clippers': 'lac', 'Los Angeles Clippers': 'lac', 'Los Angeles Lakers': 'lal',
  'Memphis Grizzlies': 'mem', 'Miami Heat': 'mia', 'Milwaukee Bucks': 'mil',
  'Minnesota Timberwolves': 'min', 'New Orleans Pelicans': 'no', 'New York Knicks': 'nyk',
  'Oklahoma City Thunder': 'okc', 'Orlando Magic': 'orl', 'Philadelphia 76ers': 'phi',
  'Phoenix Suns': 'phx', 'Portland Trail Blazers': 'por', 'Sacramento Kings': 'sac',
  'San Antonio Spurs': 'sa', 'Toronto Raptors': 'tor', 'Utah Jazz': 'utah',
  'Washington Wizards': 'was',
};

function getNBALogo(name) {
  const abbr = NBA_ESPN[name];
  if (!abbr) return null;
  return 'https://a.espncdn.com/i/teamlogos/nba/500/' + abbr + '.png';
}

function PlayerModal({ player, color, language, onClose }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [kazmoText, setKazmoText] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);

  const langNames = {
    fr:'français', en:'English', es:'español', pt:'português',
    de:'Deutsch', it:'italiano', ar:'العربية', ru:'русский'
  };

  useEffect(() => { fetchPlayerStats(); }, []);

  async function fetchPlayerStats() {
    setLoadingStats(true);
    try {
      const res = await fetch(
        'https://v2.nba.api-sports.io/players/statistics?id=' + player.id + '&season=2025',
        { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' } }
      );
      const data = await res.json();
      const games = data.response || [];
      if (games.length > 0) {
        const pts = games.reduce(function(s,g){return s+(g.points||0);},0) / games.length;
        const reb = games.reduce(function(s,g){return s+(g.totReb||0);},0) / games.length;
        const ast = games.reduce(function(s,g){return s+(g.assists||0);},0) / games.length;
        const stl = games.reduce(function(s,g){return s+(g.steals||0);},0) / games.length;
        const blk = games.reduce(function(s,g){return s+(g.blocks||0);},0) / games.length;
        const min = games.reduce(function(s,g){return s+(parseFloat(g.min)||0);},0) / games.length;
        setStats({ pts, reb, ast, stl, blk, min, games: games.length });
      }
    } catch(e) {}
    finally { setLoadingStats(false); }
  }

  async function fetchKazmo() {
    setLoadingKazmo(true);
    try {
      const langName = langNames[language] || 'français';
      const prompt = 'Tu es Kazmo, expert NBA. Fais une analyse concise du joueur ' +
        player.firstname + ' ' + player.lastname +
        ', position ' + (player.leagues?.standard?.pos || 'inconnue') +
        '. Saison 2025-26. Points forts, style de jeu, importance pour son equipe. ' +
        'Reponds en ' + langName + ' en 3-4 phrases maximum.';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers: H_ANTHROPIC,
        body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:300, messages:[{ role:'user', content:prompt }] }),
      });
      const data = await response.json();
      setKazmoText((data.content||[]).map(function(c){return c.text||'';}).join(''));
    } catch(e) {}
    finally { setLoadingKazmo(false); }
  }

  const pos = player.leagues?.standard?.pos || '?';
  const age = player.birth?.date ? new Date().getFullYear() - new Date(player.birth.date).getFullYear() : null;
  const height = player.height?.meters ? player.height.meters + 'm' : null;
  const weight = player.weight?.kilograms ? player.weight.kilograms + 'kg' : null;
  const country = player.birth?.country || null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={pStyles.overlay}>
        <View style={pStyles.container}>
          <View style={[pStyles.header, { borderBottomColor: color }]}>
            <View style={[pStyles.avatar, { backgroundColor: color + '33' }]}>
              <Text style={pStyles.avatarText}>{(player.firstname||'?')[0]}{(player.lastname||'?')[0]}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={pStyles.name}>{player.firstname} {player.lastname}</Text>
              <View style={pStyles.badgeRow}>
                <View style={[pStyles.posBadge, { backgroundColor: color }]}>
                  <Text style={pStyles.posBadgeText}>{pos}</Text>
                </View>
                {country ? <Text style={pStyles.country}>{country}</Text> : null}
                {age ? <Text style={pStyles.info}>{age} ans</Text> : null}
                {height ? <Text style={pStyles.info}>{height}</Text> : null}
                {weight ? <Text style={pStyles.info}>{weight}</Text> : null}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={pStyles.closeBtn}>
              <Text style={pStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={pStyles.scroll}>
            <Text style={pStyles.sectionTitle}>STATS SAISON 2025-26</Text>
            {loadingStats ? (
              <ActivityIndicator color="#FF6B2B" style={{ marginVertical:16 }} />
            ) : stats ? (
              <View style={pStyles.statsGrid}>
                {[
                  { label:'PTS', value: stats.pts.toFixed(1) },
                  { label:'REB', value: stats.reb.toFixed(1) },
                  { label:'AST', value: stats.ast.toFixed(1) },
                  { label:'STL', value: stats.stl.toFixed(1) },
                  { label:'BLK', value: stats.blk.toFixed(1) },
                  { label:'MIN', value: stats.min.toFixed(1) },
                ].map(function(s, i) {
                  return (
                    <View key={i} style={pStyles.statBox}>
                      <Text style={[pStyles.statValue, { color }]}>{s.value}</Text>
                      <Text style={pStyles.statLabel}>{s.label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={pStyles.emptyBox}><Text style={pStyles.emptyText}>Stats non disponibles</Text></View>
            )}
            <Text style={[pStyles.sectionTitle, { marginTop:16 }]}>ANALYSE KAZMO</Text>
            {!kazmoText && !loadingKazmo ? (
              <TouchableOpacity onPress={fetchKazmo} activeOpacity={0.85}
                style={[pStyles.kazmoBtn, { borderColor: color + '44', backgroundColor: color + '11' }]}>
                <Text style={[pStyles.kazmoBtnText, { color }]}>🤖 Analyser ce joueur</Text>
              </TouchableOpacity>
            ) : loadingKazmo ? (
              <View style={{ alignItems:'center', padding:16 }}>
                <ActivityIndicator color="#FF6B2B" />
                <Text style={pStyles.emptyText}>Kazmo analyse...</Text>
              </View>
            ) : (
              <View style={pStyles.kazmoCard}>
                <Text style={pStyles.kazmoText}>{kazmoText}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const pStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'#000000bb', justifyContent:'flex-end' },
  container: { backgroundColor:'#16162a', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'80%', borderWidth:1, borderColor:'#ffffff14' },
  header: { flexDirection:'row', alignItems:'center', gap:12, padding:16, borderBottomWidth:2 },
  avatar: { width:56, height:56, borderRadius:28, alignItems:'center', justifyContent:'center' },
  avatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:20 },
  name: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:1 },
  badgeRow: { flexDirection:'row', alignItems:'center', gap:6, marginTop:4, flexWrap:'wrap' },
  posBadge: { borderRadius:6, paddingHorizontal:8, paddingVertical:2 },
  posBadgeText: { color:'#fff', fontFamily:'BebasNeue', fontSize:10 },
  country: { color:'#ffffff88', fontSize:10 },
  info: { color:'#ffffff55', fontSize:10 },
  closeBtn: { width:32, height:32, borderRadius:16, backgroundColor:'#ffffff14', alignItems:'center', justifyContent:'center' },
  closeBtnText: { color:'#ffffff88', fontSize:14 },
  scroll: { padding:16, paddingBottom:40 },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:10 },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  statBox: { width:'30%', backgroundColor:'#0d0d1a', borderRadius:10, padding:12, alignItems:'center', borderWidth:1, borderColor:'#ffffff14' },
  statValue: { fontFamily:'BebasNeue', fontSize:22, letterSpacing:1 },
  statLabel: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:10, letterSpacing:1, marginTop:2 },
  emptyBox: { backgroundColor:'#0d0d1a', borderRadius:10, padding:16, alignItems:'center' },
  emptyText: { color:'#ffffff55', fontSize:11, marginTop:8 },
  kazmoBtn: { borderRadius:12, padding:14, alignItems:'center', borderWidth:1 },
  kazmoBtnText: { fontFamily:'BebasNeue', fontSize:13, letterSpacing:1 },
  kazmoCard: { backgroundColor:'#0d0d1a', borderRadius:12, padding:14, borderWidth:1, borderColor:'#FF6B2B22' },
  kazmoText: { color:'#ffffffcc', fontSize:13, lineHeight:20 },
});

export default function TeamScreen({ favorite, onBack }) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState('recent');
  const [allGames, setAllGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kazmoAnalysis, setKazmoAnalysis] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [nbMatchs, setNbMatchs] = useState(5);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const color = {
    basketball:'#1D428A', hockey:'#00B8D9', baseball:'#E53935',
    nfl:'#1A73E8', soccer:'#4CAF50', tennis:'#c85a19',
    f1:'#E10600', golf:'#2E7D32', mma:'#9C27B0',
  }[favorite.sport] || '#FF6B2B';

  const sportIcon = {
    basketball:'🏀', hockey:'🏒', baseball:'⚾', nfl:'🏈',
    soccer:'⚽', f1:'🏎', golf:'⛳', mma:'🤼',
  }[favorite.sport] || '🏆';

  const langNames = {
    fr:'français', en:'English', es:'español', pt:'português',
    de:'Deutsch', it:'italiano', ar:'العربية', ru:'русский'
  };

  useEffect(() => { fetchTeamData(); }, []);

  async function fetchTeamData() {
    setLoading(true);
    try {
      if (favorite.sport === 'basketball') await fetchNBAData();
      else if (favorite.sport === 'hockey') await fetchHockeyData();
      else if (favorite.sport === 'baseball') await fetchBaseballData();
      else if (favorite.sport === 'nfl') await fetchNFLData();
      else if (favorite.sport === 'soccer') await fetchSoccerData();
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function fetchNBAData() {
    try {
      const res = await fetch(
        'https://v2.nba.api-sports.io/games?league=standard&season='+SEASONS.NBA+'&team=' + favorite.team_id,
        { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' } }
      );
      const data = await res.json();
      const all = data.response || [];
      const finished = all.filter(function(g){ return String(g.status.short) === '3'; })
        .sort(function(a,b){ return new Date(b.date.start) - new Date(a.date.start); });
      const upcoming = all.filter(function(g){ return String(g.status.short) === '1'; })
        .sort(function(a,b){ return new Date(a.date.start) - new Date(b.date.start); }).slice(0,10);
      setAllGames(finished); setUpcomingGames(upcoming);
    } catch(e) {}
    try {
      const res = await fetch(
        'https://v2.nba.api-sports.io/players?team=' + favorite.team_id + '&season=2024',
        { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' } }
      );
      const data = await res.json();
      setPlayers((data.response || []).slice(0, 12));
    } catch(e) {}
  }

  async function fetchHockeyData() {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime()-86400000).toISOString().slice(0,10);
      const in30 = new Date(now.getTime()+30*86400000).toISOString().slice(0,10);
      const season = SEASONS.NHL || 2025;
      const res = await fetch(
        'https://v1.hockey.api-sports.io/games?team=' + favorite.team_id + '&season=' + season,
        { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.hockey.api-sports.io' } }
      );
      const data = await res.json();
      const all = data.response || [];
      const finished = all.filter(function(g){
        return ['Finished','After Over Time','After Penalties'].indexOf(g.status.long) >= 0;
      }).sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
      const upcoming = all.filter(function(g){
        const d = g.date?.slice(0,10);
        return g.status.short === 'NS' && d >= yesterday && d <= in30;
      }).sort(function(a,b){ return new Date(a.date) - new Date(b.date); }).slice(0,10);
      setAllGames(finished); setUpcomingGames(upcoming);
    } catch(e) {}
  }

  async function fetchBaseballData() {
    try {
      const season = SEASONS.MLB || 2026;
      const res = await fetch(
        'https://v1.baseball.api-sports.io/games?team=' + favorite.team_id + '&season=' + season + '&league=1',
        { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.baseball.api-sports.io' } }
      );
      const data = await res.json();
      const all = data.response || [];
      const finished = all.filter(function(g){
        return g.status.long === 'Finished' || g.status.short === 'FT';
      }).sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
      const upcoming = all.filter(function(g){
        return g.status.short === 'NS';
      }).sort(function(a,b){ return new Date(a.date) - new Date(b.date); }).slice(0,10);
      setAllGames(finished); setUpcomingGames(upcoming);
    } catch(e) {}
  }

  async function fetchNFLData() {
    try {
      const season = SEASONS.NFL || 2025;
      const res = await fetch(
        'https://v1.american-football.api-sports.io/games?team=' + favorite.team_id + '&season=' + season + '&league=1',
        { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.american-football.api-sports.io' } }
      );
      const data = await res.json();
      const all = data.response || [];
      const finished = all.filter(function(g){
        return g.game?.status?.short === 'FT' || g.game?.status?.long === 'Finished';
      }).sort(function(a,b){ return new Date(b.game?.date?.date) - new Date(a.game?.date?.date); });
      const upcoming = all.filter(function(g){
        return g.game?.status?.short === 'NS';
      }).sort(function(a,b){ return new Date(a.game?.date?.date) - new Date(b.game?.date?.date); }).slice(0,10);
      setAllGames(finished); setUpcomingGames(upcoming);
    } catch(e) {}
  }

  async function fetchSoccerData() {
    try {
      const season = SEASONS.SOCCER || 2025;
      const res = await fetch(
        'https://v3.football.api-sports.io/fixtures?team=' + favorite.team_id + '&season=' + season + '&last=20',
        { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
      );
      const data = await res.json();
      const all = data.response || [];
      const finished = all.filter(function(f){
        return ['FT','AET','PEN'].indexOf(f.fixture.status.short) >= 0;
      }).sort(function(a,b){ return new Date(b.fixture.date) - new Date(a.fixture.date); });
      setAllGames(finished);
    } catch(e) {}
    try {
      const season = SEASONS.SOCCER || 2025;
      const res = await fetch(
        'https://v3.football.api-sports.io/fixtures?team=' + favorite.team_id + '&season=' + season + '&next=10',
        { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
      );
      const data = await res.json();
      setUpcomingGames(data.response || []);
    } catch(e) {}
  }

  async function fetchKazmoAnalysis() {
    if (kazmoAnalysis) return;
    setLoadingKazmo(true);
    try {
      const langName = langNames[language] || 'français';
      const prompt = 'Tu es Kazmo, assistant IA sportif premium.\n' +
        'Fais une analyse complete de l\'equipe : ' + favorite.team_name + '\n' +
        'Sport : ' + favorite.sport + '\nLigue : ' + (favorite.league || 'Non precisee') + '\n\n' +
        'Inclus :\n1. Presentation\n2. Saison en cours\n3. Points forts et faibles\n4. Joueurs cles\n5. Perspectives\n\n' +
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
    const newHistory = [...chatHistory, { role:'user', content: question }];
    setChatHistory(newHistory);
    try {
      const langName = langNames[language] || 'français';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body: JSON.stringify({
          model:'claude-sonnet-4-5', max_tokens:500,
          system:'Tu es Kazmo, expert sportif IA sur ' + favorite.team_name + '. Reponds en ' + langName + '.',
          messages: newHistory.map(function(m){return{role:m.role,content:m.content};}),
        }),
      });
      const data = await response.json();
      const answer = (data.content||[]).map(function(c){return c.text||'';}).join('');
      setChatHistory(function(prev){return[...prev,{role:'assistant',content:answer}];});
    } catch(e) {}
    finally { setLoadingChat(false); }
  }

  // Fonctions utilitaires pour récupérer les infos selon le sport
  function getGameDate(g) {
    if (favorite.sport === 'basketball') return (g.date?.start||'').slice(0,10);
    if (favorite.sport === 'soccer') return (g.fixture?.date||'').slice(0,10);
    if (favorite.sport === 'nfl') return (g.game?.date?.date||'').slice(0,10);
    return (g.date||'').slice(0,10);
  }

  function getGameDateFull(g) {
    const d = getGameDate(g);
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
  }

  function getGameTime(g) {
    let dateStr = '';
    if (favorite.sport === 'basketball') dateStr = g.date?.start||'';
    else if (favorite.sport === 'soccer') dateStr = g.fixture?.date||'';
    else if (favorite.sport === 'nfl') dateStr = g.game?.date?.date||'';
    else dateStr = g.date||'';
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
  }

  function isHome(g) {
    if (favorite.sport === 'basketball') {
      return String(g.teams?.home?.id) === String(favorite.team_id) || g.teams?.home?.name === favorite.team_name;
    }
    if (favorite.sport === 'soccer') {
      return String(g.teams?.home?.id) === String(favorite.team_id);
    }
    if (favorite.sport === 'nfl') {
      return String(g.teams?.home?.id) === String(favorite.team_id);
    }
    if (favorite.sport === 'hockey') {
      return String(g.teams?.home?.id) === String(favorite.team_id);
    }
    if (favorite.sport === 'baseball') {
      return String(g.teams?.home?.id) === String(favorite.team_id);
    }
    return true;
  }

  function getScores(g) {
    const home = isHome(g);
    if (favorite.sport === 'basketball') {
      const my = home ? g.scores?.home?.points : g.scores?.visitors?.points;
      const opp = home ? g.scores?.visitors?.points : g.scores?.home?.points;
      return { my: my||0, opp: opp||0 };
    }
    if (favorite.sport === 'soccer') {
      const my = home ? g.goals?.home : g.goals?.away;
      const opp = home ? g.goals?.away : g.goals?.home;
      return { my: my||0, opp: opp||0 };
    }
    if (favorite.sport === 'hockey') {
      const my = home ? g.scores?.home : g.scores?.away;
      const opp = home ? g.scores?.away : g.scores?.home;
      return { my: my||0, opp: opp||0 };
    }
    if (favorite.sport === 'baseball') {
      const my = home ? g.scores?.home?.total : g.scores?.away?.total;
      const opp = home ? g.scores?.away?.total : g.scores?.home?.total;
      return { my: my||0, opp: opp||0 };
    }
    if (favorite.sport === 'nfl') {
      const my = home ? g.scores?.home?.total : g.scores?.away?.total;
      const opp = home ? g.scores?.away?.total : g.scores?.home?.total;
      return { my: my||0, opp: opp||0 };
    }
    return { my:0, opp:0 };
  }

  function getOppName(g) {
    const home = isHome(g);
    if (favorite.sport === 'basketball') {
      return home ? g.teams?.visitors?.name : g.teams?.home?.name;
    }
    if (favorite.sport === 'soccer') {
      return home ? g.teams?.away?.name : g.teams?.home?.name;
    }
    if (favorite.sport === 'hockey' || favorite.sport === 'baseball') {
      return home ? g.teams?.away?.name : g.teams?.home?.name;
    }
    if (favorite.sport === 'nfl') {
      return home ? g.teams?.away?.name : g.teams?.home?.name;
    }
    return '?';
  }

  function getOppLogo(g) {
    const name = getOppName(g);
    if (favorite.sport === 'basketball') return getNBALogo(name);
    if (favorite.sport === 'soccer') {
      const home = isHome(g);
      return home ? g.teams?.away?.logo : g.teams?.home?.logo;
    }
    if (favorite.sport === 'hockey') {
      const home = isHome(g);
      return home ? g.teams?.away?.logo : g.teams?.home?.logo;
    }
    if (favorite.sport === 'baseball') {
      const home = isHome(g);
      return home ? g.teams?.away?.logo : g.teams?.home?.logo;
    }
    return null;
  }

  const recentGames = allGames.slice(0, nbMatchs);
  const myLogo = favorite.logo_url || (favorite.sport === 'basketball' ? getNBALogo(favorite.team_name) : null);

  const TABS = [
    { id:'recent', label:'📊 Forme' },
    { id:'upcoming', label:'📅 Prochains' },
    { id:'players', label:'👥 Joueurs' },
    { id:'kazmo', label:'🤖 Kazmo' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: color }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {myLogo ? (
            <Image source={{ uri: myLogo }} style={styles.headerLogo} onError={function(){}} />
          ) : (
            <View style={[styles.headerLogoPlaceholder, { backgroundColor: color + '33' }]}>
              <Text style={styles.headerLogoText}>{sportIcon}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTeamName}>{favorite.team_name}</Text>
            <Text style={styles.headerLeague}>{favorite.league}</Text>
          </View>
        </View>
        <View style={{ width:40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
        <View style={styles.tabBar}>
          {TABS.map(function(tb) {
            return (
              <TouchableOpacity key={tb.id}
                style={[styles.tabBtn, tab === tb.id && { backgroundColor: color }]}
                onPress={() => { setTab(tb.id); if (tb.id === 'kazmo') fetchKazmoAnalysis(); }}>
                <Text style={[styles.tabBtnText, tab === tb.id && { color:'#fff' }]}>{tb.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#FF6B2B" size="large" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* FORME */}
          {tab === 'recent' && (
            <View>
              <View style={styles.nbMatchsRow}>
                <Text style={styles.sectionTitle}>DERNIERS MATCHS</Text>
                <View style={styles.nbMatchsBtns}>
                  {[3, 5, 10].map(function(n) {
                    return (
                      <TouchableOpacity key={n}
                        style={[styles.nbBtn, nbMatchs === n && { backgroundColor: color }]}
                        onPress={() => setNbMatchs(n)}>
                        <Text style={[styles.nbBtnText, nbMatchs === n && { color:'#fff' }]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {recentGames.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de matchs récents</Text></View>
              ) : recentGames.map(function(g, i) {
                const scores = getScores(g);
                const oppName = getOppName(g);
                const oppLogo = getOppLogo(g);
                const home = isHome(g);
                const win = scores.my > scores.opp;
                return (
                  <View key={i} style={[styles.gameCard, { borderLeftColor: win ? '#4CAF50' : '#E53935', borderLeftWidth:3 }]}>
                    <View style={styles.gameCardRow}>
                      <Text style={styles.gameCardDate}>{getGameDate(g)}</Text>
                      <Text style={styles.gameCardLocation}>{home ? '🏠 Domicile' : '✈️ Extérieur'}</Text>
                      <View style={[styles.winLossBadge, { backgroundColor: win ? '#4CAF5022' : '#E5393522' }]}>
                        <Text style={[styles.winLossText, { color: win ? '#4CAF50' : '#E53935' }]}>{win ? '✓ V' : '✗ D'}</Text>
                      </View>
                    </View>
                    <View style={styles.gameCardTeams}>
                      {oppLogo ? (
                        <Image source={{ uri: oppLogo }} style={styles.gameCardLogo} onError={function(){}} />
                      ) : (
                        <View style={styles.gameCardLogoPlaceholder}><Text style={{ fontSize:16 }}>{sportIcon}</Text></View>
                      )}
                      <Text style={styles.gameCardOpp} numberOfLines={1}>vs {oppName}</Text>
                      <Text style={[styles.gameCardScore, { color: win ? '#4CAF50' : '#E53935' }]}>
                        {scores.my} - {scores.opp}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* PROCHAINS */}
          {tab === 'upcoming' && (
            <View>
              <Text style={styles.sectionTitle}>PROCHAINS MATCHS</Text>
              {upcomingGames.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>Pas de matchs à venir</Text></View>
              ) : upcomingGames.map(function(g, i) {
                const oppName = getOppName(g);
                const oppLogo = getOppLogo(g);
                const home = isHome(g);
                return (
                  <View key={i} style={styles.upcomingCard}>
                    <View style={styles.upcomingCardRow}>
                      <Text style={styles.upcomingDate}>{getGameDateFull(g)}</Text>
                      <Text style={styles.gameCardLocation}>{home ? '🏠 Domicile' : '✈️ Extérieur'}</Text>
                      <Text style={[styles.upcomingTime, { color }]}>{getGameTime(g)}</Text>
                    </View>
                    <View style={styles.gameCardTeams}>
                      {oppLogo ? (
                        <Image source={{ uri: oppLogo }} style={styles.gameCardLogo} onError={function(){}} />
                      ) : (
                        <View style={styles.gameCardLogoPlaceholder}><Text style={{ fontSize:16 }}>{sportIcon}</Text></View>
                      )}
                      <Text style={styles.gameCardOpp} numberOfLines={1}>vs {oppName}</Text>
                      <Text style={[styles.vsText, { color }]}>À VENIR</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* JOUEURS */}
          {tab === 'players' && (
            <View>
              <Text style={styles.sectionTitle}>ROSTER</Text>
              {players.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    {favorite.sport === 'basketball' ? 'Roster non disponible' : 'Roster disponible pour NBA uniquement'}
                  </Text>
                </View>
              ) : (
                <View style={styles.playersGrid}>
                  {players.map(function(p, i) {
                    return (
                      <TouchableOpacity key={i} style={styles.playerCard} activeOpacity={0.8}
                        onPress={() => setSelectedPlayer(p)}>
                        <View style={[styles.playerAvatar, { backgroundColor: color + '33' }]}>
                          <Text style={styles.playerAvatarText}>
                            {(p.firstname||'?')[0]}{(p.lastname||'?')[0]}
                          </Text>
                        </View>
                        <Text style={styles.playerName} numberOfLines={1}>{p.firstname} {p.lastname}</Text>
                        {p.leagues?.standard?.pos ? (
                          <Text style={[styles.playerPos, { color }]}>{p.leagues.standard.pos}</Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* KAZMO */}
          {tab === 'kazmo' && (
            <View>
              <View style={styles.kazmoHeader}>
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.kazmoAvatar}>
                  <Text style={styles.kazmoAvatarText}>K</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.kazmoName}>KAZMO IA</Text>
                  <Text style={styles.kazmoSub}>Analyse de {favorite.team_name}</Text>
                </View>
              </View>
              {loadingKazmo ? (
                <View style={styles.center}>
                  <ActivityIndicator color="#FF6B2B" size="large" />
                  <Text style={styles.loadingText}>Kazmo analyse...</Text>
                </View>
              ) : kazmoAnalysis ? (
                <View style={styles.analysisCard}>
                  <Text style={styles.analysisText}>{kazmoAnalysis}</Text>
                </View>
              ) : null}
              <Text style={[styles.sectionTitle, { marginTop:20 }]}>POSER UNE QUESTION</Text>
              {chatHistory.length > 0 && (
                <View style={styles.chatHistory}>
                  {chatHistory.map(function(msg, i) {
                    const isUser = msg.role === 'user';
                    return (
                      <View key={i} style={[styles.chatMsg, isUser ? styles.chatMsgUser : styles.chatMsgKazmo]}>
                        {!isUser && (
                          <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.chatAvatar}>
                            <Text style={styles.chatAvatarText}>K</Text>
                          </LinearGradient>
                        )}
                        <View style={[styles.chatBubble, isUser ? styles.chatBubbleUser : styles.chatBubbleKazmo]}>
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
                      <View style={[styles.chatBubble, styles.chatBubbleKazmo]}>
                        <ActivityIndicator color="#FF6B2B" size="small" />
                      </View>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.chatInputRow}>
                <TextInput
                  value={chatInput} onChangeText={setChatInput}
                  style={styles.chatInput}
                  placeholder={'Question sur ' + favorite.team_name + '...'}
                  placeholderTextColor="#ffffff44" multiline maxLength={300}
                />
                <TouchableOpacity onPress={sendChat} disabled={loadingChat || !chatInput.trim()}
                  activeOpacity={0.85} style={styles.chatSendBtn}>
                  <LinearGradient
                    colors={loadingChat || !chatInput.trim() ? ['#444','#555'] : ['#FF6B2B','#FFD600']}
                    start={{x:0,y:0}} end={{x:1,y:0}} style={styles.chatSendBtnGradient}>
                    <Text style={styles.chatSendBtnText}>→</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} color={color} language={language} onClose={() => setSelectedPlayer(null)} />
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
  headerLogoText: { color:'#fff', fontFamily:'BebasNeue', fontSize:22 },
  headerTeamName: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:1 },
  headerLeague: { color:'#ffffff66', fontSize:10, marginTop:2 },
  tabScrollView: { maxHeight:42, marginHorizontal:16, marginTop:8, marginBottom:4 },
  tabBar: { flexDirection:'row', gap:6 },
  tabBtn: { paddingHorizontal:14, paddingVertical:8, borderRadius:10, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:11 },
  scroll: { padding:16, paddingBottom:40 },
  center: { padding:40, alignItems:'center', justifyContent:'center', gap:8 },
  loadingText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:14 },
  nbMatchsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  nbMatchsBtns: { flexDirection:'row', gap:6 },
  nbBtn: { width:36, height:28, borderRadius:8, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22', alignItems:'center', justifyContent:'center' },
  nbBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12 },
  emptyBox: { backgroundColor:'#16162a', borderRadius:12, padding:20, alignItems:'center', borderWidth:1, borderColor:'#ffffff14' },
  emptyText: { color:'#ffffff55', fontSize:12, textAlign:'center' },
  gameCard: { backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  gameCardRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  gameCardDate: { color:'#ffffff55', fontSize:10, flex:1 },
  gameCardLocation: { color:'#ffffff88', fontSize:9 },
  winLossBadge: { borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  winLossText: { fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  gameCardTeams: { flexDirection:'row', alignItems:'center', gap:8 },
  gameCardLogo: { width:28, height:28, resizeMode:'contain' },
  gameCardLogoPlaceholder: { width:28, height:28, borderRadius:14, backgroundColor:'#ffffff11', alignItems:'center', justifyContent:'center' },
  gameCardOpp: { color:'#fff', fontSize:12, fontWeight:'600', flex:1 },
  gameCardScore: { fontFamily:'BebasNeue', fontSize:18 },
  upcomingCard: { backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  upcomingCardRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  upcomingDate: { color:'#ffffff55', fontSize:10, flex:1 },
  upcomingTime: { fontFamily:'BebasNeue', fontSize:14 },
  vsText: { fontFamily:'BebasNeue', fontSize:12 },
  playersGrid: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  playerCard: { width:'30%', backgroundColor:'#16162a', borderRadius:10, padding:10, alignItems:'center', borderWidth:1, borderColor:'#ffffff14' },
  playerAvatar: { width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', marginBottom:6 },
  playerAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14 },
  playerName: { color:'#fff', fontSize:9, fontFamily:'BebasNeue', textAlign:'center', letterSpacing:0.3 },
  playerPos: { fontSize:9, fontFamily:'BebasNeue', marginTop:2 },
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
