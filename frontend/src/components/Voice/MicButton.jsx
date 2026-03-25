import useSpeechToText from "../../hooks/useSpeechToText";
import { LuMic, LuMicOff } from "react-icons/lu";

/**
 * MicButton
 * Props:
 *  - onFinal: (text) => void   // where you append the transcript to your input
 *  - lang: "en-US" | "th-TH" | "my-MM" ...
 *  - className: optional styling
 */
export default function MicButton({ onFinal, lang = "en-US", className = "" }) {
  const stt = useSpeechToText({ lang, interim: true, continuous: false, onFinal });

  if (!stt.supported) {
    return (
      <button
        type="button"
        title="Speech recognition not supported in this browser"
        className={`opacity-50 cursor-not-allowed rounded-full p-2 border ${className}`}
      >
        <LuMicOff />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={stt.toggle}
        className={`rounded-full p-2 border inline-flex items-center justify-center transition
          ${stt.listening ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "hover:bg-gray-50 dark:hover:bg-white/10"}
          ${className}`}
        aria-pressed={stt.listening}
        aria-label={stt.listening ? "Stop voice input" : "Start voice input"}
      >
        {stt.listening ? <LuMic /> : <LuMicOff />}
      </button>

      {stt.listening && stt.interimTranscript ? (
        <div className="absolute -top-10 right-0 max-w-[240px] truncate text-[11px] bg-black text-white/90 px-2 py-1 rounded shadow">
          {stt.interimTranscript}
        </div>
      ) : null}
    </div>
  );
}
