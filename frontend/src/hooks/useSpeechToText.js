import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Web Speech API wrapper.
 * Options:
 *  - lang: BCP-47 tag, e.g., "en-US", "th-TH", "my-MM"
 *  - interim: show interim (live) words while talking
 *  - continuous: keep session open after a final result (usually false)
 *  - onFinal: callback(string) when a final result is produced
 */
export default function useSpeechToText({
  lang = "en-US",
  interim = true,
  continuous = false,
  onFinal,
} = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const r = new SR();
    r.lang = lang;
    r.interimResults = interim;
    r.continuous = continuous;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let interimStr = "";
      let finalStr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalStr += res[0].transcript;
        else interimStr += res[0].transcript;
      }
      setInterimTranscript(interimStr);
      if (finalStr && onFinal) onFinal(finalStr.trim());
    };

    r.onerror = (e) => {
      setError(e.error || "recognition_error");
      setListening(false);
    };
    r.onend = () => setListening(false);

    recRef.current = r;

    return () => {
      try { r.stop(); } catch {}
      recRef.current = null;
    };
  }, [lang, interim, continuous, onFinal]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setError(null);
    setInterimTranscript("");
    try {
      recRef.current.start(); // must be called from a user gesture
      setListening(true);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
  }, []);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  return { supported, listening, interimTranscript, error, start, stop, toggle };
}
