import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ScrollView, Platform, ActivityIndicator, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { supabase } from '../api/supabase';

const { width, height } = Dimensions.get('window');

const SPORTS = [
  { id:'NBA', icon:'🏀', label:'NBA' },
  { id:'NHL', icon:'🏒', label:'NHL' },
  { id:'MLB', icon:'⚾', label:'MLB' },
  { id:'NFL', icon:'🏈', label:'NFL' },
  { id:'FOOTBALL', icon:'⚽', label:'Football' },
  { id:'F1', icon:'🏎', label:'F1' },
  { id:'GOLF', icon:'⛳', label:'Golf' },
  { id:'MMA', icon:'🤼', label:'MMA' },
];

const LANGUAGES = [
  { code:'en', flag:'🇬🇧', name:'English' },
  { code:'fr', flag:'🇫🇷', name:'Français' },
  { code:'es', flag:'🇪🇸', name:'Español' },
  { code:'pt', flag:'🇧🇷', name:'Português' },
  { code:'de', flag:'🇩🇪', name:'Deutsch' },
  { code:'it', flag:'🇮🇹', name:'Italiano' },
  { code:'ar', flag:'🇸🇦', name:'العربية' },
  { code:'ru', flag:'🇷🇺', name:'Русский' },
];

export default function OnboardingScreen({ onDone, userId }) {
  const [step, setStep] = useState(0);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [notifGranted, setNotifGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const TOTAL_STEPS = 4;

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  }

  function goPrev() {
    if (step > 0) setStep(step - 1);
  }

  function toggleSport(id) {
    setSelectedSports(function(prev) {
      if (prev.includes(id)) return prev.filter(function(s) { return s !== id; });
      return [...prev, id];
    });
  }

  async function requestNotifications() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifGranted(status === 'granted');
    } catch(e) {}
    goNext();
  }

  async function finish() {
    setLoading(true);
    try {
      // Sauvegarder langue et sports favoris
      if (userId) {
        await supabase.from('profiles').update({ language: selectedLang }).eq('id', userId);
        await supabase.from('push_tokens').update({
          language: selectedLang,
          sports_interests: selectedSports,
        }).eq('user_id', userId);
      }
      onDone(selectedLang);
    } catch(e) {}
    finally { setLoading(false); }
  }

  // Indicateur de progression
  function ProgressDots() {
    return (
      <View style={styles.dots}>
        {Array.from({length: TOTAL_STEPS}).map(function(_, i) {
          return (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          );
        })}
      </View>
    );
  }

  // STEP 0 — Welcome
  if (step === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#080814','#0d0d2a']} style={styles.bg}>
          <View style={styles.content}>
            <View style={styles.logoRow}>
              <Text style={styles.logoWhite}>KAZ</Text>
              <Text style={styles.logoOrange}>MO</Text>
            </View>
            <Text style={styles.tagline}>LIVE SCORES · ALL SPORTS</Text>
            <View style={styles.welcomeIcons}>
              {['🏀','⚽','🏒','⚾','🏈','🏎','⛳','🤼'].map(function(icon, i) {
                return <Text key={i} style={[styles.welcomeIcon, {opacity: 0.4 + (i%3)*0.2}]}>{icon}</Text>;
              })}
            </View>
            <Text style={styles.welcomeTitle}>Welcome to Kazmo</Text>
            <Text style={styles.welcomeSub}>Your ultimate sports companion.{'\n'}Live scores, predictions & more.</Text>
          </View>
          <View style={styles.bottomArea}>
            <ProgressDots />
            <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={styles.btnFull}>
              <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.btnGradient}>
                <Text style={styles.btnText}>GET STARTED →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // STEP 1 — Choose sports
  if (step === 1) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#080814','#0d0d2a']} style={styles.bg}>
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Your Sports</Text>
            <Text style={styles.stepSub}>Select the sports you follow to get personalized notifications.</Text>
            <View style={styles.sportsGrid}>
              {SPORTS.map(function(sport) {
                const selected = selectedSports.includes(sport.id);
                return (
                  <TouchableOpacity key={sport.id} style={[styles.sportCard, selected && styles.sportCardSelected]} onPress={() => toggleSport(sport.id)} activeOpacity={0.8}>
                    <Text style={styles.sportCardIcon}>{sport.icon}</Text>
                    <Text style={[styles.sportCardLabel, selected && {color:'#fff'}]}>{sport.label}</Text>
                    {selected && <View style={styles.sportCheckmark}><Text style={{fontSize:10,color:'#fff'}}>✓</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.skipHint}>You can change this later in your profile.</Text>
          </View>
          <View style={styles.bottomArea}>
            <ProgressDots />
            <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={styles.btnFull}>
              <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.btnGradient}>
                <Text style={styles.btnText}>{selectedSports.length > 0 ? 'CONTINUE →' : 'SKIP →'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // STEP 2 — Notifications
  if (step === 2) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#080814','#0d0d2a']} style={styles.bg}>
          <View style={styles.content}>
            <Text style={styles.notifEmoji}>🔔</Text>
            <Text style={styles.stepTitle}>Stay in the Loop</Text>
            <Text style={styles.stepSub}>Enable notifications to get alerts for live matches, scores and breaking sports news.</Text>
            <View style={styles.notifFeatures}>
              {[
                { icon:'⚡', text:'Live score alerts' },
                { icon:'🏆', text:'Match start reminders' },
                { icon:'📊', text:'Final results instantly' },
              ].map(function(f, i) {
                return (
                  <View key={i} style={styles.notifFeatureRow}>
                    <Text style={styles.notifFeatureIcon}>{f.icon}</Text>
                    <Text style={styles.notifFeatureText}>{f.text}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.bottomArea}>
            <ProgressDots />
            <TouchableOpacity onPress={requestNotifications} activeOpacity={0.85} style={styles.btnFull}>
              <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.btnGradient}>
                <Text style={styles.btnText}>ENABLE NOTIFICATIONS 🔔</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // STEP 3 — Language
  if (step === 3) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#080814','#0d0d2a']} style={styles.bg}>
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Choose Language</Text>
            <Text style={styles.stepSub}>Kazmo is available in 8 languages. Pick yours!</Text>
            <View style={styles.langGrid}>
              {LANGUAGES.map(function(lang) {
                const selected = selectedLang === lang.code;
                return (
                  <TouchableOpacity key={lang.code} style={[styles.langCard, selected && styles.langCardSelected]} onPress={() => setSelectedLang(lang.code)} activeOpacity={0.8}>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text style={[styles.langName, selected && {color:'#fff'}]}>{lang.name}</Text>
                    {selected && <View style={styles.sportCheckmark}><Text style={{fontSize:10,color:'#fff'}}>✓</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.bottomArea}>
            <ProgressDots />
            <TouchableOpacity onPress={finish} disabled={loading} activeOpacity={0.85} style={styles.btnFull}>
              <LinearGradient colors={loading?['#444','#555']:['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.btnGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>LET'S GO 🚀</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex:1 },
  bg: { flex:1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  content: { flex:1, paddingHorizontal:28, alignItems:'center', justifyContent:'center' },
  bottomArea: { paddingHorizontal:28, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap:12 },
  dots: { flexDirection:'row', justifyContent:'center', gap:8, marginBottom:8 },
  dot: { width:8, height:8, borderRadius:4, backgroundColor:'#ffffff22' },
  dotActive: { width:24, backgroundColor:'#FF6B2B' },
  // Welcome
  logoRow: { flexDirection:'row', marginBottom:8 },
  logoWhite: { fontSize:80, color:'#fff', fontFamily:'BebasNeue', letterSpacing:4 },
  logoOrange: { fontSize:80, color:'#FF6B2B', fontFamily:'BebasNeue', letterSpacing:4 },
  tagline: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12, letterSpacing:3, marginBottom:32 },
  welcomeIcons: { flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:8, marginBottom:32, width:200 },
  welcomeIcon: { fontSize:28 },
  welcomeTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:32, letterSpacing:2, textAlign:'center', marginBottom:12 },
  welcomeSub: { color:'#ffffff88', fontSize:14, textAlign:'center', lineHeight:22 },
  // Button
  btnFull: { borderRadius:14 },
  btnGradient: { borderRadius:14, padding:16, alignItems:'center' },
  btnText: { color:'#fff', fontFamily:'BebasNeue', fontSize:16, letterSpacing:2 },
  skipBtn: { alignItems:'center', padding:8 },
  skipBtnText: { color:'#ffffff44', fontSize:13 },
  // Sports
  stepTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:28, letterSpacing:2, textAlign:'center', marginBottom:8 },
  stepSub: { color:'#ffffff88', fontSize:13, textAlign:'center', lineHeight:20, marginBottom:24 },
  sportsGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center', marginBottom:12 },
  sportCard: { width:(width-56-30)/4, aspectRatio:1, borderRadius:14, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22', alignItems:'center', justifyContent:'center', gap:4 },
  sportCardSelected: { backgroundColor:'#FF6B2B22', borderColor:'#FF6B2B' },
  sportCardIcon: { fontSize:24 },
  sportCardLabel: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:10, letterSpacing:0.5 },
  sportCheckmark: { position:'absolute', top:4, right:4, backgroundColor:'#FF6B2B', borderRadius:8, width:16, height:16, alignItems:'center', justifyContent:'center' },
  skipHint: { color:'#ffffff33', fontSize:11, textAlign:'center' },
  // Notifs
  notifEmoji: { fontSize:64, marginBottom:16 },
  notifFeatures: { gap:16, marginTop:8, width:'100%' },
  notifFeatureRow: { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'#16162a', borderRadius:12, padding:14, borderWidth:1, borderColor:'#ffffff14' },
  notifFeatureIcon: { fontSize:22 },
  notifFeatureText: { color:'#ffffffcc', fontSize:14, flex:1 },
  // Language
  langGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center', width:'100%' },
  langCard: { width:(width-56-30)/4, borderRadius:14, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22', alignItems:'center', justifyContent:'center', padding:12, gap:4 },
  langCardSelected: { backgroundColor:'#1D428A22', borderColor:'#1D428A' },
  langFlag: { fontSize:28 },
  langName: { color:'#ffffff66', fontSize:10, fontFamily:'BebasNeue', letterSpacing:0.5, textAlign:'center' },
});
