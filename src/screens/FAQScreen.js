import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { supabase } from '../api/supabase';
import { useLanguage } from '../i18n/LanguageContext';

const ANTHROPIC_KEY = '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';
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

const FAQ_SUGGESTIONS = {
  fr: [
    'Comment fonctionne KAZMO ?',
    'Comment obtenir des conseils IA ?',
    'Comment changer ma langue ?',
    'Comment suivre mon equipe favorite ?',
    'Quels sports sont disponibles ?',
    'Comment acceder aux stats en direct ?',
  ],
  en: [
    'How does KAZMO work?',
    'How do I get AI advice?',
    'How do I change my language?',
    'How do I follow my favorite team?',
    'What sports are available?',
    'How do I access live stats?',
  ],
  es: [
    'Como funciona KAZMO?',
    'Como obtener consejos de IA?',
    'Como cambiar mi idioma?',
    'Como seguir mi equipo favorito?',
    'Que deportes estan disponibles?',
    'Como acceder a las estadisticas en vivo?',
  ],
  pt: [
    'Como funciona o KAZMO?',
    'Como obter conselhos de IA?',
    'Como mudar meu idioma?',
    'Como seguir meu time favorito?',
    'Quais esportes estao disponiveis?',
    'Como acessar as estatisticas ao vivo?',
  ],
  de: [
    'Wie funktioniert KAZMO?',
    'Wie bekomme ich KI-Tipps?',
    'Wie andere ich meine Sprache?',
    'Wie folge ich meinem Lieblingsteam?',
    'Welche Sportarten sind verfugbar?',
    'Wie greife ich auf Live-Statistiken zu?',
  ],
  it: [
    'Come funziona KAZMO?',
    'Come ottenere consigli IA?',
    'Come cambiare la mia lingua?',
    'Come seguire la mia squadra preferita?',
    'Quali sport sono disponibili?',
    'Come accedere alle statistiche in diretta?',
  ],
  ar: [
    'كيف يعمل كازمو؟',
    'كيف احصل على نصائح الذكاء الاصطناعي؟',
    'كيف اغير لغتي؟',
    'كيف اتابع فريقي المفضل؟',
    'ما هي الرياضات المتاحة؟',
    'كيف اصل الى الاحصاءات المباشرة؟',
  ],
  ru: [
    'Kak rabotaet KAZMO?',
    'Kak poluchit sovety IA?',
    'Kak izmenit yazyk?',
    'Kak sledovat za lyubimoy komandoy?',
    'Kakie vidy sporta dostupny?',
    'Kak poluchit dostup k zhivoy statistike?',
  ],
};

export default function FAQScreen({ user, onBack }) {
  const { t, language } = useLanguage();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [officialFAQ, setOfficialFAQ] = useState([]);
  const [tab, setTab] = useState('ask');

  const langNames = {
    fr: 'français', en: 'English', es: 'español', pt: 'português',
    de: 'Deutsch', it: 'italiano', ar: 'العربية', ru: 'русский'
  };

  const suggestions = FAQ_SUGGESTIONS[language] || FAQ_SUGGESTIONS['fr'];

  useEffect(() => {
    fetchOfficialFAQ();
    if (user) fetchUserHistory();
  }, []);

  async function fetchOfficialFAQ() {
    try {
      const { data } = await supabase
        .from('faq')
        .select('*')
        .not('reponse_officielle', 'is', null)
        .order('nb_fois', { ascending: false })
        .limit(10);
      setOfficialFAQ(data || []);
    } catch(e) {}
  }

  async function fetchUserHistory() {
    try {
      const { data } = await supabase
        .from('faq')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setHistory(data || []);
    } catch(e) {}
  }

  async function askQuestion(q) {
    const questionText = q || question.trim();
    if (!questionText) return;
    setLoading(true);
    setQuestion('');

    try {
      const langName = langNames[language] || 'français';

      // Vérifie si réponse officielle existe
      const { data: existing } = await supabase
        .from('faq')
        .select('*')
        .ilike('question', questionText)
        .not('reponse_officielle', 'is', null)
        .single();

      let reponse = '';

      if (existing?.reponse_officielle) {
        reponse = existing.reponse_officielle;
        await supabase.from('faq').update({ nb_fois: existing.nb_fois + 1 }).eq('id', existing.id);
      } else {
        const prompt = 'Tu es Kazmo, assistant IA d\'une application sportive premium.' +
          '\nL\'application KAZMO permet de suivre tous les sports en direct (NBA, NHL, MLB, NFL, Football, Tennis, F1, Golf, MMA),' +
          '\nd\'obtenir des analyses et pronostics IA, de suivre ses equipes favorites, et est disponible en 8 langues (FR/EN/ES/PT/DE/IT/AR/RU).' +
          '\n\nUn utilisateur pose cette question: ' + questionText +
          '\n\nReponds de maniere claire, utile et concise en ' + langName + '.' +
          '\nSi la question ne concerne pas KAZMO ou le sport, redirige poliment vers les sujets de l\'app.';

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: H_ANTHROPIC,
          body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 500,
            messages: [{ role:'user', content: prompt }],
          }),
        });
        const data = await response.json();
        reponse = (data.content || []).map(function(c) { return c.text || ''; }).join('');

        if (user) {
          await supabase.from('faq').insert({
            question: questionText,
            reponse: reponse,
            user_id: user.id,
            user_email: user.email,
            nb_fois: 1,
          });
        }
      }

      setHistory(function(prev) {
        return [{
          id: Date.now(),
          question: questionText,
          reponse: reponse,
          created_at: new Date().toISOString(),
          isNew: true,
        }, ...prev.slice(0, 9)];
      });

      setTab('ask');
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex:1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <Text style={styles.titleWhite}>FAQ </Text>
            <GradientText text="KAZMO" fontSize={22} letterSpacing={1} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {[
            { id:'ask', label:'💬 ' + t('faqTabAsk') },
            { id:'faq', label:'📚 ' + t('faqTabFaq') },
          ].map(function(tb) {
            return (
              <TouchableOpacity key={tb.id}
                style={[styles.tabBtn, tab === tb.id && styles.tabBtnActive]}
                onPress={() => setTab(tb.id)}>
                <Text style={[styles.tabBtnText, tab === tb.id && styles.tabBtnTextActive]}>{tb.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB ASK */}
        {tab === 'ask' && (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Avatar Kazmo */}
            <View style={styles.askBox}>
              <View style={styles.kazmoAvatar}>
                <LinearGradient colors={['#FF6B2B','#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.kazmoAvatarGradient}>
                  <Text style={styles.kazmoAvatarText}>K</Text>
                </LinearGradient>
              </View>
              <Text style={styles.kazmoWelcome}>{t('faqWelcome')}</Text>
              <Text style={styles.kazmoSubtitle}>{t('faqWelcomeSub')}</Text>
            </View>

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                style={styles.input}
                placeholder={t('faqInputPlaceholder')}
                placeholderTextColor="#ffffff44"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={() => askQuestion(null)}
                disabled={loading || !question.trim()}
                activeOpacity={0.85}
                style={styles.sendBtn}>
                <LinearGradient
                  colors={loading || !question.trim() ? ['#444','#555'] : ['#FF6B2B','#FFD600']}
                  start={{ x:0, y:0 }} end={{ x:1, y:0 }}
                  style={styles.sendBtnGradient}>
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.sendBtnText}>→</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Suggestions */}
            {!loading && history.length === 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsTitle}>{t('faqSuggestions')}</Text>
                {suggestions.map(function(s, i) {
                  return (
                    <TouchableOpacity key={i}
                      style={styles.suggestionBtn}
                      activeOpacity={0.8}
                      onPress={() => askQuestion(s)}>
                      <Text style={styles.suggestionText}>💬 {s}</Text>
                      <Text style={styles.suggestionArrow}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FF6B2B" size="large" />
                <Text style={styles.loadingText}>{t('faqThinking')}</Text>
              </View>
            )}

            {/* Historique */}
            {history.length > 0 && (
              <View style={styles.historySection}>
                {history.map(function(item, i) {
                  return (
                    <View key={item.id || i} style={[styles.qaCard, item.isNew && styles.qaCardNew]}>
                      <View style={styles.questionRow}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>👤</Text>
                        </View>
                        <View style={styles.questionBubble}>
                          <Text style={styles.questionText}>{item.question}</Text>
                        </View>
                      </View>
                      <View style={styles.answerRow}>
                        <LinearGradient colors={['#FF6B2B','#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.kazmoAvatarSmall}>
                          <Text style={styles.kazmoAvatarSmallText}>K</Text>
                        </LinearGradient>
                        <View style={styles.answerBubble}>
                          <Text style={styles.answerText}>{item.reponse}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

          </ScrollView>
        )}

        {/* TAB FAQ OFFICIELLE */}
        {tab === 'faq' && (
          <ScrollView contentContainerStyle={styles.scroll}>
            {officialFAQ.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyText}>{t('faqEmpty')}</Text>
                <Text style={styles.emptySub}>{t('faqEmptySub')}</Text>
                <TouchableOpacity onPress={() => setTab('ask')} style={{ marginTop:16 }}>
                  <LinearGradient colors={['#FF6B2B','#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.askNowBtn}>
                    <Text style={styles.askNowBtnText}>💬 {t('faqAskNow')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              officialFAQ.map(function(item, i) {
                return (
                  <View key={item.id} style={styles.faqCard}>
                    <View style={styles.faqCardHeader}>
                      <Text style={styles.faqQuestion}>{item.question}</Text>
                      {item.nb_fois > 1 && (
                        <View style={styles.faqCount}>
                          <Text style={styles.faqCountText}>{item.nb_fois}x</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.faqAnswer}>{item.reponse_officielle}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { flexDirection:'row', alignItems:'center', gap:12, padding:16, paddingBottom:8 },
  backBtn: { color:'#FF6B2B', fontSize:22, fontWeight:'700' },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  tabBar: { flexDirection:'row', backgroundColor:'#16162a', margin:16, marginTop:0,
            borderRadius:10, padding:4, gap:4 },
  tabBtn: { flex:1, padding:8, borderRadius:8, alignItems:'center' },
  tabBtnActive: { backgroundColor:'#FF6B2B' },
  tabBtnText: { color:'#ffffff55', fontFamily:'BebasNeue', fontSize:11 },
  tabBtnTextActive: { color:'#fff' },
  scroll: { padding:16, paddingBottom:40 },
  askBox: { alignItems:'center', marginBottom:20 },
  kazmoAvatar: { width:64, height:64, borderRadius:32, overflow:'hidden', marginBottom:10 },
  kazmoAvatarGradient: { width:64, height:64, alignItems:'center', justifyContent:'center' },
  kazmoAvatarText: { color:'#fff', fontFamily:'BebasNeue', fontSize:32, fontWeight:'900' },
  kazmoWelcome: { color:'#fff', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1, marginBottom:4 },
  kazmoSubtitle: { color:'#ffffff66', fontSize:11, textAlign:'center', lineHeight:16 },
  inputRow: { flexDirection:'row', gap:8, marginBottom:16, alignItems:'flex-end' },
  input: { flex:1, backgroundColor:'#16162a', borderRadius:12, padding:14, color:'#fff',
           fontSize:13, borderWidth:1, borderColor:'#ffffff22', maxHeight:100 },
  sendBtn: { width:48, height:48 },
  sendBtnGradient: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  sendBtnText: { color:'#fff', fontSize:20, fontWeight:'700' },
  suggestionsSection: { marginBottom:16 },
  suggestionsTitle: { color:'#ffffff44', fontFamily:'BebasNeue', fontSize:10, letterSpacing:2, marginBottom:8 },
  suggestionBtn: { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                   backgroundColor:'#16162a', borderRadius:10, padding:12, marginBottom:6,
                   borderWidth:1, borderColor:'#ffffff0a' },
  suggestionText: { color:'#ffffffcc', fontSize:12, flex:1 },
  suggestionArrow: { color:'#ffffff33', fontSize:18 },
  loadingBox: { alignItems:'center', padding:24, gap:10 },
  loadingText: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:13, letterSpacing:1 },
  historySection: { gap:16 },
  qaCard: { backgroundColor:'#16162a', borderRadius:14, padding:14,
            borderWidth:1, borderColor:'#ffffff14' },
  qaCardNew: { borderColor:'#FF6B2B44' },
  questionRow: { flexDirection:'row', gap:10, marginBottom:12, alignItems:'flex-start' },
  userAvatar: { width:32, height:32, borderRadius:16, backgroundColor:'#ffffff14',
                alignItems:'center', justifyContent:'center' },
  userAvatarText: { fontSize:16 },
  questionBubble: { flex:1, backgroundColor:'#ffffff0a', borderRadius:10, padding:10 },
  questionText: { color:'#fff', fontSize:12, lineHeight:18 },
  answerRow: { flexDirection:'row', gap:10, alignItems:'flex-start' },
  kazmoAvatarSmall: { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
  kazmoAvatarSmallText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, fontWeight:'900' },
  answerBubble: { flex:1, backgroundColor:'#FF6B2B11', borderRadius:10, padding:10,
                  borderWidth:1, borderColor:'#FF6B2B22' },
  answerText: { color:'#ffffffcc', fontSize:12, lineHeight:18 },
  emptyBox: { alignItems:'center', padding:40, gap:8 },
  emptyIcon: { fontSize:40 },
  emptyText: { color:'#fff', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1 },
  emptySub: { color:'#ffffff55', fontSize:11, textAlign:'center' },
  askNowBtn: { borderRadius:12, paddingHorizontal:20, paddingVertical:12 },
  askNowBtnText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:1 },
  faqCard: { backgroundColor:'#16162a', borderRadius:12, padding:14, marginBottom:10,
             borderWidth:1, borderColor:'#ffffff14' },
  faqCardHeader: { flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 },
  faqQuestion: { color:'#FF6B2B', fontFamily:'BebasNeue', fontSize:13, letterSpacing:0.5, flex:1 },
  faqCount: { backgroundColor:'#FF6B2B22', borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  faqCountText: { color:'#FF6B2B', fontSize:9, fontWeight:'700' },
  faqAnswer: { color:'#ffffffcc', fontSize:12, lineHeight:18 },
});