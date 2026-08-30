import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  isLive: boolean;
  isMicMuted: boolean;
  onToggleLive: () => void;
  onToggleMic: () => void;
  onSwitchCamera: () => void;
  onBack: () => void;
};

export default function LiveNative({ isLive, isMicMuted, onToggleLive, onToggleMic, onSwitchCamera, onBack }: Props) {
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>بث مباشر</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.bottomBar} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.mainBtn, isLive ? styles.mainBtnStop : styles.mainBtnStart]}
          onPress={onToggleLive}
        >
          <Text style={styles.mainBtnText}>{isLive ? 'إيقاف البث' : 'بدء البث بالكاميرا'}</Text>
        </TouchableOpacity>

        {isLive && (
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.smallBtn} onPress={onToggleMic}>
              <Text style={styles.smallBtnText}>{isMicMuted ? '🔇 المايك مكتوم' : '🎤 كتم المايك'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallBtn} onPress={onSwitchCamera}>
              <Text style={styles.smallBtnText}>🔄 تبديل الكاميرا</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topBar: {
    position: 'absolute', top: 40, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { backgroundColor: '#ffffff22', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  backText: { color: '#fff', fontWeight: '700' },
  title: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bottomBar: { position: 'absolute', bottom: 40, left: 20, right: 20, alignItems: 'center' },
  mainBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  mainBtnStart: { backgroundColor: '#dc2626' },
  mainBtnStop: { backgroundColor: '#dc2626' },
  mainBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  controlsRow: { flexDirection: 'row', gap: 8, marginTop: 10, width: '100%' },
  smallBtn: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
