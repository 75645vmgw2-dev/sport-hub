import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import { useLanguage } from '../i18n/LanguageContext';
import { supabase } from '../api/supabase';

const H_MMA = { 'x-rapidapi-key': API_SPORTS_KEY, 'x-rapidapi-host': 'v1.mma.api-sports.io' };

const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

const LANG_LOCALE = {
  fr:'fr-FR', en:'en-US', es:'es-ES', pt:'pt-BR',
  de:'de-DE', it:'it-IT', ar:'ar-SA', ru:'ru-RU',
};

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function FightDetailScreen({ fight, onBack, t, locale, user }) {
  const fighter1 = fight.fighters?.first?.name || 'Fighter 1';
  const fighter2 = fight.fighters?.second?.name || 'Fighter 2';
  const [isFav1, setIsFav1] = React.useState(false);
  const [isFav2, setIsFav2] = React.useState(false);
  React.useEffect(function() {
    if (!user) return;
    supabase.from('favorites').select('id,team_name').eq('user_id', user.id).eq('sport', 'mma')
      .then(function({data}) {
        const names = (data||[]).map(function(f){return f.team_name;});
        setIsFav1(names.includes(fighter1));
        setIsFav2(names.includes(fighter2));
      });
  }, []);
  async function toggleFav(name, isFav, setFav) {
    if (!user) return;
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('sport', 'mma').eq('team_name', name);
      setFav(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, sport: 'mma', team_name: name, team_id: null, team_logo: null });
      setFav(true);
    }
  }
  const [tab, setTab] = useState('stats');
  const [kazmoAnalysis, setKazmoAnalysis] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const C = '#9C27B0';

  const f1 = fight.fighters?.first;
  const f2 = fight.fighters?.second;
  const isFinished = fight.status?.short === 'FT' || fight.status?.long === 'Finished';
  const isLive = fight.status?.short === 'LIVE';
  const winner = isFinished ? (f1?.winner ? f1?.name : f2?.name) : null;

  const TABS = [
    { id:'stats', label:'📊 '+t('stats') },
    { id:'kazmo', label:'🤖 Kazmo' },
  ];

  useEffect(() => {
    if (tab === 'kazmo' && !kazmoAnalysis) fetchKazmo();
  }, [tab]);

  async function fetchKazmo() {
    setLoadingKazmo(true);
    try {
      const prompt = 'You are Kazmo, MMA expert. Analyze this fight:\n\n' +
        (f1?.name||'Fighter 1') + ' vs ' + (f2?.name||'Fighter 2') + '\n' +
        'Event: ' + (fight.category||'MMA') + '\n' +
        (isFinished ? 'Result: ' + (winner||'Unknown') + ' won\n' : '') +
        'Provide analysis of both fighters, style matchup, strengths and weaknesses. Reply in the user language.';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body:JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:600, messages:[{role:'user',content:prompt}] }),
      });
      const data = await res.json();
      setKazmoAnalysis((data.content||[]).map(function(c){return c.text||'';}).join(''));
    } catch(e) {}
    finally { setLoadingKazmo(false); }
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput('');
    setLoadingChat(true);
    const newHistory = [...chatHistory, {role:'user',content:question}];
    setChatHistory(newHistory);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body:JSON.stringify({
          model:'claude-sonnet-4-5', max_tokens:300,
          system:'You are Kazmo, MMA expert. Answer concisely about ' + (f1?.name||'') + ' vs ' + (f2?.name||'') + '.',
          messages:newHistory,
        }),
      });
      const data = await res.json();
      const answer = (data.content||[]).map(function(c){return c.text||'';}).join('');
      setChatHistory(function(prev){return[...prev,{role:'assistant',content:answer}];});
    } catch(e) {}
    finally { setLoadingChat(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.detailHeader, {borderBottomColor:C}]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{flex:1, alignItems:'center'}}>
          <Text style={styles.detailTitle}>MMA</Text>
          {fight.category ? <Text style={styles.detailSub}>{fight.category}</Text> : null}
        </View>
        <View style={{width:40}} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map(function(tb) {
          return (
            <TouchableOpacity key={tb.id}
              style={[styles.tabBtn, tab===tb.id&&{backgroundColor:C}]}
              onPress={() => setTab(tb.id)}>
              <Text style={[styles.tabBtnText, tab===tb.id&&{color:'#fff'}]}>{tb.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true}>

        <View style={[styles.fightBanner, isLive&&{borderColor:C,borderWidth:1}]}>
          {fight.is_main && (
            <View style={styles.mainBadgeRow}>
              <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>⭐ MAIN EVENT</Text></View>
            </View>
          )}
          {isLive && (
            <View style={styles.mainBadgeRow}>
              <View style={[styles.mainBadge,{backgroundColor:C+'22',borderColor:C+'44'}]}>
                <Text style={[styles.mainBadgeText,{color:C}]}>● LIVE</Text>
              </View>
            </View>
          )}
          <View style={styles.fightBannerRow}>
            <View style={styles.fighterBig}>
              {f1?.logo ? (
                <Image source={{uri:f1.logo}} style={styles.fighterLogoBig} onError={function(){}} />
              ) : (
                <View style={[styles.fighterLogoPlaceholderBig,{backgroundColor:C+'33'}]}>
                  <Text style={{fontSize:32}}>🤼</Text>
                </View>
              )}
              <Text style={[styles.fighterNameBig, winner===f1?.name&&{color:'#FFD700'}]} numberOfLines={2}>{f1?.name||'Fighter 1'}</Text>
              {winner===f1?.name && <Text style={styles.winnerLabel}>🏆 {t('win')}</Text>}
              <TouchableOpacity onPress={()=>toggleFav(fighter1,isFav1,setIsFav1)} style={{marginTop:4}}>
                <Text style={{fontSize:18,color:isFav1?'#FFD700':'#ffffff33'}}>★</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fightBannerCenter}>
              <Text style={styles.vsBig}>VS</Text>
              {fight.date && (
                <Text style={styles.fightDateBig}>
                  {new Date(fight.date).toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric'})}
                </Text>
              )}
              {isFinished && <Text style={styles.finishedBig}>{t('terminated')}</Text>}
            </View>
            <View style={[styles.fighterBig,{alignItems:'flex-end'}]}>
              {f2?.logo ? (
                <Image source={{uri:f2.logo}} style={styles.fighterLogoBig} onError={function(){}} />
              ) : (
                <View style={[styles.fighterLogoPlaceholderBig,{backgroundColor:C+'33'}]}>
                  <Text style={{fontSize:32}}>🤼</Text>
                </View>
              )}
              <Text style={[styles.fighterNameBig,{textAlign:'right'}, winner===f2?.name&&{color:'#FFD700'}]} numberOfLines={2}>{f2?.name||'Fighter 2'}</Text>
              {winner===f2?.name && <Text style={[styles.winnerLabel,{alignSelf:'flex-end'}]}>🏆 {t('win')}</Text>}
              <TouchableOpacity onPress={()=>toggleFav(fighter2,isFav2,setIsFav2)} style={{marginTop:4,alignSelf:'flex-end'}}>
                <Text style={{fontSize:18,color:isFav2?'#FFD700':'#ffffff33'}}>★</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {tab === 'stats' && (
          <View>
            <Text style={styles.sectionTitle}>{t('stats').toUpperCase()}</Text>

            {/* Résultat — seulement si terminé */}
            {isFinished && (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statName} numberOfLines={1}>{f1?.name||'?'}</Text>
                  <Text style={[styles.statValue, {color: f1?.winner===true?'#4CAF50':'#E53935'}]}>
                    {f1?.winner===true ? t('win') : t('loss')}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statName} numberOfLines={1}>{f2?.name||'?'}</Text>
                  <Text style={[styles.statValue, {color: f2?.winner===true?'#4CAF50':'#E53935'}]}>
                    {f2?.winner===true ? t('win') : t('loss')}
                  </Text>
                </View>
              </View>
            )}

            {/* Match à venir — juste les noms */}
            {!isFinished && !isLive && (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statName} numberOfLines={1}>{f1?.name||'Fighter 1'}</Text>
                  <Text style={[styles.statValue,{color:'#ffffff55',fontSize:14}]}>{t('upcoming')}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statName} numberOfLines={1}>{f2?.name||'Fighter 2'}</Text>
                  <Text style={[styles.statValue,{color:'#ffffff55',fontSize:14}]}>{t('upcoming')}</Text>
                </View>
              </View>
            )}

            {/* Live */}
            {isLive && (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statName} numberOfLines={1}>{f1?.name||'Fighter 1'}</Text>
                  <Text style={[styles.statValue,{color:'#ff1744',fontSize:14}]}>LIVE</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statName} numberOfLines={1}>{f2?.name||'Fighter 2'}</Text>
                  <Text style={[styles.statValue,{color:'#ff1744',fontSize:14}]}>LIVE</Text>
                </View>
              </View>
            )}

            {fight.slug ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Event</Text>
                <Text style={styles.infoValue}>{fight.slug}</Text>
              </View>
            ) : null}
            {fight.category ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('sports')}</Text>
                <Text style={styles.infoValue}>{fight.category}</Text>
              </View>
            ) : null}
            {fight.date ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{new Date(fight.date).toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</Text>
              </View>
            ) : null}
            {fight.is_main && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={[styles.infoValue,{color:'#FFD700'}]}>MAIN EVENT</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'kazmo' && (
          <View>
            <View style={styles.kazmoHeader}>
              <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.kazmoAvatar}>
                <Text style={styles.kazmoAvatarText}>K</Text>
              </LinearGradient>
              <View style={{flex:1}}>
                <Text style={styles.kazmoName}>KAZMO IA</Text>
                <Text style={styles.kazmoSub}>{t('kazmoAssistant')}</Text>
              </View>
            </View>
            {loadingKazmo ? (
              <View style={styles.center}><ActivityIndicator color="#FF6B2B" /></View>
            ) : kazmoAnalysis ? (
              <View style={styles.analysisCard}><Text style={styles.analysisText}>{kazmoAnalysis}</Text></View>
            ) : null}
            <Text style={[styles.sectionTitle,{marginTop:16}]}>{t('faqTabAsk').toUpperCase()}</Text>
            {chatHistory.map(function(msg,i) {
              const isUser = msg.role==='user';
              return (
                <View key={i} style={[styles.chatMsg, isUser?styles.chatMsgUser:styles.chatMsgKazmo]}>
                  {!isUser && (
                    <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.chatAvatar}>
                      <Text style={styles.chatAvatarText}>K</Text>
                    </LinearGradient>
                  )}
                  <View style={[styles.chatBubble, isUser?styles.chatBubbleUser:styles.chatBubbleKazmo]}>
                    <Text style={styles.chatText}>{msg.content}</Text>
                  </View>
                </View>
              );
            })}
            {loadingChat && (
              <View style={[styles.chatMsg,styles.chatMsgKazmo]}>
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>K</Text>
                </LinearGradient>
                <View style={[styles.chatBubble,styles.chatBubbleKazmo]}>
                  <ActivityIndicator color="#FF6B2B" size="small" />
                </View>
              </View>
            )}
            <View style={styles.chatInputRow}>
              <TextInput value={chatInput} onChangeText={setChatInput} style={styles.chatInput}
                placeholder={t('faqInputPlaceholder')} placeholderTextColor="#ffffff44" multiline maxLength={300} />
              <TouchableOpacity onPress={sendChat} disabled={loadingChat||!chatInput.trim()} style={styles.chatSendBtn}>
                <LinearGradient
                  colors={loadingChat||!chatInput.trim()?['#444','#555']:['#FF6B2B','#FFD600']}
                  start={{x:0,y:0}} end={{x:1,y:0}} style={styles.chatSendBtnGradient}>
                  <Text style={styles.chatSendBtnText}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

export default function MMAScreen({ onBack, user }) {
  const { t, language } = useLanguage();
  const locale = LANG_LOCALE[language] || 'en-US';
  const [tab, setTab] = useState('upcoming');
  const [sortBy, setSortBy] = useState('date');
  const [upcomingFights, setUpcomingFights] = useState([]);
  const [finishedFights, setFinishedFights] = useState([]);
  const [liveFights, setLiveFights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFight, setSelectedFight] = useState(null);
  const C = '#9C27B0';

  const TABS = [
    { id:'upcoming', label:'🤼 '+t('upcoming') },
    { id:'live', label:'🔴 Live' },
    { id:'finished', label:'✅ '+t('finished') },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('https://v1.mma.api-sports.io/fights?season=2026', { headers:H_MMA });
        const data = await res.json();
        const fights = data.response || [];

        const upcoming = fights.filter(function(f) {
          return f.status?.short === 'NS' || f.status?.long === 'Not Started';
        }).sort(function(a,b){ return new Date(a.date)-new Date(b.date); }).slice(0,30);

        const live = fights.filter(function(f) {
          return f.status?.short === 'LIVE' || f.status?.long === 'Live';
        });

        const finished = fights.filter(function(f) {
          return f.status?.short === 'FT' || f.status?.long === 'Finished';
        }).sort(function(a,b){ return new Date(b.date)-new Date(a.date); }).slice(0,30);

        setUpcomingFights(upcoming);
        setLiveFights(live);
        setFinishedFights(finished);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (selectedFight) {
    return <FightDetailScreen fight={selectedFight} onBack={() => setSelectedFight(null)} t={t} locale={locale} user={user} />;
  }

  function FightCard({ f }) {
    const isLive = f.status?.short === 'LIVE';
    const isFinished = f.status?.short === 'FT' || f.status?.long === 'Finished';
    const f1 = f.fighters?.first;
    const f2 = f.fighters?.second;
    const winner = isFinished ? (f1?.winner ? f1?.name : f2?.name) : null;

    return (
      <TouchableOpacity
        style={[styles.fightCard, isLive && { borderColor:C, borderWidth:1 }]}
        activeOpacity={0.8}
        onPress={() => setSelectedFight(f)}>
        <View style={styles.fightHeader}>
          {f.is_main && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>⭐ MAIN EVENT</Text></View>}
          {isLive && <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>● LIVE</Text></View>}
          {isFinished && <Text style={styles.finishedLabel}>{t('terminated')}</Text>}
          {f.category ? <Text style={styles.categoryText}>{f.category}</Text> : null}
          <Text style={styles.tapHint}>{t('seeDetails')} →</Text>
        </View>
        {f.slug ? <Text style={styles.eventSlug} numberOfLines={1}>{f.slug}</Text> : null}
        <View style={styles.fightRow}>
          <View style={styles.fighter}>
            {f1?.logo ? (
              <Image source={{uri:f1.logo}} style={styles.fighterLogo} onError={function(){}} />
            ) : (
              <View style={styles.fighterLogoPlaceholder}><Text style={styles.fighterLogoText}>🤼</Text></View>
            )}
            <Text style={[styles.fighterName, winner===f1?.name&&{color:'#FFD700'}]} numberOfLines={2}>{f1?.name||'Fighter 1'}</Text>
            {winner===f1?.name && <Text style={styles.winnerBadge}>🏆 {t('win')}</Text>}
          </View>
          <View style={styles.fightCenter}>
            <Text style={styles.vsText}>VS</Text>
            {f.date ? (
              <Text style={styles.fightDate}>
                {new Date(f.date).toLocaleDateString(locale,{day:'numeric',month:'short'})}
              </Text>
            ) : null}
          </View>
          <View style={[styles.fighter,{alignItems:'flex-end'}]}>
            {f2?.logo ? (
              <Image source={{uri:f2.logo}} style={styles.fighterLogo} onError={function(){}} />
            ) : (
              <View style={styles.fighterLogoPlaceholder}><Text style={styles.fighterLogoText}>🤼</Text></View>
            )}
            <Text style={[styles.fighterName,{textAlign:'right'}, winner===f2?.name&&{color:'#FFD700'}]} numberOfLines={2}>{f2?.name||'Fighter 2'}</Text>
            {winner===f2?.name && <Text style={[styles.winnerBadge,{alignSelf:'flex-end'}]}>🏆 {t('win')}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const sortedFinished = [...finishedFights].sort(function(a,b){
    if (sortBy === 'name') {
      const nameA = (a.fighters?.first?.name||'').toLowerCase();
      const nameB = (b.fighters?.first?.name||'').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    return new Date(b.date) - new Date(a.date);
  });
  const displayFights = tab==='upcoming' ? upcomingFights : tab==='live' ? liveFights : sortedFinished;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtnSmall}>
            <Text style={styles.backBtnSmallText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.titleWhite}>MMA </Text>
          <GradientText text="UFC" fontSize={22} letterSpacing={1} />
        </View>
        <Text style={styles.subtitle}>
          {upcomingFights.length} {t('upcoming').toLowerCase()} · {finishedFights.length} {t('finished').toLowerCase()}
          {tab==='finished' && (
            <View style={{flexDirection:'row',gap:6,marginTop:8}}>
              <TouchableOpacity onPress={()=>setSortBy('date')} style={{paddingHorizontal:10,paddingVertical:4,borderRadius:8,backgroundColor:sortBy==='date'?'#9C27B0':'#16162a',borderWidth:1,borderColor:'#9C27B033'}}>
                <Text style={{color:sortBy==='date'?'#fff':'#ffffff88',fontSize:11,fontFamily:'BebasNeue'}}>📅 DATE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setSortBy('name')} style={{paddingHorizontal:10,paddingVertical:4,borderRadius:8,backgroundColor:sortBy==='name'?'#9C27B0':'#16162a',borderWidth:1,borderColor:'#9C27B033'}}>
                <Text style={{color:sortBy==='name'?'#fff':'#ffffff88',fontSize:11,fontFamily:'BebasNeue'}}>🔤 NAME</Text>
              </TouchableOpacity>
            </View>
          )}
        </Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(function(tb) {
          return (
            <TouchableOpacity key={tb.id}
              style={[styles.tabBtn, tab===tb.id&&{backgroundColor:C}]}
              onPress={() => setTab(tb.id)}>
              <Text style={[styles.tabBtnText, tab===tb.id&&{color:'#fff'}]}>{tb.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {displayFights.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {tab==='live' ? t('liveNoMatch') : tab==='upcoming' ? t('upcoming') : t('noData')}
              </Text>
            </View>
          ) : displayFights.map(function(f) {
            return <FightCard key={f.id} f={f} />;
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { padding:16, paddingBottom:8 },
  titleRow: { flexDirection:'row', alignItems:'center', gap:6 },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  subtitle: { color:'#ffffff44', fontSize:10, marginTop:2, fontFamily:'BebasNeue', letterSpacing:1 },
  backBtnSmall: { marginRight:4 },
  backBtnSmallText: { color:'#FF6B2B', fontSize:22, fontWeight:'700' },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginTop:4, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12, letterSpacing:0.5 },
  scroll: { padding:16, paddingBottom:40 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  fightCard: { backgroundColor:'#16162a', borderRadius:12, padding:14, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  fightHeader: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' },
  mainBadgeRow: { alignItems:'center', marginBottom:6 },
  mainBadge: { backgroundColor:'#FFD70022', borderRadius:6, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:'#FFD70044' },
  mainBadgeText: { color:'#FFD700', fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  liveBadge: { backgroundColor:'#9C27B022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  liveBadgeText: { color:'#9C27B0', fontSize:9, fontWeight:'700', fontFamily:'BebasNeue' },
  finishedLabel: { color:'#ffffff44', fontSize:9 },
  categoryText: { color:'#ffffff66', fontSize:9, fontFamily:'BebasNeue' },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  eventSlug: { color:'#ffffff55', fontSize:10, marginBottom:8, fontStyle:'italic' },
  fightRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  fighter: { flex:1, alignItems:'flex-start', gap:4 },
  fighterLogo: { width:40, height:40, resizeMode:'contain', borderRadius:20 },
  fighterLogoPlaceholder: { width:40, height:40, borderRadius:20, backgroundColor:'#9C27B022', alignItems:'center', justifyContent:'center' },
  fighterLogoText: { fontSize:20 },
  fighterName: { color:'#fff', fontSize:11, fontFamily:'BebasNeue', letterSpacing:0.5 },
  winnerBadge: { color:'#FFD700', fontSize:9, fontFamily:'BebasNeue' },
  fightCenter: { alignItems:'center', paddingHorizontal:8 },
  vsText: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:18 },
  fightDate: { color:'#ffffff66', fontSize:9, marginTop:2 },
  emptyBox: { padding:20, backgroundColor:'#16162a', borderRadius:12, alignItems:'center' },
  emptyText: { color:'#ffffff44', fontSize:13, fontFamily:'BebasNeue' },
  detailHeader: { flexDirection:'row', alignItems:'center', padding:16, borderBottomWidth:2 },
  backBtn: { width:40, height:40, alignItems:'center', justifyContent:'center' },
  backBtnText: { color:'#FF6B2B', fontSize:24, fontWeight:'700' },
  detailTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:20, letterSpacing:1 },
  detailSub: { color:'#ffffff66', fontSize:10 },
  fightBanner: { backgroundColor:'#16162a', borderRadius:14, padding:16, marginBottom:16, borderWidth:1, borderColor:'#ffffff14' },
  fightBannerRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  fighterBig: { flex:1, alignItems:'flex-start', gap:8 },
  fighterLogoBig: { width:60, height:60, borderRadius:30, resizeMode:'contain' },
  fighterLogoPlaceholderBig: { width:60, height:60, borderRadius:30, alignItems:'center', justifyContent:'center' },
  fighterNameBig: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:0.5 },
  winnerLabel: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:11 },
  fightBannerCenter: { alignItems:'center', paddingHorizontal:8 },
  vsBig: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:24 },
  fightDateBig: { color:'#ffffff66', fontSize:10, marginTop:4, textAlign:'center' },
  finishedBig: { color:'#ffffff44', fontSize:10, marginTop:4, fontFamily:'BebasNeue' },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  statsRow: { flexDirection:'row', gap:8, marginBottom:12 },
  statBox: { flex:1, backgroundColor:'#16162a', borderRadius:12, padding:14, alignItems:'center', borderWidth:1, borderColor:'#ffffff14' },
  statName: { color:'#ffffff88', fontSize:10, fontFamily:'BebasNeue', letterSpacing:1, marginBottom:4 },
  statValue: { fontFamily:'BebasNeue', fontSize:20, letterSpacing:1 },
  infoRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:6 },
  infoLabel: { color:'#ffffff88', fontSize:11 },
  infoValue: { color:'#fff', fontSize:12, fontWeight:'600', flex:1, textAlign:'right' },
  kazmoHeader: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#16162a', borderRadius:14, padding:14, borderWidth:1, borderColor:'#FF6B2B33', marginBottom:12 },
  kazmoAvatar: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  kazmoAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:24, fontWeight:'900' },
  kazmoName: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1 },
  kazmoSub: { color:'#ffffff55', fontSize:10 },
  analysisCard: { backgroundColor:'#16162a', borderRadius:14, padding:16, borderWidth:1, borderColor:'#FF6B2B22', marginBottom:12 },
  analysisText: { color:'#ffffffcc', fontSize:13, lineHeight:20 },
  chatMsg: { flexDirection:'row', alignItems:'flex-end', gap:8, marginBottom:8 },
  chatMsgUser: { justifyContent:'flex-end' },
  chatMsgKazmo: { justifyContent:'flex-start' },
  chatAvatar: { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
  chatAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14 },
  chatBubble: { maxWidth:'75%', borderRadius:12, padding:10 },
  chatBubbleUser: { backgroundColor:'#FF6B2B22', borderColor:'#FF6B2B44', borderWidth:1 },
  chatBubbleKazmo: { backgroundColor:'#16162a', borderColor:'#ffffff14', borderWidth:1 },
  chatText: { color:'#fff', fontSize:12, lineHeight:18 },
  chatInputRow: { flexDirection:'row', gap:8, alignItems:'flex-end', marginTop:8 },
  chatInput: { flex:1, backgroundColor:'#16162a', borderRadius:12, padding:12, color:'#fff', fontSize:13, borderWidth:1, borderColor:'#ffffff22', maxHeight:100 },
  chatSendBtn: { width:48, height:48 },
  chatSendBtnGradient: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  chatSendBtnText: { color:'#fff', fontSize:20, fontWeight:'700' },
});
