import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../i18n/LanguageContext';
import Purchases from 'react-native-purchases';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    color: '#ffffff22',
    borderColor: '#ffffff33',
    features: [
      '✅ Live scores & schedule',
      '✅ 1 Kazmo Prediction (lifetime)',
      '❌ Favorites',
      '❌ Tips & Analysis tab',
      '❌ Unlimited predictions',
      '❌ Bet tracking',
      '❌ Kazmo Predict in Schedule',
    ],
  },
  {
    id: 'planA',
    name: 'KAZMO Pro',
    monthlyPrice: '$14.99',
    yearlyPrice: '$149.99',
    yearlyNote: 'Save 2 months',
    color: '#FF6B2B',
    borderColor: '#FF6B2B',
    features: [
      '✅ Everything in Free',
      '✅ Unlimited Kazmo Predictions',
      '✅ 1 bet in My Bets',
      '🔒 Kazmo Predict in Schedule (Elite only)',
    ],
  },
  {
    id: 'planB',
    name: 'KAZMO Elite',
    monthlyPrice: '$49.99',
    yearlyPrice: null,
    color: '#FFD700',
    borderColor: '#FFD700',
    features: [
      '✅ Everything in KAZMO Pro',
      '✅ Kazmo Predict on every match',
      '✅ Unlimited bet tracking',
      '✅ Full My Bets access',
    ],
  },
];

export default function SubscriptionScreen({ currentPlan, onBack, setUserPlan }) {
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(null);

  async function handleSubscribe(plan) {
    if (plan.id === 'free') return;
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      let pkg = null;
      if (plan.id === 'planA') {
        pkg = billingCycle === 'yearly' ? current.annual : current.monthly;
      } else if (plan.id === 'planB') {
        pkg = current.availablePackages.find(function(p){ return p.identifier === 'elite_monthly'; }) || current.monthly;
      }
      if (pkg) {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        if (customerInfo.entitlements.active['plan_b']) { if(setUserPlan) setUserPlan('planB'); setPurchased('planB'); }
        else if (customerInfo.entitlements.active['plan_a']) { if(setUserPlan) setUserPlan('planA'); setPurchased('planA'); }
      }
    } catch(e) { if (!e.userCancelled) console.error('Purchase error:', e); }
    setLoading(false);
  }

  if (purchased) {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:'#080814',alignItems:'center',justifyContent:'center',padding:24}}>
        <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={{width:100,height:100,borderRadius:50,alignItems:'center',justifyContent:'center',marginBottom:24}}>
          <Text style={{fontSize:48}}>⭐</Text>
        </LinearGradient>
        <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:28,letterSpacing:2,textAlign:'center',marginBottom:8}}>WELCOME TO {purchased==='planB'?'KAZMO ELITE':'KAZMO PRO'}!</Text>
        <Text style={{color:'#ffffff88',fontSize:13,textAlign:'center',marginBottom:32,lineHeight:20}}>Your subscription is now active. Enjoy all premium features!</Text>
        <TouchableOpacity onPress={onBack} activeOpacity={0.85} style={{width:'100%'}}>
          <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:14,padding:16,alignItems:'center'}}>
            <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1}}>🚀 START EXPLORING</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⭐ KAZMO PREMIUM</Text>
        <View style={{width:50}}/>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Unlock the full power of AI sports analysis</Text>

        {/* Billing cycle toggle — only show if not planB */}
        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setBillingCycle('monthly')}
            style={[styles.toggleBtn, billingCycle==='monthly' && styles.toggleBtnActive]}>
            <Text style={[styles.toggleText, billingCycle==='monthly' && {color:'#fff'}]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setBillingCycle('yearly')}
            style={[styles.toggleBtn, billingCycle==='yearly' && styles.toggleBtnActive]}>
            <Text style={[styles.toggleText, billingCycle==='yearly' && {color:'#fff'}]}>Yearly</Text>
            <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>-17%</Text></View>
          </TouchableOpacity>
        </View>

        {PLANS.map(function(plan) {
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.id === 'planA';
          return (
            <View key={plan.id} style={[styles.planCard, {borderColor: plan.borderColor}, isCurrent && styles.planCardCurrent]}>
              {isPopular && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>⭐ MOST POPULAR</Text></View>}
              {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>✓ YOUR PLAN</Text></View>}
              <Text style={[styles.planName, {color: plan.color}]}>{plan.name}</Text>
              {plan.monthlyPrice ? (
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>
                    {billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice+'/yr' : plan.monthlyPrice+'/mo'}
                  </Text>
                  {billingCycle === 'yearly' && plan.yearlyNote && (
                    <View style={styles.saveNote}><Text style={styles.saveNoteText}>{plan.yearlyNote}</Text></View>
                  )}
                  {plan.id === 'planB' && billingCycle === 'yearly' && (
                    <Text style={{color:'#ffffff55',fontSize:11,marginLeft:8}}>Monthly only</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.planPrice}>Free</Text>
              )}
              <View style={styles.featureList}>
                {plan.features.map(function(f, i) {
                  return <Text key={i} style={styles.featureText}>{f}</Text>;
                })}
              </View>
              {!isCurrent && plan.id !== 'free' && (
                <TouchableOpacity onPress={() => handleSubscribe(plan)} disabled={loading} activeOpacity={0.85} style={{marginTop:12}}>
                  <LinearGradient
                    colors={plan.id==='planB' ? ['#FFD700','#FF6B2B'] : ['#FF6B2B','#FFD600']}
                    start={{x:0,y:0}} end={{x:1,y:0}}
                    style={styles.subscribeBtn}>
                    {loading ? <ActivityIndicator color="#fff" size="small"/> :
                      <Text style={styles.subscribeBtnText}>
                        {plan.id==='planA'?'Start 7-day free trial':'Upgrade to KAZMO Elite'}
                      </Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <Text style={styles.trialNote}>🎁 7-day free trial • Cancel anytime • Billed via Apple/Google</Text>
        <Text style={styles.legalNote}>Subscription renews automatically. Cancel at least 24h before renewal.</Text>
        <TouchableOpacity onPress={async function(){
          try {
            const info = await Purchases.restorePurchases();
            if (info.entitlements.active['plan_b']) { if(setUserPlan) setUserPlan('planB'); Alert.alert('Restored!', 'KAZMO Elite restored successfully.'); onBack(); }
            else if (info.entitlements.active['plan_a']) { if(setUserPlan) setUserPlan('planA'); Alert.alert('Restored!', 'KAZMO Pro restored successfully.'); onBack(); }
            else { Alert.alert('Nothing to restore', 'No active subscription found.'); }
          } catch(e) { Alert.alert('Error', 'Could not restore purchases.'); }
        }} style={{marginTop:8,padding:12,alignItems:'center'}}>
          <Text style={{color:'#ffffff44',fontSize:12,textDecorationLine:'underline'}}>Restore purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16 },
  back: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  title: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:1 },
  scroll: { padding:16, paddingBottom:40 },
  subtitle: { color:'#ffffff88', fontSize:13, textAlign:'center', marginBottom:20 },
  toggleRow: { flexDirection:'row', backgroundColor:'#16162a', borderRadius:12, padding:4, marginBottom:20, gap:4 },
  toggleBtn: { flex:1, padding:10, borderRadius:10, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:6 },
  toggleBtnActive: { backgroundColor:'#FF6B2B' },
  toggleText: { color:'#ffffff88', fontFamily:'BebasNeue', fontSize:13, letterSpacing:1 },
  saveBadge: { backgroundColor:'#4CAF5033', borderRadius:4, paddingHorizontal:4, paddingVertical:1 },
  saveBadgeText: { color:'#4CAF50', fontSize:9, fontFamily:'BebasNeue' },
  planCard: { backgroundColor:'#16162a', borderRadius:16, padding:16, marginBottom:16, borderWidth:1 },
  planCardCurrent: { backgroundColor:'#FF6B2B11' },
  popularBadge: { backgroundColor:'#FF6B2B', borderRadius:6, paddingHorizontal:8, paddingVertical:2, alignSelf:'flex-start', marginBottom:8 },
  popularBadgeText: { color:'#fff', fontFamily:'BebasNeue', fontSize:10, letterSpacing:1 },
  currentBadge: { backgroundColor:'#4CAF5022', borderRadius:6, paddingHorizontal:8, paddingVertical:2, alignSelf:'flex-start', marginBottom:8, borderWidth:1, borderColor:'#4CAF5044' },
  currentBadgeText: { color:'#4CAF50', fontFamily:'BebasNeue', fontSize:10, letterSpacing:1 },
  planName: { fontFamily:'BebasNeue', fontSize:24, letterSpacing:2, marginBottom:4 },
  priceRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 },
  planPrice: { color:'#fff', fontFamily:'BebasNeue', fontSize:28, letterSpacing:1 },
  saveNote: { backgroundColor:'#4CAF5022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  saveNoteText: { color:'#4CAF50', fontSize:10, fontFamily:'BebasNeue' },
  featureList: { gap:6 },
  featureText: { color:'#ffffffcc', fontSize:13, lineHeight:20 },
  subscribeBtn: { borderRadius:12, padding:14, alignItems:'center' },
  subscribeBtnText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  trialNote: { color:'#ffffff55', fontSize:11, textAlign:'center', marginTop:8, marginBottom:4 },
  legalNote: { color:'#ffffff33', fontSize:10, textAlign:'center', lineHeight:14 },
});
