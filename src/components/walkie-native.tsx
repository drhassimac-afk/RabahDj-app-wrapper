import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  isRecording: boolean;
  lastSpeaker: string | null;
  onPressIn: () => void;
  onPressOut: () => void;
  onBack: () => void;
};

export default function WalkieNative({ isRecording, lastSpeaker, onPressIn, onPressOut, onBack }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>← رجوع</Text>
      </TouchableOpacity>
      <Text style={styles.title}>تخاطب لاسلكي</Text>
      <Text style={styles.desc}>اضغط مع الاستمرار للتحدث، وأفلت للإرسال</Text>
      <View style={styles.pttWrap}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[styles.ptt, isRecording && styles.pttOn]}
        >
          <Text style={styles.pttText}>{isRecording ? 'جارٍ\nالتسجيل' : 'اضغط\nوتحدث'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.status}>{lastSpeaker ? `آخر متحدث: ${lastSpeaker}` : 'ما فيه رسائل بعد'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', alignItems: 'center', paddingTop: 60 },
  back: { position: 'absolute', top: 40, left: 16, backgroundColor: '#ffffff14', padding: 10, borderRadius: 12 },
  backText: { color: '#fff', fontWeight: '700' },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 20 },
  desc: { color: '#94a3b8', marginTop: 12, textAlign: 'center', paddingHorizontal: 30 },
  pttWrap: { marginVertical: 50 },
  ptt: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#16a34a',
    borderWidth: 6,
    borderColor: '#16a34a55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pttOn: { backgroundColor: '#dc2626', borderColor: '#dc262655' },
  pttText: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  status: { color: '#94a3b8', fontSize: 14, marginTop: 10 },
});
