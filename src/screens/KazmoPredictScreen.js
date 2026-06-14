import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Modal, TextInput, Image,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useLanguage } from '../i18n/LanguageContext';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';

const H_NBA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' };
const H_FOOT = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' };
const H_TENNIS = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.tennis.api-sports.io' };
const H_MMA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.mma.api-sports.io' };
const H_F1 = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.formula-1.api-sports.io' };
const H_GOLF = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.golf.api-sports.io' };

const H_ANTHROPIC = { 'Content-Type':'application/json', 'x-api-key':ANTHROPIC_KEY, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' };

const TIMING_MESSAGES = {
  fr: ['⏱ JUSQU A 30 SECONDES', 'Kazmo recherche des données en temps réel'],
  en: ['⏱ THIS MAY TAKE UP TO 30 SECONDS', 'Kazmo is searching real-time data'],
  es: ['⏱ HASTA 30 SEGUNDOS', 'Kazmo busca datos en tiempo real'],
  pt: ['⏱ ATÉ 30 SEGUNDOS', 'Kazmo está buscando dados em tempo real'],
  de: ['⏱ BIS ZU 30 SEKUNDEN', 'Kazmo sucht Echtzeit-Daten'],
  it: ['⏱ FINO A 30 SECONDI', 'Kazmo sta cercando dati in tempo reale'],
  ar: ['⏱ حتى 30 ثانية', 'يبحث Kazmo عن بيانات في الوقت الفعلي'],
  ru: ['⏱ ДО 30 СЕКУНД', 'Kazmo ищет данные в реальном времени'],
};
const STATUS_MESSAGES = {
  fr: ['🔍 Recherche des blessés...','📊 Analyse de la forme récente...','🎯 Calcul des probabilités...','🧠 Génération du pronostic...'],
  en: ['🔍 Searching for injuries...','📊 Analyzing recent form...','🎯 Calculating probabilities...','🧠 Generating prediction...'],
  es: ['🔍 Buscando lesiones...','📊 Analizando forma reciente...','🎯 Calculando probabilidades...','🧠 Generando pronóstico...'],
  pt: ['🔍 Buscando lesões...','📊 Analisando forma recente...','🎯 Calculando probabilidades...','🧠 Gerando previsão...'],
  de: ['🔍 Suche nach Verletzungen...','📊 Analyse der Form...','🎯 Wahrscheinlichkeiten...','🧠 Prognose wird erstellt...'],
  it: ['🔍 Ricerca infortuni...','📊 Analisi della forma...','🎯 Calcolo probabilità...','🧠 Generazione pronostico...'],
  ar: ['🔍 البحث عن الإصابات...','📊 تحليل الأداء...','🎯 حساب الاحتمالات...','🧠 إنشاء التوقع...'],
  ru: ['🔍 Поиск травм...','📊 Анализ формы...','🎯 Расчёт вероятностей...','🧠 Генерация прогноза...'],
};

const SURFACES = [
  { id:'dur', label:'Dur', icon:'🔵' },
  { id:'gazon', label:'Gazon', icon:'🟢' },
  { id:'terre', label:'Terre battue', icon:'🟠' },
  { id:'indoor', label:'Indoor', icon:'🏠' },
];

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const SPORTS_DUEL = [
  { id:'nba', label:'NBA', icon:'🏀', color:'#1D428A' },
  { id:'nhl', label:'NHL', icon:'🏒', color:'#00B8D9' },
  { id:'mlb', label:'MLB', icon:'⚾', color:'#E53935' },
  { id:'nfl', label:'NFL', icon:'🏈', color:'#1A73E8' },
  { id:'soccer', label:'Football', icon:'⚽', color:'#4CAF50' },
  { id:'mma', label:'MMA', icon:'🤼', color:'#9C27B0' },
  { id:'tennis', label:'Tennis', icon:'🎾', color:'#c85a19' },
  { id:'boxing', label:'Boxe', icon:'🥊', color:'#B71C1C' },
];
const SPORTS_SOLO = [
  { id:'f1', label:'F1', icon:'🏎', color:'#E10600' },
  { id:'golf', label:'Golf', icon:'⛳', color:'#2E7D32' },
];
export const ALL_SPORTS = [...SPORTS_DUEL, ...SPORTS_SOLO];
const INDIVIDUAL_SPORTS = ['tennis','f1','golf','mma','boxing'];
const SOLO_SPORTS = ['f1','golf'];

const TEAMS_HARDCODED = {
  nhl:['Anaheim Ducks','Boston Bruins','Buffalo Sabres','Calgary Flames','Carolina Hurricanes','Chicago Blackhawks','Colorado Avalanche','Columbus Blue Jackets','Dallas Stars','Detroit Red Wings','Edmonton Oilers','Florida Panthers','Los Angeles Kings','Minnesota Wild','Montreal Canadiens','Nashville Predators','New Jersey Devils','New York Islanders','New York Rangers','Ottawa Senators','Philadelphia Flyers','Pittsburgh Penguins','San Jose Sharks','Seattle Kraken','St. Louis Blues','Tampa Bay Lightning','Toronto Maple Leafs','Vancouver Canucks','Vegas Golden Knights','Washington Capitals','Winnipeg Jets'],
  mlb:['Arizona Diamondbacks','Atlanta Braves','Baltimore Orioles','Boston Red Sox','Chicago Cubs','Chicago White Sox','Cincinnati Reds','Cleveland Guardians','Colorado Rockies','Detroit Tigers','Houston Astros','Kansas City Royals','Los Angeles Angels','Los Angeles Dodgers','Miami Marlins','Milwaukee Brewers','Minnesota Twins','New York Mets','New York Yankees','Oakland Athletics','Philadelphia Phillies','Pittsburgh Pirates','San Diego Padres','San Francisco Giants','Seattle Mariners','St. Louis Cardinals','Tampa Bay Rays','Texas Rangers','Toronto Blue Jays','Washington Nationals'],
  nfl:['Arizona Cardinals','Atlanta Falcons','Baltimore Ravens','Buffalo Bills','Carolina Panthers','Chicago Bears','Cincinnati Bengals','Cleveland Browns','Dallas Cowboys','Denver Broncos','Detroit Lions','Green Bay Packers','Houston Texans','Indianapolis Colts','Jacksonville Jaguars','Kansas City Chiefs','Las Vegas Raiders','Los Angeles Chargers','Los Angeles Rams','Miami Dolphins','Minnesota Vikings','New England Patriots','New Orleans Saints','New York Giants','New York Jets','Philadelphia Eagles','Pittsburgh Steelers','San Francisco 49ers','Seattle Seahawks','Tampa Bay Buccaneers','Tennessee Titans','Washington Commanders'],
  soccer_ligue1:['Paris Saint-Germain','Olympique de Marseille','AS Monaco','Stade Rennais','OSC Lille','Lyon','Nice','Lens','Strasbourg','Nantes','Toulouse','Montpellier','Reims','Brest','Le Havre'],
  soccer_pl:['Manchester City','Arsenal','Liverpool','Chelsea','Manchester United','Tottenham','Newcastle','Aston Villa','Brighton','West Ham','Wolves','Crystal Palace','Everton','Brentford','Fulham','Nottingham Forest','Bournemouth'],
  soccer_laliga:['Real Madrid','FC Barcelona','Atletico Madrid','Real Sociedad','Athletic Bilbao','Villarreal','Betis','Valencia','Getafe','Rayo Vallecano','Osasuna','Girona','Celta Vigo','Sevilla','Almeria','Mallorca'],
  soccer_bundesliga:['Bayern Munich','Borussia Dortmund','Bayer Leverkusen','RB Leipzig','Eintracht Frankfurt','Union Berlin','Freiburg','Wolfsburg','Borussia Monchengladbach','Hoffenheim','Mainz','Augsburg','Werder Bremen','Stuttgart','Köln','Heidenheim'],
  soccer_seriea:['Inter Milan','AC Milan','Juventus','Napoli','AS Roma','Lazio','Atalanta','Fiorentina','Torino','Bologna','Monza','Udinese','Lecce','Cagliari','Empoli','Hellas Verona','Genoa'],
  soccer_ucl:['Real Madrid','Manchester City','Bayern Munich','Paris Saint-Germain','FC Barcelona','Liverpool','Chelsea','Juventus','Inter Milan','Atletico Madrid','Borussia Dortmund','Porto','Benfica','Ajax','AC Milan','Napoli'],
  soccer_international:['France','Brazil','Argentina','England','Spain','Germany','Portugal','Italy','Netherlands','Belgium','Croatia','Morocco','Senegal','Japan','Uruguay','Colombia','USA','Mexico','Canada','South Africa','Australia','South Korea','Iran','Saudi Arabia','Ghana','Tunisia','Nigeria','Cameroon','Egypt','Algeria','Costa Rica','Panama','Jamaica','Honduras','Ecuador','Peru','Paraguay','Bolivia','Venezuela','Chile','New Zealand','Serbia','Switzerland','Denmark','Austria','Turkey','Ukraine','Poland','Romania','Czech Republic','Slovakia','Hungary','Scotland','Ireland','Greece','Iceland','Sweden','Norway','Finland'],
};

const SOCCER_LEAGUES = [
  { id:'ligue1', label:'🇫🇷 Ligue 1', key:'soccer_ligue1' },
  { id:'pl', label:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League', key:'soccer_pl' },
  { id:'laliga', label:'🇪🇸 La Liga', key:'soccer_laliga' },
  { id:'bundesliga', label:'🇩🇪 Bundesliga', key:'soccer_bundesliga' },
  { id:'seriea', label:'🇮🇹 Serie A', key:'soccer_seriea' },
  { id:'ucl', label:'⭐ Champions League', key:'soccer_ucl' },
  { id:'international', label:'🌍 International', key:'soccer_international' },
];

const TENNIS_TOURS = [
  { id:'atp', label:'🎾 ATP (Hommes)', gender:'men' },
  { id:'wta', label:'🎾 WTA (Femmes)', gender:'women' },
];

function DatePicker({ value, onChange, t }) {
  const now = new Date();
  const dates = [{ label:t('predictNoDate'), value:null }];
  for (let i=0;i<=7;i++) {
    const d = new Date(now.getTime()+i*86400000);
    dates.push({ label:i===0?t('today'):i===1?t('next'):d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}), value:d.toISOString().slice(0,10) });
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
      <View style={{flexDirection:'row',gap:8}}>
        {dates.map(function(d,i){const active=value===d.value;return(<TouchableOpacity key={i} style={[styles.dateBtn,active&&styles.dateBtnActive]} onPress={()=>onChange(d.value)}><Text style={[styles.dateBtnText,active&&styles.dateBtnTextActive]}>{d.label}</Text></TouchableOpacity>);})}
      </View>
    </ScrollView>
  );
}

function SoccerLeaguePicker({ onSelectLeague, onClose }) {
  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}><View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Choose a league</Text>
        <ScrollView style={{maxHeight:400}}>
          {SOCCER_LEAGUES.map(function(l){return(<TouchableOpacity key={l.id} style={styles.teamOption} onPress={()=>{onSelectLeague(l);onClose();}}><Text style={styles.teamOptionText}>{l.label}</Text></TouchableOpacity>);})}
        </ScrollView>
        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );
}

function TeamPickerModal({ sport, onSelect, onClose, title, t, initialLeague, onLeagueSelected }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(initialLeague||null);
  const [showLeaguePicker, setShowLeaguePicker] = useState(sport.id==='soccer'&&!initialLeague);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showTourPicker, setShowTourPicker] = useState(sport.id==='tennis');

  const isTennis=sport.id==='tennis', isBoxing=sport.id==='boxing', isMMA=sport.id==='mma';
  const isF1=sport.id==='f1', isGolf=sport.id==='golf';
  const isManualTop=isTennis||isBoxing||isMMA||isF1||isGolf;
  const [loaded, setLoaded] = useState(false);

  React.useEffect(function(){
    if(loaded) return; // Ne charger qu'une seule fois
    if(sport.id==='soccer'&&selectedLeague){const list=TEAMS_HARDCODED[selectedLeague.key]||[];setTeams(list.map(function(n){return{name:n,logo:null};}));setLoading(false);setLoaded(true);}
    else if(isTennis&&selectedTour){loadTennisPlayers();setLoaded(true);}
    else if(isMMA){loadMMA();setLoaded(true);}
    else if(isF1){loadF1();setLoaded(true);}
    else if(isGolf){loadGolf();setLoaded(true);}
    else if(sport.id!=='soccer'&&!isTennis&&!isBoxing){loadTeams();setLoaded(true);}
    else if(isBoxing){setLoading(false);setLoaded(true);}
  },[selectedLeague,selectedTour]);

  async function loadTennisPlayers(){
    setLoading(true);
    try{
      const url='https://v1.tennis.api-sports.io/rankings?type=singles&gender='+(selectedTour.gender==='men'?'men':'women');
      const res=await fetch(url,{headers:H_TENNIS});
      const data=await res.json();
      setTeams((data.response||[]).slice(0,100).map(function(p){return{name:p.player?.name||'',logo:p.player?.photo||null,rank:p.ranking};}).filter(function(p){return p.name;}));
    }catch(e){setTeams([]);}
    setLoading(false);
  }
  async function loadMMA(){
    setLoading(true);
    try{
      const res=await fetch('https://v1.mma.api-sports.io/fighters?season=2026',{headers:H_MMA});
      const data=await res.json();
      setTeams((data.response||[]).slice(0,100).map(function(f){return{name:(f.firstname||'')+' '+(f.lastname||''),logo:f.photo||null};}).filter(function(f){return f.name.trim();}));
    }catch(e){setTeams([]);}
    setLoading(false);
  }
  async function loadF1(){
    setLoading(true);
    try{
      const res=await fetch('https://v1.formula-1.api-sports.io/drivers?season=2026',{headers:H_F1});
      const data=await res.json();
      setTeams((data.response||[]).map(function(d){return{name:(d.name?.forename||'')+' '+(d.name?.surname||''),logo:d.image||null,rank:d.teams?.[0]?.team?.name||''};}).filter(function(d){return d.name.trim();}));
    }catch(e){setTeams([]);}
    setLoading(false);
  }
  async function loadGolf(){
    setLoading(true);
    try{
      const res=await fetch('https://v1.golf.api-sports.io/rankings?tour=PGA',{headers:H_GOLF});
      const data=await res.json();
      setTeams((data.response||[]).slice(0,100).map(function(p){return{name:p.player?.name||'',logo:p.player?.photo||null,rank:p.position};}).filter(function(p){return p.name;}));
    }catch(e){setTeams([]);}
    setLoading(false);
  }
  async function loadTeams(){
    setLoading(true);
    try{
      if(sport.id==='nba'){const res=await fetch('https://v2.nba.api-sports.io/teams?league=standard',{headers:H_NBA});const data=await res.json();setTeams((data.response||[]).filter(function(t){return t.nbaFranchise===true;}).map(function(t){return{name:t.name,logo:t.logo};}).sort(function(a,b){return a.name.localeCompare(b.name);}));}
      else{const list=TEAMS_HARDCODED[sport.id]||[];setTeams(list.map(function(n){return{name:n,logo:null};}));}
    }catch(e){const list=TEAMS_HARDCODED[sport.id]||[];setTeams(list.map(function(n){return{name:n,logo:null};}));}
    setLoading(false);
  }

  if(showLeaguePicker&&sport.id==='soccer'){return(<SoccerLeaguePicker onSelectLeague={function(l){if(onLeagueSelected)onLeagueSelected(l);setSelectedLeague(l);setShowLeaguePicker(false);}} onClose={onClose}/>);}
  if(showTourPicker&&isTennis){
    return(<Modal visible animationType="slide" transparent><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Choose circuit</Text>{TENNIS_TOURS.map(function(tour){return(<TouchableOpacity key={tour.id} style={styles.teamOption} onPress={()=>{setSelectedTour(tour);setShowTourPicker(false);}}><Text style={styles.teamOptionText}>{tour.label}</Text></TouchableOpacity>);})}<TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity></View></View></Modal>);
  }

  const filtered=teams.filter(function(tm){return tm.name.toLowerCase().includes(search.toLowerCase());});

  return(
    <Modal visible animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {selectedLeague&&sport.id==='soccer'&&(<TouchableOpacity onPress={()=>{setShowLeaguePicker(true);setTeams([]);setLoading(true);setLoaded(false);}} style={styles.leagueBadge}><Text style={styles.leagueBadgeText}>{selectedLeague.label} ▼ change</Text></TouchableOpacity>)}
          {selectedTour&&isTennis&&(<TouchableOpacity onPress={()=>{setShowTourPicker(true);setTeams([]);setLoading(true);setLoaded(false);}} style={styles.leagueBadge}><Text style={styles.leagueBadgeText}>{selectedTour.label} ▼ change</Text></TouchableOpacity>)}
          {loading?(<View style={{padding:30,alignItems:'center',gap:10}}><ActivityIndicator color="#FF6B2B" size="large"/><Text style={{color:'#ffffff66',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1}}>LOADING...</Text></View>):(
            <ScrollView style={{maxHeight:380}} keyboardShouldPersistTaps="always">
              {isManualTop&&(
                <View style={styles.manualTopSection}>
                  <Text style={styles.manualTopLabel}>✏️ SAISIE MANUELLE</Text>
                  <View style={styles.manualTopRow}>
                    <TextInput value={customName} onChangeText={setCustomName} style={[styles.searchInput,{flex:1,marginBottom:0}]} placeholder={isF1?'Ex: Max Verstappen...':isGolf?'Ex: Scottie Scheffler...':isMMA?'Ex: Jon Jones...':'Ex: Novak Djokovic...'} placeholderTextColor="#ffffff44" autoCorrect={false} autoCapitalize="words"/>
                    <TouchableOpacity style={[styles.manualConfirmBtn,!customName.trim()&&{opacity:0.4}]} onPress={()=>{if(customName.trim()){onSelect(customName.trim());onClose();}}} disabled={!customName.trim()}>
                      <Text style={styles.manualConfirmText}>✅</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dividerRow}><View style={styles.dividerLine}/><Text style={styles.dividerText}>ou choisir dans la liste</Text><View style={styles.dividerLine}/></View>
                </View>
              )}
              {!isBoxing&&(<TextInput value={search} onChangeText={setSearch} style={[styles.searchInput,{marginBottom:8}]} placeholder="Search..." placeholderTextColor="#ffffff44" autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing"/>)}
              {!isBoxing&&filtered.map(function(team,i){return(
                <TouchableOpacity key={i} style={styles.teamOption} onPress={()=>{onSelect(team.name);onClose();}}>
                  {team.logo?<Image source={{uri:team.logo}} style={styles.teamOptionLogo} onError={function(){}}/>:<View style={styles.teamOptionLogoPlaceholder}><Text style={{fontSize:16}}>{sport.icon}</Text></View>}
                  <View style={{flex:1}}><Text style={styles.teamOptionText}>{team.name}</Text>{team.rank?<Text style={{color:'#ffffff44',fontSize:10}}>#{team.rank}</Text>:null}</View>
                </TouchableOpacity>
              );})}
              {!isManualTop&&!showCustom&&(<TouchableOpacity style={styles.addCustomBtn} onPress={()=>setShowCustom(true)}><Text style={styles.addCustomBtnText}>✏️ Enter manually</Text></TouchableOpacity>)}
              {!isManualTop&&showCustom&&(
                <View style={styles.customForm}>
                  <TextInput value={customName} onChangeText={setCustomName} style={styles.searchInput} placeholder="Ex: AS Saint-Étienne, Afrique du Sud..." placeholderTextColor="#ffffff44" autoCorrect={false} autoCapitalize="words"/>
                  <TouchableOpacity style={[styles.addCustomBtn,{backgroundColor:'#FF6B2B22',borderColor:'#FF6B2B44'}]} onPress={()=>{if(customName.trim()){onSelect(customName.trim());onClose();}}}>
                    <Text style={styles.addCustomBtnText}>✅ Confirmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>setShowCustom(false)} style={{alignItems:'center',marginTop:8}}>
                    <Text style={{color:'#ffffff44',fontSize:12}}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>{t('cancel')}</Text></TouchableOpacity>
        </View></View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function parseJSONRobust(text){
  let clean=text.replace(/```json|```/g,'').trim();
  try{return JSON.parse(clean);}catch(e){}
  const s=clean.indexOf('{'),e=clean.lastIndexOf('}');
  if(s>=0&&e>s){try{return JSON.parse(clean.slice(s,e+1));}catch(e){}}
  throw new Error('Impossible de parser la réponse IA. Réessaie.');
}

async function callAnthropic(prompt){
  const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:H_ANTHROPIC,body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:1500,messages:[{role:'user',content:prompt}],tools:[{type:'web_search_20250305',name:'web_search'}]})});
  const data=await response.json();
  if(data.error)throw new Error(data.error.message);
  return(data.content||[]).map(function(c){return c.text||'';}).join('');
}

async function fetchNBAData(team1,team2){
  try{
    const[r1,r2]=await Promise.all([fetch('https://v2.nba.api-sports.io/teams?search='+encodeURIComponent(team1),{headers:H_NBA}),fetch('https://v2.nba.api-sports.io/teams?search='+encodeURIComponent(team2),{headers:H_NBA})]);
    const[d1,d2]=await Promise.all([r1.json(),r2.json()]);
    const t1=(d1.response||[])[0];const t2=(d2.response||[])[0];
    let ctx='';
    if(t1){const[g1,i1]=await Promise.all([fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&team='+t1.id+'&last=5',{headers:H_NBA}),fetch('https://v2.nba.api-sports.io/injuries?league=standard&season=2025&team='+t1.id,{headers:H_NBA})]);const[gd1,id1]=await Promise.all([g1.json(),i1.json()]);ctx+=team1+' last matches:\n';(gd1.response||[]).forEach(function(g){const h=g.teams.home.id===t1.id;const my=h?g.scores.home.points:g.scores.visitors.points;const opp=h?g.scores.visitors.points:g.scores.home.points;const on=h?g.teams.visitors.name:g.teams.home.name;ctx+=((my||0)>(opp||0)?'W':'L')+' '+(my||0)+'-'+(opp||0)+' vs '+on+'\n';});const inj=(id1.response||[]).slice(0,3).map(function(i){return i.player?.name||'';}).join(', ');if(inj)ctx+=team1+' injuries: '+inj+'\n';}
    if(t2){const[g2,i2]=await Promise.all([fetch('https://v2.nba.api-sports.io/games?league=standard&season=2025&team='+t2.id+'&last=5',{headers:H_NBA}),fetch('https://v2.nba.api-sports.io/injuries?league=standard&season=2025&team='+t2.id,{headers:H_NBA})]);const[gd2,id2]=await Promise.all([g2.json(),i2.json()]);ctx+='\n'+team2+' last matches:\n';(gd2.response||[]).forEach(function(g){const h=g.teams.home.id===t2.id;const my=h?g.scores.home.points:g.scores.visitors.points;const opp=h?g.scores.visitors.points:g.scores.home.points;const on=h?g.teams.visitors.name:g.teams.home.name;ctx+=((my||0)>(opp||0)?'W':'L')+' '+(my||0)+'-'+(opp||0)+' vs '+on+'\n';});const inj=(id2.response||[]).slice(0,3).map(function(i){return i.player?.name||'';}).join(', ');if(inj)ctx+=team2+' injuries: '+inj+'\n';}
    return ctx;
  }catch(e){return '';}
}

async function fetchSoccerData(team1,team2){
  try{
    const[r1,r2]=await Promise.all([fetch('https://v3.football.api-sports.io/teams?search='+encodeURIComponent(team1),{headers:H_FOOT}),fetch('https://v3.football.api-sports.io/teams?search='+encodeURIComponent(team2),{headers:H_FOOT})]);
    const[d1,d2]=await Promise.all([r1.json(),r2.json()]);
    const t1=(d1.response||[])[0]?.team;const t2=(d2.response||[])[0]?.team;
    let ctx='';
    if(t1){const[g1,i1]=await Promise.all([fetch('https://v3.football.api-sports.io/fixtures?team='+t1.id+'&last=5',{headers:H_FOOT}),fetch('https://v3.football.api-sports.io/injuries?team='+t1.id+'&season=2025',{headers:H_FOOT})]);const[gd1,id1]=await Promise.all([g1.json(),i1.json()]);ctx+=team1+' last matches:\n';(gd1.response||[]).forEach(function(f){const h=f.teams.home.id===t1.id;const my=h?f.goals.home:f.goals.away;const opp=h?f.goals.away:f.goals.home;const on=h?f.teams.away.name:f.teams.home.name;const r=(my||0)>(opp||0)?'W':(my||0)===(opp||0)?'D':'L';ctx+=r+' '+(my||0)+'-'+(opp||0)+' vs '+on+'\n';});const inj=(id1.response||[]).slice(0,3).map(function(i){return i.player?.name||'';}).join(', ');if(inj)ctx+=team1+' injuries: '+inj+'\n';}
    if(t2){const[g2,i2]=await Promise.all([fetch('https://v3.football.api-sports.io/fixtures?team='+t2.id+'&last=5',{headers:H_FOOT}),fetch('https://v3.football.api-sports.io/injuries?team='+t2.id+'&season=2025',{headers:H_FOOT})]);const[gd2,id2]=await Promise.all([g2.json(),i2.json()]);ctx+='\n'+team2+' last matches:\n';(gd2.response||[]).forEach(function(f){const h=f.teams.home.id===t2.id;const my=h?f.goals.home:f.goals.away;const opp=h?f.goals.away:f.goals.home;const on=h?f.teams.away.name:f.teams.home.name;const r=(my||0)>(opp||0)?'W':(my||0)===(opp||0)?'D':'L';ctx+=r+' '+(my||0)+'-'+(opp||0)+' vs '+on+'\n';});const inj=(id2.response||[]).slice(0,3).map(function(i){return i.player?.name||'';}).join(', ');if(inj)ctx+=team2+' injuries: '+inj+'\n';}
    return ctx;
  }catch(e){return '';}
}

export async function fetchSportData(sport,team1,team2){
  if(sport.id==='nba')return fetchNBAData(team1,team2);
  if(sport.id==='soccer')return fetchSoccerData(team1,team2);
  return '';
}

export function buildPrompt(sport,team1,team2,dateLabel,surfaceInfo,context,langName){
  const today=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
  const isSolo=SOLO_SPORTS.indexOf(sport.id)>=0;
  if(isSolo){
    const sc=sport.id==='f1'?'\nF1: Search current standings, recent races, qualifying, car performance.\n':'\nGOLF: Search world ranking, recent tournaments, current form.\n';
    return 'You are Kazmo, elite sports AI. Today is '+today+'.\n\nPREDICTION: Will '+team1+' win the next '+sport.label+' race/tournament?\nDATE: '+dateLabel+'\n'+sc+'Search for '+team1+" current form, recent results, winning probability.\n\nReply ONLY valid JSON:\n{\"equipe_favoris\":\""+team1+"\",\"pourcentage\":65,\"rapide\":\"2-3 sentences\",\"detaille\":\"5-8 sentences\",\"expert\":\"10-15 sentences\"}\n\nLanguage: "+langName;
  }
  let sc='';
  if(sport.id==='mma')sc='\nMMA: Search recent fights, record W/L, style, injuries, weight class.\n';
  else if(sport.id==='boxing')sc='\nBOXING: Search recent fights, record W/L, weight class, injuries.\n';
  else if(sport.id==='tennis')sc='\nTENNIS: Search recent results, head-to-head, ranking, form on this surface.\n';
  return 'You are Kazmo, elite sports AI. Today is '+today+'.\n\nSearch the web for CURRENT data:\n- Injuries/suspensions for BOTH\n- Recent form (last 5-10)\n- Head-to-head history\n- Starting lineup\n\nMATCH: '+team1+' vs '+team2+' ('+sport.label+')\nDATE: '+dateLabel+'\n'+surfaceInfo+sc+(context?'API DATA:\n'+context+'\n':'')+'\nIMPORTANT: Keep team names exactly as provided, do not translate them.\nReply ONLY valid JSON:\n{"equipe_favoris":"name","pourcentage":65,"rapide":"2-3 sentences","detaille":"5-8 sentences with injuries/form","expert":"10-15 sentences"}\n\nLanguage: '+langName;
}

export default function KazmoPredictScreen({ onBack }) {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState(null);
  const [analysisTab, setAnalysisTab] = useState('rapide');
  const [loading, setLoading] = useState(false);
  const [statusMsgIndex, setStatusMsgIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [simpleSport, setSimpleSport] = useState(null);
  const [simpleTeam1, setSimpleTeam1] = useState('');
  const [simpleTeam2, setSimpleTeam2] = useState('');
  const [simpleDate, setSimpleDate] = useState(new Date().toISOString().slice(0,10));
  const [simpleSurface, setSimpleSurface] = useState(null);
  const [showPicker1, setShowPicker1] = useState(false);
  const [showPicker2, setShowPicker2] = useState(false);
  const [soccerLeague, setSoccerLeague] = useState(null);
  const [parlayBets, setParlayBets] = useState([{sport:null,team1:'',team2:'',date:new Date().toISOString().slice(0,10),surface:null,league:null,showP1:false,showP2:false}]);
  const [pronoSport, setPronoSport] = useState(null);
  const [pronoQuestion, setPronoQuestion] = useState(null);
  const [pronoCustom, setPronoCustom] = useState('');
  const langNames = {fr:'français',en:'English',es:'español',pt:'português',de:'Deutsch',it:'italiano',ar:'العربية',ru:'русский'};
  const statusMessages = STATUS_MESSAGES[language]||STATUS_MESSAGES['fr'];

  React.useEffect(function(){
    if(!loading){setStatusMsgIndex(0);return;}
    const iv=setInterval(function(){setStatusMsgIndex(function(p){return(p+1)%statusMessages.length;});},4000);
    return()=>clearInterval(iv);
  },[loading,language]);

  const PRONOSTIC_QUESTIONS = [
    {id:'champion',label:'🏆 Champion',desc:'Qui va gagner le titre ?'},
    {id:'mvp',label:'⭐ MVP',desc:'Meilleur joueur de la saison'},
    {id:'topscorer',label:'⚽ Top scoreur',desc:'Meilleur buteur/scoreur'},
    {id:'relegation',label:'📉 Relegation',desc:'Équipes en danger'},
    {id:'custom',label:'✏ Question libre',desc:'Pose ta propre question'},
  ];

  function formatDate(d){if(!d)return t('predictNoDate');const now=new Date().toISOString().slice(0,10);const tom=new Date(Date.now()+86400000).toISOString().slice(0,10);if(d===now)return t('today');if(d===tom)return t('next');return new Date(d).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});}
  function addParlayBet(){if(parlayBets.length>=5)return;setParlayBets(function(p){return[...p,{sport:null,team1:'',team2:'',date:new Date().toISOString().slice(0,10),surface:null,league:null,showP1:false,showP2:false}];});}
  function removeParlayBet(i){setParlayBets(function(p){return p.filter(function(_,x){return x!==i;});});}
  function updateParlayBet(i,k,v){setParlayBets(function(p){return p.map(function(b,x){if(x!==i)return b;return Object.assign({},b,{[k]:v});});});}

  async function analyzeSimple(){
    const isSolo=simpleSport&&SOLO_SPORTS.indexOf(simpleSport.id)>=0;
    if(!simpleSport||!simpleTeam1)return;
    if(!isSolo&&!simpleTeam2)return;
    if(simpleSport.id==='tennis'&&!simpleSurface)return;
    setLoading(true);setResult(null);
    try{
      const ln=langNames[language]||'français';
      const ctx=await fetchSportData(simpleSport,simpleTeam1,simpleTeam2||'');
      const dl=formatDate(simpleDate);
      const si=simpleSport.id==='tennis'?'\nSURFACE: '+simpleSurface.label+' — facteur PRIMORDIAL\n':'';
      const prompt=buildPrompt(simpleSport,simpleTeam1,simpleTeam2||'',dl,si,ctx,ln);
      const text=await callAnthropic(prompt);
      const parsed=parseJSONRobust(text);
      setResult({type:'simple',sport:simpleSport,team1:simpleTeam1,team2:simpleTeam2,date:simpleDate,surface:simpleSurface,...parsed});
    }catch(e){setResult({error:e.message});}
    finally{setLoading(false);}
  }

  async function analyzeParlay(){
    const valid=parlayBets.filter(function(b){const s=b.sport&&SOLO_SPORTS.indexOf(b.sport.id)>=0;return b.sport&&b.team1&&(s||b.team2)&&(b.sport.id!=='tennis'||b.surface);});
    if(valid.length<2)return;
    setLoading(true);setResult(null);
    try{
      const ln=langNames[language]||'français';
      let bt='';
      for(let i=0;i<valid.length;i++){const b=valid[i];const ctx=await fetchSportData(b.sport,b.team1,b.team2||'');const s=SOLO_SPORTS.indexOf(b.sport.id)>=0;bt+='BET '+(i+1)+': '+(s?b.team1+' ('+b.sport.label+' — will win?)':b.team1+' vs '+b.team2+' ('+b.sport.label+')')+' — '+formatDate(b.date)+'\n';if(b.sport.id==='tennis'&&b.surface)bt+='SURFACE: '+b.surface.label+'\n';if(ctx)bt+=ctx+'\n';}
      const today=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
      const prompt='You are Kazmo. Today is '+today+'.\nSearch injuries and form for each.\n\nPARLAY:\n'+bt+'\nReply ONLY valid JSON:\n{"pourcentage_global":23,"selections":[{"match":"T1 vs T2","favori":"T1","pourcentage":65,"date":"saturday"}],"rapide":"2-3 sentences","detaille":"details","expert":"full analysis"}\n\nLanguage: '+ln;
      const text=await callAnthropic(prompt);
      const parsed=parseJSONRobust(text);
      setResult({type:'parlay',bets:valid,...parsed});
    }catch(e){setResult({error:e.message});}
    finally{setLoading(false);}
  }

  async function analyzeProno(){
    if(!pronoSport||!pronoQuestion)return;
    if(pronoQuestion.id==='custom'&&!pronoCustom.trim())return;
    setLoading(true);setResult(null);
    try{
      const ln=langNames[language]||'français';
      const q=pronoQuestion.id==='custom'?pronoCustom.trim():pronoQuestion.id==='champion'?'Who will win the title in '+pronoSport.label+'?':pronoQuestion.id==='mvp'?'Who will be MVP in '+pronoSport.label+'?':pronoQuestion.id==='topscorer'?'Who will be top scorer in '+pronoSport.label+'?':'Which teams risk relegation in '+pronoSport.label+'?';
      const today=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
      const prompt='You are Kazmo, expert sports AI. Today is '+today+'.\nSearch current standings and form.\n\nPREDICTION — '+pronoSport.label+'\nQUESTION: '+q+'\n\nReply ONLY valid JSON:\n{"favori":"answer","pourcentage":70,"rapide":"2-3 sentences","detaille":"5-8 sentences","expert":"10-15 sentences"}\n\nLanguage: '+ln;
      const text=await callAnthropic(prompt);
      const parsed=parseJSONRobust(text);
      setResult({type:'prono',sport:pronoSport,question:q,...parsed});
    }catch(e){setResult({error:e.message});}
    finally{setLoading(false);}
  }

  function reset(){setMode(null);setResult(null);setSimpleSport(null);setSimpleTeam1('');setSimpleTeam2('');setSimpleDate(new Date().toISOString().slice(0,10));setSimpleSurface(null);setSoccerLeague(null);setParlayBets([{sport:null,team1:'',team2:'',date:new Date().toISOString().slice(0,10),surface:null,league:null,showP1:false,showP2:false}]);setPronoSport(null);setPronoQuestion(null);setPronoCustom('');setAnalysisTab('rapide');}

  if(result){
    if(result.error){return(<SafeAreaView style={styles.container}><View style={styles.header}><TouchableOpacity onPress={reset}><Text style={styles.backBtnText}>←</Text></TouchableOpacity><GradientText text={t('kazmoPredict')} fontSize={22} letterSpacing={1}/></View><View style={styles.center}><Text style={{fontSize:40,marginBottom:12}}>😕</Text><Text style={styles.errorText}>{result.error}</Text><TouchableOpacity onPress={reset} style={styles.resetBtn}><Text style={styles.resetBtnText}>↻ Réessayer</Text></TouchableOpacity></View></SafeAreaView>);}
    const isParlay=result.type==='parlay',isProno=result.type==='prono';
    const pct=result.pourcentage||result.pourcentage_global||0;
    const color=pct>=65?'#4CAF50':pct>=50?'#FFD700':'#E53935';
    return(
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}><TouchableOpacity onPress={reset}><Text style={styles.backBtnText}>←</Text></TouchableOpacity><GradientText text={t('kazmoPredict')} fontSize={22} letterSpacing={1}/></View>
          <LinearGradient colors={['#16162a','#1a1a2e']} style={styles.resultCard}>
            {isProno?(<View style={styles.resultHeader}><Text style={styles.resultTitle}>{result.sport?.icon} {result.sport?.label} · PRONOSTIC</Text><Text style={styles.resultQuestion}>{result.question}</Text><View style={styles.favoriBox}><Text style={styles.favoriLabel}>KAZMO PRÉDIT</Text><Text style={[styles.favoriTeam,{color}]}>{result.favori}</Text></View></View>)
            :isParlay?(<View style={styles.resultHeader}><Text style={styles.resultTitle}>COMBINÉ · {result.bets?.length} MATCHS</Text><View style={styles.resultSelections}>{(result.selections||[]).map(function(s,i){return(<View key={i} style={styles.selectionRow}><View style={{flex:1}}><Text style={styles.selectionMatch}>{s.match}</Text>{s.date?<Text style={styles.selectionDate}>{s.date}</Text>:null}</View><Text style={[styles.selectionFavori,{color:'#FFD700'}]}>{s.favori}</Text><Text style={[styles.selectionPct,{color}]}>{s.pourcentage}%</Text></View>);})}</View></View>)
            :(<View style={styles.resultHeader}><Text style={styles.resultTitle}>{result.sport?.icon} {result.sport?.label}</Text>{result.surface&&<Text style={styles.surfaceBadge}>{result.surface.icon} {result.surface.label}</Text>}{result.date?<Text style={styles.resultDate}>📅 {formatDate(result.date)}</Text>:null}<View style={styles.resultTeams}><Text style={styles.resultTeam}>{result.team1}</Text>{result.team2?<Text style={styles.resultVs}>VS</Text>:null}{result.team2?<Text style={styles.resultTeam}>{result.team2}</Text>:null}</View>{result.equipe_favoris?<View style={styles.favoriBox}><Text style={styles.favoriLabel}>KAZMO PRÉDIT</Text><Text style={[styles.favoriTeam,{color}]}>{result.equipe_favoris}</Text></View>:null}</View>)}
            <View style={styles.pctContainer}><Text style={[styles.pctValue,{color}]}>{pct}%</Text><Text style={styles.pctLabel}>CONFIANCE</Text><View style={styles.pctBar}><View style={[styles.pctFill,{width:pct+'%',backgroundColor:color}]}/></View></View>
          </LinearGradient>
          <View style={styles.analysisTabs}>{[{id:'rapide',label:'⚡ Rapide'},{id:'detaille',label:'📊 Détaillé'},{id:'expert',label:'🎓 Expert'}].map(function(tb){return(<TouchableOpacity key={tb.id} style={[styles.analysisTab,analysisTab===tb.id&&styles.analysisTabActive]} onPress={()=>setAnalysisTab(tb.id)}><Text style={[styles.analysisTabText,analysisTab===tb.id&&{color:'#FF6B2B'}]}>{tb.label}</Text></TouchableOpacity>);})}</View>
          <View style={styles.analysisContent}><Text style={styles.analysisText}>{analysisTab==='rapide'?result.rapide:analysisTab==='detaille'?result.detaille:result.expert}</Text></View>
          <TouchableOpacity onPress={reset} style={styles.newAnalysisBtn}><LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.newAnalysisBtnGradient}><Text style={styles.newAnalysisBtnText}>+ NOUVELLE ANALYSE</Text></LinearGradient></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if(loading){return(
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.loadingAvatar}>
          <Text style={styles.loadingAvatarText}>K</Text>
        </LinearGradient>
        <Text style={styles.loadingTitle}>KAZMO ANALYSIS</Text>
        <Text style={{color:'#ffffff55',fontSize:12,letterSpacing:2,fontFamily:'BebasNeue',marginTop:4,marginBottom:24}}>AI SPORTS INTELLIGENCE</Text>
        <View style={{backgroundColor:'#16162a',borderRadius:16,padding:20,width:'85%',alignItems:'center',borderWidth:1,borderColor:'#FF6B2B33'}}>
          <Text style={{fontSize:28,marginBottom:8}}>{['🔍','📊','🧬','🌐','🎯','🧠'][statusMsgIndex%6]}</Text>
          <Text style={[styles.loadingStatus,{fontSize:14,minHeight:40,textAlign:'center'}]}>{statusMessages[statusMsgIndex]}</Text>
        </View>
        <ActivityIndicator color="#FF6B2B" size="large" style={{marginTop:24}}/>
        <View style={{backgroundColor:'#FFD60011',borderRadius:10,paddingHorizontal:16,paddingVertical:8,marginTop:16,borderWidth:1,borderColor:'#FFD60033'}}>
          <Text style={{color:'#FFD700',fontFamily:'BebasNeue',fontSize:13,letterSpacing:1,textAlign:'center'}}>{(TIMING_MESSAGES[language]||TIMING_MESSAGES['en'])[0]}</Text>
          <Text style={{color:'#ffffff44',fontSize:10,textAlign:'center',marginTop:4}}>{(TIMING_MESSAGES[language]||TIMING_MESSAGES['en'])[1]}</Text>
        </View>
      </View>
    </SafeAreaView>
  );}

  if(!mode){return(<SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.scroll}><View style={styles.header}><TouchableOpacity onPress={onBack}><Text style={styles.backBtnText}>←</Text></TouchableOpacity><GradientText text={t('kazmoPredict')} fontSize={22} letterSpacing={1}/></View><Text style={styles.modeSubtitle}>{t('kazmoPredictSub')}</Text><Text style={styles.modeTitle}>{t('chooseType').toUpperCase()}</Text><TouchableOpacity style={styles.modeCard} activeOpacity={0.85} onPress={()=>setMode('simple')}><LinearGradient colors={['#1D428A22','#1D428A44']} style={styles.modeCardGradient}><Text style={styles.modeIcon}>🎯</Text><View style={{flex:1}}><Text style={styles.modeLabel}>ANALYSE MATCH</Text><Text style={styles.modeDesc}>1 vs 1 · Analyse complète</Text></View><Text style={styles.modeArrow}>›</Text></LinearGradient></TouchableOpacity><TouchableOpacity style={styles.modeCard} activeOpacity={0.85} onPress={()=>setMode('parlay')}><LinearGradient colors={['#9C27B022','#9C27B044']} style={styles.modeCardGradient}><Text style={styles.modeIcon}>🎰</Text><View style={{flex:1}}><Text style={styles.modeLabel}>COMBINÉ</Text><Text style={styles.modeDesc}>2-5 matchs · Multi-analyse</Text></View><Text style={styles.modeArrow}>›</Text></LinearGradient></TouchableOpacity><TouchableOpacity style={styles.modeCard} activeOpacity={0.85} onPress={()=>setMode('prono')}><LinearGradient colors={['#FF6B2B22','#FFD60022']} style={styles.modeCardGradient}><Text style={styles.modeIcon}>🔭</Text><View style={{flex:1}}><Text style={styles.modeLabel}>PRONOSTIC SAISON</Text><Text style={styles.modeDesc}>Champion, MVP · Tendances</Text></View><Text style={styles.modeArrow}>›</Text></LinearGradient></TouchableOpacity></ScrollView></SafeAreaView>);}

  if(mode==='simple'){
    const isSolo=simpleSport?SOLO_SPORTS.indexOf(simpleSport.id)>=0:false;
    const isTennis=simpleSport?.id==='tennis';
    const isInd=simpleSport?INDIVIDUAL_SPORTS.indexOf(simpleSport.id)>=0:false;
    const canAnalyze=simpleSport&&simpleTeam1&&(isSolo||simpleTeam2)&&(!isTennis||simpleSurface);
    const l1=simpleSport?.id==='f1'?'Pilote':isInd?'Joueur 1':t('predictTeam1');
    const l2=simpleSport?.id==='f1'?'Pilote 2':isInd?'Joueur 2':t('predictTeam2');
    return(
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.header}><TouchableOpacity onPress={()=>setMode(null)}><Text style={styles.backBtnText}>←</Text></TouchableOpacity><GradientText text="ANALYSE MATCH" fontSize={20} letterSpacing={1}/></View>
          <Text style={styles.fieldLabel}>{t('chooseSport').toUpperCase()}</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16}}>{ALL_SPORTS.map(function(s){return(<TouchableOpacity key={s.id} style={[styles.sportChip,simpleSport?.id===s.id&&{backgroundColor:s.color,borderColor:s.color}]} onPress={()=>{setSimpleSport(s);setSimpleTeam1('');setSimpleTeam2('');setSimpleSurface(null);setSoccerLeague(null);}}><Text style={styles.sportChipIcon}>{s.icon}</Text><Text style={[styles.sportChipLabel,simpleSport?.id===s.id&&{color:'#fff'}]}>{s.label}</Text></TouchableOpacity>);})}</View>
          <Text style={styles.fieldLabel}>{t('predictMatchDate').toUpperCase()}</Text>
          <DatePicker value={simpleDate} onChange={setSimpleDate} t={t}/>
          {simpleSport&&(<>
            {isTennis&&(<><Text style={styles.fieldLabel}>🎾 SURFACE *</Text><View style={{flexDirection:'row',gap:8,marginBottom:16,flexWrap:'wrap'}}>{SURFACES.map(function(s){const a=simpleSurface?.id===s.id;return(<TouchableOpacity key={s.id} style={[styles.surfaceBtn,a&&styles.surfaceBtnActive]} onPress={()=>setSimpleSurface(s)}><Text style={styles.surfaceBtnIcon}>{s.icon}</Text><Text style={[styles.surfaceBtnText,a&&{color:'#fff'}]}>{s.label}</Text></TouchableOpacity>);})}</View></>)}
            {simpleSport.id==='soccer'&&soccerLeague&&(<View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}><View style={styles.leagueBadge}><Text style={styles.leagueBadgeText}>{soccerLeague.label}</Text></View><TouchableOpacity onPress={()=>{setSoccerLeague(null);setSimpleTeam1('');setSimpleTeam2('');}}><Text style={{color:'#E53935',fontSize:11}}>✕ Changer</Text></TouchableOpacity></View>)}
            {isSolo?(<>
              <Text style={styles.fieldLabel}>PILOTE / JOUEUR</Text>
              <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}>
                <TouchableOpacity style={[styles.pickerBtn,{flex:1}]} onPress={()=>setShowPicker1(true)}><Text style={simpleTeam1?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{simpleTeam1||'Choose...'}</Text><Text style={styles.pickerArrow}>▼</Text></TouchableOpacity>
                {simpleTeam1?<TouchableOpacity onPress={()=>setSimpleTeam1('')} style={styles.clearBtn}><Text style={styles.clearBtnText}>✕</Text></TouchableOpacity>:null}
              </View>
              <View style={styles.soloInfo}><Text style={styles.soloInfoText}>ℹ️ {simpleSport.id==='f1'?'Probabilité que ce pilote gagne la prochaine course':'Probabilité que ce joueur gagne le prochain tournoi'}</Text></View>
            </>):(<>
              <Text style={styles.fieldLabel}>{l1.toUpperCase()}</Text>
              <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}>
                <TouchableOpacity style={[styles.pickerBtn,{flex:1}]} onPress={()=>setShowPicker1(true)}><Text style={simpleTeam1?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{simpleTeam1||'Choose...'}</Text><Text style={styles.pickerArrow}>▼</Text></TouchableOpacity>
                {simpleTeam1?<TouchableOpacity onPress={()=>setSimpleTeam1('')} style={styles.clearBtn}><Text style={styles.clearBtnText}>✕</Text></TouchableOpacity>:null}
              </View>
              <Text style={[styles.fieldLabel,{marginTop:12}]}>{l2.toUpperCase()}</Text>
              <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}>
                <TouchableOpacity style={[styles.pickerBtn,{flex:1}]} onPress={()=>setShowPicker2(true)}><Text style={simpleTeam2?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{simpleTeam2||'Choose...'}</Text><Text style={styles.pickerArrow}>▼</Text></TouchableOpacity>
                {simpleTeam2?<TouchableOpacity onPress={()=>setSimpleTeam2('')} style={styles.clearBtn}><Text style={styles.clearBtnText}>✕</Text></TouchableOpacity>:null}
              </View>
            </>)}
            {simpleTeam1&&simpleTeam2&&!isSolo&&(<View style={styles.matchPreview}><Text style={styles.matchPreviewText}>{simpleTeam1}</Text><Text style={styles.matchPreviewVs}>VS</Text><Text style={styles.matchPreviewText}>{simpleTeam2}</Text></View>)}
            {isTennis&&!simpleSurface&&simpleTeam1&&simpleTeam2&&(<View style={styles.surfaceWarning}><Text style={styles.surfaceWarningText}>⚠️ Sélectionne une surface pour continuer</Text></View>)}
            <TouchableOpacity onPress={analyzeSimple} disabled={!canAnalyze} activeOpacity={0.85} style={{marginTop:16}}><LinearGradient colors={canAnalyze?['#FF6B2B','#FFD600']:['#444','#555']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.analyzeBtn}><Text style={styles.analyzeBtnText}>🔮 ANALYSER</Text></LinearGradient></TouchableOpacity>
          </>)}
        </ScrollView>
        {showPicker1&&simpleSport&&(<TeamPickerModal key='picker1' sport={simpleSport} title={isSolo?'Pilote / Joueur':l1} onSelect={function(name,league){setSimpleTeam1(name);if(league)setSoccerLeague(league);setShowPicker1(false);}} onClose={()=>setShowPicker1(false)} t={t} initialLeague={soccerLeague} onLeagueSelected={setSoccerLeague}/>)}
        {showPicker2&&simpleSport&&!isSolo&&(<TeamPickerModal sport={simpleSport} title={l2} onSelect={setSimpleTeam2} onClose={()=>setShowPicker2(false)} t={t} initialLeague={soccerLeague} onLeagueSelected={setSoccerLeague}/>)}
      </SafeAreaView>
    );
  }

  if(mode==='parlay'){
    const validCount=parlayBets.filter(function(b){const s=b.sport&&SOLO_SPORTS.indexOf(b.sport.id)>=0;return b.sport&&b.team1&&(s||b.team2)&&(b.sport.id!=='tennis'||b.surface);}).length;
    return(
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.header}><TouchableOpacity onPress={()=>setMode(null)}><Text style={styles.backBtnText}>←</Text></TouchableOpacity><GradientText text="COMBINÉ" fontSize={20} letterSpacing={1}/></View>
          {parlayBets.map(function(bet,index){
            const isSolo=bet.sport?SOLO_SPORTS.indexOf(bet.sport.id)>=0:false;
            const isInd=bet.sport?INDIVIDUAL_SPORTS.indexOf(bet.sport.id)>=0:false;
            return(<View key={index} style={styles.parlayBetCard}>
              <View style={styles.parlayBetHeader}><Text style={styles.parlayBetTitle}>MATCH {index+1}</Text>{parlayBets.length>1&&(<TouchableOpacity onPress={()=>removeParlayBet(index)}><Text style={styles.removeBtn}>✕ Supprimer</Text></TouchableOpacity>)}</View>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:10}}>{ALL_SPORTS.map(function(s){return(<TouchableOpacity key={s.id} style={[styles.sportChipSmall,bet.sport?.id===s.id&&{backgroundColor:s.color,borderColor:s.color}]} onPress={()=>updateParlayBet(index,'sport',s)}><Text style={styles.sportChipIcon}>{s.icon}</Text><Text style={[styles.sportChipLabelSmall,bet.sport?.id===s.id&&{color:'#fff'}]}>{s.label}</Text></TouchableOpacity>);})}</View>
              <DatePicker value={bet.date} onChange={function(d){updateParlayBet(index,'date',d);}} t={t}/>
              {bet.sport&&(<>
                {bet.sport.id==='tennis'&&(<View style={{flexDirection:'row',gap:6,marginBottom:10,flexWrap:'wrap'}}>{SURFACES.map(function(s){const a=bet.surface?.id===s.id;return(<TouchableOpacity key={s.id} style={[styles.surfaceBtnSmall,a&&styles.surfaceBtnActive]} onPress={()=>updateParlayBet(index,'surface',s)}><Text style={{fontSize:12}}>{s.icon}</Text><Text style={[styles.surfaceBtnTextSmall,a&&{color:'#fff'}]}>{s.label}</Text></TouchableOpacity>);})}</View>)}
                <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}>
                  <TouchableOpacity style={[styles.pickerBtn,{flex:1}]} onPress={()=>updateParlayBet(index,'showP1',true)}><Text style={bet.team1?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{bet.team1||(isSolo?'Pilote/Joueur...':isInd?'Joueur 1...':'Équipe 1...')}</Text><Text style={styles.pickerArrow}>▼</Text></TouchableOpacity>
                  {bet.team1?<TouchableOpacity onPress={()=>updateParlayBet(index,'team1','')} style={styles.clearBtn}><Text style={styles.clearBtnText}>✕</Text></TouchableOpacity>:null}
                </View>
                {!isSolo&&(<View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                  <TouchableOpacity style={[styles.pickerBtn,{flex:1}]} onPress={()=>updateParlayBet(index,'showP2',true)}><Text style={bet.team2?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{bet.team2||(isInd?'Joueur 2...':'Équipe 2...')}</Text><Text style={styles.pickerArrow}>▼</Text></TouchableOpacity>
                  {bet.team2?<TouchableOpacity onPress={()=>updateParlayBet(index,'team2','')} style={styles.clearBtn}><Text style={styles.clearBtnText}>✕</Text></TouchableOpacity>:null}
                </View>)}
              </>)}
              {bet.showP1&&bet.sport&&(<TeamPickerModal key={'parlay-p1-'+index+(bet.league?bet.league.key:'')} sport={bet.sport} title={isSolo?'Pilote/Joueur':isInd?'Joueur 1':'Équipe 1'} onSelect={function(n,league){updateParlayBet(index,'team1',n);if(league)updateParlayBet(index,'league',league);updateParlayBet(index,'showP1',false);}} onClose={()=>updateParlayBet(index,'showP1',false)} t={t} initialLeague={bet.league||null} onLeagueSelected={function(l){updateParlayBet(index,'league',l);}}/>)}
              {bet.showP2&&bet.sport&&!isSolo&&(<TeamPickerModal key={'parlay-p2-'+index+(bet.league?bet.league.key:'')} sport={bet.sport} title={isInd?'Joueur 2':'Équipe 2'} onSelect={function(n,league){updateParlayBet(index,'team2',n);if(league)updateParlayBet(index,'league',league);updateParlayBet(index,'showP2',false);}} onClose={()=>updateParlayBet(index,'showP2',false)} t={t} initialLeague={bet.league||null} onLeagueSelected={function(l){updateParlayBet(index,'league',l);}}/>)}
            </View>);
          })}
          {parlayBets.length<5&&(<TouchableOpacity onPress={addParlayBet} style={styles.addBetBtn}><Text style={styles.addBetBtnText}>+ AJOUTER UN MATCH</Text></TouchableOpacity>)}
          <TouchableOpacity onPress={analyzeParlay} disabled={validCount<2} activeOpacity={0.85} style={{marginTop:8}}><LinearGradient colors={validCount>=2?['#FF6B2B','#FFD600']:['#444','#555']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.analyzeBtn}><Text style={styles.analyzeBtnText}>🔮 ANALYSER ({validCount})</Text></LinearGradient></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if(mode==='prono'){
    const canAnalyze=pronoSport&&pronoQuestion&&(pronoQuestion.id!=='custom'||pronoCustom.trim());
    return(
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.header}><TouchableOpacity onPress={()=>setMode(null)}><Text style={styles.backBtnText}>←</Text></TouchableOpacity><GradientText text="PRONOSTIC SAISON" fontSize={18} letterSpacing={1}/></View>
          <Text style={styles.fieldLabel}>{t('chooseSport').toUpperCase()}</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16}}>{ALL_SPORTS.map(function(s){return(<TouchableOpacity key={s.id} style={[styles.sportChip,pronoSport?.id===s.id&&{backgroundColor:s.color,borderColor:s.color}]} onPress={()=>setPronoSport(s)}><Text style={styles.sportChipIcon}>{s.icon}</Text><Text style={[styles.sportChipLabel,pronoSport?.id===s.id&&{color:'#fff'}]}>{s.label}</Text></TouchableOpacity>);})}</View>
          <Text style={styles.fieldLabel}>TYPE DE QUESTION</Text>
          {PRONOSTIC_QUESTIONS.map(function(q){return(<TouchableOpacity key={q.id} style={[styles.pronoCard,pronoQuestion?.id===q.id&&styles.pronoCardActive]} onPress={()=>setPronoQuestion(q)}><Text style={styles.pronoCardLabel}>{q.label}</Text><Text style={styles.pronoCardDesc}>{q.desc}</Text></TouchableOpacity>);})}
          {pronoQuestion?.id==='custom'&&(<TextInput value={pronoCustom} onChangeText={setPronoCustom} style={styles.customInput} placeholder="Ex: Qui va être champion NBA ?" placeholderTextColor="#ffffff44" multiline/>)}
          <TouchableOpacity onPress={analyzeProno} disabled={!canAnalyze} activeOpacity={0.85} style={{marginTop:16}}><LinearGradient colors={canAnalyze?['#FF6B2B','#FFD600']:['#444','#555']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.analyzeBtn}><Text style={styles.analyzeBtnText}>🔭 ANALYSER</Text></LinearGradient></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#080814'},
  header:{flexDirection:'row',alignItems:'center',gap:12,padding:16,paddingBottom:8},
  backBtnText:{color:'#FF6B2B',fontSize:24,fontWeight:'700'},
  scroll:{padding:16,paddingBottom:40},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:40,gap:12},
  modeSubtitle:{color:'#ffffff66',fontSize:12,textAlign:'center',marginBottom:8},
  modeTitle:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:13,letterSpacing:2,marginBottom:12},
  modeCard:{borderRadius:14,marginBottom:12,overflow:'hidden',borderWidth:1,borderColor:'#ffffff14'},
  modeCardGradient:{flexDirection:'row',alignItems:'center',padding:20,gap:12},
  modeIcon:{fontSize:32},
  modeLabel:{color:'#fff',fontFamily:'BebasNeue',fontSize:18,letterSpacing:1},
  modeDesc:{color:'#ffffff88',fontSize:11,marginTop:2},
  modeArrow:{color:'#ffffff55',fontSize:28},
  fieldLabel:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:11,letterSpacing:2,marginBottom:8},
  dateBtn:{paddingHorizontal:14,paddingVertical:8,borderRadius:10,backgroundColor:'#16162a',borderWidth:1,borderColor:'#ffffff22'},
  dateBtnActive:{backgroundColor:'#FF6B2B',borderColor:'#FF6B2B'},
  dateBtnText:{color:'#ffffff88',fontFamily:'BebasNeue',fontSize:11},
  dateBtnTextActive:{color:'#fff'},
  sportChip:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#16162a',borderRadius:10,paddingHorizontal:12,paddingVertical:8,borderWidth:1,borderColor:'#ffffff22'},
  sportChipSmall:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#16162a',borderRadius:8,paddingHorizontal:10,paddingVertical:6,borderWidth:1,borderColor:'#ffffff22'},
  sportChipIcon:{fontSize:16},
  sportChipLabel:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12},
  sportChipLabelSmall:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:10},
  surfaceBtn:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#16162a',borderRadius:10,paddingHorizontal:14,paddingVertical:10,borderWidth:1,borderColor:'#ffffff22'},
  surfaceBtnActive:{backgroundColor:'#c85a19',borderColor:'#c85a19'},
  surfaceBtnIcon:{fontSize:16},
  surfaceBtnText:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12},
  surfaceBtnSmall:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#16162a',borderRadius:8,paddingHorizontal:10,paddingVertical:6,borderWidth:1,borderColor:'#ffffff22'},
  surfaceBtnTextSmall:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:10},
  surfaceWarning:{backgroundColor:'#FFD70022',borderRadius:10,padding:10,marginTop:8,borderWidth:1,borderColor:'#FFD70044'},
  surfaceWarningText:{color:'#FFD700',fontSize:11,fontFamily:'BebasNeue',letterSpacing:0.5},
  surfaceBadge:{color:'#c85a19',fontFamily:'BebasNeue',fontSize:11,letterSpacing:1,marginBottom:4},
  pickerBtn:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#16162a',borderRadius:10,padding:14,borderWidth:1,borderColor:'#ffffff22'},
  pickerBtnText:{color:'#fff',fontSize:14,flex:1},
  pickerBtnPlaceholder:{color:'#ffffff44',fontSize:14,flex:1},
  pickerArrow:{color:'#ffffff55',fontSize:12},
  clearBtn:{width:36,height:36,borderRadius:18,backgroundColor:'#E5393522',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#E5393544'},
  clearBtnText:{color:'#E53935',fontSize:14,fontWeight:'700'},
  soloInfo:{backgroundColor:'#FF6B2B11',borderRadius:10,padding:12,marginTop:8,borderWidth:1,borderColor:'#FF6B2B33'},
  soloInfoText:{color:'#FF6B2B',fontSize:11,lineHeight:16},
  matchPreview:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,backgroundColor:'#16162a',borderRadius:12,padding:16,marginTop:12,borderWidth:1,borderColor:'#FF6B2B33'},
  matchPreviewText:{color:'#fff',fontFamily:'BebasNeue',fontSize:16,textAlign:'center',flex:1},
  matchPreviewVs:{color:'#FFD700',fontFamily:'BebasNeue',fontSize:20},
  analyzeBtn:{borderRadius:12,padding:16,alignItems:'center'},
  analyzeBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1},
  parlayBetCard:{backgroundColor:'#16162a',borderRadius:14,padding:14,marginBottom:12,borderWidth:1,borderColor:'#ffffff14'},
  parlayBetHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},
  parlayBetTitle:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1},
  removeBtn:{color:'#E53935',fontSize:11},
  addBetBtn:{backgroundColor:'#ffffff0a',borderRadius:12,padding:14,alignItems:'center',borderWidth:1,borderColor:'#ffffff22',marginBottom:8},
  addBetBtnText:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1},
  pronoCard:{backgroundColor:'#16162a',borderRadius:12,padding:14,marginBottom:8,borderWidth:1,borderColor:'#ffffff14'},
  pronoCardActive:{borderColor:'#FF6B2B',backgroundColor:'#FF6B2B11'},
  pronoCardLabel:{color:'#fff',fontFamily:'BebasNeue',fontSize:14,letterSpacing:0.5},
  pronoCardDesc:{color:'#ffffff55',fontSize:10,marginTop:3},
  customInput:{backgroundColor:'#16162a',borderRadius:10,padding:14,color:'#fff',fontSize:13,borderWidth:1,borderColor:'#FF6B2B44',marginTop:8,minHeight:80},
  resultCard:{borderRadius:14,padding:20,marginBottom:16,borderWidth:1,borderColor:'#FF6B2B33'},
  resultHeader:{marginBottom:16},
  resultTitle:{color:'#ffffff88',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2,marginBottom:4},
  resultQuestion:{color:'#FFD700',fontSize:13,fontWeight:'600',marginBottom:10},
  resultDate:{color:'#FFD700',fontSize:11,fontFamily:'BebasNeue',marginBottom:8},
  resultTeams:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginBottom:12},
  resultTeam:{color:'#fff',fontFamily:'BebasNeue',fontSize:18,flex:1,textAlign:'center'},
  resultVs:{color:'#FFD700',fontFamily:'BebasNeue',fontSize:20},
  favoriBox:{backgroundColor:'#ffffff0a',borderRadius:10,padding:10,alignItems:'center'},
  favoriLabel:{color:'#ffffff55',fontSize:9,fontFamily:'BebasNeue',letterSpacing:1},
  favoriTeam:{fontFamily:'BebasNeue',fontSize:22,letterSpacing:1,marginTop:2},
  resultSelections:{gap:8},
  selectionRow:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#ffffff0a',borderRadius:8,padding:8},
  selectionMatch:{color:'#fff',fontSize:11},
  selectionDate:{color:'#FFD700',fontSize:9,marginTop:2},
  selectionFavori:{fontFamily:'BebasNeue',fontSize:12},
  selectionPct:{fontFamily:'BebasNeue',fontSize:14},
  pctContainer:{alignItems:'center'},
  pctValue:{fontFamily:'BebasNeue',fontSize:64,lineHeight:70},
  pctLabel:{color:'#ffffff44',fontFamily:'BebasNeue',fontSize:10,letterSpacing:2,marginBottom:8},
  pctBar:{width:'100%',height:6,backgroundColor:'#ffffff11',borderRadius:3,overflow:'hidden'},
  pctFill:{height:6,borderRadius:3},
  analysisTabs:{flexDirection:'row',backgroundColor:'#16162a',borderRadius:10,padding:4,gap:4,marginBottom:12},
  analysisTab:{flex:1,padding:8,borderRadius:8,alignItems:'center'},
  analysisTabActive:{backgroundColor:'#FF6B2B11'},
  analysisTabText:{color:'#ffffff55',fontFamily:'BebasNeue',fontSize:11},
  analysisContent:{backgroundColor:'#16162a',borderRadius:14,padding:16,marginBottom:16,borderWidth:1,borderColor:'#ffffff14'},
  analysisText:{color:'#ffffffcc',fontSize:13,lineHeight:22},
  newAnalysisBtn:{marginBottom:8},
  newAnalysisBtnGradient:{borderRadius:12,padding:16,alignItems:'center'},
  newAnalysisBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1},
  loadingAvatar:{width:80,height:80,borderRadius:40,alignItems:'center',justifyContent:'center',marginBottom:16},
  loadingAvatarText:{color:'#fff',fontFamily:'BebasNeue',fontSize:48,fontWeight:'900'},
  loadingTitle:{color:'#fff',fontFamily:'BebasNeue',fontSize:22,letterSpacing:2},
  loadingStatus:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:13,letterSpacing:1,textAlign:'center',marginTop:8,minHeight:20},
  errorText:{color:'#E53935',fontSize:13,textAlign:'center'},
  resetBtn:{backgroundColor:'#FF6B2B22',borderRadius:10,paddingHorizontal:20,paddingVertical:10,borderWidth:1,borderColor:'#FF6B2B44'},
  resetBtnText:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:14},
  modalOverlay:{flex:1,backgroundColor:'#000000aa',justifyContent:'flex-end'},
  modalContent:{backgroundColor:'#16162a',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,maxHeight:'90%'},
  modalTitle:{color:'#fff',fontFamily:'BebasNeue',fontSize:18,letterSpacing:2,textAlign:'center',marginBottom:12},
  searchInput:{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,color:'#fff',fontSize:13,borderWidth:1,borderColor:'#ffffff22',marginBottom:12},
  teamOption:{flexDirection:'row',alignItems:'center',gap:12,padding:12,borderBottomWidth:1,borderBottomColor:'#ffffff0a'},
  teamOptionLogo:{width:32,height:32,resizeMode:'contain'},
  teamOptionLogoPlaceholder:{width:32,height:32,borderRadius:16,backgroundColor:'#ffffff11',alignItems:'center',justifyContent:'center'},
  teamOptionText:{color:'#fff',fontSize:13,flex:1},
  cancelBtn:{backgroundColor:'#ffffff0a',borderRadius:12,padding:14,alignItems:'center',marginTop:8},
  cancelBtnText:{color:'#ffffff66',fontFamily:'BebasNeue',fontSize:14},
  leagueBadge:{backgroundColor:'#4CAF5022',borderRadius:8,padding:8,marginBottom:10,borderWidth:1,borderColor:'#4CAF5044',alignItems:'center'},
  leagueBadgeText:{color:'#4CAF50',fontFamily:'BebasNeue',fontSize:12,letterSpacing:1},
  addCustomBtn:{margin:8,padding:14,backgroundColor:'#ffffff0a',borderRadius:12,alignItems:'center',borderWidth:1,borderColor:'#ffffff22'},
  addCustomBtnText:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:13,letterSpacing:1},
  customForm:{padding:8},
  manualTopSection:{backgroundColor:'#FF6B2B11',borderRadius:12,padding:12,marginBottom:8,borderWidth:1,borderColor:'#FF6B2B33'},
  manualTopLabel:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:11,letterSpacing:1,marginBottom:8},
  manualTopRow:{flexDirection:'row',alignItems:'center',gap:8},
  manualConfirmBtn:{width:44,height:44,borderRadius:22,backgroundColor:'#FF6B2B22',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#FF6B2B44'},
  manualConfirmText:{fontSize:20},
  dividerRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:10},
  dividerLine:{flex:1,height:1,backgroundColor:'#ffffff22'},
  dividerText:{color:'#ffffff44',fontSize:10},
});
