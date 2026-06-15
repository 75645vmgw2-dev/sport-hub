import React, { useState, useEffect, useRef } from 'react';
import Purchases from 'react-native-purchases';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { supabase } from './src/api/supabase';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import LiveScreen from './src/screens/LiveScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import ConseilsScreen from './src/screens/ConseilsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import NBAScreen from './src/screens/NBAScreen';
import NHLScreen from './src/screens/NHLScreen';
import MLBScreen from './src/screens/MLBScreen';
import NFLScreen from './src/screens/NFLScreen';
import SoccerScreen from './src/screens/SoccerScreen';
import F1Screen from './src/screens/F1Screen';
import GolfScreen from './src/screens/GolfScreen';
import MMAScreen from './src/screens/MMAScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Tab = createBottomTabNavigator();

async function registerForPushNotifications(userId, language) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '3cf98fe2-b872-475b-bb43-e6034ec85261',
    });
    const token = tokenData.data;
    await supabase.from('push_tokens').upsert({
      user_id: userId, token, language: language || 'fr',
      platform: Platform.OS, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch(e) { console.log('Erreur push token:', e.message); }
}

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems:'center', justifyContent:'center', width:56 }}>
      <Text style={{ fontSize:20 }}>{emoji}</Text>
      <Text style={{
        fontFamily:'BebasNeue', fontSize:9, letterSpacing:0.5,
        color: focused ? '#FF6B2B' : '#ffffff99', marginTop:1, textAlign:'center',
      }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SportWrapper({ children, onBack, label }) {
  return (
    <View style={{ flex:1, backgroundColor:'#080814' }}>
      <View style={{ flex:1 }}>{children}</View>
      <TouchableOpacity onPress={onBack} style={styles.bottomBackBtn} activeOpacity={0.8}>
        <Text style={styles.bottomBackBtnText}>{label || '← Retour'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function AppContent() {
  const { t, language, setLanguage, loaded: langLoaded } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSport, setCurrentSport] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const navigationRef = useRef(null);
  const [fontsLoaded] = useFonts({ BebasNeue: BebasNeue_400Regular });

  useEffect(() => {
    async function initRevenueCat() {
      try {
        // Admins ont accès Elite gratuit
        const adminEmails = ['jack.melki@mac.com', 'melkijackus@gmail.com'];
        if (user && adminEmails.includes(user.email)) {
          setUserPlan('planB');
          return;
        }
        Purchases.configure({ apiKey: 'appl_eXPAcbVJEJcyzNsTcXnHwMENIZX' });
        const info = await Purchases.getCustomerInfo();
        if (info.entitlements.active['plan_b']) setUserPlan('planB');
        else if (info.entitlements.active['plan_a']) setUserPlan('planA');
        else setUserPlan('free');
      } catch(e) { console.log('RevenueCat init error:', e); }
    }
    initRevenueCat();
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Si user existant -> skip onboarding
  useEffect(() => {
    async function markDoneIfExistingUser() {
      if (!user) return;
      try {
        const done = await AsyncStorage.getItem('kazmo_onboarding_done');
        if (done !== 'true') {
          await AsyncStorage.setItem('kazmo_onboarding_done', 'true');
          setShowOnboarding(false);
        }
      } catch(e) {}
    }
    markDoneIfExistingUser();
  }, [user]);

  // Vérifier si l'onboarding a déjà été fait
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const done = await AsyncStorage.getItem('kazmo_onboarding_done');
        setShowOnboarding(done !== 'true');
      } catch(e) {
        setShowOnboarding(false);
      } finally {
        setOnboardingChecked(true);
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (user) registerForPushNotifications(user.id, language);
  }, [user, language]);

  function goToLive() {
    if (navigationRef.current) navigationRef.current.navigate('Live');
  }

  async function handleOnboardingDone(selectedLang) {
    try {
      await AsyncStorage.setItem('kazmo_onboarding_done', 'true');
      if (setLanguage) setLanguage(selectedLang);
    } catch(e) {}
    setShowOnboarding(false);
  }

  if (loading || !fontsLoaded || !langLoaded) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashWhite}>KAZ</Text>
        <Text style={styles.splashOrange}>MO</Text>
        <ActivityIndicator color="#FF6B2B" style={{ marginTop:20 }} />
      </View>
    );
  }

  // Onboarding — affiché avant l'auth pour les nouveaux utilisateurs
  if (showOnboarding) {
    return <OnboardingScreen onDone={handleOnboardingDone} userId={user?.id || null} />;
  }

  if (!user) return <AuthScreen onLogin={setUser} onSignup={function(u){setUser(u);setShowOnboarding(true);}} />;

  if (currentSport) {
    const back = () => setCurrentSport(null);
    const props = { onBack: back, user };
    let SportScreen = null;
    if (currentSport.id === 'basketball') SportScreen = <NBAScreen {...props} />;
    else if (currentSport.id === 'hockey') SportScreen = <NHLScreen {...props} />;
    else if (currentSport.id === 'baseball') SportScreen = <MLBScreen {...props} />;
    else if (currentSport.id === 'nfl') SportScreen = <NFLScreen {...props} />;
    else if (currentSport.id === 'soccer') SportScreen = <SoccerScreen {...props} />;
    else if (currentSport.id === 'f1') SportScreen = <F1Screen {...props} initialTab={currentSport.initialTab||'races'} />;
    else if (currentSport.id === 'golf') SportScreen = <GolfScreen {...props} />;
    else if (currentSport.id === 'mma') SportScreen = <MMAScreen {...props} />;
    else if (currentSport.id === 'event_special') SportScreen = <SoccerScreen {...props} initialLeague='wc' />;
    else SportScreen = (
      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonIcon}>{currentSport.icon}</Text>
        <Text style={styles.comingSoonText}>{currentSport.name}</Text>
      </View>
    );
    return (
      <SportWrapper onBack={back} label={t('backToHome')}>
        {SportScreen}
      </SportWrapper>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: '#0d0d1a',
            borderTopColor: '#ffffff22',
            borderTopWidth: 1,
            height: 76,
            paddingBottom: 10,
          },
        }}>
        <Tab.Screen name="Accueil"
          children={() => <HomeScreen user={user} onGoToLive={goToLive} onSelectSport={setCurrentSport} />}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label={t('tabHome')} focused={focused} /> }}
        />
        <Tab.Screen name="Live"
          children={() => <LiveScreen onSelectSport={setCurrentSport} />}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📺" label={t('tabLive')} focused={focused} /> }}
        />
        <Tab.Screen name="Conseils"
          children={() => <ConseilsScreen userPlan={userPlan} />}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔮" label={t('tabConseils')} focused={focused} /> }}
        />
        <Tab.Screen name="Agenda"
          children={() => <AgendaScreen userPlan={userPlan} user={user} />}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗓" label={t('tabAgenda')} focused={focused} /> }}
        />
        <Tab.Screen name="Favoris"
          children={() => <FavoritesScreen user={user} userPlan={userPlan} />}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" label={t('tabFavorites')} focused={focused} /> }}
        />
        <Tab.Screen name="Profil"
          children={() => <ProfileScreen user={user} onLogout={() => setUser(null)} userPlan={userPlan} setUserPlan={setUserPlan} />}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label={t('tabProfile')} focused={focused} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex:1, backgroundColor:'#080814', alignItems:'center', justifyContent:'center', flexDirection:'row' },
  splashWhite: { fontSize:72, letterSpacing:6, color:'#fff', fontFamily:'BebasNeue' },
  splashOrange: { fontSize:72, letterSpacing:6, color:'#FF6B2B', fontFamily:'BebasNeue' },
  comingSoon: { flex:1, backgroundColor:'#080814', alignItems:'center', justifyContent:'center', padding:40 },
  comingSoonIcon: { fontSize:64, marginBottom:16 },
  comingSoonText: { color:'#fff', fontFamily:'BebasNeue', fontSize:32, letterSpacing:2 },
  bottomBackBtn: { backgroundColor:'#16162a', borderTopWidth:1, borderTopColor:'#ffffff22', padding:16, alignItems:'center' },
  bottomBackBtnText: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1.5 },
});
