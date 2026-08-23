import React, { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { SafeAreaView, StyleSheet, PermissionsAndroid, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { RABAHDJ_HTML } from '../htmlContent';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
};

async function handleFileDownload(downloadUrl: string) {
  try {
    const match = downloadUrl.match(/^data:([^;]+);base64,(.*)$/s);
    if (!match) {
      Alert.alert('تعذر التحميل', 'صيغة الملف غير مدعومة');
      return;
    }
    const mime = match[1];
    const base64 = match[2];
    const ext = MIME_EXT[mime] || (mime.split('/')[1] || 'bin').replace(/[^a-zA-Z0-9]/g, '');
    const filename = `rabahdj_${Date.now()}.${ext}`;
    const fileUri = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: mime, dialogTitle: 'حفظ أو فتح الملف' });
    } else {
      Alert.alert('تم الحفظ', 'الملف محفوظ في: ' + fileUri);
    }
  } catch (e: any) {
    Alert.alert('خطأ بالتحميل', String(e?.message || e));
  }
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const webviewRef = useRef<WebView>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const pttStartingRef = useRef(false);
  const pttRecordingRef = useRef(false);
  const pttStopRequestedRef = useRef(false);

  useEffect(() => {
    async function requestPerms() {
      if (Platform.OS === 'android') {
        try {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
        } catch (e) {
          console.log('permission error', e);
        }
      }
      setReady(true);
    }
    requestPerms();
  }, []);

  async function startNativePtt() {
    if (pttStartingRef.current || pttRecordingRef.current) return; // منع بدء تسجيل ثانٍ
    pttStartingRef.current = true;
    pttStopRequestedRef.current = false;
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        throw new Error('صلاحية المايك مرفوضة');
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();

      if (pttStopRequestedRef.current) {
        // المستخدم رفع إصبعه أثناء التحضير — لا تبدأ تسجيل جديد
        pttStartingRef.current = false;
        pttStopRequestedRef.current = false;
        return;
      }

      audioRecorder.record();
      pttRecordingRef.current = true;
      pttStartingRef.current = false;

      if (pttStopRequestedRef.current) {
        await stopNativePtt();
      }
    } catch (e: any) {
      pttStartingRef.current = false;
      pttRecordingRef.current = false;
      webviewRef.current?.injectJavaScript(
        `window.onNativePttError && window.onNativePttError(${JSON.stringify(String(e?.message || e))}); true;`
      );
    }
  }

  async function stopNativePtt() {
    if (pttStartingRef.current) {
      // التسجيل لسا بيتحضّر — نأجل الإيقاف لحد ما يبدأ فعليًا
      pttStopRequestedRef.current = true;
      return;
    }
    if (!pttRecordingRef.current) return; // ما فيش تسجيل شغال أصلاً
    pttRecordingRef.current = false;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) return;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      webviewRef.current?.injectJavaScript(
        `window.onNativePttRecorded && window.onNativePttRecorded(${JSON.stringify(base64)}); true;`
      );
    } catch (e: any) {
      webviewRef.current?.injectJavaScript(
        `window.onNativePttError && window.onNativePttError(${JSON.stringify(String(e?.message || e))}); true;`
      );
    } finally {
      pttStopRequestedRef.current = false;
    }
  }

  if (!ready) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html: RABAHDJ_HTML, baseUrl: 'https://appassets.androidplatform.net' }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        // @ts-ignore — onPermissionRequest n'est pas dans les types officiels de cette version
        // de react-native-webview, mais reste nécessaire au runtime pour la permission caméra/micro
        onPermissionRequest={(request: any) => {
          request.grant(request.resources);
        }}
        onFileDownload={({ nativeEvent }) => {
          handleFileDownload(nativeEvent.downloadUrl);
        }}
        onMessage={({ nativeEvent }) => {
          try {
            const msg = JSON.parse(nativeEvent.data);
            if (msg.cmd === 'pttStart') startNativePtt();
            if (msg.cmd === 'pttStop') stopNativePtt();
          } catch (e) {
            console.log('onMessage parse error', e);
          }
        }}
        originWhitelist={['*']}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  webview: { flex: 1 },
});
