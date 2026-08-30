import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import HtmlHost, { type HtmlHostHandle } from '@/components/html-host';
import { usePttRecorder } from '@/hooks/use-ptt-recorder';
import { RABAHDJ_HTML } from '../htmlContent';
import WalkieNative from '@/components/walkie-native';
import LiveNative from '@/components/live-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

async function setupNotifications() {
  try {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('rabahdj', {
      name: 'RabahDj',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch (error) {
    console.log('notification setup error', error);
  }
}

async function showRabahNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.log('notification error', error);
  }
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const [showWalkie, setShowWalkie] = useState(false);
  const [isPttRecording, setIsPttRecording] = useState(false);
  const [lastSpeaker, setLastSpeaker] = useState<string | null>(null);

  const [showLive, setShowLive] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

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

  const handleWalkiePressIn = useCallback(() => {
    setIsPttRecording(true);
    void startPtt();
  }, [startPtt]);

  const handleWalkiePressOut = useCallback(() => {
    setIsPttRecording(false);
    void stopPtt();
  }, [stopPtt]);

  const openLive = useCallback(() => {
    setShowLive(true);
    injectToPage(`go('live'); void 0;`);
  }, [injectToPage]);

  const closeLive = useCallback(() => {
    injectToPage(`stopLive(); go('home'); void 0;`);
    setShowLive(false);
    setIsLive(false);
    setIsMicMuted(false);
  }, [injectToPage]);

  const handleToggleLive = useCallback(() => {
    injectToPage(`toggleLive(); void 0;`);
  }, [injectToPage]);

  const handleToggleMic = useCallback(() => {
    injectToPage(`toggleMic(); void 0;`);
  }, [injectToPage]);

  const handleSwitchCamera = useCallback(() => {
    injectToPage(`switchCamera(); void 0;`);
  }, [injectToPage]);

  useEffect(() => {
    async function requestPerms() {
      if (Platform.OS === 'android') {
        try {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);

          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            console.log('Notification permission not granted');
          }

          await Notifications.setNotificationChannelAsync('default', {
            name: 'RabahDj',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
          });
        } catch (error) {
          console.log('permission error', error);
        }
      }

      setReady(true);
    }

    requestPerms();
  }, []);

  const showNativeNotification = useCallback(
    (title: string, body: string) => {
      void Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: null,
      });
    },
    []
  );

  const handleMessage = useCallback(
    (data: string) => {
      try {
        const msg = JSON.parse(data) as {
          cmd?: string;
          title?: string;
          body?: string;
          name?: string;
          mine?: boolean;
          active?: boolean;
          muted?: boolean;
        };

        if (msg.cmd === 'pttStart') void startPtt();
        if (msg.cmd === 'pttStop') void stopPtt();

        if (msg.cmd === 'walkieLastSpeaker' && msg.name) {
          setLastSpeaker(msg.mine ? 'أنت' : msg.name);
        }

        if (msg.cmd === 'liveStatus' && typeof msg.active === 'boolean') {
          setIsLive(msg.active);
        }

        if (msg.cmd === 'micStatus' && typeof msg.muted === 'boolean') {
          setIsMicMuted(msg.muted);
        }

        if (msg.cmd === 'nativeNotification' && msg.title && msg.body) {
          void Notifications.scheduleNotificationAsync({
            content: {
              title: msg.title,
              body: msg.body,
              sound: 'default',
            },
            trigger: null,
          });
        }
      } catch (error) {
        console.log('onMessage parse error', error);
      }
    },
    [startPtt, stopPtt]
  );

  if (!ready) return <SafeAreaView style={styles.container} />;

  const isOverlayActive = showWalkie || showLive;

  return (
    <SafeAreaView style={styles.container}>
      <HtmlHost
        ref={hostRef}
        html={RABAHDJ_HTML}
        onMessage={handleMessage}
        onFileDownload={handleFileDownload}
        style={showWalkie ? styles.hidden : styles.flexFull}
      />
      {showWalkie && (
        <WalkieNative
          isRecording={isPttRecording}
          lastSpeaker={lastSpeaker}
          onPressIn={handleWalkiePressIn}
          onPressOut={handleWalkiePressOut}
          onBack={() => setShowWalkie(false)}
        />
      )}
      {showLive && (
        <LiveNative
          isLive={isLive}
          isMicMuted={isMicMuted}
          onToggleLive={handleToggleLive}
          onToggleMic={handleToggleMic}
          onSwitchCamera={handleSwitchCamera}
          onBack={closeLive}
        />
      )}
      {!isOverlayActive && (
        <>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 10, backgroundColor: '#16a34a', padding: 10, borderRadius: 8, elevation: 999 }}
            onPress={() => setShowWalkie(true)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>🎙️ توكي-ووكي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ position: 'absolute', top: 95, right: 10, backgroundColor: '#dc2626', padding: 10, borderRadius: 8, elevation: 999 }}
            onPress={openLive}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>📡 بث مباشر</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  flexFull: { flex: 1 },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
