import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, Rect, Circle, Polygon, Path, Line } from 'react-native-svg';

// OPTION 1 — K majuscule stylisé
function Icon1({ size }) {
  const s = size || 120;
  return (
    <View style={{ width:s, height:s, borderRadius:s*0.22, overflow:'hidden' }}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="i1g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF6B2B" />
            <Stop offset="1" stopColor="#FFD600" />
          </SvgGradient>
          <SvgGradient id="i1bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1a1a2e" />
            <Stop offset="1" stopColor="#080814" />
          </SvgGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#i1bg)" />
        {/* K géant */}
        <SvgText
          x="50" y="72"
          textAnchor="middle"
          fill="url(#i1g)"
          fontSize="72"
          fontWeight="900">
          K
        </SvgText>
        {/* KAZMO petit en bas */}
        <SvgText
          x="50" y="90"
          textAnchor="middle"
          fill="#ffffff88"
          fontSize="10"
          fontWeight="700"
          letterSpacing="5">
          KAZMO
        </SvgText>
      </Svg>
    </View>
  );
}

// OPTION 2 — Hexagone + KAZMO
function Icon2({ size }) {
  const s = size || 120;
  return (
    <View style={{ width:s, height:s, borderRadius:s*0.22, overflow:'hidden' }}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="i2g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF6B2B" />
            <Stop offset="1" stopColor="#FFD600" />
          </SvgGradient>
          <SvgGradient id="i2bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1a1a2e" />
            <Stop offset="1" stopColor="#080814" />
          </SvgGradient>
          <SvgGradient id="i2stroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF6B2B" />
            <Stop offset="1" stopColor="#FFD600" />
          </SvgGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#i2bg)" />
        {/* Hexagone */}
        <Polygon
          points="50,8 88,29 88,71 50,92 12,71 12,29"
          fill="none"
          stroke="url(#i2g)"
          strokeWidth="3"
        />
        {/* Hexagone intérieur */}
        <Polygon
          points="50,16 80,33 80,67 50,84 20,67 20,33"
          fill="#FF6B2B11"
        />
        {/* KAZMO */}
        <SvgText
          x="50" y="56"
          textAnchor="middle"
          fill="url(#i2g)"
          fontSize="18"
          fontWeight="900"
          letterSpacing="2">
          KAZMO
        </SvgText>
      </Svg>
    </View>
  );
}

// OPTION 3 — Bouclier + KAZMO
function Icon3({ size }) {
  const s = size || 120;
  return (
    <View style={{ width:s, height:s, borderRadius:s*0.22, overflow:'hidden' }}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="i3g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF6B2B" />
            <Stop offset="1" stopColor="#FFD600" />
          </SvgGradient>
          <SvgGradient id="i3bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1a1a2e" />
            <Stop offset="1" stopColor="#080814" />
          </SvgGradient>
          <SvgGradient id="i3shield" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF6B2B33" />
            <Stop offset="1" stopColor="#FFD60011" />
          </SvgGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#i3bg)" />
        {/* Bouclier */}
        <Path
          d="M50,8 L88,22 L88,55 C88,75 50,92 50,92 C50,92 12,75 12,55 L12,22 Z"
          fill="url(#i3shield)"
          stroke="url(#i3g)"
          strokeWidth="2.5"
        />
        {/* KAZMO */}
        <SvgText
          x="50" y="56"
          textAnchor="middle"
          fill="url(#i3g)"
          fontSize="16"
          fontWeight="900"
          letterSpacing="1">
          KAZMO
        </SvgText>
      </Svg>
    </View>
  );
}

// OPTION 4 — Cercle + KAZMO centré
function Icon4({ size }) {
  const s = size || 120;
  return (
    <View style={{ width:s, height:s, borderRadius:s*0.22, overflow:'hidden' }}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="i4g" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FF6B2B" />
            <Stop offset="1" stopColor="#FFD600" />
          </SvgGradient>
          <SvgGradient id="i4bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1a1a2e" />
            <Stop offset="1" stopColor="#080814" />
          </SvgGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#i4bg)" />
        {/* Cercle extérieur */}
        <Circle cx="50" cy="50" r="42" fill="none" stroke="url(#i4g)" strokeWidth="3" />
        {/* Cercle intérieur fin */}
        <Circle cx="50" cy="50" r="36" fill="none" stroke="url(#i4g)" strokeWidth="0.8" opacity="0.4" />
        {/* Ligne haut */}
        <Rect x="22" y="38" width="56" height="1.5" fill="url(#i4g)" opacity="0.5" />
        {/* KAZMO */}
        <SvgText
          x="50" y="57"
          textAnchor="middle"
          fill="url(#i4g)"
          fontSize="20"
          fontWeight="900"
          letterSpacing="3">
          KAZMO
        </SvgText>
        {/* Ligne bas */}
        <Rect x="22" y="62" width="56" height="1.5" fill="url(#i4g)" opacity="0.5" />
      </Svg>
    </View>
  );
}

// OPTION 5 — Slash diagonal + KAZMO
function Icon5({ size }) {
  const s = size || 120;
  return (
    <View style={{ width:s, height:s, borderRadius:s*0.22, overflow:'hidden' }}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="i5g" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FF6B2B" />
            <Stop offset="1" stopColor="#FFD600" />
          </SvgGradient>
          <SvgGradient id="i5bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1a1a2e" />
            <Stop offset="1" stopColor="#080814" />
          </SvgGradient>
          <SvgGradient id="i5slash" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF6B2B" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#FFD600" stopOpacity="0.2" />
          </SvgGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#i5bg)" />
        {/* Slash gauche */}
        <Polygon
          points="15,100 35,0 45,0 25,100"
          fill="url(#i5slash)"
        />
        {/* Slash droite */}
        <Polygon
          points="30,100 50,0 60,0 40,100"
          fill="url(#i5slash)"
          opacity="0.5"
        />
        {/* KAZMO */}
        <SvgText
          x="52" y="58"
          textAnchor="middle"
          fill="url(#i5g)"
          fontSize="20"
          fontWeight="900"
          letterSpacing="2">
          KAZMO
        </SvgText>
        {/* Ligne sous KAZMO */}
        <Rect x="20" y="63" width="60" height="2" fill="url(#i5g)" rx="1" />
        {/* Sport sous la ligne */}
       <SvgText
  x="52" y="76"
  textAnchor="middle"
  fill="#ffffffcc"
fontSize="9"
letterSpacing="4">
SPORT
</SvgText>
      </Svg>
    </View>
  );
}

export default function IconPreviewScreen({ onBack }) {
  const [selected, setSelected] = useState(null);

  const OPTIONS = [
    { id:1, label:'Option 1', desc:'K géant stylisé', component: Icon1 },
    { id:2, label:'Option 2', desc:'Hexagone + KAZMO', component: Icon2 },
    { id:3, label:'Option 3', desc:'Bouclier + KAZMO', component: Icon3 },
    { id:4, label:'Option 4', desc:'Cercle + KAZMO', component: Icon4 },
    { id:5, label:'Option 5', desc:'Slash + KAZMO', component: Icon5 },
  ];

  const SelectedComponent = selected ? OPTIONS.find(function(o) { return o.id === selected; })?.component : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ICÔNE KAZMO</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>Appuyez sur une option pour la sélectionner</Text>

        {/* Grande preview */}
        {SelectedComponent && (
          <View style={styles.bigPreview}>
            <Text style={styles.bigPreviewLabel}>APERÇU GRANDE TAILLE</Text>
            <SelectedComponent size={200} />
            <Text style={styles.bigPreviewOption}>
              {OPTIONS.find(function(o) { return o.id === selected; })?.desc}
            </Text>
          </View>
        )}

        {/* Les 5 options — rangée 3 + rangée 2 */}
        <View style={styles.optionsRow}>
          {OPTIONS.slice(0,3).map(function(opt) {
            const Comp = opt.component;
            return (
              <TouchableOpacity key={opt.id}
                style={[styles.optionCard, selected === opt.id && styles.optionCardSelected]}
                activeOpacity={0.8}
                onPress={() => setSelected(opt.id)}>
                <Comp size={90} />
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
                {selected === opt.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.optionsRow, { justifyContent:'center' }]}>
          {OPTIONS.slice(3,5).map(function(opt) {
            const Comp = opt.component;
            return (
              <TouchableOpacity key={opt.id}
                style={[styles.optionCard, { width:'45%' }, selected === opt.id && styles.optionCardSelected]}
                activeOpacity={0.8}
                onPress={() => setSelected(opt.id)}>
                <Comp size={90} />
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
                {selected === opt.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Aperçu tailles */}
        {SelectedComponent && (
          <>
            <Text style={styles.sectionTitle}>APERÇU TAILLES RÉELLES</Text>
            <View style={styles.sizesRow}>
              {[180, 120, 80, 60, 40, 29].map(function(size) {
                return (
                  <View key={size} style={styles.sizeItem}>
                    <SelectedComponent size={size} />
                    <Text style={styles.sizeLabel}>{size}px</Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity activeOpacity={0.85} style={{ marginTop:16 }}>
              <LinearGradient colors={['#FF6B2B','#FFD600']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.validateBtn}>
                <Text style={styles.validateBtnText}>✅ Je valide l'Option {selected}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080814' },
  header: { flexDirection:'row', alignItems:'center', gap:16, padding:16, paddingBottom:8 },
  backBtn: { color:'#FF6B2B', fontSize:16, fontWeight:'700' },
  title: { color:'#fff', fontFamily:'BebasNeue', fontSize:22, letterSpacing:2 },
  scroll: { padding:16, paddingBottom:40 },
  subtitle: { color:'#ffffff66', fontFamily:'BebasNeue', fontSize:11, letterSpacing:1, marginBottom:16, textAlign:'center' },
  bigPreview: { alignItems:'center', marginBottom:20, backgroundColor:'#16162a',
                borderRadius:16, padding:24, borderWidth:1, borderColor:'#FF6B2B33' },
  bigPreviewLabel: { color:'#ffffff44', fontSize:10, fontFamily:'BebasNeue', letterSpacing:2, marginBottom:16 },
  bigPreviewOption: { color:'#ffffffcc', fontSize:12, marginTop:12, fontFamily:'BebasNeue', letterSpacing:1 },
  optionsRow: { flexDirection:'row', gap:8, marginBottom:8, justifyContent:'space-between' },
  optionCard: { alignItems:'center', backgroundColor:'#16162a', borderRadius:14, padding:10,
                borderWidth:1, borderColor:'#ffffff14', flex:1 },
  optionCardSelected: { borderColor:'#FF6B2B', backgroundColor:'#FF6B2B11' },
  optionLabel: { color:'#fff', fontFamily:'BebasNeue', fontSize:11, letterSpacing:1, marginTop:6 },
  optionDesc: { color:'#ffffff55', fontSize:8, textAlign:'center', marginTop:2 },
  selectedBadge: { backgroundColor:'#FF6B2B', borderRadius:10, width:20, height:20,
                   alignItems:'center', justifyContent:'center', marginTop:4 },
  selectedBadgeText: { color:'#fff', fontSize:10, fontWeight:'700' },
  sectionTitle: { color:'#ffffffcc', fontFamily:'BebasNeue', fontSize:11, letterSpacing:2, marginBottom:12, marginTop:8 },
  sizesRow: { flexDirection:'row', alignItems:'flex-end', gap:8, flexWrap:'wrap' },
  sizeItem: { alignItems:'center', gap:4 },
  sizeLabel: { color:'#ffffff33', fontSize:7, fontFamily:'BebasNeue' },
  validateBtn: { borderRadius:12, padding:16, alignItems:'center' },
  validateBtnText: { color:'#fff', fontFamily:'BebasNeue', fontSize:16, letterSpacing:1 },
});