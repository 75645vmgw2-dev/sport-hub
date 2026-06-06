import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { supabase } from '../api/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import TeamScreen from './TeamScreen';

function GradientText({ text, fontSize, letterSpacing }) {
  return (
    <MaskedView maskElement={<Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, color:'#000' }}>{text}</Text>}>
      <LinearGradient colors={['#FF6B2B', '#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
        <Text style={{ fontSize, fontFamily:'BebasNeue', letterSpacing, opacity:0 }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const SPORT_COLORS = {
  basketball:'#1D428A', hockey:'#00B8D9', baseball:'#E53935', nfl:'#1A73E8',
  soccer:'#4CAF50', tennis:'#c85a19', f1:'#E10600', golf:'#2E7D32', mma:'#9C27B0',
};

const SPORT_ICONS = {
  basketball:'🏀', hockey:'🏒', baseball:'⚾', nfl:'🏈',
  soccer:'⚽', tennis:'🎾', f1:'🏎', golf:'⛳', mma:'🤼',
};

export default function FavoritesScreen({ user }) {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  async function fetchFavorites() {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id);
    setFavorites(data || []);
    setLoading(false);
  }

  async function removeFavorite(id) {
    await supabase.from('favorites').delete().eq('id', id);
    setFavorites(favorites.filter(function(f) { return f.id !== id; }));
  }

  const grouped = {};
  favorites.forEach(function(f) {
    if (!grouped[f.sport]) grouped[f.sport] = [];
    grouped[f.sport].push(f);
  });

  if (selectedTeam) {
    return <TeamScreen favorite={selectedTeam} onBack={() => setSelectedTeam(null)} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color="#FF6B2B" size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>{t('myFavorites').split(' ')[0]} </Text>
          <GradientText text={t('myFavorites').split(' ').slice(1).join(' ')} fontSize={22} letterSpacing={1} />
        </View>
        {favorites.length > 0 && (
          <Text style={styles.subtitle}>
            {favorites.length} {favorites.length > 1 ? t('teamsFollowed') : t('teamFollowed')}
          </Text>
        )}
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>{t('noFavorites')}</Text>
          <Text style={styles.emptyHint}>{t('noFavoritesHint')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {Object.keys(grouped).map(function(sport) {
            const color = SPORT_COLORS[sport] || '#FF6B2B';
            const icon = SPORT_ICONS[sport] || '🏆';
            return (
              <View key={sport} style={styles.sportSection}>
                <View style={[styles.sportHeader, { borderLeftColor: color }]}>
                  <Text style={styles.sportHeaderText}>{icon} {sport.toUpperCase()}</Text>
                </View>
                {grouped[sport].map(function(fav) {
                  return (
                    <TouchableOpacity
                      key={fav.id}
                      style={styles.teamCard}
                      activeOpacity={0.8}
                      onPress={() => setSelectedTeam(fav)}>
                      <View style={styles.teamCardContent}>
                        {fav.logo_url ? (
                          <Image source={{ uri: fav.logo_url }} style={styles.teamLogo} onError={function(){}} />
                        ) : (
                          <View style={[styles.teamLogoPlaceholder, { backgroundColor: color + '33' }]}>
                            <Text style={styles.teamLogoPlaceholderText}>
                              {fav.team_name.slice(0,2).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.teamInfo}>
                          <Text style={styles.teamName}>{fav.team_name}</Text>
                          <Text style={styles.teamLeague}>{fav.league}</Text>
                          <Text style={styles.teamHint}>Appuyer pour voir la fiche →</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeFavorite(fav.id)}
                          style={styles.removeBtn}
                          hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
                          <Text style={styles.removeBtnText}>★</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { padding:20, paddingBottom:10 },
  titleRow: { flexDirection:'row', alignItems:'center' },
  titleWhite: { fontSize:22, color:'#fff', fontFamily:'BebasNeue', letterSpacing:1 },
  subtitle: { color:'#ffffffcc', fontSize:11, marginTop:4, fontFamily:'BebasNeue', letterSpacing:1 },
  center: { flex:1, alignItems:'center', justifyContent:'center' },
  scroll: { padding:16, paddingBottom:40 },
  emptyBox: { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  emptyIcon: { fontSize:48, marginBottom:16 },
  emptyTitle: { color:'#fff', fontFamily:'BebasNeue', fontSize:18, letterSpacing:1, marginBottom:8 },
  emptyHint: { color:'#ffffffcc', fontSize:12, textAlign:'center', lineHeight:18 },
  sportSection: { marginBottom:20 },
  sportHeader: { borderLeftWidth:3, paddingLeft:10, marginBottom:10 },
  sportHeaderText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14, letterSpacing:2 },
  teamCard: { backgroundColor:'#16162a', borderRadius:12, padding:14, marginBottom:8,
              borderWidth:1, borderColor:'#ffffff14' },
  teamCardContent: { flexDirection:'row', alignItems:'center', gap:10 },
  teamLogo: { width:48, height:48, resizeMode:'contain' },
  teamLogoPlaceholder: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center' },
  teamLogoPlaceholderText: { color:'#fff', fontFamily:'BebasNeue', fontSize:14 },
  teamInfo: { flex:1 },
  teamName: { color:'#fff', fontSize:15, fontWeight:'700', fontFamily:'BebasNeue', letterSpacing:0.5 },
  teamLeague: { color:'#ffffffcc', fontSize:10, marginTop:2 },
  teamHint: { color:'#FF6B2B', fontSize:9, marginTop:4, fontFamily:'BebasNeue' },
  removeBtn: { padding:4 },
  removeBtnText: { color:'#FFD700', fontSize:22 },
});
