import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';

type CardDef = { key: string; label: string; emoji: string; gradient: [string, string]; onPress: () => void };

type Props = {
  cards: CardDef[];
  name: string;
  room: string;
  connectionStatus: string;
  onNameChange: (v: string) => void;
  onRoomChange: (v: string) => void;
  onConnect: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
};

export default function HomeNative({
  cards, name, room, connectionStatus, onNameChange, onRoomChange, onConnect, onOpenSettings, onOpenProfile,
}: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenProfile}>
          <Text style={styles.iconText}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenSettings}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.h1}>
        Rabah<Text style={styles.h1Blue}>Dj</Text>
      </Text>
      <Text style={styles.sub}>شبكتك الاجتماعية المحلية</Text>
      <Text style={styles.desc}>اتصل، شارك، وابث صوتاً وفيديو مع أصدقائك{'\n'}عبر شبكتك المحلية</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <TouchableOpacity key={card.key} style={styles.card} onPress={card.onPress}>
            <View style={[styles.cardIcon, { backgroundColor: card.gradient[0] }]}>
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
            </View>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.box}>
        <TextInput style={styles.input} placeholder="اسمك" placeholderTextColor="#64748b" value={name} onChangeText={onNameChange} />
        <TextInput style={styles.input} placeholder="رمز الغرفة (مثلاً: 100)" placeholderTextColor="#64748b" value={room} onChangeText={onRoomChange} />
        <TouchableOpacity style={styles.connectBtn} onPress={onConnect}>
          <Text style={styles.connectBtnText}>اتصال بالغرفة</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>{connectionStatus}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', paddingHorizontal: 20 },
  top: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 40, marginBottom: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ffffff14', justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 18 },
  h1: { fontSize: 40, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 10 },
  h1Blue: { color: '#3b82f6' },
  sub: { color: '#60a5fa', textAlign: 'center', marginTop: 10, fontSize: 16 },
  desc: { color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  card: {
    width: '47%', aspectRatio: 1.05, borderRadius: 24, backgroundColor: '#ffffff08', borderWidth: 1, borderColor: '#ffffff14',
    justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 14,
  },
  cardIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 28 },
  cardLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },
  box: { backgroundColor: '#ffffff0a', borderWidth: 1, borderColor: '#ffffff14', borderRadius: 18, padding: 16, marginTop: 10 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#ffffff22', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 10 },
  connectBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  connectBtnText: { color: '#fff', fontWeight: '800' },
  status: { color: '#4ade80', textAlign: 'center', marginTop: 14, fontSize: 13 },
});
