import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import type { HtmlHostHandle, HtmlHostProps } from './html-host';

/** جسر يحاكي `window.ReactNativeWebView` داخل iframe لمعاينة الويب. */
const BRIDGE_SCRIPT = `<script>
(function () {
  window.ReactNativeWebView = {
    postMessage: function (data) {
      parent.postMessage({ __htmlHost: 'message', data: String(data) }, '*');
    }
  };
  window.addEventListener('message', function (event) {
    var payload = event.data;
    if (payload && payload.__htmlHost === 'eval' && typeof payload.code === 'string') {
      try {
        // eslint-disable-next-line no-eval
        eval(payload.code);
      } catch (error) {
        console.log('html-host eval error', error);
      }
    }
  });
})();
</script>`;

const withBridge = (html: string) =>
  html.includes('<head>')
    ? html.replace('<head>', `<head>${BRIDGE_SCRIPT}`)
    : `${BRIDGE_SCRIPT}${html}`;

/** مستضيف الصفحة على الويب (المعاينة) باستخدام iframe. */
const HtmlHostWeb = forwardRef<HtmlHostHandle, HtmlHostProps>(({ html, onMessage }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useImperativeHandle(ref, () => ({
    injectJavaScript: (code: string) => {
      iframeRef.current?.contentWindow?.postMessage({ __htmlHost: 'eval', code }, '*');
    },
  }));

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const payload = event.data as { __htmlHost?: string; data?: string } | null;
      if (payload && payload.__htmlHost === 'message' && typeof payload.data === 'string') {
        onMessageRef.current(payload.data);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="app-content"
      srcDoc={withBridge(html)}
      allow="microphone; camera; autoplay"
      style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
    />
  );
});

HtmlHostWeb.displayName = 'HtmlHost';

export default HtmlHostWeb;
