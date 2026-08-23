import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';

/** أقل مدة تسجيل مقبولة، تمنع إنتاج ملف صوتي فارغ عند الضغط السريع جدًا. */
const MIN_RECORDING_MS = 350;

/** رسالة الخطأ الأصلية عندما تكون جلسة المسجّل مُهيّأة مسبقًا. */
const ALREADY_PREPARED_RE = /already\s+been\s+prepared|already\s+prepared/i;

export type PttPhase = 'idle' | 'preparing' | 'recording' | 'stopping';

export type PttRecorderOptions = {
  /** يُستدعى بعد إيقاف التسجيل بنجاح مع مسار الملف الناتج. */
  onRecorded: (uri: string) => void | Promise<void>;
  /** يُستدعى عند أي فشل، مع رسالة جاهزة للعرض للمستخدم. */
  onError: (message: string) => void;
  /** إشعار اختياري بتغيّر حالة المسجّل (لتحديث الواجهة). */
  onPhaseChange?: (phase: PttPhase) => void;
};

export type PttRecorderApi = {
  /** بدء التسجيل (آمن عند الاستدعاء المتكرر). */
  start: () => Promise<void>;
  /** إيقاف التسجيل (آمن عند الاستدعاء المتكرر أو بدون تسجيل جارٍ). */
  stop: () => Promise<void>;
  /** الحالة الحالية للمسجّل. */
  getPhase: () => PttPhase;
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const toMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  const text = String(error ?? '').trim();
  return text.length > 0 ? text : 'حدث خطأ غير معروف في المايك';
};

/**
 * يدير دورة حياة مسجّل الصوت لزر «اضغط وتحدث».
 *
 * المشكلة الأصلية: استدعاء `prepareToRecordAsync` على جلسة مُهيّأة مسبقًا يرفض الطلب
 * برسالة «AudioRecorder has already been prepared». الحل هنا يقوم على ثلاث طبقات:
 * 1. طابور تنفيذ متسلسل يضمن عدم تشغيل عمليتي بدء/إيقاف في نفس اللحظة.
 * 2. تحرير أي جلسة قائمة (`stop`) قبل كل `prepareToRecordAsync`.
 * 3. محاولة إنقاذ واحدة إذا ظهر الخطأ رغم ذلك: إيقاف ثم إعادة تهيئة.
 */
export function usePttRecorder(options: PttRecorderOptions): PttRecorderApi {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // نحفظ المعالجات في مراجع حتى لا تتغيّر هوية دوال البدء/الإيقاف مع كل رسم.
  const onRecordedRef = useRef(options.onRecorded);
  const onErrorRef = useRef(options.onError);
  const onPhaseChangeRef = useRef(options.onPhaseChange);

  onRecordedRef.current = options.onRecorded;
  onErrorRef.current = options.onError;
  onPhaseChangeRef.current = options.onPhaseChange;

  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const phaseRef = useRef<PttPhase>('idle');
  const preparedRef = useRef(false);
  const startedAtRef = useRef(0);
  const mountedRef = useRef(true);
  const permissionGrantedRef = useRef(false);

  /** تنفيذ العمليات واحدة تلو الأخرى: حماية من الضغط المتكرر السريع. */
  const runExclusive = useCallback((task: () => Promise<void>) => {
    const chained = queueRef.current.then(task, task);
    queueRef.current = chained.catch(() => undefined);
    return queueRef.current;
  }, []);

  const setPhase = useCallback((phase: PttPhase) => {
    phaseRef.current = phase;
    onPhaseChangeRef.current?.(phase);
  }, []);

  const setRecordingAudioMode = useCallback(async (allowsRecording: boolean) => {
    try {
      await setAudioModeAsync({ allowsRecording, playsInSilentMode: true });
    } catch (error) {
      console.log('ptt: تعذر ضبط وضع الصوت', error);
    }
  }, []);

  /** إيقاف/تحرير أي جلسة تسجيل قائمة بصمت. */
  const releaseSession = useCallback(async () => {
    const hasSession = preparedRef.current || recorder.isRecording;
    preparedRef.current = false;
    if (!hasSession) return;
    try {
      await recorder.stop();
    } catch (error) {
      console.log('ptt: تعذر تحرير الجلسة السابقة', error);
    }
  }, [recorder]);

  /** تهيئة جلسة جديدة بعد التأكد من تحرير الجلسة القديمة. */
  const prepareSession = useCallback(async () => {
    await releaseSession();
    try {
      await recorder.prepareToRecordAsync();
    } catch (error) {
      if (!ALREADY_PREPARED_RE.test(toMessage(error))) throw error;
      // جلسة قديمة ما زالت مفتوحة في الطبقة الأصلية: أوقفها ثم أعد التهيئة مرة واحدة.
      try {
        await recorder.stop();
      } catch (stopError) {
        console.log('ptt: تعذر إيقاف الجلسة العالقة', stopError);
      }
      await recorder.prepareToRecordAsync();
    }
    preparedRef.current = true;
  }, [recorder, releaseSession]);

  const start = useCallback(
    () =>
      runExclusive(async () => {
        if (!mountedRef.current) return;
        // تسجيل جارٍ أو قيد التهيئة: تجاهل الطلب المكرر بهدوء.
        if (phaseRef.current !== 'idle') return;

        setPhase('preparing');
        try {
          if (!permissionGrantedRef.current) {
            const permission = await AudioModule.requestRecordingPermissionsAsync();
            permissionGrantedRef.current = permission.granted;
            if (!permission.granted) {
              throw new Error('صلاحية المايك مرفوضة، فعّلها من إعدادات التطبيق');
            }
          }

          await setRecordingAudioMode(true);
          await prepareSession();

          if (!mountedRef.current) {
            await releaseSession();
            setPhase('idle');
            return;
          }

          recorder.record();
          startedAtRef.current = Date.now();
          setPhase('recording');
        } catch (error) {
          await releaseSession();
          await setRecordingAudioMode(false);
          setPhase('idle');
          onErrorRef.current(toMessage(error));
        }
      }),
    [prepareSession, recorder, releaseSession, runExclusive, setPhase, setRecordingAudioMode]
  );

  const stop = useCallback(
    () =>
      runExclusive(async () => {
        // لا يوجد تسجيل فعلي (إفلات مكرر أو إيقاف بعد فشل البدء): تجاهل بصمت.
        if (phaseRef.current !== 'recording') return;

        setPhase('stopping');
        try {
          const elapsed = Date.now() - startedAtRef.current;
          if (elapsed < MIN_RECORDING_MS) {
            await delay(MIN_RECORDING_MS - elapsed);
          }

          await recorder.stop();
          preparedRef.current = false;
          const uri = recorder.uri;
          setPhase('idle');
          await setRecordingAudioMode(false);

          if (!uri) throw new Error('لم يتم إنشاء ملف صوتي');
          if (mountedRef.current) {
            await onRecordedRef.current(uri);
          }
        } catch (error) {
          preparedRef.current = false;
          setPhase('idle');
          await setRecordingAudioMode(false);
          onErrorRef.current(toMessage(error));
        }
      }),
    [recorder, runExclusive, setPhase, setRecordingAudioMode]
  );

  // تنظيف عند مغادرة الشاشة: إيقاف التسجيل وتحرير الجلسة وإرجاع وضع الصوت.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      queueRef.current = queueRef.current
        .then(async () => {
          await releaseSession();
          await setRecordingAudioMode(false);
          phaseRef.current = 'idle';
        })
        .catch(() => undefined);
    };
  }, [releaseSession, setRecordingAudioMode]);

  const getPhase = useCallback(() => phaseRef.current, []);

  return { start, stop, getPhase };
}
