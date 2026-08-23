import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, SafeAreaView, StyleSheet } from 'react-native';

import HtmlHost, { type HtmlHostHandle } from '@/components/html-host';
import { usePttRecorder } from '@/hooks/use-ptt-recorder';
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
    const filename = `rabahdj_<span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mrow><mi>D</mi><mi>a</mi><mi>t</mi><mi>e</mi><mi mathvariant="normal">.</mi><mi>n</mi><mi>o</mi><mi>w</mi><mo stretchy="false">(</mo><mo stretchy="false">)</mo></mrow><mi mathvariant="normal">.</mi></mrow><annotation encoding="application/x-tex">{Date.now()}.</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mord mathnormal">a</span><span class="mord mathnormal">t</span><span class="mord mathnormal">e</span><span class="mord">.</span><span class="mord mathnormal">n</span><span class="mord mathnormal">o</span><span class="mord mathnormal" style="margin-right:0.0269em;">w</span><span class="mopen">(</span><span class="mclose">)</span></span><span class="mord">.</span></span></span></span>{ext}`;
    const fileUri = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: mime, dialogTitle: 'حفظ أو فتح الملف' });
    } else {
      Alert.alert('تم الحفظ', 'الملف محفوظ في: ' + fileUri);
    }
  } catch (error: unknown) {
    Alert.alert('خطأ بالتحميل', error instanceof Error ? error.message : String(error));
  }
}

/** قراءة الملف الصوتي الناتج وتحويله إلى base64 على كل المنصّات. */
async function readAudioAsBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('تعذر قراءة الملف الصوتي'));
      reader.onload = () => {
        const result = String(reader.result ?? '');
        resolve(result.slice(result.indexOf(',') + 1));
      };
      reader.readAsDataURL(blob);
    });
  }
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HtmlHostHandle>(null);

  const injectToPage = useCallback((code: string) => {
    hostRef.current?.injectJavaScript(code);
  }, []);

  const handleRecorded = useCallback(
    async (uri: string) => {
      const base64 = await readAudioAsBase64(uri);
      injectToPage(
        `window.onNativePttRecorded && window.onNativePttRecorded(${JSON.stringify(base64)});`
      );
    },
    [injectToPage]
  );

  const handleRecorderError = useCallback(
    (message: string) => {
      injectToPage(
        `window.onNativePttError && window.onNativePttError(${JSON.stringify(message)});`
      );
    },
    [injectToPage]
  );

  const { start: startPtt, stop: stopPtt } = usePttRecorder({
    onRecorded: handleRecorded,
    onError: handleRecorderError,
  });

  useEffect(() => {
    async function requestPerms() {
      if (Platform.OS === 'android') {
        try {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
        } catch (error) {
          console.log('permission error', error);
        }
      }
      setReady(true);
    }
    requestPerms();
  }, []);

  const handleMessage = useCallback(
    (data: string) => {
      try {
        const msg = JSON.parse(data) as { cmd?: string };
        if (msg.cmd === 'pttStart') void startPtt();
        if (msg.cmd === 'pttStop') void stopPtt();
      } catch (error) {
        console.log('onMessage parse error', error);
      }
    },
    [startPtt, stopPtt]
  );

  if (!ready) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <HtmlHost
        ref={hostRef}
        html={RABAHDJ_HTML}
        onMessage={handleMessage}
        onFileDownload={handleFileDownload}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
});
