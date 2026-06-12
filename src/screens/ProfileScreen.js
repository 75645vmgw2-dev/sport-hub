import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { supabase } from '../api/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import AdminScreen from './AdminScreen';
import FAQScreen from './FAQScreen';

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const FEATURES = [
  { id:'nfl_live', icon:'🏈', labelKey:'featureNFL' },
  { id:'alerts', icon:'🔔', labelKey:'featureAlerts' },
  { id:'betting', icon:'💰', labelKey:'featureBetting' },
  { id:'more_leagues', icon:'🌍', labelKey:'featureLeagues' },
  { id:'player_stats', icon:'📊', labelKey:'featureStats' },
  { id:'kazmo_ai', icon:'🤖', labelKey:'featureAI' },
];

const SPORTS_LIST = [
  { id:'NBA', icon:'🏀', label:'NBA', color:'#1D428A' },
  { id:'NHL', icon:'🏒', label:'NHL', color:'#00B8D9' },
  { id:'MLB', icon:'⚾', label:'MLB', color:'#E53935' },
  { id:'NFL', icon:'🏈', label:'NFL', color:'#1A73E8' },
  { id:'FOOTBALL', icon:'⚽', label:'Football', color:'#4CAF50' },
  { id:'F1', icon:'🏎', label:'F1', color:'#E10600' },
  { id:'GOLF', icon:'⛳', label:'Golf', color:'#2E7D32' },
  { id:'MMA', icon:'🤼', label:'MMA', color:'#9C27B0' },
];

export default function ProfileScreen({ user, onLogout }) {
  const { t, language, changeLanguage } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ first_name:'', last_name:'', username:'', country:'' });
  const [userVotes, setUserVotes] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [suggestion, setSuggestion] = useState('');
  const [sendingSuggestion, setSendingSuggestion] = useState(false);
  const [favoriteSports, setFavoriteSports] = useState([]);
  const [savingSports, setSavingSports] = useState(false);

  useEffect(() => {
    if (user) { fetchProfile(); checkAdmin(); fetchVotes(); fetchFavoriteSports(); }
  }, [user]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setForm({ first_name:data.first_name||'', last_name:data.last_name||'', username:data.username||'', country:data.country||'' });
      }
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function checkAdmin() {
    try {
      const { data, error } = await supabase.from('admin_users').select('id').eq('email', user.email).eq('actif', true);
      setIsAdmin(!error && data && data.length > 0);
    } catch(e) { setIsAdmin(false); }
  }

  async function fetchFavoriteSports() {
    try {
      const { data } = await supabase.from('push_tokens').select('sports_interests').eq('user_id', user.id).limit(1).single();
      if (data && data.sports_interests) {
        setFavoriteSports(data.sports_interests);
      }
    } catch(e) { setFavoriteSports([]); }
  }

  function toggleSport(sportId) {
    setFavoriteSports(function(prev) {
      if (prev.includes(sportId)) {
        return prev.filter(function(s) { return s !== sportId; });
      } else {
        return [...prev, sportId];
      }
    });
  }

  async function saveFavoriteSports() {
    setSavingSports(true);
    try {
      await supabase.from('push_tokens')
        .update({ sports_interests: favoriteSports })
        .eq('user_id', user.id);
      Alert.alert('✅', 'Sports favoris sauvegardés !');
    } catch(e) {
      Alert.alert('Erreur', e.message);
    }
    finally { setSavingSports(false); }
  }

  async function fetchVotes() {
    try {
      const [myVotes, allVotes] = await Promise.all([
        supabase.from('feature_votes').select('feature_id').eq('user_id', user.id),
        supabase.from('feature_votes').select('feature_id'),
      ]);
      setUserVotes((myVotes.data||[]).map(function(v){return v.feature_id;}));
      const counts = {};
      (allVotes.data||[]).forEach(function(v){
        counts[v.feature_id] = (counts[v.feature_id]||0) + 1;
      });
      setVoteCounts(counts);
    } catch(e) {}
  }

  async function toggleVote(featureId) {
    const hasVoted = userVotes.includes(featureId);
    if (hasVoted) {
      await supabase.from('feature_votes').delete().eq('user_id', user.id).eq('feature_id', featureId);
      setUserVotes(function(prev){return prev.filter(function(v){return v!==featureId;});});
      setVoteCounts(function(prev){return {...prev,[featureId]:Math.max(0,(prev[featureId]||1)-1)};});
    } else {
      await supabase.from('feature_votes').insert({user_id:user.id, feature_id:featureId});
      setUserVotes(function(prev){return [...prev, featureId];});
      setVoteCounts(function(prev){return {...prev,[featureId]:(prev[featureId]||0)+1};});
    }
  }

  async function sendSuggestion() {
    if (!suggestion.trim()) return;
    setSendingSuggestion(true);
    try {
      await supabase.from('feature_suggestions').insert({ user_id:user.id, suggestion:suggestion.trim(), language });
      setSuggestion('');
      Alert.alert('✅', t('suggestionSent'));
    } catch(e) { Alert.alert('Erreur', e.message); }
    finally { setSendingSuggestion(false); }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await supabase.from('profiles').upsert({ id:user.id, email:user.email, ...form });
      setProfile({...profile,...form});
      setEditing(false);
      Alert.alert('✅', t('save')+' !');
    } catch(e) { Alert.alert('Erreur', e.message); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    Alert.alert('', t('logout')+' ?', [
      { text:t('cancel'), style:'cancel' },
      { text:t('logout'), style:'destructive', onPress: async function() {
        await supabase.auth.signOut(); onLogout();
      }},
    ]);
  }

  const initials = ((form.first_name?.[0]||'')+(form.last_name?.[0]||'')).toUpperCase()||user?.email?.[0]?.toUpperCase()||'?';

  if (showAdmin) return <AdminScreen onClose={()=>setShowAdmin(false)} adminUser={user} />;
  if (showFAQ) return <FAQScreen user={user} onBack={()=>setShowFAQ(false)} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.titleWhite}>{t('myProfile').split(' ')[0]} </Text>
          <GradientText text={t('myProfile').split(' ').slice(1).join(' ')} fontSize={22} letterSpacing={1} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#FF6B2B" /></View>
        ) : (
          <>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <MaskedView maskElement={<View style={styles.avatarMask}><Text style={styles.avatarText}>{initials}</Text></View>}>
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.avatarGradient}>
                  <Text style={[styles.avatarText,{opacity:0}]}>{initials}</Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.avatarName}>{form.first_name?form.first_name+' '+form.last_name:user?.email}</Text>
              <Text style={styles.avatarEmail}>{user?.email}</Text>
            </View>

            {/* Infos profil */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('myProfile').toUpperCase()}</Text>
                {!editing&&(<TouchableOpacity onPress={()=>setEditing(true)} style={styles.editBtn}><Text style={styles.editBtnText}>✏️ {t('editProfile')}</Text></TouchableOpacity>)}
              </View>
              {editing ? (
                <>
                  <Text style={styles.fieldLabel}>{t('firstName')}</Text>
                  <TextInput value={form.first_name} onChangeText={function(v){setForm({...form,first_name:v});}} style={styles.input} placeholder={t('firstName')} placeholderTextColor="#ffffff44"/>
                  <Text style={styles.fieldLabel}>{t('lastName')}</Text>
                  <TextInput value={form.last_name} onChangeText={function(v){setForm({...form,last_name:v});}} style={styles.input} placeholder={t('lastName')} placeholderTextColor="#ffffff44"/>
                  <Text style={styles.fieldLabel}>{t('username')}</Text>
                  <TextInput value={form.username} onChangeText={function(v){setForm({...form,username:v});}} style={styles.input} placeholder={t('username')} placeholderTextColor="#ffffff44" autoCapitalize="none"/>
                  <Text style={styles.fieldLabel}>{t('country')}</Text>
                  <TextInput value={form.country} onChangeText={function(v){setForm({...form,country:v});}} style={styles.input} placeholder={t('country')} placeholderTextColor="#ffffff44"/>
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={saveProfile} disabled={saving} activeOpacity={0.85} style={{flex:1}}>
                      <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}>
                        {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={styles.saveBtnText}>{t('save')}</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>setEditing(false)} style={[styles.cancelBtn,{flex:1}]}><Text style={styles.cancelBtnText}>{t('cancel')}</Text></TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {[{label:t('firstName'),value:form.first_name},{label:t('lastName'),value:form.last_name},{label:t('username'),value:form.username},{label:t('country'),value:form.country},{label:t('email'),value:user?.email}].map(function(item,i){
                    return(<View key={i} style={styles.infoRow}><Text style={styles.infoLabel}>{item.label}</Text><Text style={styles.infoValue}>{item.value||'—'}</Text></View>);
                  })}
                </>
              )}
            </View>

            {/* ── SPORTS FAVORIS ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('favoriteSportsTitle')}</Text>
              </View>
              <Text style={styles.sportsSubtitle}>{t('favoriteSportsSub')}</Text>
              <View style={styles.sportsGrid}>
                {SPORTS_LIST.map(function(sport) {
                  const selected = favoriteSports.includes(sport.id);
                  return (
                    <TouchableOpacity
                      key={sport.id}
                      style={[styles.sportChip, selected && { backgroundColor: sport.color + '33', borderColor: sport.color }]}
                      activeOpacity={0.7}
                      onPress={() => toggleSport(sport.id)}>
                      <Text style={styles.sportChipIcon}>{sport.icon}</Text>
                      <Text style={[styles.sportChipLabel, selected && { color: '#fff' }]}>{sport.label}</Text>
                      {selected && <Text style={styles.sportChipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={saveFavoriteSports} disabled={savingSports} activeOpacity={0.85} style={{marginTop:14}}>
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}>
                  {savingSports ? <ActivityIndicator color="#fff" size="small"/> : <Text style={styles.saveBtnText}>{t('favoriteSportsSave')}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Langue */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('language').toUpperCase()}</Text>
              <TouchableOpacity style={styles.langBtn} activeOpacity={0.8} onPress={()=>setShowLangModal(true)}>
                <Text style={styles.langBtnFlag}>{LANGUAGES.find(function(l){return l.code===language;})?.flag||'🌍'}</Text>
                <Text style={styles.langBtnName}>{LANGUAGES.find(function(l){return l.code===language;})?.name||'Francais'}</Text>
                <Text style={styles.langBtnArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* ROADMAP */}
            <View style={styles.roadmapCard}>
              <View style={styles.roadmapHeader}>
                <MaskedView maskElement={<Text style={styles.roadmapTitleMask}>🚀 {t('roadmapTitle')}</Text>}>
                  <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}}>
                    <Text style={[styles.roadmapTitleMask,{opacity:0}]}>🚀 {t('roadmapTitle')}</Text>
                  </LinearGradient>
                </MaskedView>
                <Text style={styles.roadmapSub}>{t('roadmapSub')}</Text>
              </View>

              {FEATURES.map(function(f){
                const hasVoted = userVotes.includes(f.id);
                const count = voteCounts[f.id]||0;
                return(
                  <View key={f.id} style={styles.featureRow}>
                    <Text style={styles.featureIcon}>{f.icon}</Text>
                    <Text style={styles.featureLabel}>{t(f.labelKey)}</Text>
                    <TouchableOpacity
                      style={[styles.voteBtn, hasVoted&&styles.voteBtnActive]}
                      onPress={()=>toggleVote(f.id)}
                      activeOpacity={0.7}>
                      <Text style={styles.voteBtnIcon}>{hasVoted?'❤️':'🤍'}</Text>
                      <Text style={[styles.voteBtnCount, hasVoted&&{color:'#FF6B2B'}]}>{count}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionTitle}>💡 {t('suggestionTitle')}</Text>
                <TextInput
                  value={suggestion}
                  onChangeText={setSuggestion}
                  style={styles.suggestionInput}
                  placeholder={t('suggestionPlaceholder')}
                  placeholderTextColor="#ffffff44"
                  multiline
                  maxLength={300}
                />
                <TouchableOpacity onPress={sendSuggestion} disabled={!suggestion.trim()||sendingSuggestion} activeOpacity={0.85}>
                  <LinearGradient
                    colors={suggestion.trim()&&!sendingSuggestion?['#FF6B2B','#FFD600']:['#333','#444']}
                    start={{x:0,y:0}} end={{x:1,y:0}}
                    style={styles.suggestionBtn}>
                    {sendingSuggestion?<ActivityIndicator color="#fff" size="small"/>:<Text style={styles.suggestionBtnText}>📨 {t('suggestionSend')}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* FAQ */}
            <TouchableOpacity activeOpacity={0.85} onPress={()=>setShowFAQ(true)} style={styles.faqBtn}>
              <Text style={styles.faqBtnIcon}>💬</Text>
              <View style={{flex:1}}>
                <Text style={styles.faqBtnText}>{t('faq')}</Text>
                <Text style={styles.faqBtnSub}>{t('faqSub')}</Text>
              </View>
              <Text style={styles.faqBtnArrow}>›</Text>
            </TouchableOpacity>

            {/* BACK OFFICE */}
            {isAdmin&&(
              <TouchableOpacity activeOpacity={0.85} onPress={()=>setShowAdmin(true)} style={{marginBottom:12}}>
                <LinearGradient colors={['#FFD700','#FF6B2B']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.adminBtn}>
                  <Text style={styles.adminBtnIcon}>⚡</Text>
                  <View style={{flex:1}}>
                    <Text style={styles.adminBtnText}>BACK OFFICE</Text>
                    <Text style={styles.adminBtnSub}>Gestion KAZMO</Text>
                  </View>
                  <Text style={styles.adminBtnArrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <Text style={{color:'#ffffff99',fontSize:11,textAlign:'center',fontFamily:'BebasNeue',letterSpacing:1,marginBottom:8}}>KAZMO v1.0.0</Text>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>🚪 {t('logout')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal visible={showLangModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('chooseLanguage')}</Text>
            <ScrollView>
              {LANGUAGES.map(function(lang){
                const isSelected = language===lang.code;
                return(
                  <TouchableOpacity key={lang.code} style={[styles.langOption,isSelected&&styles.langOptionSelected]} onPress={()=>{changeLanguage(lang.code);setShowLangModal(false);}}>
                    <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                    <Text style={[styles.langOptionName,isSelected&&{color:'#FF6B2B'}]}>{lang.name}</Text>
                    {isSelected&&<Text style={{color:'#FF6B2B',fontSize:16}}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={()=>setShowLangModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#080814'},
  scroll:{padding:16,paddingBottom:40},
  header:{flexDirection:'row',alignItems:'center',marginBottom:20},
  titleWhite:{fontSize:22,color:'#fff',fontFamily:'BebasNeue',letterSpacing:1},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:40},
  avatarSection:{alignItems:'center',marginBottom:24},
  avatarMask:{width:80,height:80,borderRadius:40,backgroundColor:'#000',alignItems:'center',justifyContent:'center'},
  avatarGradient:{width:80,height:80,borderRadius:40,alignItems:'center',justifyContent:'center'},
  avatarText:{fontSize:28,fontFamily:'BebasNeue',color:'#fff'},
  avatarName:{color:'#fff',fontFamily:'BebasNeue',fontSize:18,letterSpacing:1,marginTop:10},
  avatarEmail:{color:'#ffffff55',fontSize:11,marginTop:2},
  card:{backgroundColor:'#16162a',borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:'#ffffff14'},
  cardHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14},
  cardTitle:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12,letterSpacing:2},
  editBtn:{backgroundColor:'#ffffff0a',borderRadius:8,paddingHorizontal:10,paddingVertical:5},
  editBtnText:{color:'#FF6B2B',fontSize:11},
  fieldLabel:{color:'#ffffffcc',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6,marginTop:8},
  input:{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,color:'#fff',fontSize:14,borderWidth:1,borderColor:'#ffffff22'},
  editActions:{flexDirection:'row',gap:8,marginTop:14},
  saveBtn:{borderRadius:10,padding:12,alignItems:'center'},
  saveBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1},
  cancelBtn:{backgroundColor:'#ffffff0a',borderRadius:10,padding:12,alignItems:'center'},
  cancelBtnText:{color:'#ffffff66',fontFamily:'BebasNeue',fontSize:14},
  infoRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#ffffff0a'},
  infoLabel:{color:'#ffffff55',fontSize:12},
  infoValue:{color:'#fff',fontSize:12,fontWeight:'600'},
  sportsSubtitle:{color:'#ffffff66',fontSize:11,lineHeight:16,marginBottom:12},
  sportsGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  sportChip:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#0d0d1a',borderRadius:10,paddingHorizontal:12,paddingVertical:9,borderWidth:1,borderColor:'#ffffff22',minWidth:'44%'},
  sportChipIcon:{fontSize:16},
  sportChipLabel:{color:'#ffffff88',fontFamily:'BebasNeue',fontSize:12,flex:1},
  sportChipCheck:{color:'#4CAF50',fontSize:12,fontWeight:'700'},
  langBtn:{flexDirection:'row',alignItems:'center',gap:10,padding:4},
  langBtnFlag:{fontSize:22},
  langBtnName:{color:'#fff',fontSize:14,flex:1},
  langBtnArrow:{color:'#ffffff33',fontSize:20},
  roadmapCard:{backgroundColor:'#16162a',borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:'#FF6B2B33'},
  roadmapHeader:{marginBottom:16},
  roadmapTitleMask:{fontSize:16,fontFamily:'BebasNeue',letterSpacing:1,color:'#000'},
  roadmapSub:{color:'#ffffff66',fontSize:11,marginTop:4},
  featureRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#ffffff0a'},
  featureIcon:{fontSize:20,width:28},
  featureLabel:{color:'#fff',fontSize:13,flex:1},
  voteBtn:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#ffffff0a',borderRadius:20,paddingHorizontal:12,paddingVertical:6,borderWidth:1,borderColor:'#ffffff22'},
  voteBtnActive:{backgroundColor:'#FF6B2B11',borderColor:'#FF6B2B44'},
  voteBtnIcon:{fontSize:14},
  voteBtnCount:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:13},
  suggestionSection:{marginTop:16},
  suggestionTitle:{color:'#ffffffcc',fontFamily:'BebasNeue',fontSize:12,letterSpacing:1,marginBottom:8},
  suggestionInput:{backgroundColor:'#0d0d1a',borderRadius:10,padding:12,color:'#fff',fontSize:13,borderWidth:1,borderColor:'#ffffff22',minHeight:80,textAlignVertical:'top',marginBottom:10},
  suggestionBtn:{borderRadius:10,padding:12,alignItems:'center'},
  suggestionBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:13,letterSpacing:1},
  faqBtn:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#16162a',borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:'#ffffff14'},
  faqBtnIcon:{fontSize:24},
  faqBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1},
  faqBtnSub:{color:'#ffffff55',fontSize:10,marginTop:2},
  faqBtnArrow:{color:'#ffffff33',fontSize:20},
  adminBtn:{borderRadius:14,padding:16,flexDirection:'row',alignItems:'center',gap:12},
  adminBtnIcon:{fontSize:24},
  adminBtnText:{color:'#000',fontFamily:'BebasNeue',fontSize:16,letterSpacing:2},
  adminBtnSub:{color:'#00000088',fontSize:10},
  adminBtnArrow:{color:'#00000055',fontSize:22},
  logoutBtn:{backgroundColor:'#E5393522',borderRadius:12,padding:14,alignItems:'center',borderWidth:1,borderColor:'#E5393533',marginTop:8},
  logoutText:{color:'#E53935',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1},
  modalOverlay:{flex:1,backgroundColor:'#000000aa',justifyContent:'flex-end'},
  modalContent:{backgroundColor:'#16162a',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,maxHeight:'80%'},
  modalTitle:{color:'#fff',fontFamily:'BebasNeue',fontSize:18,letterSpacing:2,textAlign:'center',marginBottom:16},
  langOption:{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderBottomWidth:1,borderBottomColor:'#ffffff0a'},
  langOptionSelected:{backgroundColor:'#FF6B2B11'},
  langOptionFlag:{fontSize:22},
  langOptionName:{color:'#fff',fontSize:14,flex:1},
});
