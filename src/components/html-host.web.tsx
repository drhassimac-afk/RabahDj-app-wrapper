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
  html.includes('<head>') ? html.replace('<head>', `<head><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mrow><mi>B</mi><mi>R</mi><mi>I</mi><mi>D</mi><mi>G</mi><msub><mi>E</mi><mi>S</mi></msub><mi>C</mi><mi>R</mi><mi>I</mi><mi>P</mi><mi>T</mi></mrow><mi mathvariant="normal">‘</mi><mo stretchy="false">)</mo><mo>:</mo><mi mathvariant="normal">‘</mi></mrow><annotation encoding="application/x-tex">{BRIDGE_SCRIPT}`) : `</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mord mathnormal">G</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0576em;">E</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.0576em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0576em;">S</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span><span class="mord">‘</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">:</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.6944em;"></span><span class="mord">‘</span></span></span></span>{BRIDGE_SCRIPT}${html}`;

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
