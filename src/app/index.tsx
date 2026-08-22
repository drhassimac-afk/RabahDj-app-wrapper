import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import {
  SafeAreaView,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { RABAHDJ_HTML } from '../htmlContent';
import NativeCallScreen from './NativeCallScreen';

export default function Index() {
  const [nativeCall, setNativeCall] = useState(false);
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

  if (!ready) {
    return <SafeAreaView style={styles.container} />;
  }

  if (nativeCall) return <NativeCallScreen onBack={() => setNativeCall(false)} />;

  return (
    <SafeAreaView style={styles.container}>
      <WebView onMessage={(e)=>{try{const msg=JSON.parse(e.nativeEvent.data||'{}');if(msg.type==='startNativeStream')setNativeCall(true);}catch{}}} 
        source={{
          html: RABAHDJ_HTML,
          baseUrl: 'https://appassets.androidplatform.net',
        }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"

        onPermissionRequest={(request: any) => {
          request.grant(request.resources);
        }}

        onFileDownload={async ({ nativeEvent }) => {
          const { downloadUrl } = nativeEvent;

          try {
            if (!downloadUrl) {
              Alert.alert('خطأ', 'تعذر الحصول على رابط الملف');
              return;
            }

            console.log('Download requested:', downloadUrl);

            const fileName =
              decodeURIComponent(downloadUrl.split('/').pop()?.split('?')[0] || 'download');

            const file = new File(Paths.cache, fileName);

            const downloadedFile = await File.downloadFileAsync(
              downloadUrl,
              file
            );

            console.log('File downloaded:', downloadedFile.uri);

            const canShare = await Sharing.isAvailableAsync();

            if (canShare) {
              await Sharing.shareAsync(downloadedFile.uri, {
                dialogTitle: 'حفظ أو مشاركة الملف',
              });
            } else {
              Alert.alert(
                'تم تحميل الملف',
                `تم حفظ الملف مؤقتًا باسم:\n${fileName}`
              );
            }
          } catch (error) {
            console.error('Download error:', error);

            Alert.alert(
              'فشل التحميل',
              'تعذر تحميل الملف. حاول مرة أخرى.'
            );
          }
        }}

        originWhitelist={['*']}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },

  webview: {
    flex: 1,
  },
});
