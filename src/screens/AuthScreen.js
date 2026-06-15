import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path, G } from 'react-native-svg';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Localization from 'expo-localization';
import { supabase } from '../api/supabase';
import { useLanguage } from '../i18n/LanguageContext';

// ── Google Sign In — chargement protégé (simulateur compatible) ──
let GoogleSignin = null;
let statusCodes = {};
try {
  const GoogleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleSigninModule.GoogleSignin;
  statusCodes = GoogleSigninModule.statusCodes;
  GoogleSignin.configure({
    webClientId: '579139707826-mhh95e0puqmlnkbg156uen66piipm023.apps.googleusercontent.com',
    iosClientId: '579139707826-7na99fj0talskda7l0sfquuqkvd020qs.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });
} catch(e) {}

// ── Détecte la langue du téléphone ──────────────────────────────
function getDeviceLanguage() {
  try {
    const locale = Localization.getLocales?.()?.[0]?.languageCode || 'fr';
    const supported = ['fr', 'en', 'es', 'pt', 'de', 'it', 'ar', 'ru'];
    return supported.indexOf(locale) >= 0 ? locale : 'en';
  } catch(e) { return 'fr'; }
}

// ── Sauvegarde le profil avec la langue ──────────────────────────
async function saveProfile(userId, email, firstName, lastName, avatarUrl, referredBy) {
  const lang = getDeviceLanguage();
  await supabase.from('profiles').upsert({
    id: userId,
    email: email || '',
    referred_by: referredBy || null,
    first_name: firstName || '',
    last_name: lastName || '',
    avatar_url: avatarUrl || null,
    language: lang,
  });
}

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <G>
        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <Path fill="none" d="M0 0h48v48H0z"/>
      </G>
    </Svg>
  );
}

export default function AuthScreen({ onLogin, onSignup }) {
  const { t: tLang } = useLanguage(); const t = (key) => { const en = {tagline:'LIVE RESULTS · ALL SPORTS',login:'Login',signup:'Create Account',email:'Email',password:'Password',connect:'SIGN IN',createAccount:'CREATE ACCOUNT',noAccount:'No account? Sign up',hasAccount:'Already have an account? Sign in',continueApple:'Continue with Apple',continueGoogle:'Continue with Google',errorFill:'Please fill all fields'}; return en[key] || tLang(key); };
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [loadingApple, setLoadingApple] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(function(available) {
      setAppleAvailable(available);
    }).catch(function() {
      setAppleAvailable(false);
    });
  }, []);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('', t('errorFill'));
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          await saveProfile(data.user.id, data.user.email, '', '', null);
          onLogin(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: 'https://www.kazmo.app/confirm.html' } });
        if (error) throw error;
        if (data.user) {
          await saveProfile(data.user.id, data.user.email, firstName, lastName, null, referralCode.trim().toUpperCase());
          if (onSignup) onSignup(data.user);
          else onLogin(data.user);
        } else {
          Alert.alert('✅', 'Check your email to confirm your KAZMO account.');
        }
      }
    } catch(e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!resetEmail.trim()) {
      Alert.alert('', 'Entre ton adresse email.');
      return;
    }
    setLoadingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: 'https://kazmo.app/confirm.html',
      });
      if (error) throw error;
      Alert.alert('✅', 'Reset email sent! Check your inbox.');
      setShowForgot(false);
      setResetEmail('');
    } catch(e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoadingReset(false);
    }
  }

  async function handleAppleSignIn() {
    setLoadingApple(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;
        if (data.user) {
          await saveProfile(data.user.id, data.user.email, credential.fullName?.givenName || '', credential.fullName?.familyName || '', null);
          onLogin(data.user);
        }
      }
    } catch(e) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Erreur Apple', e.message);
      }
    } finally {
      setLoadingApple(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!GoogleSignin) {
      Alert.alert('', 'Google Sign In est disponible uniquement sur appareil réel via TestFlight.');
      return;
    }
    setLoadingGoogle(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      if (!idToken) throw new Error('Impossible de récupérer le token Google.');
      const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (error) throw error;
      if (data.user) {
        const googleUser = userInfo?.data?.user || userInfo?.user;
        await saveProfile(data.user.id, data.user.email, googleUser?.givenName || '', googleUser?.familyName || '', googleUser?.photo || null);
        onLogin(data.user);
      }
    } catch(e) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
      } else if (e.code === statusCodes.IN_PROGRESS) {
        Alert.alert('', 'Connexion Google déjà en cours...');
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Erreur', 'Google Play Services non disponible.');
      } else {
        Alert.alert('Erreur Google', e.message);
      }
    } finally {
      setLoadingGoogle(false);
    }
  }

  // ── Modal mot de passe oublié ────────────────────────────────
  if (showForgot) {
    return (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <Image source={require('../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FORGOT PASSWORD</Text>
          <Text style={styles.forgotSubtitle}>Enter your email and we'll send you a reset link.</Text>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            value={resetEmail}
            onChangeText={setResetEmail}
            style={styles.input}
            placeholder="ton@email.com"
            placeholderTextColor="#ffffff44"
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus
          />
          <TouchableOpacity onPress={handleForgotPassword} disabled={loadingReset} activeOpacity={0.85}>
            <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.mainBtn}>
              {loadingReset ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>📧 SEND RESET LINK</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowForgot(false); setResetEmail(''); }} style={styles.switchBtn}>
            <Text style={styles.switchText}>← Back to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* Logo */}
      <View style={styles.logoSection}>
        <Image source={require('../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isLogin ? t('login') : t('signup')}</Text>

        {/* Apple Sign In */}
        {appleAvailable && (
          <TouchableOpacity style={styles.appleBtn} activeOpacity={0.8} onPress={handleAppleSignIn} disabled={loadingApple}>
            {loadingApple ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Text style={styles.appleBtnIcon}></Text><Text style={styles.appleBtnText}>{t('continueApple')}</Text></>
            )}
          </TouchableOpacity>
        )}

        {/* Google Sign In */}
        <TouchableOpacity style={[styles.socialBtn, styles.googleBtn]} activeOpacity={0.8} onPress={handleGoogleSignIn} disabled={loadingGoogle}>
          {loadingGoogle ? <ActivityIndicator color="#fff" size="small" /> : (
            <><GoogleIcon /><Text style={styles.socialBtnText}>{t('continueGoogle')}</Text></>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.fieldLabel}>{t('email')}</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder={t('email')} placeholderTextColor="#ffffff44" autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.fieldLabel}>{t('password')}</Text>
        <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder={t('password')} placeholderTextColor="#ffffff44" secureTextEntry />

        {/* Champs nom/prénom — visible uniquement au signup */}
        {!isLogin && (
          <><Text style={styles.fieldLabel}>FIRST NAME</Text>
          <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholder="First name" placeholderTextColor="#ffffff44" autoCapitalize="words" />
          <Text style={styles.fieldLabel}>LAST NAME</Text>
          <TextInput value={lastName} onChangeText={setLastName} style={styles.input} placeholder="Last name" placeholderTextColor="#ffffff44" autoCapitalize="words" /></>)}
        {/* Confirm password — visible uniquement au signup */}
        {!isLogin && (
          <><Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
          <TextInput value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} placeholder="Confirm password" placeholderTextColor="#ffffff44" secureTextEntry />
          <TextInput value={referralCode} onChangeText={setReferralCode} style={[styles.input,{borderColor:'#FFD70033'}]} placeholder="Referral code (optional) — get 50% off!" placeholderTextColor="#FFD70066" autoCapitalize="characters" maxLength={8} /></>)}
        {/* Mot de passe oublié — visible uniquement en mode connexion */}
        {isLogin && (
          <TouchableOpacity onPress={() => setShowForgot(true)} style={styles.forgotBtn}>
            <Text style={styles.forgotBtnText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.85} style={{ marginTop: isLogin ? 8 : 4 }}>
          <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.mainBtn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{isLogin ? t('connect') : t('createAccount')}</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
          <Text style={styles.switchText}>{isLogin ? t('noAccount') : t('hasAccount')}</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow:1, backgroundColor:'#080814', alignItems:'center', justifyContent:'center', padding:24 },
  logoSection: { alignItems:'center', marginBottom:32 },
  logoImage: { width:160, height:160, borderRadius:32, marginBottom:8 },
  tagline: { color:'#ffffffcc', fontSize:10, letterSpacing:2, textTransform:'uppercase', marginTop:4 },
  card: { width:'100%', backgroundColor:'#16162a', borderRadius:20, padding:22, borderWidth:1, borderColor:'#ffffff14' },
  cardTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:22, letterSpacing:2, textAlign:'center', marginBottom:18 },
  appleBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor:'#000', borderRadius:12, padding:14, marginBottom:10, borderWidth:1, borderColor:'#ffffff22', minHeight:48 },
  appleBtnIcon: { color:'#fff', fontSize:18 },
  appleBtnText: { color:'#fff', fontSize:14, fontWeight:'600' },
  socialBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor:'#000', borderRadius:12, padding:14, marginBottom:10, borderWidth:1, borderColor:'#ffffff22', minHeight:48 },
  googleBtn: { backgroundColor:'#ffffff0a' },
  socialBtnText: { color:'#fff', fontSize:14, fontWeight:'600' },
  dividerRow: { flexDirection:'row', alignItems:'center', gap:10, marginVertical:14 },
  dividerLine: { flex:1, height:1, backgroundColor:'#ffffff22' },
  dividerText: { color:'#ffffff55', fontSize:12 },
  fieldLabel: { color:'#ffffffcc', fontSize:11, fontFamily:'BebasNeue', letterSpacing:1, marginBottom:6 },
  input: { backgroundColor:'#0d0d1a', borderRadius:12, padding:14, color:'#fff', fontSize:14, borderWidth:1, borderColor:'#ffffff22', marginBottom:14 },
  forgotBtn: { alignItems:'flex-end', marginTop:-8, marginBottom:8 },
  forgotBtnText: { color:'#FF6B2B', fontSize:12 },
  forgotSubtitle: { color:'#ffffff66', fontSize:13, marginBottom:20, lineHeight:20 },
  mainBtn: { borderRadius:12, padding:16, alignItems:'center' },
  mainBtnText: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:2 },
  switchBtn: { marginTop:14, alignItems:'center' },
  switchText: { color:'#ffffffcc', fontSize:12 },
});
