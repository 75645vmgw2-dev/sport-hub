import { ANTHROPIC_KEY, API_SPORTS_KEY, RAPIDAPI_GOLF_KEY } from '../api/keys';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useLanguage } from '../i18n/LanguageContext';

const H_F1 = { 'x-rapidapi-key': '25ec321febd869f280179a40232674e7', 'x-rapidapi-host': 'v1.formula-1.api-sports.io' };

const H_ANTHROPIC = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
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

function formatDate(dateStr, lang) {
  if (!dateStr) return '';
  try {
    const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' :
      lang === 'de' ? 'de-DE' : lang === 'it' ? 'it-IT' : lang === 'ar' ? 'ar-SA' :
      lang === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {day:'numeric', month:'long', year:'numeric'});
  } catch(e) { return dateStr; }
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'}); }
  catch(e) { return ''; }
}

function KazmoChat({ subject, systemPrompt, initialAnalysis, t }) {
  const [kazmoAnalysis, setKazmoAnalysis] = useState('');
  const [loadingKazmo, setLoadingKazmo] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => { fetchKazmo(); }, []);

  async function fetchKazmo() {
    setLoadingKazmo(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:H_ANTHROPIC,
        body:JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:800, messages:[{role:'user',content:initialAnalysis}] }),
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
        body:JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:400, system:systemPrompt, messages:newHistory }),
      });
      const data = await res.json();
      const answer = (data.content||[]).map(function(c){return c.text||'';}).join('');
      setChatHistory(function(prev){return[...prev,{role:'assistant',content:answer}];});
    } catch(e) {}
    finally { setLoadingChat(false); }
  }

  return (
    <View>
      <View style={styles.kazmoHeader}>
        <LinearGradient colors={['#FF6B2B','#FFD600']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.kazmoAvatar}>
          <Text style={styles.kazmoAvatarText}>K</Text>
        </LinearGradient>
        <View style={{flex:1}}>
          <Text style={styles.kazmoName}>KAZMO IA</Text>
          <Text style={styles.kazmoSub}>{t('kazmoAssistant')} · {subject}</Text>
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
  );
}

function F1RaceResultScreen({ race, onBack, t, language, onSelectDriver }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const C = '#E10600';

  useEffect(() => { fetchResults(); }, []);

  async function fetchResults() {
    setLoading(true);
    try {
      const res = await fetch('https://v1.formula-1.api-sports.io/rankings/races?race='+race.id, { headers:H_F1 });
      const data = await res.json();
      setResults(data.response||[]);
    } catch(e) {}
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header,{borderBottomColor:C}]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>🏁</Text>
          <View style={{flex:1}}>
            <Text style={styles.headerTitle} numberOfLines={1}>{race.competition?.name}</Text>
            <Text style={styles.headerSub}>📍 {race.circuit?.name} · {formatDate(race.date, language)}</Text>
          </View>
        </View>
        <View style={{width:40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.liveRaceBanner,{borderColor:C,marginBottom:12}]}>
          <View style={[styles.liveBadge,{backgroundColor:'#ffffff11',borderColor:'#ffffff33',alignSelf:'flex-start',marginBottom:6}]}>
            <Text style={[styles.liveBadgeText,{color:'#ffffff88'}]}>✅ {t('terminated').toUpperCase()}</Text>
          </View>
          <Text style={styles.liveRaceName}>{race.competition?.name}</Text>
          <Text style={styles.liveRaceCircuit}>📍 {race.circuit?.name} · {race.competition?.location?.country}</Text>
          <Text style={styles.liveRaceDate}>🗓 {formatDate(race.date, language)}</Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View>
        ) : results.length === 0 ? (
          <View style={styles.emptyBox}><Text style={styles.emptyText}>{t('noData')}</Text></View>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText,{width:35}]}>#</Text>
              <Text style={[styles.tableHeaderText,{flex:1,textAlign:'left'}]}>{t('leaders')}</Text>
              <Text style={[styles.tableHeaderText,{width:80}]}>Team</Text>
              <Text style={[styles.tableHeaderText,{width:70}]}>Time</Text>
            </View>
            {results.map(function(r, i) {
              const pos = parseInt(r.position);
              const podium = pos <= 3;
              return (
                <TouchableOpacity key={i}
                  onPress={() => onSelectDriver({
                    name:r.driver?.name||'?', team:r.team?.name||'?',
                    photo:r.driver?.image||null, number:r.driver?.number||null,
                    nationality:r.driver?.nationality||null,
                    position:pos, points:0,
                  })}
                  style={[styles.tableRow,{
                    backgroundColor:i%2===0?'#16162a':'#0d0d1a',
                    borderLeftColor:pos===1?'#FFD700':pos<=3?C:'#ffffff22',
                    borderLeftWidth:3,
                  }]}>
                  <Text style={[styles.tableCell,{width:35,color:podium?'#FFD700':'#ffffff55',fontFamily:'BebasNeue',fontSize:16}]}>P{pos}</Text>
                  <View style={{flex:1}}>
                    <Text style={styles.tableTeamName} numberOfLines={1}>{r.driver?.name}</Text>
                  </View>
                  <Text style={[styles.tableCell,{width:80,color:'#ffffff66',fontSize:9}]} numberOfLines={1}>{r.team?.name}</Text>
                  <Text style={[styles.tableCell,{width:70,color:'#ffffff88',fontSize:9}]}>{r.time||''}</Text>
                  <Text style={styles.rankArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function F1TeamScreen({ team, races, onBack, t, language }) {
  const [loading, setLoading] = useState(true);
  const [recentResults, setRecentResults] = useState([]);
  const [tab, setTab] = useState('info');
  const [nbMatchs, setNbMatchs] = useState(5);
  const C = '#E10600';

  useEffect(() => { fetchResults(); }, [nbMatchs]);

  async function fetchResults() {
    setLoading(true);
    try {
      const completedRaces = (races||[]).filter(function(r){ return r.status==='Completed'; }).reverse().slice(0, nbMatchs);
      const results = await Promise.all(completedRaces.map(async function(r) {
        try {
          const res = await fetch('https://v1.formula-1.api-sports.io/rankings/races?race='+r.id, { headers:H_F1 });
          const data = await res.json();
          const teamDrivers = (data.response||[]).filter(function(p){
            return (p.team?.name||'').toLowerCase() === (team.name||'').toLowerCase();
          }).sort(function(a,b){ return parseInt(a.position)-parseInt(b.position); });
          return {
            name: r.competition?.name||'GP',
            date: formatDate(r.date, language),
            drivers: teamDrivers.map(function(p){ return {name:p.driver?.name||'?', position:p.position, time:p.time}; }),
            played: teamDrivers.length > 0,
          };
        } catch(e) {
          return { name:r.competition?.name||'GP', date:'', drivers:[], played:false };
        }
      }));
      setRecentResults(results);
    } catch(e) {}
    finally { setLoading(false); }
  }

  const TABS = [
    { id:'info', label:'📊 '+t('stats') },
    { id:'forme', label:'🏁 '+t('form') },
    { id:'kazmo', label:'🤖 Kazmo' },
  ];

  const recentStr = recentResults.filter(function(r){return r.played;}).map(function(r){
    return r.name+': '+r.drivers.map(function(d){return d.name+' P'+d.position;}).join(', ');
  }).join('\n');

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header,{borderBottomColor:C}]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {team.logo ? (
            <Image source={{uri:team.logo}} style={styles.teamLogoLarge} onError={function(){}} />
          ) : (
            <View style={[styles.playerAvatar,{backgroundColor:C+'33'}]}>
              <Text style={styles.playerAvatarText}>🏎</Text>
            </View>
          )}
          <View style={{flex:1}}>
            <Text style={styles.headerTitle} numberOfLines={1}>{team.name}</Text>
            <Text style={styles.headerSub}>Formula 1 · 2026</Text>
          </View>
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {tab === 'info' && (
          <View>
            <Text style={styles.sectionTitle}>{t('standings').toUpperCase()} 2026</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard,{borderColor:'#FFD70044'}]}>
                <Text style={[styles.statValue,{color:'#FFD700'}]}>P{team.position||'?'}</Text>
                <Text style={styles.statLabel}>{t('standings')}</Text>
              </View>
              <View style={[styles.statCard,{borderColor:C+'44'}]}>
                <Text style={[styles.statValue,{color:C}]}>{team.points||0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={[styles.statCard,{borderColor:'#4CAF5044'}]}>
                <Text style={[styles.statValue,{color:'#4CAF50',fontSize:16}]}>{team.wins||0}</Text>
                <Text style={styles.statLabel}>{t('victories')}</Text>
              </View>
            </View>
          </View>
        )}
        {tab === 'forme' && (
          <View>
            <View style={styles.nbMatchsRow}>
              <Text style={styles.sectionTitle}>{t('last').toUpperCase()} GP</Text>
              <View style={styles.nbMatchsBtns}>
                {[3,5,10].map(function(n) {
                  return (
                    <TouchableOpacity key={n}
                      style={[styles.nbBtn, nbMatchs===n&&{backgroundColor:C}]}
                      onPress={() => setNbMatchs(n)}>
                      <Text style={[styles.nbBtnText, nbMatchs===n&&{color:'#fff'}]}>{n}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {loading ? (
              <View style={styles.center}><ActivityIndicator color="#FF6B2B" /></View>
            ) : recentResults.length === 0 ? (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>{t('noData')}</Text></View>
            ) : recentResults.map(function(r, i) {
              const bestPos = r.drivers.length > 0 ? parseInt(r.drivers[0].position) : 99;
              return (
                <View key={i} style={[styles.raceResultCard,{
                  borderLeftColor: r.played?(bestPos<=3?'#FFD700':bestPos<=10?'#4CAF50':'#ffffff44'):'#ffffff22',
                  borderLeftWidth:3
                }]}>
                  <View style={styles.raceResultHeader}>
                    <Text style={styles.raceResultDate}>{r.date}</Text>
                    {r.played && r.drivers.length > 0 ? (
                      <View style={{flexDirection:'row', gap:4}}>
                        {r.drivers.map(function(d, di) {
                          const pos = parseInt(d.position);
                          const podium = pos <= 3;
                          return (
                            <View key={di} style={[styles.positionBadge,{backgroundColor:podium?'#FFD70022':'#4CAF5022'}]}>
                              <Text style={[styles.positionText,{color:podium?'#FFD700':'#4CAF50'}]}>P{d.position}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.notPlayedText}>DNS</Text>
                    )}
                  </View>
                  <Text style={styles.raceResultName} numberOfLines={1}>{r.name}</Text>
                  {r.drivers.map(function(d, di) {
                    return (
                      <Text key={di} style={styles.tableSubText}>{d.name} · P{d.position}{d.time?' · '+d.time:''}</Text>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
        {tab === 'kazmo' && (
          <KazmoChat
            subject={team.name}
            systemPrompt={'You are Kazmo, F1 expert on team '+team.name+'. Reply concisely.'}
            initialAnalysis={'You are Kazmo, premium sports AI assistant.\nAnalyze F1 team: '+team.name+'\n\n2026 Stats:\n- Rank: P'+team.position+'\n- Points: '+team.points+'\n- Wins: '+(team.wins||0)+'\n\nRecent results:\n'+(recentStr||'Not available')+'\n\nProvide a complete analysis. Reply in the user language.'}
            t={t}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function F1DriverScreen({ driver, races, onBack, t, language }) {
  const [loading, setLoading] = useState(true);
  const [recentResults, setRecentResults] = useState([]);
  const [tab, setTab] = useState('info');
  const [nbMatchs, setNbMatchs] = useState(5);
  const C = '#E10600';

  useEffect(() => { fetchResults(); }, [nbMatchs]);

  async function fetchResults() {
    setLoading(true);
    try {
      const completedRaces = (races||[]).filter(function(r){ return r.status==='Completed'; }).reverse().slice(0, nbMatchs);
      const results = await Promise.all(completedRaces.map(async function(r) {
        try {
          const res = await fetch('https://v1.formula-1.api-sports.io/rankings/races?race='+r.id, { headers:H_F1 });
          const data = await res.json();
          const found = (data.response||[]).find(function(p){
            return (p.driver?.name||'').toLowerCase().includes(driver.name.split(' ').pop().toLowerCase());
          });
          return {
            name: r.competition?.name||'GP',
            date: formatDate(r.date, language),
            position: found ? found.position : null,
            time: found ? found.time : null,
            played: !!found,
          };
        } catch(e) {
          return { name:r.competition?.name||'GP', date:'', position:null, time:null, played:false };
        }
      }));
      setRecentResults(results);
    } catch(e) {}
    finally { setLoading(false); }
  }

  const TABS = [
    { id:'info', label:'📊 '+t('stats') },
    { id:'forme', label:'🏁 '+t('form') },
    { id:'kazmo', label:'🤖 Kazmo' },
  ];

  const recentStr = recentResults.filter(function(r){return r.played;}).map(function(r){
    return r.name+': P'+r.position+(r.time?' ('+r.time+')':'');
  }).join('\n');

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header,{borderBottomColor:C}]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {driver.photo ? (
            <Image source={{uri:driver.photo}} style={styles.driverPhoto} onError={function(){}} />
          ) : (
            <View style={[styles.playerAvatar,{backgroundColor:C+'33'}]}>
              <Text style={styles.playerAvatarText}>🏎</Text>
            </View>
          )}
          <View style={{flex:1}}>
            <Text style={styles.headerTitle} numberOfLines={1}>{driver.name}</Text>
            <Text style={styles.headerSub}>{driver.team} · #{driver.number||'?'}</Text>
          </View>
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {tab === 'info' && (
          <View>
            <Text style={styles.sectionTitle}>{t('standings').toUpperCase()} 2026</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard,{borderColor:'#FFD70044'}]}>
                <Text style={[styles.statValue,{color:'#FFD700'}]}>P{driver.position||'?'}</Text>
                <Text style={styles.statLabel}>{t('standings')}</Text>
              </View>
              <View style={[styles.statCard,{borderColor:C+'44'}]}>
                <Text style={[styles.statValue,{color:C}]}>{driver.points||0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={[styles.statCard,{borderColor:'#4CAF5044'}]}>
                <Text style={[styles.statValue,{color:'#4CAF50',fontSize:16}]}>{driver.wins||0}</Text>
                <Text style={styles.statLabel}>{t('victories')}</Text>
              </View>
              <View style={[styles.statCard,{borderColor:'#1565C044'}]}>
                <Text style={[styles.statValue,{color:'#1565C0',fontSize:16}]}>{driver.podiums||0}</Text>
                <Text style={styles.statLabel}>Podiums</Text>
              </View>
            </View>
            {driver.nationality ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🌍 {t('country')}</Text>
                <Text style={styles.infoValue}>{driver.nationality}</Text>
              </View>
            ) : null}
            {driver.team ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🏎 Team</Text>
                <Text style={styles.infoValue}>{driver.team}</Text>
              </View>
            ) : null}
          </View>
        )}
        {tab === 'forme' && (
          <View>
            <View style={styles.nbMatchsRow}>
              <Text style={styles.sectionTitle}>{t('last').toUpperCase()} GP</Text>
              <View style={styles.nbMatchsBtns}>
                {[3,5,10].map(function(n) {
                  return (
                    <TouchableOpacity key={n}
                      style={[styles.nbBtn, nbMatchs===n&&{backgroundColor:C}]}
                      onPress={() => setNbMatchs(n)}>
                      <Text style={[styles.nbBtnText, nbMatchs===n&&{color:'#fff'}]}>{n}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {loading ? (
              <View style={styles.center}><ActivityIndicator color="#FF6B2B" /></View>
            ) : recentResults.length === 0 ? (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>{t('noData')}</Text></View>
            ) : recentResults.map(function(r, i) {
              const pos = parseInt(r.position);
              const podium = pos <= 3;
              const points = pos <= 10;
              return (
                <View key={i} style={[styles.raceResultCard,{
                  borderLeftColor: r.played?(podium?'#FFD700':points?'#4CAF50':'#ffffff44'):'#ffffff22',
                  borderLeftWidth:3
                }]}>
                  <View style={styles.raceResultHeader}>
                    <Text style={styles.raceResultDate}>{r.date}</Text>
                    {r.played&&r.position ? (
                      <View style={[styles.positionBadge,{backgroundColor:podium?'#FFD70022':'#4CAF5022'}]}>
                        <Text style={[styles.positionText,{color:podium?'#FFD700':'#4CAF50'}]}>P{r.position}</Text>
                      </View>
                    ) : (
                      <Text style={styles.notPlayedText}>DNS</Text>
                    )}
                    {r.time ? <Text style={styles.raceTime}>{r.time}</Text> : null}
                  </View>
                  <Text style={styles.raceResultName} numberOfLines={1}>{r.name}</Text>
                </View>
              );
            })}
          </View>
        )}
        {tab === 'kazmo' && (
          <KazmoChat
            subject={driver.name}
            systemPrompt={'You are Kazmo, F1 expert on driver '+driver.name+'. Reply concisely.'}
            initialAnalysis={'You are Kazmo, premium sports AI assistant.\nAnalyze F1 driver: '+driver.name+'\n\n2026 Stats:\n- Rank: P'+driver.position+'\n- Points: '+driver.points+'\n- Team: '+driver.team+'\n\nRecent results:\n'+(recentStr||'Not available')+'\n\nProvide a complete analysis. Reply in the user language.'}
            t={t}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function F1Screen({ onBack, user, initialTab }) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState(initialTab || 'races');
  const [races, setRaces] = useState([]);
  const [driverStandings, setDriverStandings] = useState([]);
  const [teamStandings, setTeamStandings] = useState([]);
  const [liveRaceResults, setLiveRaceResults] = useState([]);
  const [liveRace, setLiveRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const C = '#E10600';

  const TABS = [
    { id:'races', label:'🏁 GP' },
    { id:'live', label:'🔴 '+t('inProgress') },
    { id:'drivers', label:'👨 '+t('leaders') },
    { id:'teams', label:'🏎 Teams' },
  ];

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [racesRes, driverRes, teamRes] = await Promise.all([
        fetch('https://v1.formula-1.api-sports.io/races?season=2026&type=Race', { headers:H_F1 }),
        fetch('https://v1.formula-1.api-sports.io/rankings/drivers?season=2026', { headers:H_F1 }),
        fetch('https://v1.formula-1.api-sports.io/rankings/teams?season=2026', { headers:H_F1 }),
      ]);
      const [racesData, driverData, teamData] = await Promise.all([
        racesRes.json(), driverRes.json(), teamRes.json()
      ]);

      const allRaces = racesData.response||[];
      setRaces(allRaces);

      const liveRaceData = allRaces.find(function(r){ return r.status==='Live'; });
      const lastRace = allRaces.filter(function(r){ return r.status==='Completed'; }).pop();
      const targetRace = liveRaceData || lastRace;

      if (targetRace) {
        setLiveRace(targetRace);
        const lbRes = await fetch('https://v1.formula-1.api-sports.io/rankings/races?race='+targetRace.id, { headers:H_F1 });
        const lbData = await lbRes.json();
        setLiveRaceResults(lbData.response||[]);
      }

      setDriverStandings(driverData.response||[]);
      setTeamStandings(teamData.response||[]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (selectedDriver) {
    return <F1DriverScreen driver={selectedDriver} races={races} onBack={() => setSelectedDriver(null)} t={t} language={language} />;
  }

  if (selectedTeam) {
    return <F1TeamScreen team={selectedTeam} races={races} onBack={() => setSelectedTeam(null)} t={t} language={language} />;
  }

  if (selectedRace) {
    return <F1RaceResultScreen race={selectedRace} onBack={() => setSelectedRace(null)} t={t} language={language}
      onSelectDriver={function(d){ setSelectedRace(null); setSelectedDriver(d); }} />;
  }

  const completedRaces = races.filter(function(r){ return r.status==='Completed'; });
  const upcomingRaces = races.filter(function(r){ return r.status==='Scheduled'; });
  const liveRaceItem = races.find(function(r){ return r.status==='Live'; });

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header,{borderBottomColor:C}]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>🏎</Text>
          <View>
            <Text style={styles.headerTitle}>FORMULA 1</Text>
            <Text style={styles.headerSub}>2026</Text>
          </View>
        </View>
        {liveRaceItem && (
          <View style={[styles.livePill,{backgroundColor:C+'33',borderColor:C+'66'}]}>
            <Text style={[styles.livePillText,{color:C}]}>● LIVE</Text>
          </View>
        )}
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

          {tab === 'races' && (
            <View>
              {liveRaceItem && (
                <TouchableOpacity style={[styles.liveRaceBanner,{borderColor:C}]} onPress={() => setTab('live')}>
                  <View style={styles.liveRaceHeader}>
                    <View style={[styles.liveBadge,{backgroundColor:C+'33',borderColor:C+'66'}]}>
                      <Text style={[styles.liveBadgeText,{color:C}]}>🔴 {t('inProgress').toUpperCase()} — {t('seeDetails').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.liveRaceName}>{liveRaceItem.competition?.name}</Text>
                  <Text style={styles.liveRaceCircuit}>📍 {liveRaceItem.circuit?.name} · {liveRaceItem.competition?.location?.country}</Text>
                </TouchableOpacity>
              )}

              {upcomingRaces.length > 0 && <Text style={styles.sectionTitle}>{t('upcoming').toUpperCase()} GP</Text>}
              {upcomingRaces.slice(0,5).map(function(r, i) {
                return (
                  <View key={i} style={styles.raceCard}>
                    <View style={styles.raceCardHeader}>
                      <Text style={styles.raceRound}>GP {races.indexOf(r)+1}</Text>
                      <Text style={styles.raceStatus}>{t('upcoming')}</Text>
                    </View>
                    <Text style={styles.raceName}>{r.competition?.name}</Text>
                    <Text style={styles.raceLocation}>📍 {r.circuit?.name} · {r.competition?.location?.country}</Text>
                    <Text style={styles.raceDate}>🗓 {formatDate(r.date, language)} · {formatTime(r.date)}</Text>
                  </View>
                );
              })}

              {completedRaces.length > 0 && <Text style={[styles.sectionTitle,{marginTop:12}]}>{t('finished').toUpperCase()} GP</Text>}
              {[...completedRaces].reverse().slice(0,10).map(function(r, i) {
                return (
                  <TouchableOpacity key={i}
                    style={[styles.raceCard,{borderColor:'#ffffff22'}]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedRace(r)}>
                    <View style={styles.raceCardHeader}>
                      <Text style={styles.raceRound}>GP {races.indexOf(r)+1}</Text>
                      <Text style={styles.finishedLabel}>{t('terminated')}</Text>
                      <Text style={styles.tapHint}>{t('seeDetails')} →</Text>
                    </View>
                    <Text style={styles.raceName}>{r.competition?.name}</Text>
                    <Text style={styles.raceLocation}>📍 {r.circuit?.name}</Text>
                    <Text style={styles.raceDate}>🗓 {formatDate(r.date, language)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'live' && (
            <View>
              {liveRace ? (
                <View>
                  <View style={[styles.liveRaceBanner,{borderColor:C,marginBottom:12}]}>
                    <View style={styles.liveRaceHeader}>
                      <View style={[styles.liveBadge,{backgroundColor:C+'33',borderColor:C+'66'}]}>
                        <Text style={[styles.liveBadgeText,{color:C}]}>
                          {liveRace.status==='Live'?'🔴 '+t('inProgress').toUpperCase():'✅ '+t('finished').toUpperCase()}
                        </Text>
                      </View>
                      {liveRace.laps?.total && (
                        <Text style={styles.liveRaceTime}>{liveRace.laps.total} laps</Text>
                      )}
                    </View>
                    <Text style={styles.liveRaceName}>{liveRace.competition?.name}</Text>
                    <Text style={styles.liveRaceCircuit}>📍 {liveRace.circuit?.name} · {liveRace.competition?.location?.country}</Text>
                    <Text style={styles.liveRaceDate}>🗓 {formatDate(liveRace.date, language)}</Text>
                  </View>

                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText,{width:35}]}>#</Text>
                    <Text style={[styles.tableHeaderText,{flex:1,textAlign:'left'}]}>{t('leaders')}</Text>
                    <Text style={[styles.tableHeaderText,{width:80}]}>Team</Text>
                    <Text style={[styles.tableHeaderText,{width:70}]}>Time</Text>
                  </View>

                  {liveRaceResults.map(function(r, i) {
                    const pos = parseInt(r.position);
                    const podium = pos <= 3;
                    return (
                      <TouchableOpacity key={i}
                        onPress={() => setSelectedDriver({
                          name:r.driver?.name||'?', team:r.team?.name||'?',
                          photo:r.driver?.image||null, number:r.driver?.number||null,
                          nationality:r.driver?.nationality||null,
                          position:pos, points:0,
                        })}
                        style={[styles.tableRow,{
                          backgroundColor:i%2===0?'#16162a':'#0d0d1a',
                          borderLeftColor:pos===1?'#FFD700':pos<=3?C:'#ffffff22',
                          borderLeftWidth:3,
                        }]}>
                        <Text style={[styles.tableCell,{width:35,color:podium?'#FFD700':'#ffffff55',fontFamily:'BebasNeue',fontSize:16}]}>P{pos}</Text>
                        <View style={{flex:1}}>
                          <Text style={styles.tableTeamName} numberOfLines={1}>{r.driver?.name}</Text>
                        </View>
                        <Text style={[styles.tableCell,{width:80,color:'#ffffff66',fontSize:9}]} numberOfLines={1}>{r.team?.name}</Text>
                        <Text style={[styles.tableCell,{width:70,color:'#ffffff88',fontSize:9}]}>{r.time||''}</Text>
                        <Text style={styles.rankArrow}>›</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>{t('liveNoMatch')}</Text>
                </View>
              )}
            </View>
          )}

          {tab === 'drivers' && (
            <View>
              <Text style={styles.sectionTitle}>{t('standings').toUpperCase()} 2026</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText,{width:35}]}>#</Text>
                <Text style={[styles.tableHeaderText,{flex:1,textAlign:'left'}]}>{t('leaders')}</Text>
                <Text style={[styles.tableHeaderText,{width:45}]}>Pts</Text>
                <Text style={[styles.tableHeaderText,{width:20}]}> </Text>
              </View>
              {driverStandings.map(function(d, i) {
                return (
                  <TouchableOpacity key={i}
                    onPress={() => setSelectedDriver({
                      name:d.driver?.name||'?', team:d.team?.name||'?',
                      photo:d.driver?.image||null, number:d.driver?.number||null,
                      nationality:d.driver?.nationality||null,
                      position:d.position||i+1, points:d.points||0,
                      wins:d.wins||0, podiums:d.podiums||0,
                    })}
                    style={[styles.tableRow,{
                      backgroundColor:i%2===0?'#16162a':'#0d0d1a',
                      borderLeftColor:i===0?'#FFD700':i<3?C:'#ffffff22',
                      borderLeftWidth:3,
                    }]}>
                    <Text style={[styles.tableCell,{width:35,color:'#ffffff55'}]}>{d.position||i+1}</Text>
                    <View style={{flex:1}}>
                      <Text style={styles.tableTeamName} numberOfLines={1}>{d.driver?.name}</Text>
                      <Text style={styles.tableSubText}>{d.team?.name}</Text>
                    </View>
                    <Text style={[styles.tableCell,{width:45,color:'#FFD700',fontFamily:'BebasNeue',fontSize:14}]}>{d.points||0}</Text>
                    <Text style={styles.rankArrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'teams' && (
            <View>
              <Text style={styles.sectionTitle}>{t('standings').toUpperCase()} TEAMS 2026</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText,{width:35}]}>#</Text>
                <Text style={[styles.tableHeaderText,{flex:1,textAlign:'left'}]}>Team</Text>
                <Text style={[styles.tableHeaderText,{width:45}]}>Pts</Text>
                <Text style={[styles.tableHeaderText,{width:20}]}> </Text>
              </View>
              {teamStandings.map(function(t2, i) {
                return (
                  <TouchableOpacity key={i}
                    onPress={() => setSelectedTeam({
                      name:t2.team?.name||'?', logo:t2.team?.logo||null,
                      position:t2.position||i+1, points:t2.points||0, wins:t2.wins||0,
                    })}
                    style={[styles.tableRow,{
                      backgroundColor:i%2===0?'#16162a':'#0d0d1a',
                      borderLeftColor:i===0?'#FFD700':i<3?C:'#ffffff22',
                      borderLeftWidth:3,
                    }]}>
                    <Text style={[styles.tableCell,{width:35,color:'#ffffff55'}]}>{t2.position||i+1}</Text>
                    <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6}}>
                      {t2.team?.logo ? <Image source={{uri:t2.team.logo}} style={styles.teamLogoSmall} onError={function(){}} /> : null}
                      <Text style={styles.tableTeamName} numberOfLines={1}>{t2.team?.name}</Text>
                    </View>
                    <Text style={[styles.tableCell,{width:45,color:'#FFD700',fontFamily:'BebasNeue',fontSize:14}]}>{t2.points||0}</Text>
                    <Text style={styles.rankArrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:2 },
  backBtn: { width:40, height:40, alignItems:'center', justifyContent:'center' },
  backBtnText: { color:'#FF6B2B', fontSize:24, fontWeight:'700' },
  headerCenter: { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  headerIcon: { fontSize:32 },
  headerTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:20, letterSpacing:1 },
  headerSub: { color:'#ffffff66', fontSize:10 },
  livePill: { borderRadius:8, paddingHorizontal:8, paddingVertical:3, borderWidth:1 },
  livePillText: { fontFamily:'BebasNeue', fontSize:10, fontWeight:'700' },
  playerAvatar: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  playerAvatarText: { fontSize:24 },
  driverPhoto: { width:48, height:48, borderRadius:24, resizeMode:'cover' },
  teamLogoLarge: { width:48, height:48, resizeMode:'contain' },
  teamLogoSmall: { width:18, height:18, resizeMode:'contain' },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginBottom:8, borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:10 },
  scroll: { padding:16, paddingBottom:40 },
  center: { padding:40, alignItems:'center', justifyContent:'center', gap:8 },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:8 },
  liveRaceBanner: { backgroundColor:'#16162a', borderRadius:14, padding:14, marginBottom:8, borderWidth:1 },
  liveRaceHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
  liveBadge: { borderRadius:6, paddingHorizontal:6, paddingVertical:2, borderWidth:1 },
  liveBadgeText: { fontFamily:'BebasNeue', fontSize:9, fontWeight:'700' },
  liveRaceTime: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:12 },
  liveRaceName: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:1, marginBottom:4 },
  liveRaceCircuit: { color:'#ffffff88', fontSize:11, marginBottom:2 },
  liveRaceDate: { color:'#ffffff55', fontSize:10 },
  raceCard: { backgroundColor:'#16162a', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  raceCardHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  raceRound: { color:'#ffffff88', fontFamily:'BebasNeue', fontSize:11, letterSpacing:1 },
  raceStatus: { color:'#FFD700', fontFamily:'BebasNeue', fontSize:10 },
  finishedLabel: { color:'#ffffff44', fontSize:10 },
  tapHint: { color:'#FF6B2B', fontSize:9, marginLeft:'auto' },
  raceName: { color:'#fff', fontFamily:'BebasNeue', fontSize:15, letterSpacing:0.5, marginBottom:3 },
  raceLocation: { color:'#ffffff88', fontSize:11, marginBottom:2 },
  raceDate: { color:'#ffffff66', fontSize:10 },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, marginBottom:4 },
  tableHeaderText: { color:'#ffffff33', fontSize:10, fontWeight:'600', textAlign:'center' },
  tableRow: { flexDirection:'row', alignItems:'center', padding:10, borderRadius:6, marginBottom:2 },
  tableTeamName: { color:'#fff', fontSize:12, fontWeight:'600' },
  tableSubText: { color:'#ffffff55', fontSize:9, marginTop:1 },
  tableCell: { textAlign:'center', color:'#fff', fontSize:11, fontFamily:'BebasNeue' },
  rankArrow: { color:'#FF6B2B', fontSize:16, marginLeft:4 },
  emptyBox: { backgroundColor:'#16162a', borderRadius:12, padding:20, alignItems:'center' },
  emptyText: { color:'#ffffff55', fontSize:12 },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 },
  statCard: { flex:1, minWidth:'45%', backgroundColor:'#16162a', borderRadius:12, padding:14, alignItems:'center', borderWidth:1 },
  statValue: { fontFamily:'BebasNeue', fontSize:28, letterSpacing:1 },
  statLabel: { color:'#ffffff66', fontSize:9, fontFamily:'BebasNeue', letterSpacing:1, marginTop:2 },
  infoRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:6 },
  infoLabel: { color:'#ffffff88', fontSize:11 },
  infoValue: { color:'#fff', fontSize:12, fontWeight:'600' },
  nbMatchsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  nbMatchsBtns: { flexDirection:'row', gap:6 },
  nbBtn: { width:36, height:28, borderRadius:8, backgroundColor:'#16162a', borderWidth:1, borderColor:'#ffffff22', alignItems:'center', justifyContent:'center' },
  nbBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:12 },
  raceResultCard: { backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:8, borderWidth:1, borderColor:'#ffffff14' },
  raceResultHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  raceResultDate: { color:'#ffffff55', fontSize:10, flex:1 },
  positionBadge: { borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  positionText: { fontSize:10, fontWeight:'700', fontFamily:'BebasNeue' },
  notPlayedText: { color:'#ffffff33', fontSize:9 },
  raceTime: { color:'#ffffff88', fontSize:10, fontFamily:'BebasNeue' },
  raceResultName: { color:'#fff', fontSize:12, fontWeight:'600' },
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
