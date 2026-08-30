import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export type HtmlHostHandle = {
  injectJavaScript: (code: string) => void;
};

export type HtmlHostProps = {
  html: string;
  onMessage: (data: string) => void;
  onFileDownload?: (downloadUrl: string) => void;
  style?: StyleProp<ViewStyle>;
};

const HtmlHost = forwardRef<HtmlHostHandle, HtmlHostProps>(
  ({ html, onMessage, onFileDownload, style }, ref) => {
    const webviewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      injectJavaScript: (code: string) => {
        webviewRef.current?.injectJavaScript(`${code} true;`);
      },
    }));

    return (
      <WebView
        ref={webviewRef}
        source={{
          html,
          baseUrl: 'https://appassets.androidplatform.net',
        }}
        style={styles.webview, style]}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        originWhitelist={['*']}
        injectedJavaScript={`
          true;
        `}
        // @ts-expect-error مطلوب لأندرويد وقت التشغيل
        onPermissionRequest={(request: {
          grant: (resources: string[]) => void;
          resources: string[];
        }) => {
          request.grant(request.resources);
        }}
        onFileDownload={({ nativeEvent }) => {
          onFileDownload?.(nativeEvent.downloadUrl);
        }}
        onMessage={({ nativeEvent }) => {
          onMessage(nativeEvent.data);
        }}
      />
    );
  }
);

HtmlHost.displayName = 'HtmlHost';

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
});

export default HtmlHost;
