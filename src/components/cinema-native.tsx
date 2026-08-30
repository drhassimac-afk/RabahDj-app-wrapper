import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from 'react-native';

type Category = 'movies' | 'tv' | 'series';

const CATEGORY_LABELS: Record<Category, string> = {
  movies: '🎬 أفلام',
  tv: '📺 تلفاز',
  series: '🍿 مسلسلات',
};

type Props = {
  category: Category;
  history: string[];
  onSelectCategory: (cat: Category) => void;
  onPlay: (url: string) => void;
  onBack: () => void;
};

export default function CinemaNative({ category, history, onSelectCategory, onPlay, onBack }: Props) {
  const [url, setUrl] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.back} onPress={onBack}>
          <Text style={styles.backText}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>سينما وتلفاز</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.tabs}>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, category === cat && styles.tabActive]}
            onPress={() => onSelectCategory(cat)}
          >
            <Text style={styles.tabText}>{CATEGORY_LABELS[cat]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.box}>
        <TextInput
          style={styles.input}
          placeholder="رابط فيديو mp4 أو YouTube"
          placeholderTextColor="#64748b"
          value={url}
          onChangeText={setUrl}
        />
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => {
            if (!url.trim()) return;
            onPlay(url.trim());
            setUrl('');
          }}
        >
          <Text style={styles.playBtnText}>عرض للجميع</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.historyLabel}>آخر روابط {CATEGORY_LABELS[category]}</Text>
      <FlatList
        data={history}
        keyExtractor={(item, i) => `${item}_${i}`}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <Text style={styles.historyUrl} numberOfLines={1}>{item}</Text>
            <TouchableOpacity style={styles.historyPlayBtn} onPress={() => onPlay(item)}>
              <Text style={styles.historyPlayText}>عرض</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد روابط سابقة</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', paddingTop: 50, paddingHorizontal: 16 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  back: { backgroundColor: '#ffffff14', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  backText: { color: '#fff', fontWeight: '700' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff22', backgroundColor: '#ffffff0a', alignItems: 'center' },
  tabActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  tabText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  box: { backgroundColor: '#ffffff0a', borderWidth: 1, borderColor: '#ffffff14', borderRadius: 18, padding: 16, marginBottom: 16 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#ffffff22', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 10 },
  playBtn: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  playBtnText: { color: '#fff', fontWeight: '800' },
  historyLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff0a',
    borderWidth: 1, borderColor: '#ffffff14', borderRadius: 14, padding: 12, marginBottom: 8, gap: 10,
  },
  historyUrl: { flex: 1, color: '#fff' },
  historyPlayBtn: { backgroundColor: '#2563eb', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10 },
  historyPlayText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 20 },
});
