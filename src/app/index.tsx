import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { SafeAreaView, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import { RABAHDJ_HTML } from '../htmlContent';

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
        onPermissionRequest={(request: any) => {
          request.grant(request.resources);
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
