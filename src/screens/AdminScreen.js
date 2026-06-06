import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../api/supabase';
import { API_SPORTS_KEY } from '../api/config';

const ANTHROPIC_KEY = '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';
const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

const SPORTS_OPTIONS = [
  '🏀 NBA', '🏒 NHL', '⚾ MLB', '🏈 NFL',
  '⚽ Football', '🌍 Coupe du Monde',
  '🎾 Tennis', '🏎 F1', '⛳ Golf', '🤼 MMA',
  '⭐ Champions League', '🏴󠁧󠁢󠁥󠁮󠁧 Premier League',
  '🇫🇷 Ligue 1', '🇪🇸 La Liga', '🇩🇪 Bundesliga',
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
  '🎾 Tennis': [
    { name:'Novak Djokovic', logo:'' },{ name:'Carlos Alcaraz', logo:'' },
    { name:'Jannik Sinner', logo:'' },{ name:'Daniil Medvedev', logo:'' },
    { name:'Alexander Zverev', logo:'' },{ name:'Aryna Sabalenka', logo:'' },
    { name:'Iga Swiatek', logo:'' },{ name:'Coco Gauff', logo:'' },
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
            <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month-1, 1))}>
              <Text style={styles.calNav}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calMonth}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month+1, 1))}>
              <Text style={styles.calNav}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calDayNames}>
            {['Di','Lu','Ma','Me','Je','Ve','Sa'].map(function(d) {
              return <Text key={d} style={styles.calDayName}>{d}</Text>;
            })}
          </View>
          <View style={styles.calGrid}>
            {days.map(function(day, i) {
              if (!day) return <View key={'e'+i} style={styles.calDay} />;
              const dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
              const isSelected = value === dateStr;
              return (
                <TouchableOpacity key={i}
                  style={[styles.calDay, isSelected && styles.calDaySelected]}
                  onPress={() => { onSelect(field, dateStr); onClose(); }}>
                  <Text style={[styles.calDayText, isSelected && { color:'#fff' }]}>{String(day)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.calCancel}>
            <Text style={styles.calCancelText}>Annuler</Text>
          </TouchableOpacity>
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
        const res = await fetch('https://v2.nba.api-sports.io/teams?league=standard', {
          headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v2.nba.api-sports.io' }
        });
        const data = await res.json();
        const filtered = (data.response || [])
          .filter(function(t) { return t.nbaFranchise === true; })
          .map(function(t) { return { name: t.name, logo: t.logo }; })
          .sort(function(a,b) { return a.name.localeCompare(b.name); });
        setTeams(filtered);
      } else if (['⚽ Football','🌍 Coupe du Monde','⭐ Champions League','🏴 Premier League','🇫🇷 Ligue 1','🇪🇸 La Liga','🇩🇪 Bundesliga'].indexOf(sport) >= 0) {
        const leagueMap = {
          '🌍 Coupe du Monde': { league:1, season:2026 },
          '⭐ Champions League': { league:2, season:2025 },
          '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League': { league:39, season:2025 },
          '🇫🇷 Ligue 1': { league:61, season:2025 },
          '🇪🇸 La Liga': { league:140, season:2025 },
          '🇩🇪 Bundesliga': { league:78, season:2025 },
          '⚽ Football': { league:61, season:2025 },
        };
        const params = leagueMap[sport] || { league:61, season:2025 };
        const res = await fetch(
          'https://v3.football.api-sports.io/teams?league=' + params.league + '&season=' + params.season,
          { headers: { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
        );
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
          <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { marginTop:8 }]}>
            <Text style={styles.cancelBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showSportPickerMatch, setShowSportPickerMatch] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [showDatePickerMatch, setShowDatePickerMatch] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(null);
  const [editingFlash, setEditingFlash] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email:'', name:'', pin:'' });

  // Notifs state
  const [notifTitre, setNotifTitre] = useState('');
  const [notifCorps, setNotifCorps] = useState('');
  const [notifTranslating, setNotifTranslating] = useState(false);
  const [notifSending, setNotifSending] = useState(false);
  const [notifTranslations, setNotifTranslations] = useState(null);
  const [tokenCount, setTokenCount] = useState(0);

  const emptyForm = {
    sport:'', titre_fr:'', contenu_fr:'', date_debut:'', date_fin:'', actif:true,
    titre_en:'', titre_es:'', titre_pt:'', titre_de:'', titre_it:'', titre_ar:'', titre_ru:'',
    contenu_en:'', contenu_es:'', contenu_pt:'', contenu_de:'', contenu_it:'', contenu_ar:'', contenu_ru:'',
  };
  const emptyMatchForm = {
    sport:'', equipe_home:'', equipe_away:'', logo_home:'', logo_away:'',
    competition:'', date_affichage:'', date_match:'', description:'', actif:true,
  };
  const [form, setForm] = useState(emptyForm);
  const [matchForm, setMatchForm] = useState(emptyMatchForm);

  useEffect(() => { if (pin.length === 4) checkPin(); }, [pin]);
  useEffect(() => {
    if (authenticated) {
      fetchFlash(); fetchMatches();
      if (adminData?.is_super_admin) fetchAdmins();
      fetchTokenCount();
    }
  }, [authenticated]);

  async function checkPin() {
    try {
      const { data } = await supabase.from('admin_users').select('*')
        .eq('email', adminUser.email).eq('pin', pin).eq('actif', true).single();
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

  async function fetchFlash() {
    setLoading(true);
    try {
      const { data } = await supabase.from('kazmo_flash').select('*').order('date_debut', { ascending:false });
      setFlashList(data || []);
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function fetchMatches() {
    try {
      const { data } = await supabase.from('match_du_jour').select('*').order('date_affichage', { ascending:false });
      setMatchList(data || []);
    } catch(e) {}
  }

  async function fetchAdmins() {
    const { data } = await supabase.from('admin_users').select('*').order('created_at');
    setAdminList(data || []);
  }

  async function translateNotif() {
    if (!notifTitre || !notifCorps) {
      Alert.alert('Attention', 'Remplis le titre et le message en francais'); return;
    }
    setNotifTranslating(true);
    try {
      const prompt = 'Traduis ces textes de notification push dans les 7 langues. Reponds UNIQUEMENT en JSON valide, sans markdown:\n\n' +
        'TITRE FR: ' + notifTitre + '\nCORPS FR: ' + notifCorps + '\n\n' +
        'Format JSON:\n{"titre_en":"...","titre_es":"...","titre_pt":"...","titre_de":"...","titre_it":"...","titre_ar":"...","titre_ru":"...",' +
        '"corps_en":"...","corps_es":"...","corps_pt":"...","corps_de":"...","corps_it":"...","corps_ar":"...","corps_ru":"..."}';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:2000, messages:[{ role:'user', content:prompt }] }),
      });
      const data = await response.json();
      const text = (data.content||[]).map(function(c){return c.text||'';}).join('');
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setNotifTranslations(parsed);
      Alert.alert('✅', 'Traduit en 7 langues !');
    } catch(e) { Alert.alert('Erreur traduction', e.message); }
    finally { setNotifTranslating(false); }
  }

  async function sendNotifications() {
    if (!notifTitre || !notifCorps) {
      Alert.alert('Erreur', 'Titre et message sont obligatoires'); return;
    }
    Alert.alert(
      'Envoyer la notification ?',
      'Cette notification sera envoyee a ' + tokenCount + ' utilisateurs dans leur langue.',
      [
        { text:'Annuler', style:'cancel' },
        { text:'Envoyer', style:'default', onPress: async function() {
          setNotifSending(true);
          try {
            const { data: tokens } = await supabase.from('push_tokens').select('token, language');
            if (!tokens || tokens.length === 0) {
              Alert.alert('', 'Aucun utilisateur enregistre'); return;
            }

            const translations = notifTranslations || {};
            const langMap = {
              fr: { title: notifTitre, body: notifCorps },
              en: { title: translations.titre_en || notifTitre, body: translations.corps_en || notifCorps },
              es: { title: translations.titre_es || notifTitre, body: translations.corps_es || notifCorps },
              pt: { title: translations.titre_pt || notifTitre, body: translations.corps_pt || notifCorps },
              de: { title: translations.titre_de || notifTitre, body: translations.corps_de || notifCorps },
              it: { title: translations.titre_it || notifTitre, body: translations.corps_it || notifCorps },
              ar: { title: translations.titre_ar || notifTitre, body: translations.corps_ar || notifCorps },
              ru: { title: translations.titre_ru || notifTitre, body: translations.corps_ru || notifCorps },
            };

            const messages = tokens.map(function(t) {
              const lang = t.language || 'fr';
              const content = langMap[lang] || langMap['fr'];
              return {
                to: t.token,
                sound: 'default',
                title: content.title,
                body: content.body,
                data: { type: 'kazmo_notif' },
              };
            });

            // Envoyer par batch de 100
            const batches = [];
            for (let i = 0; i < messages.length; i += 100) {
              batches.push(messages.slice(i, i + 100));
            }

            let sent = 0;
            for (const batch of batches) {
              await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(batch),
              });
              sent += batch.length;
            }

            Alert.alert('✅', 'Notification envoyee a ' + sent + ' utilisateurs !');
            setNotifTitre('');
            setNotifCorps('');
            setNotifTranslations(null);
          } catch(e) { Alert.alert('Erreur envoi', e.message); }
          finally { setNotifSending(false); }
        }},
      ]
    );
  }

  async function translateFlash() {
    if (!form.titre_fr || !form.contenu_fr) { Alert.alert('Attention', 'Remplis d\'abord le titre et le contenu en francais'); return; }
    setTranslating(true);
    try {
      const prompt = 'Traduis ces textes sportifs dans les 7 langues. Reponds UNIQUEMENT en JSON valide, sans markdown:\n\n' +
        'TITRE FR: ' + form.titre_fr + '\nCONTENU FR: ' + form.contenu_fr + '\n\n' +
        'Format JSON:\n{"titre_en":"...","titre_es":"...","titre_pt":"...","titre_de":"...","titre_it":"...","titre_ar":"...","titre_ru":"...",' +
        '"contenu_en":"...","contenu_es":"...","contenu_pt":"...","contenu_de":"...","contenu_it":"...","contenu_ar":"...","contenu_ru":"..."}';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:2000, messages:[{ role:'user', content:prompt }] }),
      });
      const data = await response.json();
      const text = (data.content||[]).map(function(c){return c.text||'';}).join('');
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setForm(function(prev) { return {...prev,...parsed}; });
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
      const dataToSave = {
        sport: matchForm.sport, equipe_home: matchForm.equipe_home, equipe_away: matchForm.equipe_away,
        logo_home: matchForm.logo_home || null, logo_away: matchForm.logo_away || null,
        competition: matchForm.competition || null, date_affichage: matchForm.date_affichage,
        date_match: matchForm.date_match ? matchForm.date_match + 'T20:00:00+00:00' : null,
        description: matchForm.description || null, actif: matchForm.actif,
      };
      if (editingMatch) { await supabase.from('match_du_jour').update(dataToSave).eq('id', editingMatch.id); Alert.alert('✅','Match modifie !'); }
      else { await supabase.from('match_du_jour').insert(dataToSave); Alert.alert('✅','Match programme !'); }
      setShowMatchForm(false); setEditingMatch(null); setMatchForm(emptyMatchForm); fetchMatches();
    } catch(e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  async function deleteMatch(id) {
    Alert.alert('Supprimer ?','Cette action est irreversible.',[
      {text:'Annuler',style:'cancel'},
      {text:'Supprimer',style:'destructive',onPress:async function(){ await supabase.from('match_du_jour').delete().eq('id',id); fetchMatches(); }},
    ]);
  }

  async function toggleMatch(match) { await supabase.from('match_du_jour').update({actif:!match.actif}).eq('id',match.id); fetchMatches(); }

  function openEditMatch(match) {
    setMatchForm({
      sport:match.sport||'', equipe_home:match.equipe_home||'', equipe_away:match.equipe_away||'',
      logo_home:match.logo_home||'', logo_away:match.logo_away||'', competition:match.competition||'',
      date_affichage:match.date_affichage||'', date_match:match.date_match?match.date_match.slice(0,10):'',
      description:match.description||'', actif:match.actif,
    });
    setEditingMatch(match); setShowMatchForm(true);
  }

  function openEdit(flash) {
    setForm({
      sport:flash.sport||'', titre_fr:flash.titre_fr||'', contenu_fr:flash.contenu_fr||'',
      date_debut:flash.date_debut||'', date_fin:flash.date_fin||'', actif:flash.actif,
      titre_en:flash.titre_en||'', titre_es:flash.titre_es||'', titre_pt:flash.titre_pt||'',
      titre_de:flash.titre_de||'', titre_it:flash.titre_it||'', titre_ar:flash.titre_ar||'', titre_ru:flash.titre_ru||'',
      contenu_en:flash.contenu_en||'', contenu_es:flash.contenu_es||'', contenu_pt:flash.contenu_pt||'',
      contenu_de:flash.contenu_de||'', contenu_it:flash.contenu_it||'', contenu_ar:flash.contenu_ar||'', contenu_ru:flash.contenu_ru||'',
    });
    setEditingFlash(flash); setShowForm(true);
  }

  async function toggleFlash(flash) { await supabase.from('kazmo_flash').update({actif:!flash.actif}).eq('id',flash.id); fetchFlash(); }

  async function deleteFlash(id) {
    Alert.alert('Supprimer ?','Cette action est irreversible.',[
      {text:'Annuler',style:'cancel'},
      {text:'Supprimer',style:'destructive',onPress:async function(){ await supabase.from('kazmo_flash').delete().eq('id',id); fetchFlash(); }},
    ]);
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
    Alert.alert('Supprimer ?',admin.name+' n\'aura plus acces.',[
      {text:'Annuler',style:'cancel'},
      {text:'Supprimer',style:'destructive',onPress:async function(){ await supabase.from('admin_users').delete().eq('id',admin.id); fetchAdmins(); }},
    ]);
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
              return(
                <TouchableOpacity key={i} style={styles.pinKey} activeOpacity={0.7}
                  onPress={()=>{
                    if(key==='⌫'){setPin(function(p){return p.slice(0,-1);});}
                    else if(pin.length<4){setPin(function(p){return p+key;});}
                  }}>
                  <Text style={styles.pinKeyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.pinCancel}>
            <Text style={styles.pinCancelText}>Annuler</Text>
          </TouchableOpacity>
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
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕ Fermer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight:42,marginHorizontal:16,marginBottom:8}}>
        <View style={styles.tabBar}>
          {[
            {id:'match',label:'🗓 Match'},
            {id:'flash',label:'⚡ Flash'},
            {id:'admins',label:'👥 Admins',superOnly:true},
            {id:'stats',label:'📊 Stats'},
            {id:'notifs',label:'🔔 Notifs'},
          ].filter(function(tb){return !tb.superOnly||adminData?.is_super_admin;})
          .map(function(tb){
            return(
              <TouchableOpacity key={tb.id}
                style={[styles.tabBtn,tab===tb.id&&styles.tabBtnActive]}
                onPress={()=>setTab(tb.id)}>
                <Text style={[styles.tabBtnText,tab===tb.id&&styles.tabBtnTextActive]}>{tb.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* MATCH DU JOUR TAB */}
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

      {/* FORMULAIRE MATCH */}
      {tab==='match' && showMatchForm && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
          <TouchableOpacity style={[styles.input,styles.pickerBtn,!matchForm.sport&&{opacity:0.5}]}
            onPress={()=>{ if(matchForm.sport) setShowTeamPicker('home'); else Alert.alert('','Choisissez d\'abord un sport'); }}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1}}>
              {matchForm.logo_home?<Image source={{uri:matchForm.logo_home}} style={{width:24,height:24,resizeMode:'contain'}} onError={function(){}}/>:null}
              <Text style={matchForm.equipe_home?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{matchForm.equipe_home||'Choisir equipe domicile...'}</Text>
            </View>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Equipe exterieure *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn,!matchForm.sport&&{opacity:0.5}]}
            onPress={()=>{ if(matchForm.sport) setShowTeamPicker('away'); else Alert.alert('','Choisissez d\'abord un sport'); }}>
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
          <TouchableOpacity onPress={saveMatch} disabled={loading} activeOpacity={0.85} style={{marginTop:16}}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}>
              {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.saveBtnText}>💾 Sauvegarder</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{setShowMatchForm(false);setEditingMatch(null);}} style={[styles.cancelBtn,{marginTop:8}]}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* FLASH TAB */}
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
            return(
              <View key={flash.id} style={[styles.flashCard,isActive&&styles.flashCardActive]}>
                <View style={styles.flashCardHeader}>
                  <Text style={styles.flashCardSport}>{flash.sport}</Text>
                  <View style={[styles.statusBadge,{backgroundColor:isActive?'#4CAF5022':'#ffffff11'}]}>
                    <Text style={[styles.statusText,{color:isActive?'#4CAF50':flash.actif?'#FFD700':'#ffffff55'}]}>{isActive?'● ACTIF':flash.actif?'Programme':'Inactif'}</Text>
                  </View>
                </View>
                <Text style={styles.flashCardTitre}>{flash.titre_fr}</Text>
                <Text style={styles.flashCardContenu} numberOfLines={2}>{flash.contenu_fr}</Text>
                <Text style={styles.flashCardDates}>📅 {flash.date_debut} → {flash.date_fin}</Text>
                {flash.titre_en?<Text style={styles.translatedIndicator}>✅ Traduit en 7 langues</Text>:<Text style={styles.notTranslatedIndicator}>⚠️ Non traduit</Text>}
                <View style={styles.flashCardActions}>
                  <TouchableOpacity onPress={()=>openEdit(flash)} style={styles.actionBtn}><Text style={styles.actionBtnText}>✏️ Modifier</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>toggleFlash(flash)} style={styles.actionBtn}><Text style={styles.actionBtnText}>{flash.actif?'⏸ Desactiver':'▶️ Activer'}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>deleteFlash(flash.id)} style={[styles.actionBtn,styles.actionBtnDanger]}><Text style={[styles.actionBtnText,{color:'#E53935'}]}>🗑 Supprimer</Text></TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* FORMULAIRE FLASH */}
      {tab==='flash' && showForm && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={()=>{setShowForm(false);setEditingFlash(null);}}><Text style={styles.formBack}>← Retour</Text></TouchableOpacity>
            <Text style={styles.formTitle}>{editingFlash?'Modifier Flash':'Nouveau Flash'}</Text>
          </View>
          <Text style={styles.fieldLabel}>Sport / Competition *</Text>
          <TouchableOpacity style={[styles.input,styles.pickerBtn]} onPress={()=>setShowSportPicker(true)}>
            <Text style={form.sport?styles.pickerBtnText:styles.pickerBtnPlaceholder}>{form.sport||'Choisir un sport...'}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
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

      {/* ADMINS TAB */}
      {tab==='admins' && adminData?.is_super_admin && !showAddAdmin && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.addBtn} onPress={()=>setShowAddAdmin(true)}>
            <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.addBtnGradient}>
              <Text style={styles.addBtnText}>👤 Ajouter un admin</Text>
            </LinearGradient>
          </TouchableOpacity>
          {adminList.map(function(admin){
            return(
              <View key={admin.id} style={styles.adminCard}>
                <View style={styles.adminCardLeft}>
                  <Text style={styles.adminName}>{admin.name} {admin.is_super_admin?'👑':''}</Text>
                  <Text style={styles.adminEmail}>{admin.email}</Text>
                  <View style={[styles.statusBadge,{backgroundColor:admin.actif?'#4CAF5022':'#ffffff11',alignSelf:'flex-start',marginTop:4}]}>
                    <Text style={[styles.statusText,{color:admin.actif?'#4CAF50':'#ffffff55'}]}>{admin.actif?'● Actif':'⏸ Inactif'}</Text>
                  </View>
                </View>
                {!admin.is_super_admin&&(
                  <View style={styles.adminActions}>
                    <TouchableOpacity onPress={()=>toggleAdmin(admin)} style={styles.actionBtn}><Text style={styles.actionBtnText}>{admin.actif?'⏸':'▶️'}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={()=>deleteAdmin(admin)} style={[styles.actionBtn,styles.actionBtnDanger]}><Text style={[styles.actionBtnText,{color:'#E53935'}]}>🗑</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {tab==='admins' && showAddAdmin && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={()=>setShowAddAdmin(false)}><Text style={styles.formBack}>← Retour</Text></TouchableOpacity>
            <Text style={styles.formTitle}>Nouvel Admin</Text>
          </View>
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

      {/* STATS */}
      {tab==='stats'&&<View style={styles.center}><Text style={styles.comingSoonIcon}>📊</Text><Text style={styles.comingSoonText}>Stats disponibles bientot</Text></View>}

      {/* NOTIFS */}
      {tab==='notifs' && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Compteur users */}
          <View style={styles.notifStatsCard}>
            <Text style={styles.notifStatsIcon}>📱</Text>
            <View>
              <Text style={styles.notifStatsValue}>{tokenCount}</Text>
              <Text style={styles.notifStatsSub}>utilisateurs enregistres</Text>
            </View>
            <TouchableOpacity onPress={fetchTokenCount} style={styles.refreshBtn}>
              <Text style={styles.refreshBtnText}>↻</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Titre de la notification *</Text>
          <TextInput
            value={notifTitre}
            onChangeText={setNotifTitre}
            style={styles.input}
            placeholder="Ex: MATCH DU JOUR — Real vs PSG ce soir !"
            placeholderTextColor="#ffffff44"
            maxLength={100}
          />

          <Text style={styles.fieldLabel}>Message *</Text>
          <TextInput
            value={notifCorps}
            onChangeText={setNotifCorps}
            style={[styles.input, styles.inputMultiline]}
            placeholder="Ex: Ce soir a 21h, le choc des titans ! Suivez le match en direct sur Kazmo."
            placeholderTextColor="#ffffff44"
            multiline numberOfLines={4}
            maxLength={200}
          />

          {/* Bouton traduire */}
          <TouchableOpacity onPress={translateNotif} disabled={notifTranslating} activeOpacity={0.85} style={{marginTop:10,marginBottom:8}}>
            <LinearGradient
              colors={notifTranslating ? ['#444','#555'] : ['#1D428A','#00B8D9']}
              start={{x:0,y:0}} end={{x:1,y:0}} style={styles.translateBtn}>
              {notifTranslating
                ? <><ActivityIndicator color="#fff" size="small"/><Text style={styles.translateBtnText}> Traduction...</Text></>
                : <Text style={styles.translateBtnText}>🌍 Traduire en 7 langues</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {notifTranslations && (
            <View style={styles.translatedBadge}>
              <Text style={styles.translatedBadgeText}>✅ Traduit : EN · ES · PT · DE · IT · AR · RU</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.notifInfoCard}>
            <Text style={styles.notifInfoText}>
              💡 Chaque utilisateur recevra la notification dans sa langue.{'\n'}
              Sans traduction, tous recoivent le message en francais.
            </Text>
          </View>

          {/* Bouton envoyer */}
          <TouchableOpacity onPress={sendNotifications} disabled={notifSending} activeOpacity={0.85} style={{marginTop:8}}>
            <LinearGradient
              colors={notifSending ? ['#444','#555'] : ['#FF6B2B','#FFD600']}
              start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}>
              {notifSending
                ? <><ActivityIndicator color="#fff" size="small"/><Text style={styles.saveBtnText}> Envoi en cours...</Text></>
                : <Text style={styles.saveBtnText}>🔔 Envoyer a tous ({tokenCount})</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      )}

      {/* MODALS */}
      <Modal visible={showSportPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir un sport</Text>
            <ScrollView>
              {SPORTS_OPTIONS.map(function(sport){
                return(
                  <TouchableOpacity key={sport} style={[styles.sportOption,form.sport===sport&&styles.sportOptionSelected]}
                    onPress={()=>{setForm({...form,sport});setShowSportPicker(false);}}>
                    <Text style={[styles.sportOptionText,form.sport===sport&&{color:'#FF6B2B'}]}>{sport}</Text>
                    {form.sport===sport&&<Text style={{color:'#FF6B2B'}}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={()=>setShowSportPicker(false)} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSportPickerMatch} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir un sport</Text>
            <ScrollView>
              {SPORTS_OPTIONS.map(function(sport){
                return(
                  <TouchableOpacity key={sport} style={[styles.sportOption,matchForm.sport===sport&&styles.sportOptionSelected]}
                    onPress={()=>{setMatchForm({...matchForm,sport,equipe_home:'',equipe_away:'',logo_home:'',logo_away:''});setShowSportPickerMatch(false);}}>
                    <Text style={[styles.sportOptionText,matchForm.sport===sport&&{color:'#FF6B2B'}]}>{sport}</Text>
                    {matchForm.sport===sport&&<Text style={{color:'#FF6B2B'}}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={()=>setShowSportPickerMatch(false)} style={[styles.cancelBtn,{marginTop:8}]}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showTeamPicker && (
        <TeamPicker sport={matchForm.sport}
          onSelect={function(name, logo) {
            if (showTeamPicker === 'home') { setMatchForm(function(prev) { return {...prev, equipe_home:name, logo_home:logo}; }); }
            else { setMatchForm(function(prev) { return {...prev, equipe_away:name, logo_away:logo}; }); }
          }}
          onClose={() => setShowTeamPicker(null)}
        />
      )}

      {showDatePicker==='date_debut'&&<CalendarPicker field="date_debut" value={form.date_debut} onSelect={function(f,v){setForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePicker(null)}/>}
      {showDatePicker==='date_fin'&&<CalendarPicker field="date_fin" value={form.date_fin} onSelect={function(f,v){setForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePicker(null)}/>}
      {showDatePickerMatch==='date_affichage'&&<CalendarPicker field="date_affichage" value={matchForm.date_affichage} onSelect={function(f,v){setMatchForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePickerMatch(null)}/>}
      {showDatePickerMatch==='date_match'&&<CalendarPicker field="date_match" value={matchForm.date_match} onSelect={function(f,v){setMatchForm(function(p){return{...p,[f]:v};});}} onClose={()=>setShowDatePickerMatch(null)}/>}

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
});
