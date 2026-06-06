import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useLanguage } from '../i18n/LanguageContext';
import { API_SPORTS_KEY } from '../api/config';

const H_NBA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };
const H_SOCCER = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };
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

const SPORTS = [
  { id:'nba', label:'NBA', icon:'🏀', color:'#1D428A' },
  { id:'nhl', label:'NHL', icon:'🏒', color:'#00B8D9' },
  { id:'mlb', label:'MLB', icon:'⚾', color:'#E53935' },
  { id:'nfl', label:'NFL', icon:'🏈', color:'#1A73E8' },
  { id:'soccer', label:'Football', icon:'⚽', color:'#4CAF50' },
  { id:'tennis', label:'Tennis', icon:'🎾', color:'#c85a19' },
  { id:'f1', label:'F1', icon:'🏎', color:'#E10600' },
  { id:'golf', label:'Golf', icon:'⛳', color:'#2E7D32' },
  { id:'mma', label:'MMA', icon:'🥊', color:'#9C27B0' },
];

const SPORT_EXAMPLES = {
  nba: { team: 'Ex: San Antonio Spurs', player: 'Ex: Victor Wembanyama', team2: 'Ex: New York Knicks' },
  nhl: { team: 'Ex: Carolina Hurricanes', player: 'Ex: Connor McDavid', team2: 'Ex: Vegas Golden Knights' },
  mlb: { team: 'Ex: New York Yankees', player: 'Ex: Shohei Ohtani', team2: 'Ex: Los Angeles Dodgers' },
  nfl: { team: 'Ex: Kansas City Chiefs', player: 'Ex: Patrick Mahomes', team2: 'Ex: San Francisco 49ers' },
  soccer: { team: 'Ex: France', player: 'Ex: Kylian Mbappe', team2: 'Ex: Bresil' },
  tennis: { team: 'Ex: Carlos Alcaraz', player: 'Ex: Jannik Sinner', team2: 'Ex: Novak Djokovic' },
  f1: { team: 'Ex: Red Bull Racing', player: 'Ex: Max Verstappen', team2: 'Ex: Ferrari' },
  golf: { team: 'Ex: Rory McIlroy', player: 'Ex: Scottie Scheffler', team2: 'Ex: Jon Rahm' },
  mma: { team: 'Ex: Jon Jones', player: 'Ex: Islam Makhachev', team2: 'Ex: Alex Pereira' },
};

const REQUIRES_OPPONENT = ['pronostic', 'h2h', 'pari'];
const SHOWS_OPPONENT = ['pronostic', 'h2h', 'pari', 'analyse', 'tendance'];

async function callAnthropic(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: H_ANTHROPIC,
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role:'user', content: prompt }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return (data.content || []).map(function(c) { return c.text || ''; }).join('');
}

async function searchNBATeam(name) {
  try {
    const res = await fetch('https://v2.nba.api-sports.io/teams?search=' + encodeURIComponent(name), { headers: H_NBA });
    const data = await res.json();
    return (data.response || [])[0] || null;
  } catch(e) { return null; }
}

async function getNBARecentGames(teamId, n) {
  try {
    const res = await fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&team=' + teamId, { headers: H_NBA });
    const data = await res.json();
    return (data.response || [])
      .filter(function(g) { return g.status.long === 'Finished'; })
      .sort(function(a,b) { return new Date(b.date.start) - new Date(a.date.start); })
      .slice(0, n);
  } catch(e) { return []; }
}

async function getNBAPlayerStats(teamId) {
  try {
    const res = await fetch('https://v2.nba.api-sports.io/players/statistics?season=2025&team=' + teamId, { headers: H_NBA });
    const data = await res.json();
    const stats = {};
    (data.response || []).forEach(function(s) {
      if (!s || !s.player) return;
      const name = (s.player.firstname||'') + ' ' + (s.player.lastname||'');
      if (!stats[name]) stats[name] = { name, pts:[], reb:[], ast:[] };
      stats[name].pts.push(Number(s.points)||0);
      stats[name].reb.push(Number(s.totReb)||0);
      stats[name].ast.push(Number(s.assists)||0);
    });
    return Object.values(stats)
      .filter(function(p) { return p.pts.length >= 3; })
      .map(function(p) {
        const n = Math.min(5, p.pts.length);
        return {
          name: p.name,
          avgPts: (p.pts.slice(0,n).reduce(function(a,b){return a+b;},0)/n).toFixed(1),
          avgReb: (p.reb.slice(0,n).reduce(function(a,b){return a+b;},0)/n).toFixed(1),
          avgAst: (p.ast.slice(0,n).reduce(function(a,b){return a+b;},0)/n).toFixed(1),
        };
      })
      .sort(function(a,b) { return Number(b.avgPts) - Number(a.avgPts); })
      .slice(0, 5);
  } catch(e) { return []; }
}

async function searchSoccerTeam(name) {
  try {
    const res = await fetch('https://v3.football.api-sports.io/teams?search=' + encodeURIComponent(name), { headers: H_SOCCER });
    const data = await res.json();
    return (data.response || [])[0]?.team || null;
  } catch(e) { return null; }
}

async function getSoccerRecentGames(teamId, n) {
  try {
    const res = await fetch('https://v3.football.api-sports.io/fixtures?team=' + teamId + '&last=' + n, { headers: H_SOCCER });
    const data = await res.json();
    return data.response || [];
  } catch(e) { return []; }
}

function formatNBAGames(games, teamId) {
  if (!games.length) return 'Pas de matchs disponibles';
  return games.map(function(g) {
    const isHome = g.teams.home.id === teamId;
    const my = isHome ? g.scores.home.points : g.scores.visitors.points;
    const opp = isHome ? g.scores.visitors.points : g.scores.home.points;
    const oppName = isHome ? g.teams.visitors.name : g.teams.home.name;
    const result = (my||0) > (opp||0) ? 'V' : 'D';
    return result + ' ' + (my||0) + '-' + (opp||0) + ' ' + (isHome?'vs':'@') + ' ' + oppName;
  }).join('\n');
}

function formatNBAPlayers(players) {
  if (!players.length) return 'Stats non disponibles';
  return players.map(function(p) {
    return p.name + ': ' + p.avgPts + 'pts / ' + p.avgReb + 'reb / ' + p.avgAst + 'ast';
  }).join('\n');
}

function formatSoccerGames(games, teamId) {
  if (!games.length) return 'Pas de matchs disponibles';
  return games.map(function(f) {
    const isHome = f.teams.home.id === teamId;
    const my = isHome ? f.goals.home : f.goals.away;
    const opp = isHome ? f.goals.away : f.goals.home;
    const oppName = isHome ? f.teams.away.name : f.teams.home.name;
    const result = (my||0) > (opp||0) ? 'V' : (my||0) === (opp||0) ? 'N' : 'D';
    return result + ' ' + (my||0) + '-' + (opp||0) + ' ' + (isHome?'vs':'@') + ' ' + oppName;
  }).join('\n');
}

export default function ConseilsScreen() {
  const { t, language } = useLanguage();
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

  const CONSEIL_TYPES = [
    { id:'analyse', label: t('typeAnalyse'), icon:'📊', desc: t('typeAnalyseDesc') },
    { id:'pronostic', label: t('typePronostic'), icon:'🎯', desc: t('typePronosticDesc') },
    { id:'pari', label: t('typePari'), icon:'💰', desc: t('typePariDesc') },
    { id:'joueur', label: t('typeJoueur'), icon:'⭐', desc: t('typeJoueurDesc') },
    { id:'tendance', label: t('typeTendance'), icon:'📈', desc: t('typeTendanceDesc') },
    { id:'h2h', label: t('typeH2H'), icon:'⚔️', desc: t('typeH2HDesc') },
  ];

  const langNames = {
    fr: 'français', en: 'English', es: 'español', pt: 'português',
    de: 'Deutsch', it: 'italiano', ar: 'العربية', ru: 'русский'
  };

  function getExamples() {
    if (!selectedSport) return { team: 'Ex: Equipe', player: 'Ex: Joueur', team2: 'Ex: Adversaire' };
    return SPORT_EXAMPLES[selectedSport.id] || { team: 'Ex: Equipe', player: 'Ex: Joueur', team2: 'Ex: Adversaire' };
  }

  function getPlaceholder1() {
    const ex = getExamples();
    if (selectedType?.id === 'joueur') return ex.player;
    if (selectedType?.id === 'f1' || selectedSport?.id === 'f1') return ex.team;
    return ex.team;
  }

  function getPlaceholder2() {
    return getExamples().team2;
  }

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
        setLoadingStatus('Recherche equipe NBA...');
        const t1 = await searchNBATeam(team1.trim());
        let t2data = null;
        if (team2.trim()) t2data = await searchNBATeam(team2.trim());
        if (t1) {
          setLoadingStatus('Recuperation matchs recents...');
          const games1 = await getNBARecentGames(t1.id, 5);
          setLoadingStatus('Recuperation stats joueurs...');
          const players1 = await getNBAPlayerStats(t1.id);
          context += '=== ' + t1.name + ' ===\n';
          context += 'Derniers matchs:\n' + formatNBAGames(games1, t1.id) + '\n';
          context += 'Top joueurs (moy. 5 matchs):\n' + formatNBAPlayers(players1) + '\n\n';
        }
        if (t2data) {
          setLoadingStatus('Recuperation donnees adversaire...');
          const games2 = await getNBARecentGames(t2data.id, 5);
          const players2 = await getNBAPlayerStats(t2data.id);
          context += '=== ' + t2data.name + ' ===\n';
          context += 'Derniers matchs:\n' + formatNBAGames(games2, t2data.id) + '\n';
          context += 'Top joueurs (moy. 5 matchs):\n' + formatNBAPlayers(players2) + '\n\n';
        }
      } else if (sport === 'soccer') {
        setLoadingStatus('Recherche equipe Football...');
        const t1 = await searchSoccerTeam(team1.trim());
        let t2data = null;
        if (team2.trim()) t2data = await searchSoccerTeam(team2.trim());
        if (t1) {
          setLoadingStatus('Recuperation matchs recents...');
          const games1 = await getSoccerRecentGames(t1.id, 5);
          context += '=== ' + t1.name + ' ===\n';
          context += 'Derniers matchs:\n' + formatSoccerGames(games1, t1.id) + '\n\n';
        }
        if (t2data) {
          setLoadingStatus('Recuperation donnees adversaire...');
          const games2 = await getSoccerRecentGames(t2data.id, 5);
          context += '=== ' + t2data.name + ' ===\n';
          context += 'Derniers matchs:\n' + formatSoccerGames(games2, t2data.id) + '\n\n';
        }
      }
    } catch(e) { console.error('Context error:', e); }
    return context;
  }

  async function generateConseil() {
    if (isGenerateDisabled()) return;
    setLoading(true);
    setConseil('');
    setError('');
    try {
      const sportName = selectedSport.label;
      const langName = langNames[language] || 'français';
      const context = await buildContextData();
      setLoadingStatus('Kazmo genere le conseil...');

      const hasRealData = context.length > 0;
      const dataSection = hasRealData ? '\n\nDONNEES REELLES API:\n' + context : '';
      const opponent = team2.trim() ? ' vs ' + team2.trim() : '';

      let prompt = '';
      if (selectedType.id === 'analyse') {
        prompt = 'Tu es un expert sportif. Analyse ' + team1.trim() + opponent + ' en ' + sportName + '.' +
          dataSection + '\nInclus: forme recente, points forts/faibles, joueurs cles, conclusion.' +
          '\nReponds en ' + langName + '.';
      } else if (selectedType.id === 'pronostic') {
        prompt = 'Tu es un expert en pronostics sportifs.' + dataSection +
          '\nDonne un pronostic POUR LE MATCH ' + team1.trim() + ' VS ' + team2.trim() + ' en ' + sportName + '.' +
          '\nTu dois choisir UN SEUL vainqueur. Inclus: qui va gagner, % de confiance, 3 raisons, risques.' +
          '\nIMPORTANT: choisis clairement un vainqueur entre ' + team1.trim() + ' et ' + team2.trim() + '.' +
          '\nReponds en ' + langName + '.';
      } else if (selectedType.id === 'pari') {
        prompt = 'Tu es un consultant en paris sportifs.' + dataSection +
          '\nDonne le meilleur conseil de pari pour ' + team1.trim() + ' VS ' + team2.trim() + ' en ' + sportName + '.' +
          '\nInclus: type de pari recommande, cote approximative, niveau de risque (faible/moyen/eleve), justification.' +
          '\nIMPORTANT: rappelle que les paris comportent des risques.' +
          '\nReponds en ' + langName + '.';
      } else if (selectedType.id === 'joueur') {
        prompt = 'Tu es un scout sportif expert.' + dataSection +
          '\nIdentifie le joueur cle a surveiller pour ' + team1.trim() + (opponent ? opponent : ' en ' + sportName) + '.' +
          '\nInclus: nom, poste, stats recentes, pourquoi il sera decisif.' +
          '\nReponds en ' + langName + '.';
      } else if (selectedType.id === 'tendance') {
        prompt = 'Tu es un analyste de donnees sportives.' + dataSection +
          '\nAnalyse les tendances de ' + team1.trim() + (opponent ? opponent : '') + ' en ' + sportName + '.' +
          '\nInclus: serie en cours, moyenne de points sur 5 matchs, domicile/exterieur, stats avancees.' +
          '\nReponds en ' + langName + '.';
      } else if (selectedType.id === 'h2h') {
        prompt = 'Tu es un expert en statistiques sportives.' + dataSection +
          '\nAnalyse lhistorique entre ' + team1.trim() + ' et ' + team2.trim() + ' en ' + sportName + '.' +
          '\nInclus: bilan general, derniers resultats, tendances, qui a lavantage historique.' +
          '\nReponds en ' + langName + '.';
      }

      const text = await callAnthropic(prompt);
      setConseil(text);
      setHistory(function(prev) {
        return [{
          id: Date.now(),
          sport: selectedSport,
          type: selectedType,
          team1: team1.trim(),
          team2: team2.trim(),
          conseil: text,
          hasRealData,
          date: new Date().toLocaleDateString('fr-FR'),
        }, ...prev.slice(0, 4)];
      });
    } catch(e) {
      console.error(e);
      setError('Erreur: ' + e.message);
    }
    finally { setLoading(false); setLoadingStatus(''); }
  }

  function reset() {
    setStep(1);
    setSelectedSport(null);
    setSelectedType(null);
    setTeam1('');
    setTeam2('');
    setConseil('');
    setError('');
  }

  function goBack() {
    if (conseil) { setConseil(''); return; }
    if (step === 3) { setStep(2); setSelectedType(null); setTeam1(''); setTeam2(''); }
    else if (step === 2) { setStep(1); setSelectedSport(null); }
  }

  const showBack = step > 1 || conseil;
  const requiresOpponent = selectedType && REQUIRES_OPPONENT.indexOf(selectedType.id) >= 0;
  const showsOpponent = selectedType && SHOWS_OPPONENT.indexOf(selectedType.id) >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {showBack && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>{t('conseilsTitle').split(' ')[0]} </Text>
          <GradientText text={t('conseilsTitle').split(' ').slice(1).join(' ')} fontSize={22} letterSpacing={1} />
        </View>
        <Text style={styles.subtitle}>{t('conseilsSubtitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ETAPE 1 */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, step >= 1 && { backgroundColor:'#FF6B2B' }]}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>{t('chooseSport')}</Text>
            {selectedSport && <Text style={styles.stepDone}>{selectedSport.icon} {selectedSport.label} ✓</Text>}
          </View>
          {(!selectedSport || step === 1) && (
            <View style={styles.sportsGrid}>
              {SPORTS.map(function(s) {
                return (
                  <TouchableOpacity key={s.id}
                    style={[styles.sportChip,
                      selectedSport?.id === s.id && { backgroundColor: s.color, borderColor: s.color }]}
                    activeOpacity={0.7}
                    onPress={() => { setSelectedSport(s); setStep(2); }}>
                    <Text style={styles.sportChipIcon}>{s.icon}</Text>
                    <Text style={[styles.sportChipLabel,
                      selectedSport?.id === s.id && { color:'#fff' }]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ETAPE 2 */}
        {selectedSport && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, step >= 2 && { backgroundColor:'#FF6B2B' }]}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>{t('chooseType')}</Text>
              {selectedType && <Text style={styles.stepDone}>{selectedType.icon} ✓</Text>}
            </View>
            {(!selectedType || step === 2) && (
              <View style={styles.typesList}>
                {CONSEIL_TYPES.map(function(ct) {
                  const needsTwo = REQUIRES_OPPONENT.indexOf(ct.id) >= 0;
                  return (
                    <TouchableOpacity key={ct.id}
                      style={[styles.typeCard,
                        selectedType?.id === ct.id && { borderColor:'#FF6B2B', backgroundColor:'#FF6B2B11' }]}
                      activeOpacity={0.8}
                      onPress={() => { setSelectedType(ct); setStep(3); }}>
                      <View style={styles.typeCardLeft}>
                        <Text style={styles.typeIcon}>{ct.icon}</Text>
                        <View style={styles.typeCardInfo}>
                          <Text style={styles.typeLabel}>{ct.label}</Text>
                          <Text style={styles.typeDesc}>{ct.desc}</Text>
                        </View>
                      </View>
                      {needsTwo && (
                        <View style={styles.twoTeamsBadge}>
                          <Text style={styles.twoTeamsText}>{t('twoTeamsBadge')}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ETAPE 3 */}
        {selectedSport && selectedType && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, step >= 3 && { backgroundColor:'#FF6B2B' }]}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>
                {requiresOpponent ? t('twoTeams') : t('chooseTeam')}
              </Text>
            </View>

            {(selectedSport.id === 'nba' || selectedSport.id === 'soccer') && (
              <View style={styles.realDataBadge}>
                <Text style={styles.realDataText}>
                  ✅ Donnees reelles API — {selectedSport.label}
                </Text>
              </View>
            )}

            <TextInput
              value={team1}
              onChangeText={setTeam1}
              style={styles.input}
              placeholder={getPlaceholder1()}
              placeholderTextColor="#ffffff44"
            />

            {showsOpponent && (
              <View style={{ marginTop:8 }}>
                <TextInput
                  value={team2}
                  onChangeText={setTeam2}
                  style={[styles.input, requiresOpponent && !team2.trim() && { borderColor:'#FF6B2B66' }]}
                  placeholder={getPlaceholder2() + (requiresOpponent ? ' *' : '')}
                  placeholderTextColor={requiresOpponent ? '#FF6B2B88' : '#ffffff44'}
                />
                {requiresOpponent && !team2.trim() && (
                  <Text style={styles.requiredHint}>
                    {selectedType.id === 'pronostic' ? '* Adversaire obligatoire pour un pronostic' :
                     selectedType.id === 'pari' ? '* Adversaire obligatoire pour un conseil pari' :
                     '* Les deux equipes sont obligatoires pour H2H'}
                  </Text>
                )}
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={generateConseil}
              disabled={isGenerateDisabled()}
              activeOpacity={0.85}
              style={{ marginTop:12 }}>
              <LinearGradient
                colors={isGenerateDisabled() ? ['#444','#555'] : ['#FF6B2B','#FFD600']}
                start={{ x:0, y:0 }} end={{ x:1, y:0 }}
                style={styles.generateBtn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.generateBtnText}>🔮 {t('generate')}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* LOADING STATUS */}
        {loading && loadingStatus ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#FF6B2B" size="large" />
            <Text style={styles.loadingText}>{loadingStatus}</Text>
          </View>
        ) : null}

        {/* RESULTAT */}
        {conseil ? (
          <View style={styles.conseilCard}>
            <View style={styles.conseilHeader}>
              <LinearGradient colors={['#FF6B2B','#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>🔮 {t('conseils')}</Text>
              </LinearGradient>
              <View style={[styles.sportMini, { backgroundColor: selectedSport?.color }]}>
                <Text style={styles.sportMiniText}>{selectedSport?.icon} {selectedSport?.label}</Text>
              </View>
            </View>
            <View style={styles.conseilMeta}>
              <Text style={styles.conseilMetaText}>{selectedType?.icon} {selectedType?.label}</Text>
              <Text style={styles.conseilMetaTeam}>{team1}{team2 ? ' vs ' + team2 : ''}</Text>
            </View>
            <Text style={styles.conseilText}>{conseil}</Text>
            <View style={styles.conseilActions}>
              <TouchableOpacity onPress={generateConseil} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>↻ {t('regenerate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={reset} style={styles.newBtn}>
                <Text style={styles.newBtnText}>+ {t('newAdvice')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* HISTORIQUE */}
        {history.length > 0 && !conseil && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>{t('recentHistory')}</Text>
            {history.map(function(h) {
              return (
                <TouchableOpacity key={h.id}
                  style={styles.historyCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedSport(h.sport);
                    setSelectedType(h.type);
                    setTeam1(h.team1);
                    setTeam2(h.team2);
                    setConseil(h.conseil);
                    setStep(3);
                  }}>
                  <View style={[styles.historyIcon, { backgroundColor: h.sport.color + '33' }]}>
                    <Text>{h.sport.icon}</Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTeam}>{h.team1}{h.team2 ? ' vs ' + h.team2 : ''}</Text>
                    <Text style={styles.historyType}>
                      {h.type.icon} {h.type.label} · {h.date}
                      {h.hasRealData ? ' · ✅' : ''}
                    </Text>
                  </View>
                  <Text style={styles.historyArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { padding:20, paddingBottom:10 },
  backBtn: { marginBottom:8, alignSelf:'flex-start' },
  backBtnText: { color:'#FF6B2B', fontSize:22, fontWeight:'700' },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  subtitle: { color:'#ffffffcc', fontSize:11, marginTop:2, fontFamily:'BebasNeue', letterSpacing:1 },
  scroll: { padding:16, paddingBottom:40 },
  stepCard: { backgroundColor:'#16162a', borderRadius:14, padding:16, marginBottom:12, borderWidth:1, borderColor:'#ffffff14' },
  stepHeader: { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  stepBadge: { width:24, height:24, borderRadius:12, backgroundColor:'#ffffff22', alignItems:'center', justifyContent:'center' },
  stepBadgeText: { color:'#fff', fontSize:11, fontWeight:'700' },
  stepTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1, flex:1 },
  stepDone: { color:'#4CAF50', fontSize:11 },
  sportsGrid: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  sportChip: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#0d0d1a',
               borderRadius:10, paddingHorizontal:12, paddingVertical:8,
               borderWidth:1, borderColor:'#ffffff22' },
  sportChipIcon: { fontSize:16 },
  sportChipLabel: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:12 },
  typesList: { gap:8 },
  typeCard: { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
              backgroundColor:'#0d0d1a', borderRadius:12, padding:12,
              borderWidth:1, borderColor:'#ffffff14' },
  typeCardLeft: { flexDirection:'row', alignItems:'center', gap:10, flex:1 },
  typeIcon: { fontSize:22 },
  typeCardInfo: { flex:1 },
  typeLabel: { color:'#fff', fontFamily:'BebasNeue', fontSize:13, letterSpacing:0.5 },
  typeDesc: { color:'#ffffffcc', fontSize:10, marginTop:2 },
  twoTeamsBadge: { backgroundColor:'#FFD70022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  twoTeamsText: { color:'#FFD700', fontSize:9, fontFamily:'BebasNeue' },
  realDataBadge: { backgroundColor:'#4CAF5022', borderRadius:8, padding:8, marginBottom:10, borderWidth:1, borderColor:'#4CAF5044' },
  realDataText: { color:'#4CAF50', fontSize:10, fontFamily:'BebasNeue', letterSpacing:0.5 },
  input: { backgroundColor:'#0d0d1a', borderRadius:10, padding:14, color:'#fff',
           fontSize:14, borderWidth:1, borderColor:'#ffffff22' },
  requiredHint: { color:'#FF6B2B88', fontSize:10, marginTop:4, fontStyle:'italic' },
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
  historyCard: { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#16162a',
                 borderRadius:10, padding:12, marginBottom:6, borderWidth:1, borderColor:'#ffffff0a' },
  historyIcon: { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  historyInfo: { flex:1 },
  historyTeam: { color:'#fff', fontSize:12, fontWeight:'600' },
  historyType: { color:'#ffffffcc', fontSize:10, marginTop:2 },
  historyArrow: { color:'#ffffff55', fontSize:20 },
});