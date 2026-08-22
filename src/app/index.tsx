import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { SafeAreaView, StyleSheet, PermissionsAndroid, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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

  if (!ready) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ html: RABAHDJ_HTML, baseUrl: 'https://appassets.androidplatform.net' }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        onPermissionRequest={(request) => {
          request.grant(request.resources);
        }}
        onFileDownload={({ nativeEvent }) => {
          handleFileDownload(nativeEvent.downloadUrl);
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
