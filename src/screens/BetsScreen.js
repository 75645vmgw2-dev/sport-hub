import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Share, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../api/supabase';
import { useLanguage } from '../i18n/LanguageContext';
const SPORTS = ['Football','NBA','NHL','MLB','NFL','Tennis','MMA','F1','Golf','Boxing','Other'];
const BET_TYPES = ['Simple','Combiné','Système'];
const RESULTS = [
  { id:'pending', label:'⏳ Pending', color:'#FFD700' },
  { id:'won', label:'✅ Won', color:'#4CAF50' },
  { id:'lost', label:'❌ Lost', color:'#E53935' },
  { id:'void', label:'↩️ Void', color:'#ffffff55' },
];
function calcProfit(odds, oddsFormat, stake, result) {
  if (result === 'void') return 0;
  let d = parseFloat(odds);
  if (oddsFormat === 'american') { const o=parseFloat(odds); d = o>0?(o/100)+1:(100/Math.abs(o))+1; }
  if (result === 'won') return ((d-1)*parseFloat(stake)).toFixed(2);
  if (result === 'lost') return (-parseFloat(stake)).toFixed(2);
  return 0;
}
export default function BetsScreen({ user, onBack, userPlan='free' }) {
  const { t } = useLanguage();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBet, setEditingBet] = useState(null);
  const [filterResult, setFilterResult] = useState('all');

  if (userPlan === 'free') {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:'#080814',alignItems:'center',justifyContent:'center',padding:24}}>
        <Text style={{fontSize:40,marginBottom:16}}>📊</Text>
        <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:24,letterSpacing:2,marginBottom:8,textAlign:'center'}}>KAZMO PRO FEATURE</Text>
        <Text style={{color:'#ffffff88',fontSize:13,textAlign:'center',marginBottom:24,lineHeight:20}}>Bet tracking is available with KAZMO Pro or Elite. Upgrade to track your bets and analyze your performance.</Text>
        <TouchableOpacity onPress={onBack} activeOpacity={0.85} style={{borderRadius:14,overflow:'hidden',width:'100%'}}>
          <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={{padding:16,alignItems:'center',borderRadius:14}}>
            <Text style={{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1}}>⭐ UPGRADE TO PRO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  const [showDatePicker, setShowDatePicker] = useState(false);
  const emptyLeg = { match_home:'', match_away:'', sport:'Football', odds:'', odds_format:'decimal' };
  const emptyForm = { sport:'Football', match_home:'', match_away:'', bet_type:'Simple', bookmaker:'', odds:'', odds_format:'decimal', stake:'', currency:'USD', result:'pending', notes:'', match_date:new Date().toISOString().slice(0,10), legs:[{...emptyLeg}] };
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { fetchBets(); }, []);
  async function fetchBets() {
    setLoading(true);
    try { const { data } = await supabase.from('user_bets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); setBets(data||[]); } catch(e) {}
    setLoading(false);
  }
  function calcCombinedOdds(legs, format) {
    let total = 1;
    legs.forEach(function(leg) {
      if (!leg.odds) return;
      let d = parseFloat(leg.odds);
      if (format === 'american' || leg.odds_format === 'american') {
        const o = parseFloat(leg.odds);
        d = o > 0 ? (o/100)+1 : (100/Math.abs(o))+1;
      }
      total *= d;
    });
    return total.toFixed(2);
  }

  async function saveBet() {
    if (userPlan === 'planA' && bets.length >= 1) {
      Alert.alert('KAZMO Pro', 'Plan A allows 1 bet maximum. Upgrade to KAZMO Elite for unlimited bet tracking.');
      return;
    }
    const isCombo = form.bet_type === 'Combiné';
    const finalOdds = isCombo ? calcCombinedOdds(form.legs, form.odds_format) : form.odds;
    if (!form.stake) { Alert.alert('Error', 'Stake is required'); return; }
    if (!isCombo && !form.match_home) { Alert.alert('Error', 'Match is required'); return; }
    if (isCombo && form.legs.filter(l=>l.match_home&&l.odds).length < 2) { Alert.alert('Error', 'A combo bet needs at least 2 matches with odds'); return; }
    try {
      const profit = calcProfit(finalOdds, 'decimal', form.stake, form.result);
      if (userPlan === 'planA' && bets.length >= 1) {
      Alert.alert('KAZMO Pro', 'Plan A allows 1 bet maximum. Upgrade to KAZMO Elite for unlimited bet tracking.');
      return;
    }
    const isCombo = form.bet_type === 'Combiné';
      const finalOdds = isCombo ? calcCombinedOdds(form.legs, form.odds_format) : form.odds;
      const comboMatch = isCombo ? form.legs.filter(l=>l.match_home).map(l=>l.match_home+(l.match_away?' vs '+l.match_away:'')).join(' | ') : null;
      const data = { ...form, user_id:user.id, match_home:isCombo?(comboMatch||'Combiné'):form.match_home, odds:parseFloat(finalOdds)||1, stake:parseFloat(form.stake), profit_loss:parseFloat(profit) };
      if (editingBet) { await supabase.from('user_bets').update(data).eq('id', editingBet.id); }
      else { await supabase.from('user_bets').insert(data); }
      setShowForm(false); setEditingBet(null); setForm(emptyForm); fetchBets();
    } catch(e) { Alert.alert('Error', e.message); }
  }
  async function deleteBet(id) {
    Alert.alert('Delete?', 'This bet will be permanently deleted.', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => { await supabase.from('user_bets').delete().eq('id', id); fetchBets(); }}
    ]);
  }
  async function exportCSV() {
    const headers = 'Date,Sport,Match,Type,Bookmaker,Odds,Format,Stake,Currency,Result,P&L,Notes';
    const rows = bets.map(b => [b.match_date||'',b.sport||'',(b.match_home||'')+(b.match_away?' vs '+b.match_away:''),b.bet_type||'',b.bookmaker||'',b.odds||'',b.odds_format||'',b.stake||'',b.currency||'',b.result||'',b.profit_loss||'',(b.notes||'').replace(/,/g,' ')].join(',')).join('\n');
    await Share.share({ message: headers+'\n'+rows, title:'My Bets KAZMO' });
  }
  const filtered = filterResult==='all' ? bets : bets.filter(b=>b.result===filterResult);
  const won = bets.filter(b=>b.result==='won');
  const lost = bets.filter(b=>b.result==='lost');
  const totalStake = bets.filter(b=>b.result!=='pending').reduce((s,b)=>s+(parseFloat(b.stake)||0),0);
  const totalPL = bets.reduce((s,b)=>s+(parseFloat(b.profit_loss)||0),0);
  const roi = totalStake>0?((totalPL/totalStake)*100).toFixed(1):'0.0';
  const winRate = (won.length+lost.length)>0?((won.length/(won.length+lost.length))*100).toFixed(0):'0';
  if (showForm) return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>{setShowForm(false);setEditingBet(null);}}><Text style={styles.back}>← Back</Text></TouchableOpacity>
          <Text style={styles.title}>{editingBet?'Edit Bet':'New Bet'}</Text>
        </View>
        <Text style={styles.label}>Sport *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
          <View style={{flexDirection:'row',gap:8}}>{SPORTS.map(s=>(<TouchableOpacity key={s} onPress={()=>setForm({...form,sport:s})} style={[styles.chip,form.sport===s&&styles.chipActive]}><Text style={[styles.chipText,form.sport===s&&{color:'#fff'}]}>{s}</Text></TouchableOpacity>))}</View>
        </ScrollView>
        {form.bet_type !== 'Combiné' ? (<>
          <Text style={styles.label}>Team / Player 1 *</Text>
          <TextInput value={form.match_home} onChangeText={v=>setForm({...form,match_home:v})} style={styles.input} placeholder="Ex: Real Madrid" placeholderTextColor="#ffffff44"/>
          <Text style={styles.label}>Team / Player 2</Text>
          <TextInput value={form.match_away} onChangeText={v=>setForm({...form,match_away:v})} style={styles.input} placeholder="Ex: Barcelona" placeholderTextColor="#ffffff44"/>
        </>) : (<>
          <Text style={styles.label}>MATCHES IN COMBO *</Text>
          {form.legs.map(function(leg, i) { return (
            <View key={i} style={{backgroundColor:'#0d0d1a',borderRadius:10,padding:10,marginBottom:8,borderWidth:1,borderColor:'#ffffff11'}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <Text style={{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:12}}>MATCH {i+1}</Text>
                {form.legs.length > 2 && <TouchableOpacity onPress={function(){const l=[...form.legs];l.splice(i,1);setForm({...form,legs:l});}}><Text style={{color:'#E53935',fontSize:12}}>✕</Text></TouchableOpacity>}
              </View>
              <TextInput value={leg.match_home} onChangeText={function(v){const l=[...form.legs];l[i]={...l[i],match_home:v};setForm({...form,legs:l});}} style={[styles.input,{marginBottom:4}]} placeholder="Team/Player 1" placeholderTextColor="#ffffff44"/>
              <TextInput value={leg.match_away} onChangeText={function(v){const l=[...form.legs];l[i]={...l[i],match_away:v};setForm({...form,legs:l});}} style={[styles.input,{marginBottom:4}]} placeholder="Team/Player 2 (optional)" placeholderTextColor="#ffffff44"/>
              <View style={{flexDirection:'row',gap:8}}>
                <View style={{flex:1}}>
                  <TextInput value={leg.odds} onChangeText={function(v){const l=[...form.legs];l[i]={...l[i],odds:v};setForm({...form,legs:l});}} style={styles.input} placeholder="Odds" placeholderTextColor="#ffffff44" keyboardType="decimal-pad"/>
                </View>
                <View style={{flexDirection:'row',gap:4}}>
                  <TouchableOpacity onPress={function(){const l=[...form.legs];l[i]={...l[i],odds_format:'decimal'};setForm({...form,legs:l});}} style={[styles.chip,leg.odds_format==='decimal'&&styles.chipActive,{paddingHorizontal:8}]}><Text style={[styles.chipText,leg.odds_format==='decimal'&&{color:'#fff'}]}>DEC</Text></TouchableOpacity>
                  <TouchableOpacity onPress={function(){const l=[...form.legs];l[i]={...l[i],odds_format:'american'};setForm({...form,legs:l});}} style={[styles.chip,leg.odds_format==='american'&&styles.chipActive,{paddingHorizontal:8}]}><Text style={[styles.chipText,leg.odds_format==='american'&&{color:'#fff'}]}>US</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          );})}
          {form.legs.length < 10 && <TouchableOpacity onPress={function(){setForm({...form,legs:[...form.legs,{...emptyLeg}]});}} style={{backgroundColor:'#FF6B2B11',borderRadius:10,padding:10,alignItems:'center',borderWidth:1,borderColor:'#FF6B2B33',marginBottom:8}}><Text style={{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:13}}>+ ADD MATCH</Text></TouchableOpacity>}
          {form.legs.filter(l=>l.odds).length >= 2 && <View style={{backgroundColor:'#4CAF5011',borderRadius:8,padding:8,borderWidth:1,borderColor:'#4CAF5033',marginBottom:8}}><Text style={{color:'#4CAF50',fontFamily:'BebasNeue',fontSize:12}}>COMBINED ODDS: {calcCombinedOdds(form.legs,'decimal')}</Text></View>}
        </>)}
        <Text style={styles.label}>Bet Type</Text>
        <View style={{flexDirection:'row',gap:8,marginBottom:12}}>{BET_TYPES.map(bt=>(<TouchableOpacity key={bt} onPress={()=>setForm({...form,bet_type:bt})} style={[styles.chip,form.bet_type===bt&&styles.chipActive]}><Text style={[styles.chipText,form.bet_type===bt&&{color:'#fff'}]}>{bt}</Text></TouchableOpacity>))}</View>
        <Text style={styles.label}>Bookmaker</Text>
        <TextInput value={form.bookmaker} onChangeText={v=>setForm({...form,bookmaker:v})} style={styles.input} placeholder="Ex: Bet365, DraftKings..." placeholderTextColor="#ffffff44"/>
        <Text style={styles.label}>Odds Format</Text>
        <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
          <TouchableOpacity onPress={()=>setForm({...form,odds_format:'decimal'})} style={[styles.chip,form.odds_format==='decimal'&&styles.chipActive]}><Text style={[styles.chipText,form.odds_format==='decimal'&&{color:'#fff'}]}>Decimal (2.50)</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setForm({...form,odds_format:'american'})} style={[styles.chip,form.odds_format==='american'&&styles.chipActive]}><Text style={[styles.chipText,form.odds_format==='american'&&{color:'#fff'}]}>American (+150)</Text></TouchableOpacity>
        </View>
        <Text style={styles.label}>Odds *</Text>
        <TextInput value={form.odds} onChangeText={v=>setForm({...form,odds:v})} style={styles.input} placeholder={form.odds_format==='decimal'?'Ex: 2.50':'Ex: +150 or -110'} placeholderTextColor="#ffffff44" keyboardType={form.odds_format==='american'?'numbers-and-punctuation':'decimal-pad'}/>
        <View style={{flexDirection:'row',gap:12}}>
          <View style={{flex:2}}><Text style={styles.label}>Stake *</Text><TextInput value={form.stake} onChangeText={v=>setForm({...form,stake:v})} style={styles.input} placeholder="Ex: 100" placeholderTextColor="#ffffff44" keyboardType="decimal-pad"/></View>
          <View style={{flex:1}}><Text style={styles.label}>Currency</Text><TouchableOpacity style={[styles.input,{justifyContent:'center',alignItems:'center'}]} onPress={()=>setForm({...form,currency:form.currency==='USD'?'EUR':form.currency==='EUR'?'GBP':'USD'})}><Text style={{color:'#fff',fontSize:16}}>{form.currency}</Text></TouchableOpacity></View>
        </View>
        <Text style={styles.label}>Result</Text>
        <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:12}}>{RESULTS.map(r=>(<TouchableOpacity key={r.id} onPress={()=>setForm({...form,result:r.id})} style={[styles.chip,form.result===r.id&&{backgroundColor:r.color+'33',borderColor:r.color}]}><Text style={[styles.chipText,form.result===r.id&&{color:r.color}]}>{r.label}</Text></TouchableOpacity>))}</View>
        <Text style={styles.label}>Match Date</Text>
        <TouchableOpacity onPress={()=>setShowDatePicker(true)} style={[styles.input,{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]}>
          <Text style={{color:form.match_date?'#fff':'#ffffff44',fontSize:14}}>{form.match_date||'Select date...'}</Text>
          <Text style={{fontSize:16}}>📅</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={form.match_date ? new Date(form.match_date) : new Date()}
            mode="date"
            display="spinner"
            textColor="#fff"
            onChange={function(event, date) {
              setShowDatePicker(false);
              if (date) setForm({...form, match_date: date.toISOString().slice(0,10)});
            }}
          />
        )}
        <Text style={styles.label}>Notes</Text>
        <TextInput value={form.notes} onChangeText={v=>setForm({...form,notes:v})} style={[styles.input,{height:80}]} placeholder="Analysis, reason for bet..." placeholderTextColor="#ffffff44" multiline/>
        {form.odds&&form.stake&&(<View style={styles.calcBox}><Text style={styles.calcTitle}>AUTO CALCULATION</Text><Text style={styles.calcText}>Potential win: <Text style={{color:'#4CAF50',fontFamily:'BebasNeue'}}>{form.odds_format==='decimal'?((parseFloat(form.odds)-1)*parseFloat(form.stake||0)).toFixed(2):parseFloat(form.odds)>0?((parseFloat(form.odds)/100)*parseFloat(form.stake||0)).toFixed(2):((100/Math.abs(parseFloat(form.odds)))*parseFloat(form.stake||0)).toFixed(2)} {form.currency}</Text></Text></View>)}
        <TouchableOpacity onPress={saveBet} activeOpacity={0.85} style={{marginTop:16,marginBottom:8}}><LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveBtn}><Text style={styles.saveBtnText}>💾 Save</Text></LinearGradient></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>📊 {t('myBets')}</Text>
        <TouchableOpacity onPress={exportCSV}><Text style={{color:'#FF6B2B',fontSize:12,fontFamily:'BebasNeue'}}>CSV ↗</Text></TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statNum}>{bets.length}</Text><Text style={styles.statLabel}>BETS</Text></View>
        <View style={styles.statCard}><Text style={[styles.statNum,{color:'#4CAF50'}]}>{winRate}%</Text><Text style={styles.statLabel}>WIN RATE</Text></View>
        <View style={styles.statCard}><Text style={[styles.statNum,{color:totalPL>=0?'#4CAF50':'#E53935'}]}>{totalPL>=0?'+':''}{parseFloat(totalPL).toFixed(0)}</Text><Text style={styles.statLabel}>P&L</Text></View>
        <View style={styles.statCard}><Text style={[styles.statNum,{color:parseFloat(roi)>=0?'#4CAF50':'#E53935'}]}>{roi}%</Text><Text style={styles.statLabel}>ROI</Text></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingHorizontal:16,marginBottom:8}}>
        <View style={{flexDirection:'row',gap:8}}>{[{id:'all',label:'All'},...RESULTS].map(r=>(<TouchableOpacity key={r.id} onPress={()=>setFilterResult(r.id)} style={[styles.chip,filterResult===r.id&&styles.chipActive]}><Text style={[styles.chipText,filterResult===r.id&&{color:'#fff'}]}>{r.label}</Text></TouchableOpacity>))}</View>
      </ScrollView>
      {loading?(<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color="#FF6B2B" size="large"/></View>):(
        <ScrollView contentContainerStyle={{padding:16,paddingBottom:120}}>
          {filtered.length===0?(<View style={{alignItems:'center',padding:40}}><Text style={{fontSize:40,marginBottom:12}}>📊</Text><Text style={{color:'#ffffff55',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1}}>No bets yet</Text><Text style={{color:'#ffffff33',fontSize:12,marginTop:4,textAlign:'center'}}>Add your first bet to start tracking</Text></View>):filtered.map(bet=>{
            const res=RESULTS.find(r=>r.id===bet.result)||RESULTS[0];
            const pl=parseFloat(bet.profit_loss||0);
            return(<View key={bet.id} style={styles.betCard}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
                  <View style={styles.sportBadge}><Text style={styles.sportBadgeText}>{bet.sport}</Text></View>
                  <View style={[styles.resultBadge,{backgroundColor:res.color+'22',borderColor:res.color+'44'}]}><Text style={[styles.resultBadgeText,{color:res.color}]}>{res.label}</Text></View>
                </View>
                <Text style={{color:'#ffffff44',fontSize:10}}>{bet.match_date||''}</Text>
              </View>
              <Text style={styles.matchText}>{bet.match_home}{bet.match_away?' vs '+bet.match_away:''}</Text>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:8}}>
                <View>
                  <Text style={styles.oddsText}>Odds: <Text style={{color:'#FFD700'}}>{bet.odds_format==='american'?(parseFloat(bet.odds)>0?'+':'')+bet.odds:bet.odds}</Text></Text>
                  <Text style={styles.stakeText}>Stake: {bet.stake} {bet.currency}</Text>
                  {bet.bookmaker?<Text style={{color:'#ffffff44',fontSize:10,marginTop:2}}>{bet.bookmaker}</Text>:null}
                </View>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={[styles.plText,{color:pl>=0?'#4CAF50':'#E53935'}]}>{pl>=0?'+':''}{pl.toFixed(2)} {bet.currency}</Text>
                  <Text style={styles.betTypeText}>{bet.bet_type}</Text>
                </View>
              </View>
              {bet.notes?<Text style={styles.notesText} numberOfLines={2}>{bet.notes}</Text>:null}
              <View style={{flexDirection:'row',gap:8,marginTop:10}}>
                <TouchableOpacity onPress={()=>{setEditingBet(bet);setForm({...bet,odds:String(bet.odds),stake:String(bet.stake)});setShowForm(true);}} style={styles.editBtn}><Text style={styles.editBtnText}>✏️ Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={()=>deleteBet(bet.id)} style={styles.deleteBtn}><Text style={styles.deleteBtnText}>🗑</Text></TouchableOpacity>
              </View>
            </View>);
          })}
        </ScrollView>
      )}
      <TouchableOpacity onPress={()=>setShowForm(true)} style={styles.fab}>
        <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.fabGradient}>
          <Text style={styles.fabText}>+ New Bet</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#080814'},
  scroll:{padding:16,paddingBottom:40},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,paddingBottom:8},
  back:{color:'#FF6B2B',fontFamily:'BebasNeue',fontSize:14,letterSpacing:1},
  title:{color:'#fff',fontFamily:'BebasNeue',fontSize:18,letterSpacing:1},
  label:{color:'#ffffff88',fontSize:11,fontFamily:'BebasNeue',letterSpacing:1,marginBottom:6,marginTop:12},
  input:{backgroundColor:'#16162a',borderRadius:10,padding:12,color:'#fff',fontSize:14,borderWidth:1,borderColor:'#ffffff22',marginBottom:4},
  chip:{paddingHorizontal:12,paddingVertical:4,borderRadius:16,backgroundColor:'#16162a',borderWidth:1,borderColor:'#ffffff22',height:32,justifyContent:'center'},
  chipActive:{backgroundColor:'#FF6B2B33',borderColor:'#FF6B2B'},
  chipText:{color:'#ffffffcc',fontSize:12,fontFamily:'BebasNeue'},
  saveBtn:{borderRadius:12,padding:14,alignItems:'center'},
  saveBtnText:{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1},
  statsRow:{flexDirection:'row',paddingHorizontal:16,gap:8,marginBottom:12},
  statCard:{flex:1,backgroundColor:'#16162a',borderRadius:10,padding:10,alignItems:'center',borderWidth:1,borderColor:'#ffffff11'},
  statNum:{color:'#fff',fontFamily:'BebasNeue',fontSize:18,letterSpacing:1},
  statLabel:{color:'#ffffff55',fontSize:9,fontFamily:'BebasNeue',letterSpacing:1,marginTop:2},
  betCard:{backgroundColor:'#16162a',borderRadius:12,padding:14,marginBottom:10,borderWidth:1,borderColor:'#ffffff11'},
  sportBadge:{backgroundColor:'#FF6B2B22',borderRadius:6,paddingHorizontal:8,paddingVertical:2,borderWidth:1,borderColor:'#FF6B2B44'},
  sportBadgeText:{color:'#FF6B2B',fontSize:10,fontFamily:'BebasNeue'},
  resultBadge:{borderRadius:6,paddingHorizontal:8,paddingVertical:2,borderWidth:1},
  resultBadgeText:{fontSize:10,fontFamily:'BebasNeue'},
  matchText:{color:'#fff',fontSize:14,fontWeight:'600'},
  oddsText:{color:'#ffffffcc',fontSize:12},
  stakeText:{color:'#ffffff88',fontSize:11,marginTop:2},
  plText:{fontFamily:'BebasNeue',fontSize:18,letterSpacing:1},
  betTypeText:{color:'#ffffff44',fontSize:10,marginTop:2},
  notesText:{color:'#ffffff55',fontSize:11,marginTop:8,fontStyle:'italic'},
  editBtn:{flex:1,backgroundColor:'#ffffff11',borderRadius:8,padding:8,alignItems:'center'},
  editBtnText:{color:'#ffffffcc',fontSize:12},
  deleteBtn:{backgroundColor:'#E5393511',borderRadius:8,padding:8,paddingHorizontal:12},
  deleteBtnText:{fontSize:14},
  calcBox:{backgroundColor:'#4CAF5011',borderRadius:10,padding:12,borderWidth:1,borderColor:'#4CAF5033',marginTop:8},
  calcTitle:{color:'#4CAF50',fontFamily:'BebasNeue',fontSize:11,letterSpacing:1,marginBottom:4},
  calcText:{color:'#ffffffcc',fontSize:13},
  fab:{position:'absolute',bottom:24,right:24,left:24},
  fabGradient:{borderRadius:14,padding:16,alignItems:'center'},
  fabText:{color:'#fff',fontFamily:'BebasNeue',fontSize:16,letterSpacing:1},
});
