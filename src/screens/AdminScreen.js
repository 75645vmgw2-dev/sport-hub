import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal, Image, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../api/supabase';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';


const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

const SPORTS_OPTIONS = [
  '🏀 NBA', '🏒 NHL', '⚾ MLB', '🏈 NFL',
  '⚽ Football', '🌍 Coupe du Monde',
  '🎾 Tennis', '🥊 Boxe', '🏃 Athlétisme', '🏊 Natation',
  '🏎 F1', '⛳ Golf', '🤼 MMA', '🏉 Rugby',
  '⭐ Champions League', '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League',
  '🇫🇷 Ligue 1', '🇪🇸 La Liga', '🇩🇪 Bundesliga',
];

const FEATURE_LABELS = {
  nfl_live: '🏈 NFL Live (Septembre 2026)',
  alerts: '🔔 Alertes matchs en temps réel',
  betting: '💰 Paris sportifs intégrés',
  more_leagues: '🌍 Plus de ligues de football',
  player_stats: '📊 Stats avancées joueurs',
  kazmo_ai: '🤖 Kazmo IA encore plus puissant',
};

const LANG_FLAGS = { fr:'🇫🇷', en:'🇬🇧', es:'🇪🇸', pt:'🇧🇷', de:'🇩🇪', it:'🇮🇹', ar:'🇸🇦', ru:'🇷🇺' };

const NOTIF_SPORTS = [
  { id:'NBA', icon:'🏀', label:'NBA' },
  { id:'NHL', icon:'🏒', label:'NHL' },
  { id:'MLB', icon:'⚾', label:'MLB' },
  { id:'NFL', icon:'🏈', label:'NFL' },
  { id:'FOOTBALL', icon:'⚽', label:'Football' },
  { id:'F1', icon:'🏎', label:'F1' },
  { id:'GOLF', icon:'⛳', label:'Golf' },
  { id:'MMA', icon:'🤼', label:'MMA' },
];

const TEAMS_HARDCODED = {
  '🏒 NHL': [
    { name:'Anaheim Ducks', logo:'' },{ name:'Boston Bruins', logo:'' },
    { name:'Calgary Flames', logo:'' },{ name:'Carolina Hurricanes', logo:'' },
    { name:'Chicago Blackhawks', logo:'' },{ name:'Colorado Avalanche', logo:'' },
    { name:'Dallas Stars', logo:'' },{ name:'Detroit Red Wings', logo:'' },
    { name:'Edmonton Oilers', logo:'' },{ name:'Florida Panthers', logo:'' },
    { name:'Los Angeles Kings', logo:'' },{ name:'Minnesota Wild', logo:'' },
    { name:'Montreal Canadiens', logo:'' },{ name:'Nashville Predators', logo:'' },
    { name:'New Jersey Devils', logo:'' },{ name:'New York Islanders', logo:'' },
    { name:'New York Rangers', logo:'' },{ name:'Ottawa Senators', logo:'' },
    { name:'Philadelphia Flyers', logo:'' },{ name:'Pittsburgh Penguins', logo:'' },
    { name:'San Jose Sharks', logo:'' },{ name:'Seattle Kraken', logo:'' },
    { name:'St. Louis Blues', logo:'' },{ name:'Tampa Bay Lightning', logo:'' },
    { name:'Toronto Maple Leafs', logo:'' },{ name:'Vancouver Canucks', logo:'' },
    { name:'Vegas Golden Knights', logo:'' },{ name:'Washington Capitals', logo:'' },
    { name:'Winnipeg Jets', logo:'' },
  ],
  '⚾ MLB': [
    { name:'Arizona Diamondbacks', logo:'' },{ name:'Atlanta Braves', logo:'' },
    { name:'Baltimore Orioles', logo:'' },{ name:'Boston Red Sox', logo:'' },
    { name:'Chicago Cubs', logo:'' },{ name:'Chicago White Sox', logo:'' },
    { name:'Cincinnati Reds', logo:'' },{ name:'Cleveland Guardians', logo:'' },
    { name:'Colorado Rockies', logo:'' },{ name:'Detroit Tigers', logo:'' },
    { name:'Houston Astros', logo:'' },{ name:'Kansas City Royals', logo:'' },
    { name:'Los Angeles Angels', logo:'' },{ name:'Los Angeles Dodgers', logo:'' },
    { name:'Miami Marlins', logo:'' },{ name:'Milwaukee Brewers', logo:'' },
    { name:'Minnesota Twins', logo:'' },{ name:'New York Mets', logo:'' },
    { name:'New York Yankees', logo:'' },{ name:'Oakland Athletics', logo:'' },
    { name:'Philadelphia Phillies', logo:'' },{ name:'Pittsburgh Pirates', logo:'' },
    { name:'San Diego Padres', logo:'' },{ name:'San Francisco Giants', logo:'' },
    { name:'Seattle Mariners', logo:'' },{ name:'St. Louis Cardinals', logo:'' },
    { name:'Tampa Bay Rays', logo:'' },{ name:'Texas Rangers', logo:'' },
    { name:'Toronto Blue Jays', logo:'' },{ name:'Washington Nationals', logo:'' },
  ],
  '🏈 NFL': [
    { name:'Arizona Cardinals', logo:'' },{ name:'Atlanta Falcons', logo:'' },
    { name:'Baltimore Ravens', logo:'' },{ name:'Buffalo Bills', logo:'' },
    { name:'Carolina Panthers', logo:'' },{ name:'Chicago Bears', logo:'' },
    { name:'Cincinnati Bengals', logo:'' },{ name:'Cleveland Browns', logo:'' },
    { name:'Dallas Cowboys', logo:'' },{ name:'Denver Broncos', logo:'' },
    { name:'Detroit Lions', logo:'' },{ name:'Green Bay Packers', logo:'' },
    { name:'Houston Texans', logo:'' },{ name:'Indianapolis Colts', logo:'' },
    { name:'Jacksonville Jaguars', logo:'' },{ name:'Kansas City Chiefs', logo:'' },
    { name:'Las Vegas Raiders', logo:'' },{ name:'Los Angeles Chargers', logo:'' },
    { name:'Los Angeles Rams', logo:'' },{ name:'Miami Dolphins', logo:'' },
    { name:'Minnesota Vikings', logo:'' },{ name:'New England Patriots', logo:'' },
    { name:'New Orleans Saints', logo:'' },{ name:'New York Giants', logo:'' },
    { name:'New York Jets', logo:'' },{ name:'Philadelphia Eagles', logo:'' },
    { name:'Pittsburgh Steelers', logo:'' },{ name:'San Francisco 49ers', logo:'' },
    { name:'Seattle Seahawks', logo:'' },{ name:'Tampa Bay Buccaneers', logo:'' },
    { name:'Tennessee Titans', logo:'' },{ name:'Washington Commanders', logo:'' },
  ],
  '🏎 F1': [
    { name:'Max Verstappen', logo:'' },{ name:'Lewis Hamilton', logo:'' },
    { name:'Charles Leclerc', logo:'' },{ name:'Lando Norris', logo:'' },
    { name:'Oscar Piastri', logo:'' },{ name:'George Russell', logo:'' },
    { name:'Fernando Alonso', logo:'' },{ name:'Red Bull Racing', logo:'' },
    { name:'Ferrari', logo:'' },{ name:'McLaren', logo:'' },
    { name:'Mercedes', logo:'' },{ name:'Aston Martin', logo:'' },
  ],
  '⛳ Golf': [
    { name:'Scottie Scheffler', logo:'' },{ name:'Rory McIlroy', logo:'' },
    { name:'Jon Rahm', logo:'' },{ name:'Viktor Hovland', logo:'' },
    { name:'Xander Schauffele', logo:'' },{ name:'Collin Morikawa', logo:'' },
  ],
  '🤼 MMA': [
    { name:'Jon Jones', logo:'' },{ name:'Islam Makhachev', logo:'' },
    { name:'Leon Edwards', logo:'' },{ name:'Alex Pereira', logo:'' },
    { name:'Conor McGregor', logo:'' },{ name:'Kamaru Usman', logo:'' },
  ],
};

const GMT_HOURS = [];
for (let h = 0; h < 24; h++) {
  GMT_HOURS.push(String(h).padStart(2,'0') + ':00');
  GMT_HOURS.push(String(h).padStart(2,'0') + ':30');
}

const EVENT_ICONS = ['🎾','🥊','🏃','🏊','🏅','🎿','🚴','⛷','🏋','🤸','🏇','🎱','🎯','🏆','⭐'];

function TimePicker({ value, onSelect, onClose, title }) {
  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title} (GMT)</Text>
          <ScrollView style={{ maxHeight:400 }}>
            {GMT_HOURS.map(function(h) {
              const selected = value === h;
              return (
                <TouchableOpacity key={h} style={[styles.sportOption, selected && styles.sportOptionSelected]} onPress={() => { onSelect(h); onClose(); }}>
                  <Text style={[styles.sportOptionText, selected && { color:'#FF6B2B' }]}>{h} GMT</Text>
                  {selected && <Text style={{ color:'#FF6B2B' }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={[styles.cancelBtn,{marginTop:8}]}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CalendarPicker({ field, value, onSelect, onClose }) {
  const [currentDate, setCurrentDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.calOverlay}>
        <View style={styles.calBox}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month-1, 1))}><Text style={styles.calNav}>‹</Text></TouchableOpacity>
            <Text style={styles.calMonth}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month+1, 1))}><Text style={styles.calNav}>›</Text></TouchableOpacity>
          </View>
          <View style={styles.calDayNames}>
            {['Di','Lu','Ma','Me','Je','Ve','Sa'].map(function(d) { return <Text key={d} style={styles.calDayName}>{d}</Text>; })}
          </View>
          <View style={styles.calGrid}>
            {days.map(function(day, i) {
              if (!day) return <View key={'e'+i} style={styles.calDay} />;
              const dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
              const isSelected = value === dateStr;
              return (
                <TouchableOpacity key={i} style={[styles.calDay, isSelected && styles.calDaySelected]} onPress={() => { onSelect(field, dateStr); onClose(); }}>
                  <Text style={[styles.calDayText, isSelected && { color:'#fff' }]}>{String(day)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.calCancel}><Text style={styles.calCancelText}>Annuler</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function TeamPicker({ sport, onSelect, onClose }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customLogo, setCustomLogo] = useState('');

  useEffect(() => { loadTeams(); }, [sport]);

  async function loadTeams() {
    setLoading(true);
    try {
      if (sport === '🏀 NBA') {
        const res = await fetch('https://v2.nba.api-sports.io/teams?league=standard', { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' } });
        const data = await res.json();
        setTeams((data.response || []).filter(function(t) { return t.nbaFranchise === true; }).map(function(t) { return { name: t.name, logo: t.logo }; }).sort(function(a,b) { return a.name.localeCompare(b.name); }));
      } else if (['⚽ Football','🌍 Coupe du Monde','⭐ Champions League','🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League','🇫🇷 Ligue 1','🇪🇸 La Liga','🇩🇪 Bundesliga'].indexOf(sport) >= 0) {
        const leagueMap = { '🌍 Coupe du Monde': { league:1, season:2026 }, '⭐ Champions League': { league:2, season:2025 }, '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League': { league:39, season:2025 }, '🇫🇷 Ligue 1': { league:61, season:2025 }, '🇪🇸 La Liga': { league:140, season:2025 }, '🇩🇪 Bundesliga': { league:78, season:2025 }, '⚽ Football': { league:61, season:2025 } };
        const params = leagueMap[sport] || { league:61, season:2025 };
        const res = await fetch('https://v3.football.api-sports.io/teams?league=' + params.league + '&season=' + params.season, { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' } });
        const data = await res.json();
        setTeams((data.response || []).map(function(t) { return { name: t.team.name, logo: t.team.logo }; }).sort(function(a,b) { return a.name.localeCompare(b.name); }));
      } else {
        setTeams(TEAMS_HARDCODED[sport] || []);
      }
    } catch(e) { setTeams(TEAMS_HARDCODED[sport] || []); }
    finally { setLoading(false); }
  }

  const filtered = teams.filter(function(t) { return t.name.toLowerCase().includes(search.toLowerCase()); });

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.teamPickerContent}>
          <Text style={styles.modalTitle}>Choisir une equipe</Text>
          <TextInput value={search} onChangeText={setSearch} style={styles.searchInput} placeholder="Rechercher..." placeholderTextColor="#ffffff44"/>
          {loading ? <View style={styles.center}><ActivityIndicator color="#FF6B2B"/></View> : (
            <ScrollView style={{ maxHeight:400 }}>
              {filtered.map(function(team, i) {
                return (
                  <TouchableOpacity key={i} style={styles.teamOption} onPress={() => { onSelect(team.name, team.logo || ''); onClose(); }}>
                    {team.logo ? <Image source={{ uri: team.logo }} style={styles.teamOptionLogo} onError={function(){}} /> : <View style={styles.teamOptionLogoPlaceholder}><Text style={{ fontSize:16 }}>🏆</Text></View>}
                    <Text style={styles.teamOptionText}>{team.name}</Text>
                  </TouchableOpacity>
                );
              })}
              {!showCustom ? (
                <TouchableOpacity style={styles.addCustomBtn} onPress={() => setShowCustom(true)}>
                  <Text style={styles.addCustomBtnText}>+ Ajouter une equipe manuellement</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.customForm}>
                  <Text style={styles.fieldLabel}>Nom de l'equipe</Text>
                  <TextInput value={customName} onChangeText={setCustomName} style={styles.input} placeholder="Ex: Paris Saint-Germain" placeholderTextColor="#ffffff44"/>
                  <Text style={styles.fieldLabel}>URL logo (optionnel)</Text>
                  <TextInput value={customLogo} onChangeText={setCustomLogo} style={styles.input} placeholder="https://..." placeholderTextColor="#ffffff44" autoCapitalize="none"/>
                  <TouchableOpacity style={styles.customConfirmBtn} onPress={() => { if (customName.trim()) { onSelect(customName.trim(), customLogo.trim()); onClose(); } }}>
                    <Text style={styles.customConfirmBtnText}>✅ Confirmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowCustom(false)} style={{ marginTop:8, alignItems:'center' }}>
                    <Text style={{ color:'#ffffff55', fontSize:12 }}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { marginTop:8 }]}><Text style={styles.cancelBtnText}>Fermer</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PlanifierTab() {
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [titre, setTitre] = useState('');
  const [corps, setCorps] = useState('');
  const [langFilter, setLangFilter] = useState([]);
  const [sportFilter, setSportFilter] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledHour, setScheduledHour] = useState('20:00');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState(null);
  const LANG_FLAGS = { fr:'🇫🇷', en:'🇬🇧', es:'🇪🇸', pt:'🇧🇷', de:'🇩🇪', it:'🇮🇹', ar:'🇸🇦', ru:'🇷🇺' };
  const SPORT_ICONS = { NBA:'🏀', NHL:'🏒', MLB:'⚾', NFL:'🏈', FOOTBALL:'⚽', F1:'🏎', GOLF:'⛳', MMA:'🤼' };
  const NOTIF_SPORTS_LIST = [
    {id:'NBA',icon:'🏀'},{id:'NHL',icon:'🏒'},{id:'MLB',icon:'⚾'},{id:'NFL',icon:'🏈'},
    {id:'FOOTBALL',icon:'⚽'},{id:'F1',icon:'🏎'},{id:'GOLF',icon:'⛳'},{id:'MMA',icon:'🤼'},
  ];

  useEffect(function(){ fetchScheduled(); }, []);

  async function fetchScheduled() {
    setLoading(true);
    try {
      const { data } = await supabase.from('notif_scheduled').select('*').order('scheduled_at', { ascending: true });
      setScheduled(data || []);
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function translateNotif() {
    if (!titre || !corps) { Alert.alert('Attention', 'Remplis le titre et le message'); return; }
    setTranslating(true);
    try {
      const prompt = 'Traduis ces textes dans les 7 langues. Reponds UNIQUEMENT en JSON valide:\n\nTITRE FR: ' + titre + '\nCORPS FR: ' + corps + '\n\n{"titre_en":"...","titre_es":"...","titre_pt":"...","titre_de":"...","titre_it":"...","titre_ar":"...","titre_ru":"...","corps_en":"...","corps_es":"...","corps_pt":"...","corps_de":"...","corps_it":"...","corps_ar":"...","corps_ru":"..."}';
      const response = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{ 'Content-Type':'application/json', 'x-api-key':'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', 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' }, body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:2000, messages:[{ role:'user', content:prompt }] }) });
      const data = await response.json();
      const text = (data.content||[]).map(function(c){return c.text||'';}).join('');
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setTranslations(parsed);
      Alert.alert('✅', 'Traduit en 7 langues !');
    } catch(e) { Alert.alert('Erreur', e.message); }
    finally { setTranslating(false); }
  }

  async function scheduleNotif() {
    if (!titre || !corps || !scheduledDate || !scheduledHour) { Alert.alert('Erreur', 'Titre, message, date et heure sont obligatoires'); return; }
    setSending(true);
    try {
      const scheduledAt = scheduledDate + 'T' + scheduledHour + ':00Z';
      await supabase.from('notif_scheduled').insert({
        titre, corps,
        lang_filter: langFilter.length > 0 ? langFilter : null,
        sport_filter: sportFilter.length > 0 ? sportFilter : null,
        scheduled_at: scheduledAt,
        sent: false,
      });
      Alert.alert('✅', 'Notification planifiée pour le ' + scheduledDate + ' à ' + scheduledHour + ' GMT !');
      setTitre(''); setCorps(''); setLangFilter([]); setSportFilter([]);
      setScheduledDate(''); setScheduledHour('20:00'); setTranslations(null);
      fetchScheduled();
    } catch(e) { Alert.alert('Erreur', e.message); }
    finally { setSending(false); }
  }

  async function deleteScheduled(id) {
    Alert.alert('Supprimer ?', 'Supprimer cette notification planifiée ?', [
      { text:'Annuler', style:'cancel' },
      { text:'Supprimer', style:'destructive', onPress: async function() {
        await supabase.from('notif_scheduled').delete().eq('id', id);
        fetchScheduled();
      }},
    ]);
  }

  const now = new Date();
  const pending = scheduled.filter(function(s){ return !s.sent; });
  const sent = scheduled.filter(function(s){ return s.sent; });

  return (
    <ScrollView contentContainerStyle={{padding:16, paddingBottom:40}} keyboardShouldPersistTaps="handled">

      {/* Notifs planifiées en attente */}
      {pending.length > 0 && (
        <View style={{marginBottom:16}}>
          <Text style={{color:'#FFD700',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2,marginBottom:8}}>⏳ EN ATTENTE ({pending.length})</Text>
          {pending.map(function(n) {
            const date = new Date(n.scheduled_at).toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
            const isPast = new Date(n.scheduled_at) < now;
            return (
              <View key={n.id} style={{backgroundColor:'#16162a',borderRadius:12,padding:12,marginBottom:8,borderWidth:1,borderColor:isPast?'#E5393544':'#FFD70044'}}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <View style={{backgroundColor:isPast?'#E5393522':'#FFD70022',borderRadius:8,paddingHorizontal:8,paddingVertical:3}}>
                    <Text style={{color:isPast?'#E53935':'#FFD700',fontFamily:'BebasNeue',fontSize:10}}>{isPast?'⚠️ DÉPASSÉ':'⏰ ' + date + ' GMT'}</Text>
                  </View>
                  <TouchableOpacity onPress={function(){deleteScheduled(n.id);}} style={{backgroundColor:'#E5393511',borderRadius:6,padding:4}}>
                    <Text style={{fontSize:12}}>🗑</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:13,marginBottom:2}}>{n.titre}</Text>
                <Text style={{color:'#ffffffcc',fontSize:11}} numberOfLines={2}>{n.corps}</Text>
                <View style={{flexDirection:'row',gap:8,marginTop:6,flexWrap:'wrap'}}>
                  {n.lang_filter?n.lang_filter.map(function(l){return(<Text key={l} style={{fontSize:13}}>{LANG_FLAGS[l]||l}</Text>);}):<Text style={{color:'#ffffff33',fontSize:10}}>🌍 Toutes langues</Text>}
                  {n.sport_filter?n.sport_filter.map(function(s){return(<Text key={s} style={{fontSize:13}}>{SPORT_ICONS[s]||s}</Text>);}):<Text style={{color:'#ffffff33',fontSize:10}}>🏅 Tous sports</Text>}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Formulaire nouvelle notif planifiée */}
      <Text style={{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2,marginBottom:12}}>➕ PLANIFIER UNE NOTIFICATION</Text>

      <Text style={{color:'#ffffffcc',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6}}>Titre *</Text>
      <TextInput value={titre} onChangeText={setTitre} style={{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,color:'#fff',fontSize:13,borderWidth:1,borderColor:'#ffffff22',marginBottom:10}} placeholder="Ex: Ce soir — Real vs PSG !" placeholderTextColor="#ffffff44" maxLength={100}/>

      <Text style={{color:'#ffffffcc',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6}}>Message *</Text>
      <TextInput value={corps} onChangeText={setCorps} style={{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,color:'#fff',fontSize:13,borderWidth:1,borderColor:'#ffffff22',marginBottom:10,height:80,textAlignVertical:'top'}} placeholder="Le message de la notification..." placeholderTextColor="#ffffff44" multiline maxLength={200}/>

      <TouchableOpacity onPress={translateNotif} disabled={translating} activeOpacity={0.85} style={{marginBottom:10}}>
        <LinearGradient colors={translating?['#444','#555']:['#1D428A','#00B8D9']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:12,padding:12,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8}}>
          {translating?<><ActivityIndicator color="#fff" size="small"/><Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:13}}> Traduction...</Text></>:<Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:13}}>🌍 Traduire en 7 langues</Text>}
        </LinearGradient>
      </TouchableOpacity>
      {translations&&<View style={{backgroundColor:'#4CAF5022',borderRadius:8,padding:8,marginBottom:10,borderWidth:1,borderColor:'#4CAF5044'}}><Text style={{color:'#4CAF50',fontSize:10,fontFamily:'BebasNeue'}}>✅ Traduit : EN · ES · PT · DE · IT · AR · RU</Text></View>}

      {/* Filtres langue */}
      <Text style={{color:'#ffffffcc',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6}}>🌍 LANGUE (optionnel)</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:10}}>
        {Object.keys(LANG_FLAGS).map(function(lang){
          const sel = langFilter.includes(lang);
          return(<TouchableOpacity key={lang} style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:sel?'#1D428A':'#16162a',borderRadius:10,paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderColor:sel?'#1D428A':'#ffffff22'}} onPress={function(){setLangFilter(sel?langFilter.filter(function(l){return l!==lang;}): [...langFilter,lang]);}}>
            <Text style={{fontSize:14}}>{LANG_FLAGS[lang]}</Text>
            <Text style={{color:sel?'#fff':'#ffffff88',fontFamily:'BebasNeue',fontSize:11}}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>);
        })}
      </View>

      {/* Filtres sport */}
      <Text style={{color:'#ffffffcc',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6}}>🏆 SPORT (optionnel)</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:10}}>
        {NOTIF_SPORTS_LIST.map(function(sport){
          const sel = sportFilter.includes(sport.id);
          return(<TouchableOpacity key={sport.id} style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:sel?'#FF6B2B':'#16162a',borderRadius:10,paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderColor:sel?'#FF6B2B':'#ffffff22'}} onPress={function(){setSportFilter(sel?sportFilter.filter(function(s){return s!==sport.id;}): [...sportFilter,sport.id]);}}>
            <Text style={{fontSize:14}}>{sport.icon}</Text>
            <Text style={{color:sel?'#fff':'#ffffff88',fontFamily:'BebasNeue',fontSize:11}}>{sport.id}</Text>
          </TouchableOpacity>);
        })}
      </View>

      {/* Date et heure */}
      <View style={{flexDirection:'row',gap:10,marginBottom:10}}>
        <View style={{flex:1}}>
          <Text style={{color:'#ffffffcc',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6}}>📅 DATE *</Text>
          <TouchableOpacity onPress={function(){setShowCalendar(true);}} style={{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,borderWidth:1,borderColor:'#ffffff22',flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
            <Text style={{color:scheduledDate?'#fff':'#ffffff44',fontSize:13}}>{scheduledDate||'Choisir...'}</Text>
            <Text style={{color:'#ffffff55',fontSize:12}}>📅</Text>
          </TouchableOpacity>
        </View>
        <View style={{flex:1}}>
          <Text style={{color:'#ffffffcc',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6}}>🕐 HEURE GMT *</Text>
          <TouchableOpacity onPress={function(){setShowTimePicker(true);}} style={{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,borderWidth:1,borderColor:'#ffffff22',flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
            <Text style={{color:'#fff',fontSize:13}}>{scheduledHour} GMT</Text>
            <Text style={{color:'#ffffff55',fontSize:12}}>🕐</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={scheduleNotif} disabled={sending} activeOpacity={0.85} style={{marginTop:8}}>
        <LinearGradient colors={sending?['#444','#555']:['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:12,padding:14,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8}}>
          {sending?<><ActivityIndicator color="#fff" size="small"/><Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:14}}> Planification...</Text></>:<Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:14}}>⏰ PLANIFIER</Text>}
        </LinearGradient>
      </TouchableOpacity>

      {/* Notifs déjà envoyées */}
      {sent.length > 0 && (
        <View style={{marginTop:20}}>
          <Text style={{color:'#4CAF50',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2,marginBottom:8}}>✅ ENVOYÉES ({sent.length})</Text>
          {sent.map(function(n) {
            const date = new Date(n.scheduled_at).toLocaleDateString('fr-FR', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
            return(<View key={n.id} style={{backgroundColor:'#16162a',borderRadius:10,padding:10,marginBottom:6,borderWidth:1,borderColor:'#4CAF5022',flexDirection:'row',alignItems:'center',gap:8}}>
              <Text style={{fontSize:16}}>✅</Text>
              <View style={{flex:1}}><Text style={{color:'#fff',fontSize:12,fontWeight:'600'}}>{n.titre}</Text><Text style={{color:'#ffffff55',fontSize:10}}>{date} GMT</Text></View>
              <TouchableOpacity onPress={function(){deleteScheduled(n.id);}} style={{backgroundColor:'#E5393511',borderRadius:6,padding:4}}><Text style={{fontSize:12}}>🗑</Text></TouchableOpacity>
            </View>);
          })}
        </View>
      )}

      {showCalendar && <CalendarPicker field="date" value={scheduledDate} onSelect={function(f,v){setScheduledDate(v);}} onClose={function(){setShowCalendar(false);}}/>}
      {showTimePicker && <TimePicker title="Heure d'envoi" value={scheduledHour} onSelect={setScheduledHour} onClose={function(){setShowTimePicker(false);}}/>}
    </ScrollView>
  );
}

function HistoriqueTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const LANG_FLAGS = { fr:'🇫🇷', en:'🇬🇧', es:'🇪🇸', pt:'🇧🇷', de:'🇩🇪', it:'🇮🇹', ar:'🇸🇦', ru:'🇷🇺' };
  const SPORT_ICONS = { NBA:'🏀', NHL:'🏒', MLB:'⚾', NFL:'🏈', FOOTBALL:'⚽', F1:'🏎', GOLF:'⛳', MMA:'🤼' };

  useEffect(function() { fetchLogs(); }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const { data } = await supabase.from('notif_sent_log').select('*').order('sent_at', { ascending: false }).limit(50);
      setLogs(data || []);
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function deleteLog(id) {
    Alert.alert('Supprimer ?', 'Supprimer cet historique ?', [
      { text:'Annuler', style:'cancel' },
      { text:'Supprimer', style:'destructive', onPress: async function() {
        await supabase.from('notif_sent_log').delete().eq('id', id);
        fetchLogs();
      }},
    ]);
  }

  return (
    <View style={{flex:1}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,paddingBottom:8}}>
        <Text style={{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2}}>📋 HISTORIQUE ({logs.length})</Text>
        <TouchableOpacity onPress={fetchLogs} style={{backgroundColor:'#ffffff0a',borderRadius:8,width:32,height:32,alignItems:'center',justifyContent:'center'}}>
          <Text style={{color:'#FF6B2B',fontSize:16}}>↻</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color="#FF6B2B" size="large"/></View>
      ) : logs.length === 0 ? (
        <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:40}}>
          <Text style={{fontSize:32,marginBottom:8}}>🔔</Text>
          <Text style={{color:'#ffffff55',fontFamily:'BebasNeue',fontSize:14}}>Aucune notification envoyée</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{padding:16,paddingTop:0,paddingBottom:40}}>
          {logs.map(function(log) {
            const date = new Date(log.sent_at).toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
            return (
              <View key={log.id} style={{backgroundColor:'#16162a',borderRadius:12,padding:14,marginBottom:10,borderWidth:1,borderColor:'#ffffff14'}}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <Text style={{color:'#FFD700',fontFamily:'BebasNeue',fontSize:11,letterSpacing:1}}>📅 {date}</Text>
                  <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                    <View style={{backgroundColor:'#4CAF5022',borderRadius:8,paddingHorizontal:8,paddingVertical:3,borderWidth:1,borderColor:'#4CAF5044'}}>
                      <Text style={{color:'#4CAF50',fontFamily:'BebasNeue',fontSize:11}}>✉️ {log.sent_count||0} envoyés</Text>
                    </View>
                    <TouchableOpacity onPress={function(){deleteLog(log.id);}} style={{backgroundColor:'#E5393511',borderRadius:6,padding:4}}>
                      <Text style={{fontSize:12}}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:14,letterSpacing:0.5,marginBottom:4}}>{log.titre}</Text>
                <Text style={{color:'#ffffffcc',fontSize:12,lineHeight:18,marginBottom:8}}>{log.corps}</Text>
                <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>
                  {log.lang_filter && log.lang_filter.length > 0 ? (
                    <View style={{flexDirection:'row',gap:4,alignItems:'center'}}>
                      <Text style={{color:'#ffffff44',fontSize:10}}>Langues:</Text>
                      {log.lang_filter.map(function(l){return(<Text key={l} style={{fontSize:14}}>{LANG_FLAGS[l]||l}</Text>);})}
                    </View>
                  ) : (
                    <Text style={{color:'#ffffff44',fontSize:10}}>🌍 Toutes les langues</Text>
                  )}
                  {log.sport_filter && log.sport_filter.length > 0 ? (
                    <View style={{flexDirection:'row',gap:4,alignItems:'center'}}>
                      <Text style={{color:'#ffffff44',fontSize:10}}>Sports:</Text>
                      {log.sport_filter.map(function(s){return(<Text key={s} style={{fontSize:14}}>{SPORT_ICONS[s]||s}</Text>);})}
                    </View>
                  ) : (
                    <Text style={{color:'#ffffff44',fontSize:10}}>🏅 Tous les sports</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const SPORT_ICONS = { NBA:'🏀', NHL:'🏒', MLB:'⚾', NFL:'🏈', FOOTBALL:'⚽', F1:'🏎', GOLF:'⛳', MMA:'🤼' };
  const LANG_FLAGS = { fr:'🇫🇷', en:'🇬🇧', es:'🇪🇸', pt:'🇧🇷', de:'🇩🇪', it:'🇮🇹', ar:'🇸🇦', ru:'🇷🇺' };

  useEffect(function() { fetchUsers(0, ''); }, []);

  async function fetchUsers(p, s) {
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('id, email, first_name, last_name, created_at, language', { count:'exact' })
        .order('created_at', { ascending: false })
        .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);
      if (s.trim()) query = query.or('email.ilike.%' + s + '%,first_name.ilike.%' + s + '%,last_name.ilike.%' + s + '%');
      const { data, count } = await query;
      // Récupérer les sports favoris
      const ids = (data||[]).map(function(u){return u.id;});
      let sportsMap = {};
      if (ids.length > 0) {
        const { data: tokens } = await supabase.from('push_tokens').select('user_id, sports_interests').in('user_id', ids);
        (tokens||[]).forEach(function(t){ sportsMap[t.user_id] = t.sports_interests||[]; });
      }
      const enriched = (data||[]).map(function(u){ return {...u, sports: sportsMap[u.id]||[]}; });
      setUsers(enriched);
      setTotal(count||0);
      setPage(p);
    } catch(e) {}
    finally { setLoading(false); }
  }

  function doSearch(s) {
    setSearch(s);
    fetchUsers(0, s);
  }

  return (
    <View style={{flex:1}}>
      <View style={{padding:16,paddingBottom:8}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <Text style={{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2}}>👥 UTILISATEURS ({total})</Text>
          <TouchableOpacity onPress={function(){fetchUsers(0,search);}} style={{backgroundColor:'#ffffff0a',borderRadius:8,width:32,height:32,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#FF6B2B',fontSize:16}}>↻</Text></TouchableOpacity>
        </View>
        <TextInput value={search} onChangeText={doSearch} style={{backgroundColor:'#0d0d1a',borderRadius:10,padding:10,color:'#fff',fontSize:13,borderWidth:1,borderColor:'#ffffff22'}} placeholder="Rechercher par nom ou email..." placeholderTextColor="#ffffff44" autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing"/>
      </View>
      {loading ? (
        <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color="#FF6B2B" size="large"/></View>
      ) : (
        <ScrollView contentContainerStyle={{padding:16,paddingTop:0,paddingBottom:40}}>
          {users.length === 0 ? (
            <View style={{alignItems:'center',padding:40}}><Text style={{fontSize:32,marginBottom:8}}>👤</Text><Text style={{color:'#ffffff55',fontFamily:'BebasNeue',fontSize:14}}>Aucun utilisateur trouvé</Text></View>
          ) : users.map(function(u, i) {
            const name = ((u.first_name||'') + ' ' + (u.last_name||'')).trim();
            const date = new Date(u.created_at).toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric'});
            return (
              <View key={u.id} style={{backgroundColor:'#16162a',borderRadius:12,padding:12,marginBottom:8,borderWidth:1,borderColor:'#ffffff14'}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:6}}>
                  <View style={{width:36,height:36,borderRadius:18,backgroundColor:'#FF6B2B22',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#FF6B2B44'}}>
                    <Text style={{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:16}}>{(name||u.email||'?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{color:'#fff',fontSize:13,fontWeight:'600'}}>{name||'—'}</Text>
                    <Text style={{color:'#ffffff55',fontSize:10,marginTop:1}}>{u.email}</Text>
                  </View>
                  <Text style={{fontSize:18}}>{LANG_FLAGS[u.language]||'🌍'}</Text>
                </View>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                  <Text style={{color:'#ffffff44',fontSize:10}}>📅 {date}</Text>
                  <View style={{flexDirection:'row',gap:4,flexWrap:'wrap',justifyContent:'flex-end',flex:1,marginLeft:8}}>
                    {u.sports.length > 0
                      ? u.sports.map(function(s){return(<View key={s} style={{backgroundColor:'#FF6B2B22',borderRadius:6,paddingHorizontal:6,paddingVertical:2}}><Text style={{fontSize:11}}>{SPORT_ICONS[s]||s}</Text></View>);})
                      : <Text style={{color:'#ffffff22',fontSize:10}}>Aucun sport</Text>}
                  </View>
                </View>
              </View>
            );
          })}
          {/* Pagination */}
          {total > PAGE_SIZE && (
            <View style={{flexDirection:'row',justifyContent:'center',gap:12,marginTop:8}}>
              <TouchableOpacity disabled={page===0} onPress={function(){fetchUsers(page-1,search);}} style={{backgroundColor:page===0?'#ffffff0a':'#FF6B2B22',borderRadius:10,paddingHorizontal:16,paddingVertical:8,borderWidth:1,borderColor:page===0?'#ffffff22':'#FF6B2B44'}}>
                <Text style={{color:page===0?'#ffffff22':'#FF6B2B',fontFamily:'BebasNeue',fontSize:13}}>← Précédent</Text>
              </TouchableOpacity>
              <View style={{backgroundColor:'#16162a',borderRadius:10,paddingHorizontal:12,paddingVertical:8,borderWidth:1,borderColor:'#ffffff22',alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:11}}>{page+1} / {Math.ceil(total/PAGE_SIZE)}</Text>
              </View>
              <TouchableOpacity disabled={(page+1)*PAGE_SIZE>=total} onPress={function(){fetchUsers(page+1,search);}} style={{backgroundColor:(page+1)*PAGE_SIZE>=total?'#ffffff0a':'#FF6B2B22',borderRadius:10,paddingHorizontal:16,paddingVertical:8,borderWidth:1,borderColor:(page+1)*PAGE_SIZE>=total?'#ffffff22':'#FF6B2B44'}}>
                <Text style={{color:(page+1)*PAGE_SIZE>=total?'#ffffff22':'#FF6B2B',fontFamily:'BebasNeue',fontSize:13}}>Suivant →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatsTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0, pushTokens: 0, totalVotes: 0,
    totalSuggestions: 0, activeFlash: 0, langBreakdown: {},
    votesByFeature: {}, newToday: 0, newThisWeek: 0,
    sportBreakdown: {}, recentUsers: [], growthData: [],
  });

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7*86400000).toISOString();
      const todayStart = today + 'T00:00:00Z';

      const [profilesRes, tokensRes, votesRes, suggestionsRes, flashRes, langRes,
             newTodayRes, newWeekRes, recentRes, sportRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('push_tokens').select('*', { count: 'exact', head: true }),
        supabase.from('feature_votes').select('feature_id'),
        supabase.from('feature_suggestions').select('*', { count: 'exact', head: true }),
        supabase.from('kazmo_flash').select('*', { count: 'exact', head: false }).eq('actif', true).lte('date_debut', today).gte('date_fin', today),
        supabase.from('push_tokens').select('language'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('profiles').select('email, first_name, last_name, created_at, language').order('created_at', { ascending: false }).limit(5),
        supabase.from('push_tokens').select('sports_interests'),
      ]);

      const votesByFeature = {};
      (votesRes.data || []).forEach(function(v) { votesByFeature[v.feature_id] = (votesByFeature[v.feature_id] || 0) + 1; });

      const langBreakdown = {};
      (langRes.data || []).forEach(function(t) { const lang = t.language || 'fr'; langBreakdown[lang] = (langBreakdown[lang] || 0) + 1; });

      const sportBreakdown = {};
      (sportRes.data || []).forEach(function(t) {
        (t.sports_interests || []).forEach(function(s) {
          sportBreakdown[s] = (sportBreakdown[s] || 0) + 1;
        });
      });

      setStats({
        totalUsers: profilesRes.count || 0,
        pushTokens: tokensRes.count || 0,
        totalVotes: (votesRes.data || []).length,
        totalSuggestions: suggestionsRes.count || 0,
        activeFlash: (flashRes.data || []).length,
        langBreakdown,
        votesByFeature,
        newToday: newTodayRes.count || 0,
        newThisWeek: newWeekRes.count || 0,
        recentUsers: recentRes.data || [],
        sportBreakdown,
      });
    } catch(e) { console.log('StatsTab error:', e); }
    finally { setLoading(false); }
  }

  if (loading) { return (<View style={styles.statsLoadingContainer}><ActivityIndicator color="#FF6B2B" size="large"/><Text style={styles.statsLoadingText}>Chargement des stats...</Text></View>); }

  const maxVote = Math.max(...Object.values(stats.votesByFeature).concat([1]));
  const maxSport = Math.max(...Object.values(stats.sportBreakdown).concat([1]));
  const SPORT_ICONS = { NBA:'🏀', NHL:'🏒', MLB:'⚾', NFL:'🏈', FOOTBALL:'⚽', F1:'🏎', GOLF:'⛳', MMA:'🤼' };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.statsHeader}><Text style={styles.statsSectionTitle}>📊 TABLEAU DE BORD</Text><TouchableOpacity onPress={fetchStats} style={styles.refreshBtn}><Text style={styles.refreshBtnText}>↻</Text></TouchableOpacity></View>

      {/* KPIs principaux */}
      <View style={styles.statsRow}>
        <View style={[styles.statsKpiCard, { borderColor:'#4CAF5044' }]}><Text style={styles.statsKpiIcon}>👤</Text><Text style={[styles.statsKpiValue, { color:'#4CAF50' }]}>{stats.totalUsers}</Text><Text style={styles.statsKpiLabel}>Utilisateurs</Text></View>
        <View style={[styles.statsKpiCard, { borderColor:'#FF6B2B44' }]}><Text style={styles.statsKpiIcon}>📱</Text><Text style={[styles.statsKpiValue, { color:'#FF6B2B' }]}>{stats.pushTokens}</Text><Text style={styles.statsKpiLabel}>Tokens push</Text></View>
      </View>

      {/* Nouvelles inscriptions */}
      <View style={styles.statsRow}>
        <View style={[styles.statsKpiCard, { borderColor:'#00B8D944' }]}><Text style={styles.statsKpiIcon}>🆕</Text><Text style={[styles.statsKpiValue, { color:'#00B8D9' }]}>{stats.newToday}</Text><Text style={styles.statsKpiLabel}>Aujourd'hui</Text></View>
        <View style={[styles.statsKpiCard, { borderColor:'#9C27B044' }]}><Text style={styles.statsKpiIcon}>📈</Text><Text style={[styles.statsKpiValue, { color:'#9C27B0' }]}>{stats.newThisWeek}</Text><Text style={styles.statsKpiLabel}>Cette semaine</Text></View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statsKpiCard, { borderColor:'#FFD70044' }]}><Text style={styles.statsKpiIcon}>❤️</Text><Text style={[styles.statsKpiValue, { color:'#FFD700' }]}>{stats.totalVotes}</Text><Text style={styles.statsKpiLabel}>Votes roadmap</Text></View>
        <View style={[styles.statsKpiCard, { borderColor:'#E5393544' }]}><Text style={styles.statsKpiIcon}>💡</Text><Text style={[styles.statsKpiValue, { color:'#E53935' }]}>{stats.totalSuggestions}</Text><Text style={styles.statsKpiLabel}>Suggestions</Text></View>
      </View>

      {/* Flash actifs */}
      <View style={styles.statsFullCard}>
        <View style={styles.statsFullCardHeader}>
          <Text style={styles.statsFullCardIcon}>⚡</Text>
          <Text style={styles.statsFullCardLabel}>Flash infos actifs aujourd'hui</Text>
          <View style={[styles.statsBadge, { backgroundColor: stats.activeFlash > 0 ? '#4CAF5022' : '#ffffff11' }]}>
            <Text style={[styles.statsBadgeText, { color: stats.activeFlash > 0 ? '#4CAF50' : '#ffffff55' }]}>{stats.activeFlash > 0 ? '● ' + stats.activeFlash + ' actif' + (stats.activeFlash > 1 ? 's' : '') : 'Aucun actif'}</Text>
          </View>
        </View>
      </View>

      {/* Sports les plus populaires */}
      {Object.keys(stats.sportBreakdown).length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>🏆 SPORTS FAVORIS DES USERS</Text>
          {Object.keys(stats.sportBreakdown).sort(function(a,b){ return stats.sportBreakdown[b]-stats.sportBreakdown[a]; }).map(function(sport) {
            const count = stats.sportBreakdown[sport] || 0;
            const pct = maxSport > 0 ? Math.round((count / maxSport) * 100) : 0;
            return (
              <View key={sport} style={styles.statsBarRow}>
                <Text style={styles.statsBarFlag}>{SPORT_ICONS[sport]||'🏅'}</Text>
                <Text style={[styles.statsBarLang,{width:60}]}>{sport}</Text>
                <View style={styles.statsBarTrack}><View style={[styles.statsBarFill, { width: pct + '%', backgroundColor: '#FF6B2B' }]} /></View>
                <Text style={styles.statsBarCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Derniers inscrits */}
      {stats.recentUsers.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>🆕 DERNIERS INSCRITS</Text>
          {stats.recentUsers.map(function(u, i) {
            const name = (u.first_name||'') + ' ' + (u.last_name||'');
            const date = new Date(u.created_at).toLocaleDateString('fr-FR', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
            const flagMap = {fr:'🇫🇷',en:'🇬🇧',es:'🇪🇸',pt:'🇧🇷',de:'🇩🇪',it:'🇮🇹',ar:'🇸🇦',ru:'🇷🇺'};
            return (
              <View key={i} style={styles.recentUserRow}>
                <Text style={styles.recentUserFlag}>{flagMap[u.language]||'🌍'}</Text>
                <View style={{flex:1}}>
                  <Text style={styles.recentUserName}>{name.trim()||u.email}</Text>
                  <Text style={styles.recentUserDate}>{date}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Répartition par langue */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>🌍 RÉPARTITION PAR LANGUE</Text>
        {Object.keys(LANG_FLAGS).map(function(lang) {
          const count = stats.langBreakdown[lang] || 0;
          const pct = stats.pushTokens > 0 ? Math.round((count / stats.pushTokens) * 100) : 0;
          return (<View key={lang} style={styles.statsBarRow}><Text style={styles.statsBarFlag}>{LANG_FLAGS[lang]}</Text><Text style={styles.statsBarLang}>{lang.toUpperCase()}</Text><View style={styles.statsBarTrack}><View style={[styles.statsBarFill, { width: (pct || 0) + '%', backgroundColor: '#FF6B2B' }]} /></View><Text style={styles.statsBarCount}>{count}</Text><Text style={styles.statsBarPct}>{pct}%</Text></View>);
        })}
        {Object.keys(stats.langBreakdown).length === 0 && (<Text style={styles.statsEmpty}>Aucune donnée de langue disponible</Text>)}
      </View>

      {/* Votes */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>🏆 VOTES PAR FONCTIONNALITÉ</Text>
        {Object.keys(FEATURE_LABELS).sort(function(a, b) { return (stats.votesByFeature[b] || 0) - (stats.votesByFeature[a] || 0); }).map(function(featureId) {
          const count = stats.votesByFeature[featureId] || 0;
          const pct = maxVote > 0 ? Math.round((count / maxVote) * 100) : 0;
          return (<View key={featureId} style={styles.statsVoteCard}><View style={styles.statsVoteHeader}><Text style={styles.statsVoteLabel}>{FEATURE_LABELS[featureId]}</Text><View style={styles.statsVoteBadge}><Text style={styles.statsVoteCount}>{count} ❤️</Text></View></View><View style={styles.statsBarTrack}><View style={[styles.statsBarFill, { width: pct + '%', backgroundColor: '#FFD700' }]} /></View></View>);
        })}
      </View>
    </ScrollView>
  );
}


function UsersScreen({ supabase }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function deleteUser(userId, email) {
    Alert.alert('Supprimer ?', email + ' sera supprimé définitivement.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async function() {
        try {
          await supabase.from('profiles').delete().eq('id', userId);
          await supabase.from('push_tokens').delete().eq('user_id', userId);
          setUsers(function(prev) { return prev.filter(function(u) { return u.id !== userId; }); });
          Alert.alert('✅', 'Utilisateur supprimé.');
        } catch(e) { Alert.alert('Erreur', e.message); }
      }}
    ]);
  }

  const filtered = users.filter(function(u) {
    const q = search.toLowerCase();
    return !q || (u.email||'').toLowerCase().includes(q) || (u.first_name||'').toLowerCase().includes(q) || (u.last_name||'').toLowerCase().includes(q);
  });

  const LANG_FLAGS = { fr:'🇫🇷', en:'🇬🇧', es:'🇪🇸', pt:'🇧🇷', de:'🇩🇪', it:'🇮🇹', ar:'🇸🇦', ru:'🇷🇺' };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={styles.notifStatsCard}>
        <Text style={styles.notifStatsIcon}>👤</Text>
        <View style={{flex:1}}>
          <Text style={styles.notifStatsValue}>{users.length}</Text>
          <Text style={styles.notifStatsSub}>utilisateurs total</Text>
        </View>
        <TouchableOpacity onPress={fetchUsers} style={styles.refreshBtn}><Text style={styles.refreshBtnText}>↻</Text></TouchableOpacity>
      </View>
      <TextInput
        value={search} onChangeText={setSearch}
        style={[styles.input, {marginBottom:12}]}
        placeholder="🔍 Rechercher par nom ou email..."
        placeholderTextColor="#ffffff44"
        autoCorrect={false} autoCapitalize="none"
      />
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        {[{id:'created_at',label:'📅 Date'},{id:'email',label:'📧 Email'},{id:'language',label:'🌍 Langue'}].map(function(s){
          const active = sortBy === s.id;
          return (
            <TouchableOpacity key={s.id} style={[styles.tabGridBtn, active&&styles.tabBtnActive]} onPress={()=>setSortBy(s.id)}>
              <Text style={[styles.tabBtnText, active&&styles.tabBtnTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {loading ? <ActivityIndicator color="#FF6B2B" style={{marginTop:20}}/> : filtered.length === 0 ? (
        <View style={styles.center}><Text style={styles.comingSoonText}>Aucun utilisateur trouvé</Text></View>
      ) : filtered.sort(function(a,b){
        if (sortBy === 'created_at') return new Date(b.created_at) - new Date(a.created_at);
        if (sortBy === 'email') return (a.email||'').localeCompare(b.email||'');
        if (sortBy === 'language') return (a.language||'').localeCompare(b.language||'');
        return 0;
      }).map(function(u) {
        const date = u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '';
        const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Sans nom';
        return (
          <View key={u.id} style={[styles.adminCard, {marginBottom:8}]}>
            <View style={styles.adminCardLeft}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <Text style={{fontSize:20}}>{LANG_FLAGS[u.language]||'🌍'}</Text>
                <View>
                  <Text style={styles.adminName}>{name}</Text>
                  <Text style={styles.adminEmail}>{u.email||'—'}</Text>
                  <Text style={{color:'#ffffff33',fontSize:10,marginTop:2}}>📅 {date}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={()=>deleteUser(u.id, u.email)} style={[styles.actionBtn, styles.actionBtnDanger]}>
              <Text style={[styles.actionBtnText,{color:'#E53935'}]}>🗑</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function AdminScreen({ onClose, adminUser }) {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [tab, setTab] = useState('match');
  const [flashList, setFlashList] = useState([]);
  const [matchList, setMatchList] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [eventList, setEventList] = useState([]);
  const [suggestionList, setSuggestionList] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showSportPickerMatch, setShowSportPickerMatch] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [showDatePickerMatch, setShowDatePickerMatch] = useState(null);
  const [showDatePickerEvent, setShowDatePickerEvent] = useState(null);
  const [showTimePickerMatch, setShowTimePickerMatch] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingFlash, setEditingFlash] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email:'', name:'', pin:'' });
  const [showUserPickerAdmin, setShowUserPickerAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [notifTitre, setNotifTitre] = useState('');
  const [notifCorps, setNotifCorps] = useState('');
  const [notifTranslating, setNotifTranslating] = useState(false);
  const [notifSending, setNotifSending] = useState(false);
  const [notifTranslations, setNotifTranslations] = useState(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [notifLangFilter, setNotifLangFilter] = useState([]);
  const [notifSportFilter, setNotifSportFilter] = useState([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [notifDate, setNotifDate] = useState('');
  const [flashSujet, setFlashSujet] = useState('');
  const [flashGenerating, setFlashGenerating] = useState(false);
  const [notifHeure, setNotifHeure] = useState('');
  const [showNotifDatePicker, setShowNotifDatePicker] = useState(false);
  const [showNotifTimePicker, setShowNotifTimePicker] = useState(false);

  const emptyForm = { sport:'', titre_fr:'', contenu_fr:'', date_debut:'', date_fin:'', actif:true, heure_debut_gmt:'00:00', heure_fin_gmt:'23:30', titre_en:'', titre_es:'', titre_pt:'', titre_de:'', titre_it:'', titre_ar:'', titre_ru:'', contenu_en:'', contenu_es:'', contenu_pt:'', contenu_de:'', contenu_it:'', contenu_ar:'', contenu_ru:'' };
  const emptyMatchForm = { sport:'', equipe_home:'', equipe_away:'', logo_home:'', logo_away:'', competition:'', date_affichage:'', date_match:'', description:'', actif:true, heure_debut_gmt:'00:00', heure_fin_gmt:'23:30' };
  const emptyEventForm = { nom:'', icon:'🎾', date_debut:'', date_fin:'', actif:true, description:'' };
  const [form, setForm] = useState(emptyForm);
  const [matchForm, setMatchForm] = useState(emptyMatchForm);
  const [eventForm, setEventForm] = useState(emptyEventForm);

  useEffect(() => { if (pin.length === 4) checkPin(); }, [pin]);
  useEffect(() => {
    if (authenticated) {
      fetchFlash(); fetchMatches(); fetchEvents(); fetchIdeas();
      if (adminData?.is_super_admin) fetchAdmins();
      fetchTokenCount();
    }
  }, [authenticated]);
  useEffect(() => { if (authenticated && tab === 'ideas') fetchIdeas(); }, [tab, authenticated]);

  async function checkPin() {
    try {
      const { data } = await supabase.from('admin_users').select('*').eq('email', adminUser.email).eq('pin', pin).eq('actif', true).single();
      if (data) { setAdminData(data); setAuthenticated(true); }
      else { Alert.alert('❌', 'Code PIN incorrect'); setPin(''); }
    } catch(e) { Alert.alert('❌', 'Code PIN incorrect'); setPin(''); }
  }

  async function fetchTokenCount() {
    try {
      const { count } = await supabase.from('push_tokens').select('*', { count:'exact', head:true });
      setTokenCount(count || 0);
    } catch(e) {}
  }

  async function fetchFilteredCount(langs, sports) {
    try {
      let query = supabase.from('push_tokens').select('*', { count:'exact', head:true });
      if (langs.length > 0) query = query.in('language', langs);
      if (sports.length > 0) query = query.overlaps('sports_interests', sports);
      const { count } = await query;
      setFilteredCount(count || 0);
    } catch(e) { setFilteredCount(0); }
  }

  async function fetchFlash() {
    setLoading(true);
    try { const { data } = await supabase.from('kazmo_flash').select('*').order('date_debut', { ascending:false }); setFlashList(data || []); }
    catch(e) {} finally { setLoading(false); }
  }

  async function fetchMatches() {
    try { const { data } = await supabase.from('match_du_jour').select('*').order('date_affichage', { ascending:false }); setMatchList(data || []); }
    catch(e) {}
  }

  async function fetchEvents() {
    try { const { data } = await supabase.from('kazmo_events').select('*').order('date_debut', { ascending:true }); setEventList(data || []); }
    catch(e) {}
  }

  async function fetchIdeas() {
    try {
      const [suggestions, votes] = await Promise.all([
        supabase.from('feature_suggestions').select('*').order('created_at', { ascending:false }),
        supabase.from('feature_votes').select('feature_id'),
      ]);
      setSuggestionList(suggestions.data || []);
      const counts = {};
      (votes.data || []).forEach(function(v) { counts[v.feature_id] = (counts[v.feature_id] || 0) + 1; });
      setVoteCounts(counts);
    } catch(e) {}
  }

  async function deleteSuggestion(id) {
    Alert.alert('Supprimer ?','Cette suggestion sera supprimée.',[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async function(){ await supabase.from('feature_suggestions').delete().eq('id', id); fetchIdeas(); }}]);
  }

  async function fetchAdmins() {
    const { data } = await supabase.from('admin_users').select('*').order('created_at');
    setAdminList(data || []);
  }

  async function saveEvent() {
    if (!eventForm.nom || !eventForm.date_debut || !eventForm.date_fin) { Alert.alert('Erreur', 'Nom, date début et date fin sont obligatoires'); return; }
    setLoading(true);
    try {
      const dataToSave = { nom:eventForm.nom, icon:eventForm.icon||'🎾', date_debut:eventForm.date_debut, date_fin:eventForm.date_fin, actif:eventForm.actif, description:eventForm.description||'' };
      if (editingEvent) { await supabase.from('kazmo_events').update(dataToSave).eq('id', editingEvent.id); Alert.alert('✅','Événement modifié !'); }
      else { await supabase.from('kazmo_events').insert(dataToSave); Alert.alert('✅','Événement créé !'); }
      setShowEventForm(false); setEditingEvent(null); setEventForm(emptyEventForm); fetchEvents();
    } catch(e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  async function deleteEvent(id) { Alert.alert('Supprimer ?','Cette action est irreversible.',[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async function(){ await supabase.from('kazmo_events').delete().eq('id',id); fetchEvents(); }}]); }
  async function toggleEvent(event) { await supabase.from('kazmo_events').update({actif:!event.actif}).eq('id',event.id); fetchEvents(); }
  function openEditEvent(event) { setEventForm({ nom:event.nom||'', icon:event.icon||'🎾', date_debut:event.date_debut||'', date_fin:event.date_fin||'', actif:event.actif, description:event.description||'' }); setEditingEvent(event); setShowEventForm(true); }

  async function translateNotif() {
    if (!notifTitre || !notifCorps) { Alert.alert('Attention', 'Remplis le titre et le message en francais'); return; }
    setNotifTranslating(true);
    try {
      const prompt = 'Traduis ces textes de notification push dans les 7 langues. Reponds UNIQUEMENT en JSON valide, sans markdown:\n\nTITRE FR: ' + notifTitre + '\nCORPS FR: ' + notifCorps + '\n\nFormat JSON:\n{"titre_en":"...","titre_es":"...","titre_pt":"...","titre_de":"...","titre_it":"...","titre_ar":"...","titre_ru":"...","corps_en":"...","corps_es":"...","corps_pt":"...","corps_de":"...","corps_it":"...","corps_ar":"...","corps_ru":"..."}';
      const response = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:H_ANTHROPIC, body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:2000, messages:[{ role:'user', content:prompt }] }) });
      const data = await response.json();
      const text = (data.content||[]).map(function(c){return c.text||'';}).join('');
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setNotifTranslations(parsed);
      Alert.alert('✅', 'Traduit en 7 langues !');
    } catch(e) { Alert.alert('Erreur traduction', e.message); }
    finally { setNotifTranslating(false); }
  }

  async function sendNotifications() {
    if (!notifTitre || !notifCorps) { Alert.alert('Erreur', 'Titre et message sont obligatoires'); return; }
    // Si date+heure choisies -> planifier
    if (notifDate && notifHeure) {
      setNotifSending(true);
      try {
        const scheduledAt = notifDate + 'T' + notifHeure + ':00Z';
        await supabase.from('notif_scheduled').insert({
          titre: notifTitre, corps: notifCorps,
          lang_filter: notifLangFilter.length > 0 ? notifLangFilter : null,
          sport_filter: notifSportFilter.length > 0 ? notifSportFilter : null,
          scheduled_at: scheduledAt, sent: false,
        });
        Alert.alert('✅', 'Notification planifiée pour le ' + notifDate + ' à ' + notifHeure + ' GMT !');
        setNotifTitre(''); setNotifCorps(''); setNotifTranslations(null);
        setNotifLangFilter([]); setNotifSportFilter([]); setNotifDate(''); setNotifHeure('');
      } catch(e) { Alert.alert('Erreur', e.message); }
      finally { setNotifSending(false); }
      return;
    }
    const targetCount = (notifLangFilter.length > 0 || notifSportFilter.length > 0) ? filteredCount : tokenCount;
    Alert.alert('Envoyer la notification ?', 'Cette notification sera envoyee a ' + targetCount + ' utilisateurs.', [
      { text:'Annuler', style:'cancel' },
      { text:'Envoyer', style:'default', onPress: async function() {
        setNotifSending(true);
        try {
          let query = supabase.from('push_tokens').select('token, language');
          if (notifLangFilter.length > 0) query = query.in('language', notifLangFilter);
          if (notifSportFilter.length > 0) query = query.overlaps('sports_interests', notifSportFilter);
          const { data: tokens } = await query;
          if (!tokens || tokens.length === 0) { Alert.alert('', 'Aucun utilisateur correspond aux filtres'); setNotifSending(false); return; }
          const translations = notifTranslations || {};
          const langMap = { fr:{title:notifTitre,body:notifCorps}, en:{title:translations.titre_en||notifTitre,body:translations.corps_en||notifCorps}, es:{title:translations.titre_es||notifTitre,body:translations.corps_es||notifCorps}, pt:{title:translations.titre_pt||notifTitre,body:translations.corps_pt||notifCorps}, de:{title:translations.titre_de||notifTitre,body:translations.corps_de||notifCorps}, it:{title:translations.titre_it||notifTitre,body:translations.corps_it||notifCorps}, ar:{title:translations.titre_ar||notifTitre,body:translations.corps_ar||notifCorps}, ru:{title:translations.titre_ru||notifTitre,body:translations.corps_ru||notifCorps} };
          const messages = tokens.map(function(t){ const lang=t.language||'fr'; const content=langMap[lang]||langMap['fr']; return {to:t.token,sound:'default',title:content.title,body:content.body,data:{type:'kazmo_notif'}}; });
          const batches = [];
          for (let i = 0; i < messages.length; i += 100) { batches.push(messages.slice(i, i + 100)); }
          let sent = 0;
          for (const batch of batches) { await fetch('https://exp.host/--/api/v2/push/send', { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(batch) }); sent += batch.length; }
          // Sauvegarder dans l'historique
          await supabase.from('notif_sent_log').insert({
            titre: notifTitre,
            corps: notifCorps,
            lang_filter: notifLangFilter.length > 0 ? notifLangFilter : null,
            sport_filter: notifSportFilter.length > 0 ? notifSportFilter : null,
            sent_count: sent,
            sent_at: new Date().toISOString(),
          });
          Alert.alert('✅', 'Notification envoyee a ' + sent + ' utilisateurs !');
          setNotifTitre(''); setNotifCorps(''); setNotifTranslations(null);
          setNotifLangFilter([]); setNotifSportFilter([]); setNotifDate(''); setNotifHeure('');
        } catch(e) { Alert.alert('Erreur envoi', e.message); }
        finally { setNotifSending(false); }
      }},
    ]);
  }

  async function generateFlash() {
    if (!flashSujet.trim()) return;
    setFlashGenerating(true);
    try {
      const prompt = 'Tu es Kazmo, expert sportif. Genere un flash info sportif percutant sur ce sujet: ' + flashSujet + '\n\nReponds UNIQUEMENT en JSON valide sans markdown:\n{"titre_fr":"TITRE EN MAJUSCULES MAX 10 MOTS","contenu_fr":"Contenu percutant 2-3 phrases maximum"}';
      const response = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:H_ANTHROPIC, body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:500, messages:[{ role:'user', content:prompt }] }) });
      const data = await response.json();
      const text = (data.content||[]).map(function(c){return c.text||'';}).join('');
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setForm(function(prev){ return {...prev, titre_fr:parsed.titre_fr||'', contenu_fr:parsed.contenu_fr||''}; });
      Alert.alert('✅', 'Flash généré ! Vérifie et traduis.');
    } catch(e) { Alert.alert('Erreur IA', e.message); }
    finally { setFlashGenerating(false); }
  }

  async function translateFlash() {
    if (!form.titre_fr || !form.contenu_fr) { Alert.alert('Attention', 'Remplis d\'abord le titre et le contenu en francais'); return; }
    setTranslating(true);
    try {
      const prompt = 'Traduis ces textes sportifs dans les 7 langues. Reponds UNIQUEMENT en JSON valide, sans markdown:\n\nTITRE FR: ' + form.titre_fr + '\nCONTENU FR: ' + form.contenu_fr + '\n\nFormat JSON:\n{"titre_en":"...","titre_es":"...","titre_pt":"...","titre_de":"...","titre_it":"...","titre_ar":"...","titre_ru":"...","contenu_en":"...","contenu_es":"...","contenu_pt":"...","contenu_de":"...","contenu_it":"...","contenu_ar":"...","contenu_ru":"..."}';
      const response = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:H_ANTHROPIC, body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:2000, messages:[{ role:'user', content:prompt }] }) });
      const data = await response.json();
      const text = (data.content||[]).map(function(c){return c.text||'';}).join('');
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setForm(function(prev){ return {...prev,...parsed}; });
      Alert.alert('✅', 'Traduit en 7 langues !');
    } catch(e) { Alert.alert('Erreur traduction', e.message); }
    finally { setTranslating(false); }
  }

  async function saveFlash() {
    if (!form.sport || !form.titre_fr || !form.contenu_fr || !form.date_debut || !form.date_fin) { Alert.alert('Erreur', 'Sport, titre, contenu et dates sont obligatoires'); return; }
    setLoading(true);
    try {
      if (editingFlash) { await supabase.from('kazmo_flash').update(form).eq('id', editingFlash.id); Alert.alert('✅','Flash modifie !'); }
      else { await supabase.from('kazmo_flash').insert(form); Alert.alert('✅','Flash ajoute !'); }
      setShowForm(false); setEditingFlash(null); setForm(emptyForm); fetchFlash();
    } catch(e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  async function saveMatch() {
    if (!matchForm.sport || !matchForm.equipe_home || !matchForm.equipe_away || !matchForm.date_affichage) { Alert.alert('Erreur', 'Sport, equipes et date sont obligatoires'); return; }
    setLoading(true);
    try {
      const dataToSave = { sport:matchForm.sport, equipe_home:matchForm.equipe_home, equipe_away:matchForm.equipe_away, logo_home:matchForm.logo_home||null, logo_away:matchForm.logo_away||null, competition:matchForm.competition||null, date_affichage:matchForm.date_affichage, date_match:matchForm.date_match?matchForm.date_match+'T20:00:00+00:00':null, description:matchForm.description||null, actif:matchForm.actif, heure_debut_gmt:matchForm.heure_debut_gmt||'00:00', heure_fin_gmt:matchForm.heure_fin_gmt||'23:30' };
      if (editingMatch) { await supabase.from('match_du_jour').update(dataToSave).eq('id', editingMatch.id); Alert.alert('✅','Match modifie !'); }
      else { await supabase.from('match_du_jour').insert(dataToSave); Alert.alert('✅','Match programme !'); }
      setShowMatchForm(false); setEditingMatch(null); setMatchForm(emptyMatchForm); fetchMatches();
    } catch(e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  async function deleteMatch(id) { Alert.alert('Supprimer ?','Cette action est irreversible.',[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async function(){ await supabase.from('match_du_jour').delete().eq('id',id); fetchMatches(); }}]); }
  async function toggleMatch(match) { await supabase.from('match_du_jour').update({actif:!match.actif}).eq('id',match.id); fetchMatches(); }

  function openEditMatch(match) {
    setMatchForm({ sport:match.sport||'', equipe_home:match.equipe_home||'', equipe_away:match.equipe_away||'', logo_home:match.logo_home||'', logo_away:match.logo_away||'', competition:match.competition||'', date_affichage:match.date_affichage||'', date_match:match.date_match?match.date_match.slice(0,10):'', description:match.description||'', actif:match.actif, heure_debut_gmt:match.heure_debut_gmt||'00:00', heure_fin_gmt:match.heure_fin_gmt||'23:30' });
    setEditingMatch(match); setShowMatchForm(true);
  }

  function openEdit(flash) {
    setForm({ sport:flash.sport||'', titre_fr:flash.titre_fr||'', contenu_fr:flash.contenu_fr||'', date_debut:flash.date_debut||'', date_fin:flash.date_fin||'', actif:flash.actif, titre_en:flash.titre_en||'', titre_es:flash.titre_es||'', titre_pt:flash.titre_pt||'', titre_de:flash.titre_de||'', titre_it:flash.titre_it||'', titre_ar:flash.titre_ar||'', titre_ru:flash.titre_ru||'', contenu_en:flash.contenu_en||'', contenu_es:flash.contenu_es||'', contenu_pt:flash.contenu_pt||'', contenu_de:flash.contenu_de||'', contenu_it:flash.contenu_it||'', contenu_ar:flash.contenu_ar||'', contenu_ru:flash.contenu_ru||'' });
    setEditingFlash(flash); setShowForm(true);
  }

  async function toggleFlash(flash) { await supabase.from('kazmo_flash').update({actif:!flash.actif}).eq('id',flash.id); fetchFlash(); }
  async function deleteFlash(id) { Alert.alert('Supprimer ?','Cette action est irreversible.',[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async function(){ await supabase.from('kazmo_flash').delete().eq('id',id); fetchFlash(); }}]); }

  async function loadAllUsers() {
    try {
      const { data } = await supabase.from('profiles').select('id, email, first_name, last_name').order('created_at', { ascending: false });
      setAllUsers(data || []);
    } catch(e) {}
  }

  async function addAdmin() {
    if (!newAdmin.email||!newAdmin.name||!newAdmin.pin){Alert.alert('Erreur','Tous les champs sont obligatoires');return;}
    try {
      await supabase.from('admin_users').insert({email:newAdmin.email,name:newAdmin.name,pin:newAdmin.pin,is_super_admin:false,actif:true});
      Alert.alert('✅','Admin ajoute !'); setShowAddAdmin(false); setNewAdmin({email:'',name:'',pin:''}); fetchAdmins();
    } catch(e){Alert.alert('Erreur',e.message);}
  }

  async function toggleAdmin(admin) {
    if(admin.is_super_admin){Alert.alert('','Impossible de desactiver un super admin');return;}
    await supabase.from('admin_users').update({actif:!admin.actif}).eq('id',admin.id); fetchAdmins();
  }

  async function deleteAdmin(admin) {
    if(admin.is_super_admin){Alert.alert('','Impossible de supprimer un super admin');return;}
    Alert.alert('Supprimer ?',admin.name+' n\'aura plus acces.',[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async function(){ await supabase.from('admin_users').delete().eq('id',admin.id); fetchAdmins(); }}]);
  }

  if (!authenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pinScreen}>
          <Text style={styles.pinIcon}>⚡</Text>
          <Text style={styles.pinTitle}>KAZMO ADMIN</Text>
          <Text style={styles.pinSubtitle}>{adminUser?.email}</Text>
          <Text style={styles.pinHint}>Entrez votre code PIN</Text>
          <View style={styles.pinDisplay}>
            {[0,1,2,3].map(function(i){return <View key={i} style={[styles.pinDot,pin.length>i&&styles.pinDotFilled]}/>;}) }
          </View>
          <View style={styles.pinGrid}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map(function(key,i){
              if(key==='')return <View key={i} style={styles.pinKey}/>;
              return(<TouchableOpacity key={i} style={styles.pinKey} activeOpacity={0.7} onPress={()=>{ if(key==='⌫'){setPin(function(p){return p.slice(0,-1);});} else if(pin.length<4){setPin(function(p){return p+key;});} }}><Text style={styles.pinKeyText}>{key}</Text></TouchableOpacity>);
            })}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.pinCancel}><Text style={styles.pinCancelText}>Annuler</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>⚡</Text>
          <View>
            <Text style={styles.headerTitle}>KAZMO ADMIN</Text>
            <Text style={styles.headerSub}>{adminData?.name} {adminData?.is_super_admin?'👑':''}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕ Fermer</Text></TouchableOpacity>
      </View>

      <View style={styles.tabGrid}>
          {[
            {id:'match',label:'🗓 Match'},
            {id:'flash',label:'⚡ Flash'},
            {id:'notifs',label:'🔔 Notifs'},
            {id:'users',label:'👤 Users'},
            {id:'stats',label:'📊 Stats'},
            {id:'events',label:'🎯 Events'},
            {id:'ideas',label:'💡 Idées'},
            {id:'admins',label:'👥 Admins',superOnly:true},
          ].filter(function(tb){return !tb.superOnly||adminData?.is_super_admin;})
            .map(function(tb){
              return(<TouchableOpacity key={tb.id} style={[styles.tabGridBtn,tab===tb.id&&styles.tabBtnActive]} onPress={()=>setTab(tb.id)}><Text style={[styles.tabBtnText,tab===tb.id&&styles.tabBtnTextActive]}>{tb.label}</Text></TouchableOpacity>);
            })}
        </View>

      {/* MATCH DU JOUR */}
      {tab==='match' && !showMatchForm && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.addBtn} onPress={()=>{setMatchForm(emptyMatchForm);setEditingMatch(null);setShowMatchForm(true);}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.addBtnGradient}>
              <Text style={styles.addBtnText}>🗓 Programmer un Match du Jour</Text>
            </LinearGradient>
          </TouchableOpacity>
          {matchList.length===0?(
            <View style={styles.center}><Text style={styles.comingSoonIcon}>🗓</Text><Text style={styles.comingSoonText}>Pas encore de match programme</Text></View>
          ):matchList.map(function(match){
            const today=new Date().toISOString().slice(0,10);
            const isToday=match.date_affichage===today;
            return(
              <View key={match.id} style={[styles.matchCard,isToday&&styles.matchCardToday]}>
                <View style={styles.flashCardHeader}>
                  <View style={styles.matchDateBadge}><Text style={styles.matchDateText}>📅 {match.date_affichage}</Text></View>
                  {isToday&&<View style={styles.todayBadge}><Text style={styles.todayBadgeText}>● AUJOURD'HUI</Text></View>}
                  <View style={[styles.statusBadge,{backgroundColor:match.actif?'#4CAF5022':'#ffffff11'}]}>
                    <Text style={[styles.statusText,{color:match.actif?'#4CAF50':'#ffffff55'}]}>{match.actif?'● Actif':'⏸ Inactif'}</Text>
                  </View>
                </View>
                <Text style={styles.matchSport}>{match.sport}</Text>
                <View style={styles.matchTeamsRow}>
                  {match.logo_home?<Image source={{uri:match.logo_home}} style={styles.matchLogo} onError={function(){}}/>:null}
                  <Text style={styles.matchTeams}>{match.equipe_home} vs {match.equipe_away}</Text>
                  {match.logo_away?<Image source={{uri:match.logo_away}} style={styles.matchLogo} onError={function(){}}/>:null}
                </View>
                {match.competition?<Text style={styles.matchComp}>{match.competition}</Text>:null}
                <View style={styles.gmtRow}><Text style={styles.gmtText}>🕐 GMT : {match.heure_debut_gmt||'00:00'} → {match.heure_fin_gmt||'23:30'}</Text></View>
                <View style={styles.flashCardActions}>
                  <TouchableOpacity onPress={()=>openEditMatch(match)} style={styles.actionBtn}><Text style={styles.actionBtnText}>✏️ Modifier</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>toggleMatch(match)} style={styles.actionBtn}><Text style={styles.actionBtnText}>{match.actif?'⏸ Desactiver':'▶️ Activer'}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>deleteMatch(match.id)} style={[styles.actionBtn,styles.actionBtnDanger]}><Text style={[styles.actionBtnText,{color:'#E53935'}]}>🗑 Supprimer</Text></TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {tab==='match' && showMatchForm && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={()=>{setShowMatchForm(false);setEditingMatch(null);}}><Text style={styles.formBack}>← Retour</Text></TouchableOpacity>
            <Text style={styles.formTitle}>{editingMatch?'Modifier Match':'Programmer Match'}</Text>
          </View>
          <Text style={styles.fieldLabel}>Sport *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowSportPickerMatch(true)}>
            <Text style={matchForm.sport?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{matchForm.sport||'Choisir un sport...'}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Equipe domicile *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn,!matchForm.sport&&{opacity:0.5}]} onPress={()=>{ if(matchForm.sport) setShowTeamPicker('home'); else Alert.alert('','Choisissez d\'abord un sport'); }}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1}}>
              {matchForm.logo_home?<Image source={{uri:matchForm.logo_home}} style={{width:24,height:24,resizeMode:'contain'}} onError={function(){}}/>:null}
              <Text style={matchForm.equipe_home?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{matchForm.equipe_home||'Choisir equipe domicile...'}</Text>
            </View>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Equipe exterieure *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn,!matchForm.sport&&{opacity:0.5}]} onPress={()=>{ if(matchForm.sport) setShowTeamPicker('away'); else Alert.alert('','Choisissez d\'abord un sport'); }}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1}}>
              {matchForm.logo_away?<Image source={{uri:matchForm.logo_away}} style={{width:24,height:24,resizeMode:'contain'}} onError={function(){}}/>:null}
              <Text style={matchForm.equipe_away?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{matchForm.equipe_away||'Choisir equipe exterieure...'}</Text>
            </View>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Competition</Text>
          <TextInput value={matchForm.competition} onChangeText={function(v){setMatchForm({...matchForm,competition:v});}} style={styles.input} placeholder="Ex: NBA Finales 2026" placeholderTextColor="#ffffff44"/>
          <Text style={styles.fieldLabel}>Description (optionnel)</Text>
          <TextInput value={matchForm.description} onChangeText={function(v){setMatchForm({...matchForm,description:v});}} style={[styles.input,styles.inputMultiline]} placeholder="Contexte du match..." placeholderTextColor="#ffffff44" multiline numberOfLines={3}/>
          <Text style={styles.fieldLabel}>Date d'affichage *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowDatePickerMatch('date_affichage')}>
            <Text style={matchForm.date_affichage?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{matchForm.date_affichage||'Choisir une date...'}</Text>
            <Text style={styles.pickerArrow}>📅</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Date du match (optionnel)</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowDatePickerMatch('date_match')}>
            <Text style={matchForm.date_match?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{matchForm.date_match||'Choisir une date...'}</Text>
            <Text style={styles.pickerArrow}>📅</Text>
          </TouchableOpacity>
          <View style={styles.gmtSection}>
            <Text style={styles.gmtSectionTitle}>🕐 HORAIRE DE DIFFUSION GMT</Text>
            <Text style={styles.gmtSectionSub}>Le Match du Jour s'affichera uniquement entre ces heures</Text>
            <View style={styles.gmtRow}>
              <View style={{flex:1}}>
                <Text style={styles.fieldLabel}>Heure debut GMT *</Text>
                <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowTimePickerMatch('debut')}>
                  <Text style={styles.pickerBtnText}>{matchForm.heure_debut_gmt||'00:00'} GMT</Text>
                  <Text style={styles.pickerArrow}>🕐</Text>
                </TouchableOpacity>
              </View>
              <View style={{width:12}} />
              <View style={{flex:1}}>
                <Text style={styles.fieldLabel}>Heure fin GMT *</Text>
                <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowTimePickerMatch('fin')}>
                  <Text style={styles.pickerBtnText}>{matchForm.heure_fin_gmt||'23:30'} GMT</Text>
                  <Text style={styles.pickerArrow}>🕐</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {/* Prévisualisation */}
          {matchForm.equipe_home && matchForm.equipe_away && (
            <View style={{marginTop:16,borderRadius:14,overflow:'hidden',borderWidth:1,borderColor:'#FF6B2B33'}}>
              <LinearGradient colors={['#1a1a2e','#FF6B2B22']} start={{x:0,y:0}} end={{x:1,y:1}} style={{padding:16}}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <View style={{backgroundColor:'#FF6B2B22',borderRadius:8,paddingHorizontal:8,paddingVertical:3,borderWidth:1,borderColor:'#FF6B2B44'}}>
                    <Text style={{color:'#FF6B2B',fontSize:10,fontWeight:'700'}}>⭐ MATCH DU JOUR</Text>
                  </View>
                  <Text style={{color:'#ffffff66',fontSize:10}}>{matchForm.sport}</Text>
                </View>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8,gap:6}}>
                  {matchForm.logo_home?<Image source={{uri:matchForm.logo_home}} style={{width:28,height:28,resizeMode:'contain'}} onError={function(){}}/>:null}
                  <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:15,flex:1}} numberOfLines={1}>{matchForm.equipe_home}</Text>
                  <Text style={{color:'#FFD700',fontFamily:'BebasNeue',fontSize:18,paddingHorizontal:4}}>VS</Text>
                  <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:15,flex:1,textAlign:'right'}} numberOfLines={1}>{matchForm.equipe_away}</Text>
                  {matchForm.logo_away?<Image source={{uri:matchForm.logo_away}} style={{width:28,height:28,resizeMode:'contain'}} onError={function(){}}/>:null}
                </View>
                {matchForm.competition?<Text style={{color:'#ffffff55',fontSize:10,marginBottom:6}}>{matchForm.competition}</Text>:null}
                <Text style={{color:'#FF6B2B',fontSize:11,fontWeight:'700'}}>Aperçu Kazmo →</Text>
              </LinearGradient>
            </View>
          )}

          <TouchableOpacity onPress={saveMatch} disabled={loading} activeOpacity={0.85} style={{marginTop:16}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}>
              {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.saveBtnText}>💾 Sauvegarder</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{setShowMatchForm(false);setEditingMatch(null);}} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
        </ScrollView>
      )}

      {tab==='events' && !showEventForm && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.eventInfoCard}>
            <Text style={styles.eventInfoTitle}>🎯 ÉVÉNEMENTS SPÉCIAUX</Text>
            <Text style={styles.eventInfoSub}>Wimbledon, Boxe, Athlétisme... Activez un événement pour faire apparaître une tuile dynamique dans l'app pendant la durée choisie.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={()=>{setEventForm(emptyEventForm);setEditingEvent(null);setShowEventForm(true);}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.addBtnGradient}>
              <Text style={styles.addBtnText}>🎯 Créer un Événement</Text>
            </LinearGradient>
          </TouchableOpacity>
          {eventList.length===0?(
            <View style={styles.center}><Text style={styles.comingSoonIcon}>🎯</Text><Text style={styles.comingSoonText}>Aucun événement créé</Text></View>
          ):eventList.map(function(event){
            const now=new Date().toISOString().slice(0,10);
            const isActive=event.actif&&event.date_debut<=now&&event.date_fin>=now;
            const isUpcoming=event.actif&&event.date_debut>now;
            return(
              <View key={event.id} style={[styles.eventCard,isActive&&styles.eventCardActive]}>
                <View style={styles.flashCardHeader}>
                  <Text style={styles.eventCardIcon}>{event.icon}</Text>
                  <Text style={styles.eventCardNom}>{event.nom}</Text>
                  <View style={[styles.statusBadge,{backgroundColor:isActive?'#4CAF5022':isUpcoming?'#FFD70022':'#ffffff11'}]}>
                    <Text style={[styles.statusText,{color:isActive?'#4CAF50':isUpcoming?'#FFD700':'#ffffff55'}]}>{isActive?'● ACTIF':isUpcoming?'⏳ À venir':'⏸ Inactif'}</Text>
                  </View>
                </View>
                <Text style={styles.eventCardDates}>📅 {event.date_debut} → {event.date_fin}</Text>
                {event.description?<Text style={styles.eventCardDesc} numberOfLines={2}>{event.description}</Text>:null}
                <View style={styles.flashCardActions}>
                  <TouchableOpacity onPress={()=>openEditEvent(event)} style={styles.actionBtn}><Text style={styles.actionBtnText}>✏️ Modifier</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>toggleEvent(event)} style={styles.actionBtn}><Text style={styles.actionBtnText}>{event.actif?'⏸ Désactiver':'▶️ Activer'}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>deleteEvent(event.id)} style={[styles.actionBtn,styles.actionBtnDanger]}><Text style={[styles.actionBtnText,{color:'#E53935'}]}>🗑 Supprimer</Text></TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {tab==='events' && showEventForm && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={()=>{setShowEventForm(false);setEditingEvent(null);}}><Text style={styles.formBack}>← Retour</Text></TouchableOpacity>
            <Text style={styles.formTitle}>{editingEvent?'Modifier Événement':'Nouvel Événement'}</Text>
          </View>
          <Text style={styles.fieldLabel}>Icône *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowIconPicker(true)}>
            <Text style={{fontSize:24}}>{eventForm.icon}</Text>
            <Text style={styles.pickerArrow}>▼ Choisir</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Nom de l'événement *</Text>
          <TextInput value={eventForm.nom} onChangeText={function(v){setEventForm({...eventForm,nom:v});}} style={styles.input} placeholder="Ex: Wimbledon 2026" placeholderTextColor="#ffffff44"/>
          <Text style={styles.fieldLabel}>Description (optionnel)</Text>
          <TextInput value={eventForm.description} onChangeText={function(v){setEventForm({...eventForm,description:v});}} style={[styles.input,styles.inputMultiline]} placeholder="Ex: Grand Chelem sur gazon, Londres" placeholderTextColor="#ffffff44" multiline numberOfLines={3}/>
          <Text style={styles.fieldLabel}>Date de début *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowDatePickerEvent('date_debut')}>
            <Text style={eventForm.date_debut?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{eventForm.date_debut||'Choisir une date...'}</Text>
            <Text style={styles.pickerArrow}>📅</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Date de fin *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowDatePickerEvent('date_fin')}>
            <Text style={eventForm.date_fin?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{eventForm.date_fin||'Choisir une date...'}</Text>
            <Text style={styles.pickerArrow}>📅</Text>
          </TouchableOpacity>
          <View style={[styles.input,{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10}]}>
            <Text style={styles.pickerBtnText}>Actif immédiatement</Text>
            <Switch value={eventForm.actif} onValueChange={function(v){setEventForm({...eventForm,actif:v});}} trackColor={{false:'#ffffff22',true:'#FF6B2B44'}} thumbColor={eventForm.actif?'#FF6B2B':'#ffffff55'} />
          </View>
          <TouchableOpacity onPress={saveEvent} disabled={loading} activeOpacity={0.85} style={{marginTop:16}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}>
              {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.saveBtnText}>💾 Sauvegarder</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{setShowEventForm(false);setEditingEvent(null);}} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
        </ScrollView>
      )}

      {tab==='ideas' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.ideasSection}>
            <Text style={styles.ideasSectionTitle}>🏆 CLASSEMENT DES VOTES</Text>
            {Object.keys(FEATURE_LABELS).sort(function(a,b){ return (voteCounts[b]||0) - (voteCounts[a]||0); }).map(function(featureId){
              const count = voteCounts[featureId] || 0;
              const maxVotes = Math.max(...Object.values(voteCounts).concat([1]));
              const pct = Math.round((count / maxVotes) * 100);
              return(<View key={featureId} style={styles.voteRankCard}><View style={styles.voteRankHeader}><Text style={styles.voteRankLabel}>{FEATURE_LABELS[featureId]}</Text><View style={styles.voteRankBadge}><Text style={styles.voteRankCount}>{count} ❤️</Text></View></View><View style={styles.voteBar}><View style={[styles.voteBarFill,{width:pct+'%'}]}/></View></View>);
            })}
          </View>
          <View style={styles.ideasSection}>
            <View style={styles.ideasSectionHeader}>
              <Text style={styles.ideasSectionTitle}>💡 SUGGESTIONS ({suggestionList.length})</Text>
              <TouchableOpacity onPress={fetchIdeas} style={styles.refreshBtn}><Text style={styles.refreshBtnText}>↻</Text></TouchableOpacity>
            </View>
            {suggestionList.length===0?(
              <View style={styles.center}><Text style={styles.comingSoonIcon}>💡</Text><Text style={styles.comingSoonText}>Aucune suggestion</Text></View>
            ):suggestionList.map(function(s){
              const date = new Date(s.created_at).toLocaleDateString('fr-FR');
              const flagMap = {fr:'🇫🇷',en:'🇬🇧',es:'🇪🇸',pt:'🇧🇷',de:'🇩🇪',it:'🇮🇹',ar:'🇸🇦',ru:'🇷🇺'};
              return(<View key={s.id} style={styles.suggestionCard}><View style={styles.suggestionCardHeader}><Text style={styles.suggestionFlag}>{flagMap[s.language]||'🌍'}</Text><Text style={styles.suggestionDate}>{date}</Text><TouchableOpacity onPress={()=>deleteSuggestion(s.id)} style={styles.deleteSuggBtn}><Text style={styles.deleteSuggBtnText}>🗑</Text></TouchableOpacity></View><Text style={styles.suggestionText}>{s.suggestion}</Text></View>);
            })}
          </View>
        </ScrollView>
      )}

      {tab==='flash' && !showForm && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.addBtn} onPress={()=>{setForm(emptyForm);setEditingFlash(null);setShowForm(true);}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.addBtnGradient}>
              <Text style={styles.addBtnText}>⚡ Nouveau Flash</Text>
            </LinearGradient>
          </TouchableOpacity>
          {loading?<View style={styles.center}><ActivityIndicator color="#FF6B2B"/></View>
          :flashList.map(function(flash){
            const now=new Date().toISOString().slice(0,10);
            const isActive=flash.actif&&flash.date_debut<=now&&flash.date_fin>=now;
            return(<View key={flash.id} style={[styles.flashCard,isActive&&styles.flashCardActive]}><View style={styles.flashCardHeader}><Text style={styles.flashCardSport}>{flash.sport}</Text><View style={[styles.statusBadge,{backgroundColor:isActive?'#4CAF5022':'#ffffff11'}]}><Text style={[styles.statusText,{color:isActive?'#4CAF50':flash.actif?'#FFD700':'#ffffff55'}]}>{isActive?'● ACTIF':flash.actif?'Programme':'Inactif'}</Text></View></View><Text style={styles.flashCardTitre}>{flash.titre_fr}</Text><Text style={styles.flashCardContenu} numberOfLines={2}>{flash.contenu_fr}</Text><Text style={styles.flashCardDates}>📅 {flash.date_debut} → {flash.date_fin}</Text>{flash.titre_en?<Text style={styles.translatedIndicator}>✅ Traduit en 7 langues</Text>:<Text style={styles.notTranslatedIndicator}>⚠️ Non traduit</Text>}<View style={styles.flashCardActions}><TouchableOpacity onPress={()=>openEdit(flash)} style={styles.actionBtn}><Text style={styles.actionBtnText}>✏️ Modifier</Text></TouchableOpacity><TouchableOpacity onPress={()=>toggleFlash(flash)} style={styles.actionBtn}><Text style={styles.actionBtnText}>{flash.actif?'⏸ Desactiver':'▶️ Activer'}</Text></TouchableOpacity><TouchableOpacity onPress={()=>deleteFlash(flash.id)} style={[styles.actionBtn,styles.actionBtnDanger]}><Text style={[styles.actionBtnText,{color:'#E53935'}]}>🗑 Supprimer</Text></TouchableOpacity></View></View>);
          })}
        </ScrollView>
      )}

      {tab==='flash' && showForm && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={()=>{setShowForm(false);setEditingFlash(null);}}><Text style={styles.formBack}>← Retour</Text></TouchableOpacity>
            <Text style={styles.formTitle}>{editingFlash?'Modifier Flash':'Nouveau Flash'}</Text>
          </View>
          <Text style={styles.fieldLabel}>Sport / Competition *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowSportPicker(true)}>
            <Text style={form.sport?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{form.sport||'Choisir un sport...'}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          <View style={{backgroundColor:'#FF6B2B11',borderRadius:12,padding:12,marginBottom:12,borderWidth:1,borderColor:'#FF6B2B33'}}>
            <Text style={{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:11,letterSpacing:1,marginBottom:8}}>🤖 GÉNÉRER AVEC KAZMO IA</Text>
            <TextInput value={flashSujet} onChangeText={setFlashSujet} style={[styles.input,{marginBottom:8}]} placeholder="Ex: Coupe du Monde 2026 commence au Canada..." placeholderTextColor="#ffffff44" multiline/>
            <TouchableOpacity onPress={generateFlash} disabled={flashGenerating||!flashSujet.trim()} activeOpacity={0.85}>
              <LinearGradient colors={flashGenerating?['#444','#555']:['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={[styles.saveBtn,{padding:10}]}>
                {flashGenerating?<><ActivityIndicator color="#fff" size="small"/><Text style={styles.saveBtnText}> Génération...</Text></>:<Text style={styles.saveBtnText}>⚡ GÉNÉRER</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>Titre en francais *</Text>
          <TextInput value={form.titre_fr} onChangeText={function(v){setForm({...form,titre_fr:v});}} style={styles.input} placeholder="Ex: LA COUPE DU MONDE EST LANCEE" placeholderTextColor="#ffffff44" autoCapitalize="characters"/>
          <Text style={styles.fieldLabel}>Contenu en francais *</Text>
          <TextInput value={form.contenu_fr} onChangeText={function(v){setForm({...form,contenu_fr:v});}} style={[styles.input,styles.inputMultiline]} placeholder="Analyse percutante en 2-3 phrases..." placeholderTextColor="#ffffff44" multiline numberOfLines={4}/>
          <TouchableOpacity onPress={translateFlash} disabled={translating} activeOpacity={0.85} style={{marginTop:10,marginBottom:8}}>
            <LinearGradient colors={translating?['#444','#555']:['#1D428A','#00B8D9']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.translateBtn}>
              {translating?<><ActivityIndicator color="#fff" size="small"/><Text style={styles.translateBtnText}> Traduction...</Text></>:<Text style={styles.translateBtnText}>🌍 Traduire en 7 langues</Text>}
            </LinearGradient>
          </TouchableOpacity>
          {form.titre_en?<View style={styles.translatedBadge}><Text style={styles.translatedBadgeText}>✅ Traduit : EN · ES · PT · DE · IT · AR · RU</Text></View>:null}
          <Text style={styles.fieldLabel}>Date debut *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowDatePicker('date_debut')}>
            <Text style={form.date_debut?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{form.date_debut||'Choisir une date...'}</Text>
            <Text style={styles.pickerArrow}>📅</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Date fin *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowDatePicker('date_fin')}>
            <Text style={form.date_fin?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{form.date_fin||'Choisir une date...'}</Text>
            <Text style={styles.pickerArrow}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={saveFlash} disabled={loading} activeOpacity={0.85} style={{marginTop:16}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}>
              {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.saveBtnText}>💾 Sauvegarder</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{setShowForm(false);setEditingFlash(null);}} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
        </ScrollView>
      )}

      {tab==='admins' && adminData?.is_super_admin && !showAddAdmin && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.addBtn} onPress={()=>setShowAddAdmin(true)}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.addBtnGradient}>
              <Text style={styles.addBtnText}>👤 Ajouter un admin</Text>
            </LinearGradient>
          </TouchableOpacity>
          {adminList.map(function(admin){
            return(<View key={admin.id} style={styles.adminCard}><View style={styles.adminCardLeft}><Text style={styles.adminName}>{admin.name} {admin.is_super_admin?'👑':''}</Text><Text style={styles.adminEmail}>{admin.email}</Text><View style={[styles.statusBadge,{backgroundColor:admin.actif?'#4CAF5022':'#ffffff11',alignSelf:'flex-start',marginTop:4}]}><Text style={[styles.statusText,{color:admin.actif?'#4CAF50':'#ffffff55'}]}>{admin.actif?'● Actif':'⏸ Inactif'}</Text></View></View>{!admin.is_super_admin&&(<View style={styles.adminActions}><TouchableOpacity onPress={()=>toggleAdmin(admin)} style={styles.actionBtn}><Text style={styles.actionBtnText}>{admin.actif?'⏸':'▶️'}</Text></TouchableOpacity><TouchableOpacity onPress={()=>deleteAdmin(admin)} style={[styles.actionBtn,styles.actionBtnDanger]}><Text style={[styles.actionBtnText,{color:'#E53935'}]}>🗑</Text></TouchableOpacity></View>)}</View>);
          })}
        </ScrollView>
      )}

      {tab==='admins' && showAddAdmin && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={()=>setShowAddAdmin(false)}><Text style={styles.formBack}>← Retour</Text></TouchableOpacity>
            <Text style={styles.formTitle}>Nouvel Admin</Text>
          </View>
          <Text style={styles.fieldLabel}>Sélectionner un utilisateur</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={function(){loadAllUsers();setShowUserPickerAdmin(true);}}>
            <Text style={newAdmin.email?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{newAdmin.email||'Choisir depuis la liste users...'}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          {newAdmin.email&&<View style={{backgroundColor:'#4CAF5011',borderRadius:8,padding:8,marginBottom:8,borderWidth:1,borderColor:'#4CAF5033'}}><Text style={{color:'#4CAF50',fontSize:11}}>✅ {newAdmin.name} — {newAdmin.email}</Text></View>}
          <Text style={styles.fieldLabel}>Nom complet</Text>
          <TextInput value={newAdmin.name} onChangeText={function(v){setNewAdmin({...newAdmin,name:v});}} style={styles.input} placeholder="Ex: Marie Dupont" placeholderTextColor="#ffffff44"/>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput value={newAdmin.email} onChangeText={function(v){setNewAdmin({...newAdmin,email:v});}} style={styles.input} placeholder="marie@kazmo.live" placeholderTextColor="#ffffff44" autoCapitalize="none" keyboardType="email-address"/>
          <Text style={styles.fieldLabel}>Code PIN (4 chiffres)</Text>
          <TextInput value={newAdmin.pin} onChangeText={function(v){setNewAdmin({...newAdmin,pin:v});}} style={styles.input} placeholder="1234" placeholderTextColor="#ffffff44" keyboardType="numeric" maxLength={4} secureTextEntry/>
          <TouchableOpacity onPress={addAdmin} activeOpacity={0.85} style={{marginTop:16}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}><Text style={styles.saveBtnText}>✅ Ajouter</Text></LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setShowAddAdmin(false)} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
        </ScrollView>
      )}

      {tab==='stats' && <StatsTab />}

      {/* ── NOTIFS AVEC FILTRES LANGUE + SPORT ── */}
      {tab==='notifs' && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.notifStatsCard}>
            <Text style={styles.notifStatsIcon}>📱</Text>
            <View style={{flex:1}}>
              <Text style={styles.notifStatsValue}>{tokenCount}</Text>
              <Text style={styles.notifStatsSub}>utilisateurs total</Text>
            </View>
            {(notifLangFilter.length > 0 || notifSportFilter.length > 0) && (
              <View style={styles.notifFilteredBadge}>
                <Text style={styles.notifFilteredText}>🎯 {filteredCount} ciblés</Text>
              </View>
            )}
            <TouchableOpacity onPress={fetchTokenCount} style={styles.refreshBtn}><Text style={styles.refreshBtnText}>↻</Text></TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>🌍 CIBLER PAR LANGUE (optionnel)</Text>
          <Text style={styles.notifFilterSub}>Laisse vide pour envoyer à toutes les langues</Text>
          <View style={styles.notifFilterGrid}>
            {Object.keys(LANG_FLAGS).map(function(lang) {
              const selected = notifLangFilter.includes(lang);
              return (
                <TouchableOpacity key={lang} style={[styles.notifFilterChip, selected && styles.notifFilterChipLang]}
                  onPress={function() {
                    const newFilter = selected ? notifLangFilter.filter(function(l){return l!==lang;}) : [...notifLangFilter, lang];
                    setNotifLangFilter(newFilter);
                    fetchFilteredCount(newFilter, notifSportFilter);
                  }}>
                  <Text style={styles.notifFilterFlag}>{LANG_FLAGS[lang]}</Text>
                  <Text style={[styles.notifFilterLabel, selected && {color:'#fff'}]}>{lang.toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, {marginTop:12}]}>🏆 CIBLER PAR SPORT (optionnel)</Text>
          <Text style={styles.notifFilterSub}>Laisse vide pour envoyer à tous les sports</Text>
          <View style={styles.notifFilterGrid}>
            {NOTIF_SPORTS.map(function(sport) {
              const selected = notifSportFilter.includes(sport.id);
              return (
                <TouchableOpacity key={sport.id} style={[styles.notifFilterChip, selected && styles.notifFilterChipSport]}
                  onPress={function() {
                    const newFilter = selected ? notifSportFilter.filter(function(s){return s!==sport.id;}) : [...notifSportFilter, sport.id];
                    setNotifSportFilter(newFilter);
                    fetchFilteredCount(notifLangFilter, newFilter);
                  }}>
                  <Text style={{fontSize:14}}>{sport.icon}</Text>
                  <Text style={[styles.notifFilterLabel, selected && {color:'#fff'}]}>{sport.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, {marginTop:12}]}>⏰ PROGRAMMER (optionnel)</Text>
          <Text style={styles.notifFilterSub}>Laisse vide pour envoyer immédiatement</Text>
          <View style={{flexDirection:'row',gap:10,marginBottom:8}}>
            <View style={{flex:1}}>
              <TouchableOpacity onPress={function(){setShowNotifDatePicker(true);}} style={[styles.input,styles.pickerBtn]}>
                <Text style={notifDate?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{notifDate||'📅 Date...'}</Text>
                <Text style={styles.pickerArrow}>📅</Text>
              </TouchableOpacity>
            </View>
            <View style={{flex:1}}>
              <TouchableOpacity onPress={function(){setShowNotifTimePicker(true);}} style={[styles.input,styles.pickerBtn]}>
                <Text style={notifHeure?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{notifHeure?notifHeure+' GMT':'🕐 Heure GMT...'}</Text>
                <Text style={styles.pickerArrow}>🕐</Text>
              </TouchableOpacity>
            </View>
          </View>
          {notifDate&&notifHeure&&(<View style={{backgroundColor:'#FFD70022',borderRadius:8,padding:8,marginBottom:8,borderWidth:1,borderColor:'#FFD70044'}}><Text style={{color:'#FFD700',fontSize:11,fontFamily:'BebasNeue'}}>⏰ PLANIFIÉ : {notifDate} à {notifHeure} GMT</Text></View>)}
          {(notifDate||notifHeure)&&(<TouchableOpacity onPress={function(){setNotifDate('');setNotifHeure('');}} style={{alignItems:'center',marginBottom:8}}><Text style={{color:'#E53935',fontSize:11}}>✕ Effacer date/heure</Text></TouchableOpacity>)}

          <Text style={[styles.fieldLabel, {marginTop:12}]}>Titre de la notification *</Text>
          <TextInput value={notifTitre} onChangeText={setNotifTitre} style={styles.input} placeholder="Ex: MATCH DU JOUR — Real vs PSG ce soir !" placeholderTextColor="#ffffff44" maxLength={100}/>
          <Text style={styles.fieldLabel}>Message *</Text>
          <TextInput value={notifCorps} onChangeText={setNotifCorps} style={[styles.input, styles.inputMultiline]} placeholder="Ex: Ce soir a 21h, le choc des titans !" placeholderTextColor="#ffffff44" multiline numberOfLines={4} maxLength={200}/>

          <TouchableOpacity onPress={translateNotif} disabled={notifTranslating} activeOpacity={0.85} style={{marginTop:10,marginBottom:8}}>
            <LinearGradient colors={notifTranslating?['#444','#555']:['#1D428A','#00B8D9']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.translateBtn}>
              {notifTranslating?<><ActivityIndicator color="#fff" size="small"/><Text style={styles.translateBtnText}> Traduction...</Text></>:<Text style={styles.translateBtnText}>🌍 Traduire en 7 langues</Text>}
            </LinearGradient>
          </TouchableOpacity>
          {notifTranslations&&<View style={styles.translatedBadge}><Text style={styles.translatedBadgeText}>✅ Traduit : EN · ES · PT · DE · IT · AR · RU</Text></View>}

          <View style={styles.notifInfoCard}>
            <Text style={styles.notifInfoText}>
              {notifLangFilter.length === 0 && notifSportFilter.length === 0
                ? '💡 Envoi à TOUS les ' + tokenCount + ' utilisateurs dans leur langue.'
                : '🎯 Envoi ciblé à ' + filteredCount + ' utilisateurs · Langue: ' + (notifLangFilter.length>0?notifLangFilter.join(', '):'toutes') + ' · Sport: ' + (notifSportFilter.length>0?notifSportFilter.join(', '):'tous')}
            </Text>
          </View>

          <TouchableOpacity onPress={sendNotifications} disabled={notifSending} activeOpacity={0.85} style={{marginTop:8}}>
            <LinearGradient colors={notifSending?['#444','#555']:(notifDate&&notifHeure)?['#9C27B0','#673AB7']:['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}>
              {notifSending?<><ActivityIndicator color="#fff" size="small"/><Text style={styles.saveBtnText}> En cours...</Text></> : (notifDate&&notifHeure)?<Text style={styles.saveBtnText}>⏰ PLANIFIER POUR {notifHeure} GMT</Text>:<Text style={styles.saveBtnText}>🔔 Envoyer ({(notifLangFilter.length>0||notifSportFilter.length>0)?filteredCount:tokenCount})</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {(notifLangFilter.length > 0 || notifSportFilter.length > 0) && (
            <TouchableOpacity onPress={function(){setNotifLangFilter([]);setNotifSportFilter([]);}} style={[styles.cancelBtn,{marginTop:8}]}>
              <Text style={styles.cancelBtnText}>✕ Réinitialiser les filtres</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── USERS ── */}
      {tab==='users' && (
        <UsersTab />
      )}

      {/* ── HISTORIQUE NOTIFICATIONS ── */}
      {tab==='historique' && (
        <HistoriqueTab />
      )}

      {/* ── PLANIFIER NOTIFICATIONS ── */}
      {tab==='planifier' && (
        <PlanifierTab />
      )}

      <Modal visible={showSportPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir un sport</Text>
          <ScrollView>{SPORTS_OPTIONS.map(function(sport){ return(<TouchableOpacity key={sport} style={[styles.sportOption,form.sport===sport&&styles.sportOptionSelected]} onPress={()=>{setForm({...form,sport});setShowSportPicker(false);}}><Text style={[styles.sportOptionText,form.sport===sport&&{color:'#FF6B2B'}]}>{sport}</Text>{form.sport===sport&&<Text style={{color:'#FF6B2B'}}>✓</Text>}</TouchableOpacity>); })}</ScrollView>
          <TouchableOpacity onPress={()=>setShowSportPicker(false)} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={showSportPickerMatch} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir un sport</Text>
          <ScrollView>{SPORTS_OPTIONS.map(function(sport){ return(<TouchableOpacity key={sport} style={[styles.sportOption,matchForm.sport===sport&&styles.sportOptionSelected]} onPress={()=>{setMatchForm({...matchForm,sport,equipe_home:'',equipe_away:'',logo_home:'',logo_away:''});setShowSportPickerMatch(false);}}><Text style={[styles.sportOptionText,matchForm.sport===sport&&{color:'#FF6B2B'}]}>{sport}</Text>{matchForm.sport===sport&&<Text style={{color:'#FF6B2B'}}>✓</Text>}</TouchableOpacity>); })}</ScrollView>
          <TouchableOpacity onPress={()=>setShowSportPickerMatch(false)} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={showIconPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir une icône</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,padding:8,justifyContent:'center'}}>
            {EVENT_ICONS.map(function(icon){
              const selected = eventForm.icon === icon;
              return(<TouchableOpacity key={icon} style={[{width:50,height:50,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#16162a',borderWidth:1,borderColor:'#ffffff22'},selected&&{borderColor:'#FF6B2B',backgroundColor:'#FF6B2B22'}]} onPress={()=>{setEventForm({...eventForm,icon});setShowIconPicker(false);}}><Text style={{fontSize:26}}>{icon}</Text></TouchableOpacity>);
            })}
          </View>
          <TouchableOpacity onPress={()=>setShowIconPicker(false)} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {showTeamPicker && (<TeamPicker sport={matchForm.sport} onSelect={function(name, logo){ if(showTeamPicker==='home'){setMatchForm(function(prev){return {...prev,equipe_home:name,logo_home:logo};});}else{setMatchForm(function(prev){return {...prev,equipe_away:name,logo_away:logo};});} }} onClose={() => setShowTeamPicker(null)} />)}
      {showTimePickerMatch==='debut'&&(<TimePicker title="Heure debut" value={matchForm.heure_debut_gmt} onSelect={function(h){setMatchForm(function(p){return {...p,heure_debut_gmt:h};});}} onClose={()=>setShowTimePickerMatch(null)}/>)}
      {showTimePickerMatch==='fin'&&(<TimePicker title="Heure fin" value={matchForm.heure_fin_gmt} onSelect={function(h){setMatchForm(function(p){return {...p,heure_fin_gmt:h};});}} onClose={()=>setShowTimePickerMatch(null)}/>)}
      {showTimePickerMatch==='flash_debut'&&(<TimePicker title="Heure debut Flash" value={form.heure_debut_gmt} onSelect={function(h){setForm(function(p){return {...p,heure_debut_gmt:h};});}} onClose={()=>setShowTimePickerMatch(null)}/>)}
      {showTimePickerMatch==='flash_fin'&&(<TimePicker title="Heure fin Flash" value={form.heure_fin_gmt} onSelect={function(h){setForm(function(p){return {...p,heure_fin_gmt:h};});}} onClose={()=>setShowTimePickerMatch(null)}/>)}
      {showDatePicker==='date_debut'&&<CalendarPicker field="date_debut" value={form.date_debut} onSelect={function(f,v){setForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePicker(null)}/>}
      {showDatePicker==='date_fin'&&<CalendarPicker field="date_fin" value={form.date_fin} onSelect={function(f,v){setForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePicker(null)}/>}
      {showDatePickerMatch==='date_affichage'&&<CalendarPicker field="date_affichage" value={matchForm.date_affichage} onSelect={function(f,v){setMatchForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePickerMatch(null)}/>}
      {showDatePickerMatch==='date_match'&&<CalendarPicker field="date_match" value={matchForm.date_match} onSelect={function(f,v){setMatchForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePickerMatch(null)}/>}
      {showDatePickerEvent==='date_debut'&&<CalendarPicker field="date_debut" value={eventForm.date_debut} onSelect={function(f,v){setEventForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePickerEvent(null)}/>}
      {showDatePickerEvent==='date_fin'&&<CalendarPicker field="date_fin" value={eventForm.date_fin} onSelect={function(f,v){setEventForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePickerEvent(null)}/>}
      {showNotifDatePicker&&<CalendarPicker field="notif_date" value={notifDate} onSelect={function(f,v){setNotifDate(v);}} onClose={()=>setShowNotifDatePicker(null)}/>}
      {showNotifTimePicker&&<TimePicker title="Heure d'envoi" value={notifHeure} onSelect={setNotifHeure} onClose={()=>setShowNotifTimePicker(null)}/>}

      {showUserPickerAdmin && (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}><View style={styles.teamPickerContent}>
            <Text style={styles.modalTitle}>Choisir un utilisateur</Text>
            <ScrollView style={{maxHeight:400}}>
              {allUsers.map(function(u,i) {
                const name = [u.first_name,u.last_name].filter(Boolean).join(' ')||u.email||'Sans nom';
                return(
                  <TouchableOpacity key={i} style={styles.teamOption} onPress={function(){
                    setNewAdmin({...newAdmin, email:u.email||'', name:name});
                    setShowUserPickerAdmin(false);
                  }}>
                    <View style={styles.teamOptionLogoPlaceholder}><Text style={{fontSize:16}}>👤</Text></View>
                    <View style={{flex:1}}>
                      <Text style={styles.teamOptionText}>{name}</Text>
                      <Text style={{color:'#ffffff44',fontSize:11}}>{u.email}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={()=>setShowUserPickerAdmin(false)} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
          </View></View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#080814'},
  pinScreen:{flex:1,alignItems:'center',justifyContent:'center',padding:40},
  pinIcon:{fontSize:48,marginBottom:8},
  pinTitle:{color:'#FFD700',fontFamily:'BebasNeue',fontSize:28,letterSpacing:3,marginBottom:4},
  pinSubtitle:{color:'#ffffff88',fontSize:11,marginBottom:4},
  pinHint:{color:'#ffffff55',fontSize:12,marginBottom:24},
  pinDisplay:{flexDirection:'row',gap:16,marginBottom:32},
  pinDot:{width:16,height:16,borderRadius:8,borderWidth:2,borderColor:'#ffffff44'},
  pinDotFilled:{backgroundColor:'#FF6B2B',borderColor:'#FF6B2B'},
  pinGrid:{flexDirection:'row',flexWrap:'wrap',width:240,gap:8,justifyContent:'center'},
  pinKey:{width:72,height:72,borderRadius:36,backgroundColor:'#16162a',borderWidth:1,borderColor:'#ffffff22',alignItems:'center',justifyContent:'center'},
  pinKeyText:{color:'#fff',fontSize:22,fontFamily:'BebasNeue'},
  pinCancel:{marginTop:24},
  pinCancelText:{color:'#ffffff55',fontSize:14},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,paddingBottom:8},
  headerLeft:{flexDirection:'row',alignItems:'center',gap:10},
  headerIcon:{fontSize:22},
  headerTitle:{color:'#FFD700',fontFamily:'BebasNeue',fontSize:16,letterSpacing:2},
  headerSub:{color:'#ffffff55',fontSize:10},
  closeBtn:{backgroundColor:'#ffffff14',borderRadius:8,paddingHorizontal:12,paddingVertical:6},
  closeBtnText:{color:'#ffffff88',fontSize:12},
  tabBar:{flexDirection:'row',gap:6},
  tabGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginHorizontal:16,marginBottom:12},
  tabGridBtn:{paddingHorizontal:12,paddingVertical:8,borderRadius:10,backgroundColor:'#16162a',borderWidth:1,borderColor:'#ffffff22',minWidth:'30%',alignItems:'center'},
  tabBtn:{paddingHorizontal:14,paddingVertical:8,borderRadius:10,backgroundColor:'#16162a',borderWidth:1,borderColor:'#ffffff22'},
  tabBtnActive:{backgroundColor:'#FF6B2B',borderColor:'#FF6B2B'},
  tabBtnText:{color:'#ffffff55',fontFamily:'BebasNeue',fontSize:11},
  tabBtnTextActive:{color:'#fff'},
  scroll:{padding:16,paddingBottom:40},
  formHeader:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:16},
  formBack:{color:'#FF6B2B',fontSize:14,fontWeight:'700'},
  formTitle:{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1},
  addBtn:{marginBottom:12},
  addBtnGradient:{borderRadius:12,padding:14,alignItems:'center'},
  addBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1},
  eventInfoCard:{backgroundColor:'#FF6B2B11',borderRadius:12,padding:14,marginBottom:12,borderWidth:1,borderColor:'#FF6B2B33'},
  eventInfoTitle:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1,marginBottom:4},
  eventInfoSub:{color:'#ffffffcc',fontSize:11,lineHeight:16},
  eventCard:{backgroundColor:'#16162a',borderRadius:12,padding:14,marginBottom:10,borderWidth:1,borderColor:'#ffffff14'},
  eventCardActive:{borderColor:'#FF6B2B44'},
  eventCardIcon:{fontSize:24,marginRight:6},
  eventCardNom:{color:'#fff',fontFamily:'BebasNeue',fontSize:14,flex:1},
  eventCardDates:{color:'#ffffff55',fontSize:10,marginBottom:4,marginTop:4},
  eventCardDesc:{color:'#ffffffcc',fontSize:11,marginBottom:6},
  ideasSection:{marginBottom:20},
  ideasSectionHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},
  ideasSectionTitle:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2,marginBottom:10},
  voteRankCard:{backgroundColor:'#16162a',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'#ffffff14'},
  voteRankHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},
  voteRankLabel:{color:'#fff',fontSize:12,flex:1},
  voteRankBadge:{backgroundColor:'#FF6B2B22',borderRadius:8,paddingHorizontal:8,paddingVertical:2},
  voteRankCount:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:12},
  voteBar:{height:4,backgroundColor:'#ffffff11',borderRadius:2,overflow:'hidden'},
  voteBarFill:{height:4,backgroundColor:'#FF6B2B',borderRadius:2},
  suggestionCard:{backgroundColor:'#16162a',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'#ffffff14'},
  suggestionCardHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
  suggestionFlag:{fontSize:16},
  suggestionDate:{color:'#ffffff55',fontSize:10,flex:1},
  deleteSuggBtn:{backgroundColor:'#E5393511',borderRadius:6,padding:4},
  deleteSuggBtnText:{fontSize:12},
  suggestionText:{color:'#ffffffcc',fontSize:12,lineHeight:18},
  matchCard:{backgroundColor:'#16162a',borderRadius:12,padding:14,marginBottom:10,borderWidth:1,borderColor:'#ffffff14'},
  matchCardToday:{borderColor:'#FF6B2B44'},
  matchDateBadge:{backgroundColor:'#ffffff11',borderRadius:6,paddingHorizontal:8,paddingVertical:2},
  matchDateText:{color:'#ffffffcc',fontSize:10,fontFamily:'BebasNeue'},
  todayBadge:{backgroundColor:'#FF6B2B22',borderRadius:6,paddingHorizontal:8,paddingVertical:2},
  todayBadgeText:{color:'#FF6B2B',fontSize:9,fontWeight:'700',fontFamily:'BebasNeue'},
  matchSport:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:12,letterSpacing:1,marginTop:6},
  matchTeamsRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:4},
  matchTeams:{color:'#fff',fontFamily:'BebasNeue',fontSize:14,flex:1},
  matchLogo:{width:24,height:24,resizeMode:'contain'},
  matchComp:{color:'#ffffff55',fontSize:10,marginTop:2},
  gmtRow:{flexDirection:'row',alignItems:'center',marginTop:6,gap:8},
  gmtText:{color:'#00B8D9',fontSize:10,fontFamily:'BebasNeue',letterSpacing:0.5},
  gmtSection:{backgroundColor:'#1D428A22',borderRadius:12,padding:14,marginTop:12,marginBottom:4,borderWidth:1,borderColor:'#1D428A44'},
  gmtSectionTitle:{color:'#00B8D9',fontFamily:'BebasNeue',fontSize:12,letterSpacing:1,marginBottom:4},
  gmtSectionSub:{color:'#ffffff55',fontSize:10,marginBottom:10},
  flashCard:{backgroundColor:'#16162a',borderRadius:12,padding:14,marginBottom:10,borderWidth:1,borderColor:'#ffffff14'},
  flashCardActive:{borderColor:'#FF6B2B44'},
  flashCardHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6,flexWrap:'wrap',gap:4},
  flashCardSport:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:12,letterSpacing:1},
  statusBadge:{borderRadius:6,paddingHorizontal:8,paddingVertical:2},
  statusText:{fontSize:9,fontWeight:'700',fontFamily:'BebasNeue'},
  flashCardTitre:{color:'#fff',fontFamily:'BebasNeue',fontSize:14,marginBottom:4},
  flashCardContenu:{color:'#ffffffcc',fontSize:11,lineHeight:16,marginBottom:6},
  flashCardDates:{color:'#ffffff55',fontSize:10,marginBottom:4},
  translatedIndicator:{color:'#4CAF50',fontSize:9,fontFamily:'BebasNeue',marginBottom:8},
  notTranslatedIndicator:{color:'#FFD700',fontSize:9,fontFamily:'BebasNeue',marginBottom:8},
  flashCardActions:{flexDirection:'row',gap:6,flexWrap:'wrap'},
  actionBtn:{backgroundColor:'#ffffff0a',borderRadius:8,paddingHorizontal:10,paddingVertical:6},
  actionBtnDanger:{backgroundColor:'#E5393511'},
  actionBtnText:{color:'#ffffffcc',fontSize:10},
  adminCard:{backgroundColor:'#16162a',borderRadius:12,padding:14,marginBottom:8,borderWidth:1,borderColor:'#ffffff14',flexDirection:'row',alignItems:'center'},
  adminCardLeft:{flex:1},
  adminName:{color:'#fff',fontSize:14,fontWeight:'600'},
  adminEmail:{color:'#ffffff88',fontSize:11,marginTop:2},
  adminActions:{flexDirection:'row',gap:6},
  center:{flex:1,alignItems:'center',justifyContent:'center',gap:8},
  comingSoonIcon:{fontSize:40},
  comingSoonText:{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1},
  fieldLabel:{color:'#ffffffcc',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6,marginTop:10},
  input:{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,color:'#fff',fontSize:13,borderWidth:1,borderColor:'#ffffff22'},
  inputMultiline:{height:100,textAlignVertical:'top'},
  pickerBtn:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  pickerBtnText:{color:'#fff',fontSize:13},
  pickerBtnPlaceholder:{color:'#ffffff44',fontSize:13},
  pickerArrow:{color:'#ffffff55',fontSize:12},
  translateBtn:{borderRadius:12,padding:14,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8},
  translateBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:13,letterSpacing:0.5},
  translatedBadge:{backgroundColor:'#4CAF5022',borderRadius:8,padding:8,marginBottom:8,borderWidth:1,borderColor:'#4CAF5044'},
  translatedBadgeText:{color:'#4CAF50',fontSize:10,fontFamily:'BebasNeue',letterSpacing:0.5},
  saveBtn:{borderRadius:12,padding:14,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8},
  saveBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1},
  cancelBtn:{backgroundColor:'#ffffff0a',borderRadius:12,padding:14,alignItems:'center'},
  cancelBtnText:{color:'#ffffff66',fontFamily:'BebasNeue',fontSize:14},
  modalOverlay:{flex:1,backgroundColor:'#000000aa',justifyContent:'flex-end'},
  modalContent:{backgroundColor:'#16162a',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,maxHeight:'80%'},
  modalTitle:{color:'#fff',fontFamily:'BebasNeue',fontSize:18,letterSpacing:2,textAlign:'center',marginBottom:16},
  sportOption:{padding:14,borderBottomWidth:1,borderBottomColor:'#ffffff11',flexDirection:'row',justifyContent:'space-between'},
  sportOptionSelected:{backgroundColor:'#FF6B2B11'},
  sportOptionText:{color:'#fff',fontSize:14},
  teamPickerContent:{backgroundColor:'#16162a',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,maxHeight:'85%'},
  searchInput:{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,color:'#fff',fontSize:13,borderWidth:1,borderColor:'#ffffff22',marginBottom:12},
  teamOption:{flexDirection:'row',alignItems:'center',gap:12,padding:12,borderBottomWidth:1,borderBottomColor:'#ffffff0a'},
  teamOptionLogo:{width:32,height:32,resizeMode:'contain'},
  teamOptionLogoPlaceholder:{width:32,height:32,borderRadius:16,backgroundColor:'#ffffff11',alignItems:'center',justifyContent:'center'},
  teamOptionText:{color:'#fff',fontSize:13,flex:1},
  addCustomBtn:{margin:16,padding:14,backgroundColor:'#FF6B2B22',borderRadius:12,alignItems:'center',borderWidth:1,borderColor:'#FF6B2B44'},
  addCustomBtnText:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:13,letterSpacing:1},
  customForm:{padding:16,backgroundColor:'#0d0d1a',borderRadius:12,margin:8},
  customConfirmBtn:{backgroundColor:'#FF6B2B',borderRadius:10,padding:12,alignItems:'center',marginTop:8},
  customConfirmBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:13,letterSpacing:1},
  notifStatsCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#16162a',borderRadius:12,padding:16,marginBottom:8,borderWidth:1,borderColor:'#ffffff14'},
  notifStatsIcon:{fontSize:28},
  notifStatsValue:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:28,letterSpacing:1},
  notifStatsSub:{color:'#ffffff55',fontSize:10},
  refreshBtn:{marginLeft:'auto',backgroundColor:'#ffffff0a',borderRadius:8,width:36,height:36,alignItems:'center',justifyContent:'center'},
  refreshBtnText:{color:'#FF6B2B',fontSize:18,fontWeight:'700'},
  notifInfoCard:{backgroundColor:'#1D428A22',borderRadius:10,padding:12,marginTop:8,borderWidth:1,borderColor:'#1D428A44'},
  notifInfoText:{color:'#ffffffcc',fontSize:11,lineHeight:18},
  notifFilterSub:{color:'#ffffff44',fontSize:10,marginBottom:8,marginTop:-4},
  notifFilterGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},
  notifFilterChip:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#16162a',borderRadius:10,paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderColor:'#ffffff22'},
  notifFilterChipLang:{backgroundColor:'#1D428A',borderColor:'#1D428A'},
  notifFilterChipSport:{backgroundColor:'#FF6B2B',borderColor:'#FF6B2B'},
  notifFilterFlag:{fontSize:14},
  notifFilterLabel:{color:'#ffffff88',fontFamily:'BebasNeue',fontSize:11},
  notifFilteredBadge:{backgroundColor:'#FF6B2B22',borderRadius:8,paddingHorizontal:10,paddingVertical:4,borderWidth:1,borderColor:'#FF6B2B44'},
  notifFilteredText:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:11},
  calOverlay:{flex:1,backgroundColor:'#000000aa',alignItems:'center',justifyContent:'center'},
  calBox:{backgroundColor:'#16162a',borderRadius:16,padding:16,width:320,borderWidth:1,borderColor:'#ffffff22'},
  calHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},
  calNav:{color:'#FF6B2B',fontSize:24,fontWeight:'700',paddingHorizontal:8},
  calMonth:{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1},
  calDayNames:{flexDirection:'row',marginBottom:8},
  calDayName:{width:40,textAlign:'center',color:'#ffffff55',fontSize:11,fontWeight:'700'},
  calGrid:{flexDirection:'row',flexWrap:'wrap'},
  calDay:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:20},
  calDaySelected:{backgroundColor:'#FF6B2B'},
  calDayText:{color:'#fff',fontSize:13},
  calCancel:{marginTop:12,padding:12,alignItems:'center'},
  calCancelText:{color:'#ffffff55',fontSize:13},
  statsLoadingContainer:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
  statsLoadingText:{color:'#ffffff55',fontFamily:'BebasNeue',fontSize:13,letterSpacing:1},
  statsHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},
  statsSectionTitle:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2},
  statsRow:{flexDirection:'row',gap:10,marginBottom:10},
  statsKpiCard:{flex:1,backgroundColor:'#16162a',borderRadius:14,padding:14,alignItems:'center',borderWidth:1,gap:4},
  statsKpiIcon:{fontSize:22},
  statsKpiValue:{fontFamily:'BebasNeue',fontSize:32,letterSpacing:1},
  statsKpiLabel:{color:'#ffffff55',fontSize:10,fontFamily:'BebasNeue',letterSpacing:0.5,textAlign:'center'},
  statsFullCard:{backgroundColor:'#16162a',borderRadius:14,padding:14,marginBottom:10,borderWidth:1,borderColor:'#ffffff14'},
  statsFullCardHeader:{flexDirection:'row',alignItems:'center',gap:10},
  statsFullCardIcon:{fontSize:20},
  statsFullCardLabel:{color:'#ffffffcc',fontSize:12,flex:1},
  statsBadge:{borderRadius:8,paddingHorizontal:10,paddingVertical:3},
  statsBadgeText:{fontSize:10,fontFamily:'BebasNeue',letterSpacing:0.5},
  statsSection:{marginBottom:20},
  statsBarRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8},
  statsBarFlag:{fontSize:16,width:24,textAlign:'center'},
  statsBarLang:{color:'#ffffff88',fontFamily:'BebasNeue',fontSize:10,width:22},
  statsBarTrack:{flex:1,height:6,backgroundColor:'#ffffff11',borderRadius:3,overflow:'hidden'},
  statsBarFill:{height:6,borderRadius:3},
  statsBarCount:{color:'#fff',fontFamily:'BebasNeue',fontSize:11,width:28,textAlign:'right'},
  statsBarPct:{color:'#ffffff55',fontSize:9,width:30,textAlign:'right'},
  statsEmpty:{color:'#ffffff44',fontSize:11,fontStyle:'italic',textAlign:'center',marginTop:8},
  statsVoteCard:{backgroundColor:'#16162a',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'#ffffff14'},
  statsVoteHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},
  statsVoteLabel:{color:'#fff',fontSize:12,flex:1},
  statsVoteBadge:{backgroundColor:'#FFD70022',borderRadius:8,paddingHorizontal:8,paddingVertical:2},
  statsVoteCount:{color:'#FFD700',fontFamily:'BebasNeue',fontSize:12},
  recentUserRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#ffffff0a'},
  recentUserFlag:{fontSize:18},
  recentUserName:{color:'#fff',fontSize:12,fontWeight:'600'},
  recentUserDate:{color:'#ffffff55',fontSize:10,marginTop:2},
});
