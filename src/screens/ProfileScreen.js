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
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', country: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkAdmin();
    }
  }, [user]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          username: data.username || '',
          country: data.country || '',
        });
      }
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function checkAdmin() {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', user.email)
        .eq('actif', true)
        .single();
      setIsAdmin(!!data);
    } catch(e) {
      setIsAdmin(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        ...form,
      });
      setProfile({ ...profile, ...form });
      setEditing(false);
      Alert.alert('✅', t('save') + ' !');
    } catch(e) {
      Alert.alert('Erreur', e.message);
    }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    Alert.alert('', t('logout') + ' ?', [
      { text: t('cancel'), style:'cancel' },
      { text: t('logout'), style:'destructive', onPress: async function() {
        await supabase.auth.signOut();
        onLogout();
      }},
    ]);
  }

  const initials = ((form.first_name?.[0] || '') + (form.last_name?.[0] || '')).toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  if (showAdmin) {
    return <AdminScreen onClose={() => setShowAdmin(false)} adminUser={user} />;
  }

  if (showFAQ) {
    return <FAQScreen user={user} onBack={() => setShowFAQ(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
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
              <MaskedView maskElement={
                <View style={styles.avatarMask}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              }>
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.avatarGradient}>
                  <Text style={[styles.avatarText, { opacity:0 }]}>{initials}</Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.avatarName}>
                {form.first_name ? form.first_name + ' ' + form.last_name : user?.email}
              </Text>
              <Text style={styles.avatarEmail}>{user?.email}</Text>
            </View>

            {/* Infos profil */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('myProfile').toUpperCase()}</Text>
                {!editing && (
                  <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                    <Text style={styles.editBtnText}>✏️ {t('editProfile')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {editing ? (
                <>
                  <Text style={styles.fieldLabel}>{t('firstName')}</Text>
                  <TextInput
                    value={form.first_name}
                    onChangeText={function(v) { setForm({...form, first_name:v}); }}
                    style={styles.input}
                    placeholder={t('firstName')}
                    placeholderTextColor="#ffffff44"
                  />
                  <Text style={styles.fieldLabel}>{t('lastName')}</Text>
                  <TextInput
                    value={form.last_name}
                    onChangeText={function(v) { setForm({...form, last_name:v}); }}
                    style={styles.input}
                    placeholder={t('lastName')}
                    placeholderTextColor="#ffffff44"
                  />
                  <Text style={styles.fieldLabel}>{t('username')}</Text>
                  <TextInput
                    value={form.username}
                    onChangeText={function(v) { setForm({...form, username:v}); }}
                    style={styles.input}
                    placeholder={t('username')}
                    placeholderTextColor="#ffffff44"
                    autoCapitalize="none"
                  />
                  <Text style={styles.fieldLabel}>{t('country')}</Text>
                  <TextInput
                    value={form.country}
                    onChangeText={function(v) { setForm({...form, country:v}); }}
                    style={styles.input}
                    placeholder={t('country')}
                    placeholderTextColor="#ffffff44"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={saveProfile} disabled={saving} activeOpacity={0.85} style={{ flex:1 }}>
                      <LinearGradient colors={['#FF6B2B','#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.saveBtn}>
                        {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditing(false)} style={[styles.cancelBtn, { flex:1 }]}>
                      <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {[
                    { label: t('firstName'), value: form.first_name },
                    { label: t('lastName'), value: form.last_name },
                    { label: t('username'), value: form.username },
                    { label: t('country'), value: form.country },
                    { label: t('email'), value: user?.email },
                  ].map(function(item, i) {
                    return (
                      <View key={i} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{item.label}</Text>
                        <Text style={styles.infoValue}>{item.value || '—'}</Text>
                      </View>
                    );
                  })}
                </>
              )}
            </View>

            {/* Langue */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('language').toUpperCase()}</Text>
              <TouchableOpacity
                style={styles.langBtn}
                activeOpacity={0.8}
                onPress={() => setShowLangModal(true)}>
                <Text style={styles.langBtnFlag}>
                  {LANGUAGES.find(function(l) { return l.code === language; })?.flag || '🌍'}
                </Text>
                <Text style={styles.langBtnName}>
                  {LANGUAGES.find(function(l) { return l.code === language; })?.name || 'Francais'}
                </Text>
                <Text style={styles.langBtnArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* FAQ */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowFAQ(true)}
              style={styles.faqBtn}>
              <Text style={styles.faqBtnIcon}>💬</Text>
              <View style={{ flex:1 }}>
                <Text style={styles.faqBtnText}>{t('faq')}</Text>
                <Text style={styles.faqBtnSub}>{t('faqSub')}</Text>
              </View>
              <Text style={styles.faqBtnArrow}>›</Text>
            </TouchableOpacity>

            {/* BACK OFFICE */}
            {isAdmin && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowAdmin(true)}
                style={{ marginBottom:12 }}>
                <LinearGradient
                  colors={['#FFD700', '#FF6B2B']}
                  start={{ x:0, y:0 }} end={{ x:1, y:0 }}
                  style={styles.adminBtn}>
                  <Text style={styles.adminBtnIcon}>⚡</Text>
                  <View style={{ flex:1 }}>
                    <Text style={styles.adminBtnText}>BACK OFFICE</Text>
                    <Text style={styles.adminBtnSub}>Gestion KAZMO</Text>
                  </View>
                  <Text style={styles.adminBtnArrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Déconnexion */}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>🚪 {t('logout')}</Text>
            </TouchableOpacity>

          </>
        )}

      </ScrollView>

      {/* Modal Langue */}
      <Modal visible={showLangModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('chooseLanguage')}</Text>
            <ScrollView>
              {LANGUAGES.map(function(lang) {
                const isSelected = language === lang.code;
                return (
                  <TouchableOpacity key={lang.code}
                    style={[styles.langOption, isSelected && styles.langOptionSelected]}
                    onPress={() => { changeLanguage(lang.code); setShowLangModal(false); }}>
                    <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                    <Text style={[styles.langOptionName, isSelected && { color:'#FF6B2B' }]}>{lang.name}</Text>
                    {isSelected && <Text style={{ color:'#FF6B2B', fontSize:16 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowLangModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  scroll: { padding:16, paddingBottom:40 },
  header: { flexDirection:'row', alignItems:'center', marginBottom:20 },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  avatarSection: { alignItems:'center', marginBottom:24 },
  avatarMask: { width:80, height:80, borderRadius:40, backgroundColor:'#000',
                alignItems:'center', justifyContent:'center' },
  avatarGradient: { width:80, height:80, borderRadius:40, alignItems:'center', justifyContent:'center' },
  avatarText: { fontSize:28, fontFamily:'BebasNeue', color:'#fff' },
  avatarName: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:1, marginTop:10 },
  avatarEmail: { color:'#ffffff55', fontSize:11, marginTop:2 },
  card: { backgroundColor:'#16162a', borderRadius:14, padding:16, marginBottom:12,
          borderWidth:1, borderColor:'#ffffff14' },
  cardHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  cardTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:12, letterSpacing:2 },
  editBtn: { backgroundColor:'#ffffff0a', borderRadius:8, paddingHorizontal:10, paddingVertical:5 },
  editBtnText: { color:'#FF6B2B', fontSize:11 },
  fieldLabel: { color:'#ffffffcc', fontSize:11, fontFamily:'BebasNeue', letterSpacing:1, marginBottom:6, marginTop:8 },
  input: { backgroundColor:'#0d0d1a', borderRadius:10, padding:12, color:'#fff',
           fontSize:14, borderWidth:1, borderColor:'#ffffff22' },
  editActions: { flexDirection:'row', gap:8, marginTop:14 },
  saveBtn: { borderRadius:10, padding:12, alignItems:'center' },
  saveBtnText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  cancelBtn: { backgroundColor:'#ffffff0a', borderRadius:10, padding:12, alignItems:'center' },
  cancelBtnText: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:14 },
  infoRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
             paddingVertical:10, borderBottomWidth:1, borderBottomColor:'#ffffff0a' },
  infoLabel: { color:'#ffffff55', fontSize:12 },
  infoValue: { color:'#fff', fontSize:12, fontWeight:'600' },
  langBtn: { flexDirection:'row', alignItems:'center', gap:10, padding:4 },
  langBtnFlag: { fontSize:22 },
  langBtnName: { color:'#fff', fontSize:14, flex:1 },
  langBtnArrow: { color:'#ffffff33', fontSize:20 },
  faqBtn: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#16162a',
            borderRadius:14, padding:16, marginBottom:12,
            borderWidth:1, borderColor:'#ffffff14' },
  faqBtnIcon: { fontSize:24 },
  faqBtnText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  faqBtnSub: { color:'#ffffff55', fontSize:10, marginTop:2 },
  faqBtnArrow: { color:'#ffffff33', fontSize:20 },
  adminBtn: { borderRadius:14, padding:16, flexDirection:'row', alignItems:'center', gap:12 },
  adminBtnIcon: { fontSize:24 },
  adminBtnText: { color:'#000', fontFamily:'BebasNeue', fontSize:16, letterSpacing:2 },
  adminBtnSub: { color:'#00000088', fontSize:10 },
  adminBtnArrow: { color:'#00000055', fontSize:22 },
  logoutBtn: { backgroundColor:'#E5393522', borderRadius:12, padding:14, alignItems:'center',
               borderWidth:1, borderColor:'#E5393533', marginTop:8 },
  logoutText: { color:'#E53935', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  modalOverlay: { flex:1, backgroundColor:'#000000aa', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'#16162a', borderTopLeftRadius:20, borderTopRightRadius:20,
                  padding:20, maxHeight:'80%' },
  modalTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:2,
                textAlign:'center', marginBottom:16 },
  langOption: { flexDirection:'row', alignItems:'center', gap:12, padding:14,
                borderBottomWidth:1, borderBottomColor:'#ffffff0a' },
  langOptionSelected: { backgroundColor:'#FF6B2B11' },
  langOptionFlag: { fontSize:22 },
  langOptionName: { color:'#fff', fontSize:14, flex:1 },
});