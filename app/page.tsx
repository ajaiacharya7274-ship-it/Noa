"use client";

import { useEffect, useRef, useState } from "react";

type NoaState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "EXECUTING"
  | "COMPLETE";

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function Home() {
  const [noaState, setNoaState] = useState<NoaState>("IDLE");
  const [micOn, setMicOn] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [zoom, setZoom] = useState(1);
  const [dragged, setDragged] = useState(false);
  const [micPosition, setMicPosition] = useState({
    right: 28,
    bottom: 28,
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const grabRef = useRef({ x: 0, y: 0 });
  const draggedRef = useRef(false);
  const micRef = useRef<HTMLButtonElement | null>(null);

  const MIN_ZOOM = 0.55;
  const MAX_ZOOM = 2.4;

  /* ---------------------------------
     MIC / SPEECH RECOGNITION
  --------------------------------- */

  useEffect(() => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new Recognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setMicOn(true);
      setNoaState("LISTENING");
    };

    recognition.onresult = (event) => {
      let text = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        text += event.results[i][0].transcript;
      }

      const clean = text.trim();

      if (!clean) return;

      setTranscript(clean);

      if (event.results[event.results.length - 1].isFinal) {
        setNoaState("THINKING");

        setTimeout(() => {
          executeCommand(clean);
        }, 350);
      }
    };

    recognition.onerror = () => {
      setNoaState("IDLE");
    };

    recognition.onend = () => {
      /*
       * IMPORTANT:
       * Recognition ending does NOT turn the MIC visual state off.
       * User controls the green/blue state by pressing the mic.
       */
      if (!micOnRef.current) {
        setNoaState("IDLE");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, []);

  const micOnRef = useRef(false);

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  /* ---------------------------------
     STATE
  --------------------------------- */

  function changeState(next: NoaState) {
    setNoaState(next);
  }

  /* ---------------------------------
     SPEAK
  --------------------------------- */

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1;

    utterance.onstart = () => {
      changeState("SPEAKING");
    };

    utterance.onend = () => {
      changeState(micOnRef.current ? "LISTENING" : "IDLE");
    };

    window.speechSynthesis.speak(utterance);
  }

  /* ---------------------------------
     COMMAND ENGINE
  --------------------------------- */

  function executeCommand(input: string) {
    const text = input.trim().toLowerCase();

    if (!text) {
      changeState(micOnRef.current ? "LISTENING" : "IDLE");
      return;
    }

    // ZOOM IN
    if (
      text === "zoom in" ||
      text === "zoom closer" ||
      text === "make it bigger"
    ) {
      setZoom((current) =>
        Math.min(MAX_ZOOM, current + 0.15)
      );

      changeState("SPEAKING");
      speak("Zooming in.");
      return;
    }

    // ZOOM OUT
    if (
      text === "zoom out" ||
      text === "zoom away" ||
      text === "make it smaller"
    ) {
      setZoom((current) =>
        Math.max(MIN_ZOOM, current - 0.15)
      );

      changeState("SPEAKING");
      speak("Zooming out.");
      return;
    }

    // RESET ZOOM
    if (
      text === "reset zoom" ||
      text === "normal size" ||
      text === "reset orb"
    ) {
      setZoom(1);

      changeState("SPEAKING");
      speak("Zoom reset.");
      return;
    }

    // STATUS
    if (
      text === "status" ||
      text === "what is your state" ||
      text === "what state are you in"
    ) {
      changeState("SPEAKING");
      speak(`NOA is ${noaState.toLowerCase()}.`);
      return;
    }

    // OPEN URL
    const urlMatch = text.match(
      /^(?:open|go to|visit)\s+(https?:\/\/\S+|www\.\S+)$/
    );

    if (urlMatch) {
      let url = urlMatch[1];

      if (url.startsWith("www.")) {
        url = `https://${url}`;
      }

      changeState("EXECUTING");

      const newWindow = window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      setTimeout(() => {
        if (newWindow) {
          speak("Opening it.");
        } else {
          speak("The browser blocked the new tab.");
        }
      }, 300);

      return;
    }

    // UNKNOWN COMMAND
    changeState("SPEAKING");

    speak(
      `I heard: ${input}. This command is not connected to an executable action yet.`
    );
  }

  /* ---------------------------------
     MIC CLICK
  --------------------------------- */

  function toggleMic() {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }

    const recognition = recognitionRef.current;

    if (!micOn) {
      /*
       * VISUAL STATE CHANGES IMMEDIATELY.
       * This fixes the old delayed color problem.
       */
      setMicOn(true);
      micOnRef.current = true;
      setNoaState("LISTENING");

      if (recognition) {
        try {
          recognition.start();
        } catch {
          // Recognition may already be running.
        }
      }

      return;
    }

    // TURN MIC OFF
    setMicOn(false);
    micOnRef.current = false;
    setNoaState("IDLE");

    if (recognition) {
      try {
        recognition.stop();
      } catch {}
    }
  }

  /* ---------------------------------
     RESET MIC
  --------------------------------- */

  function resetMic() {
    const recognition = recognitionRef.current;

    setMicOn(false);
    micOnRef.current = false;
    setNoaState("IDLE");
    setTranscript("");

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (recognition) {
      try {
        recognition.stop();
      } catch {}

      try {
        recognition.abort();
      } catch {}
    }
  }

  /* ---------------------------------
     MIC DRAG
  --------------------------------- */

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (event.button !== 0) return;

    const element = micRef.current;

    if (!element) return;

    const rect = element.getBoundingClientRect();

    pointerIdRef.current = event.pointerId;
    draggingRef.current = true;
    draggedRef.current = false;

    grabRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    element.setPointerCapture(event.pointerId);

    event.preventDefault();
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!draggingRef.current) return;

    if (pointerIdRef.current !== event.pointerId) return;

    const element = micRef.current;

    if (!element) return;

    const width = element.offsetWidth;
    const height = element.offsetHeight;

    const x =
      event.clientX - grabRef.current.x;

    const y =
      event.clientY - grabRef.current.y;

    const left = Math.max(
      0,
      Math.min(window.innerWidth - width, x)
    );

    const top = Math.max(
      0,
      Math.min(window.innerHeight - height, y)
    );

    const right = window.innerWidth - left - width;
    const bottom = window.innerHeight - top - height;

    if (
      Math.abs(event.movementX) > 1 ||
      Math.abs(event.movementY) > 1
    ) {
      draggedRef.current = true;
      setDragged(true);
    }

    setMicPosition({
      right,
      bottom,
    });
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (pointerIdRef.current !== event.pointerId) return;

    draggingRef.current = false;

    const element = micRef.current;

    if (element?.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }

    pointerIdRef.current = null;

    if (draggedRef.current) {
      setTimeout(() => {
        setDragged(false);
      }, 150);
    }
  }

  /* ---------------------------------
     MOUSE WHEEL ZOOM
  --------------------------------- */

  function handleWheel(
    event: React.WheelEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    const direction = event.deltaY < 0 ? 1 : -1;

    setZoom((current) =>
      Math.max(
        MIN_ZOOM,
        Math.min(
          MAX_ZOOM,
          current + direction * 0.08
        )
      )
    );
  }

  /* ---------------------------------
     WAVEFORM
  --------------------------------- */

  const bars = [
    5, 8, 12, 18, 11, 23, 16, 29, 19,
    24, 14, 9, 6, 10, 16, 22, 15, 20,
    27, 17, 10, 14, 20, 25, 15, 9, 5
  ];

  const stateColor =
    noaState === "THINKING"
      ? "#a855f7"
      : noaState === "SPEAKING"
      ? "#38bdf8"
      : noaState === "EXECUTING"
      ? "#f59e0b"
      : noaState === "COMPLETE"
      ? "#35e887"
      : "#4fa3ff";

  return (
    <main className="noa-app">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #000;
          overflow: hidden;
        }

        body {
          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;
          color: #4fa3ff;
        }

        button {
          font-family: inherit;
        }

        .noa-app {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background:
            radial-gradient(
              circle at center,
              rgba(5, 20, 45, 0.18),
              #000 58%
            );
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: none;
        }

        /* -----------------------------
           TOP STATUS
        ----------------------------- */

        .topbar {
          position: fixed;
          top: 28px;
          left: 0;
          right: 0;
          z-index: 50;

          display: flex;
          justify-content: center;
          align-items: center;
          gap: 18px;
          pointer-events: none;
        }

        .voice-status {
          font-size: 12px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: ${micOn ? "#35e887" : "#65748a"};
          text-shadow:
            0 0 14px
            ${micOn
              ? "rgba(53,232,135,.45)"
              : "rgba(79,163,255,.25)"};
        }

        .reset-button {
          pointer-events: auto;
          border: 1px solid rgba(79,163,255,.35);
          background: rgba(3,8,18,.75);
          color: #7fb9ff;
          border-radius: 14px;
          padding: 10px 16px;
          font-size: 11px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: .2s ease;
        }

        .reset-button:hover {
          border-color: #4fa3ff;
          box-shadow:
            0 0 18px
            rgba(79,163,255,.22);
        }

        /* -----------------------------
           ORB
        ----------------------------- */

        .orb-wrapper {
          width: 300px;
          height: 300px;
          position: relative;
          transform-origin: center;
          transition: transform .18s ease-out;
          will-change: transform;
        }

        .orb-glow {
          position: absolute;
          inset: -70px;
          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              ${stateColor}55 0%,
              ${stateColor}18 42%,
              transparent 72%
            );

          filter: blur(20px);

          animation:
            orb-breathe
            ${noaState === "EXECUTING"
              ? "0.75s"
              : noaState === "THINKING"
              ? "1.4s"
              : "4.5s"}
            ease-in-out infinite;
        }

        @keyframes orb-breathe {
          0%,
          100% {
            opacity: .65;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        .orb-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .ring-one {
          transform-origin: 150px 150px;
          animation:
            rotate-one
            22s
            linear
            infinite;
        }

        .ring-two {
          transform-origin: 150px 150px;
          animation:
            rotate-two
            17s
            linear
            infinite;
        }

        .ring-three {
          transform-origin: 150px 150px;
          animation:
            rotate-three
            13s
            linear
            infinite;
        }

        @keyframes rotate-one {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotate-two {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes rotate-three {
          to {
            transform: rotate(-360deg);
          }
        }

        /* -----------------------------
           CENTER
        ----------------------------- */

        .center {
          position: absolute;
          inset: 0;
          z-index: 5;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          pointer-events: none;
        }

        .wave {
          height: 44px;
          width: 170px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 4px;
        }

        .wave-bar {
          display: block;
          width: 3px;
          border-radius: 8px;

          background: ${stateColor};

          box-shadow:
            0 0 9px
            ${stateColor}bb;

          animation:
            wave-animation
            ${noaState === "THINKING"
              ? ".42s"
              : noaState === "SPEAKING"
              ? ".25s"
              : ".8s"}
            ease-in-out infinite
            alternate;
        }

        @keyframes wave-animation {
          from {
            transform: scaleY(.25);
            opacity: .35;
          }

          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .state {
          margin-top: 16px;

          color: ${stateColor};

          font-size: 12px;
          letter-spacing: 5px;
          text-transform: uppercase;

          text-shadow:
            0 0 12px
            ${stateColor}aa;
        }

        /* -----------------------------
           MIC
        ----------------------------- */

        .mic {
          position: fixed;

          right: ${micPosition.right}px;
          bottom: ${micPosition.bottom}px;

          width: 76px;
          height: 76px;

          z-index: 100;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: grab;

          user-select: none;
          -webkit-user-select: none;

          touch-action: none;

          -webkit-tap-highlight-color: transparent;

          transition:
            border-color .18s ease,
            background .18s ease,
            box-shadow .18s ease,
            color .18s ease;

          ${
            micOn
              ? `
                border: 2px solid #35e887;
                color: #35e887;
                background: rgba(53,232,135,.10);
                box-shadow:
                  0 0 28px rgba(53,232,135,.45),
                  inset 0 0 16px rgba(53,232,135,.10);
              `
              : `
                border: 2px solid #4fa3ff;
                color: #4fa3ff;
                background: rgba(79,163,255,.08);
                box-shadow:
                  0 0 25px rgba(79,163,255,.28),
                  inset 0 0 12px rgba(79,163,255,.08);
              `
          }
        }

        .mic.dragging {
          cursor: grabbing;
        }

        .mic-icon {
          width: 32px;
          height: 32px;
          display: block;
          pointer-events: none;
        }

        .transcript {
          position: fixed;
          left: 50%;
          bottom: 32px;
          transform: translateX(-50%);

          max-width: min(80vw, 500px);

          color: #8aa1ba;
          font-size: 11px;
          letter-spacing: 1px;
          text-align: center;

          opacity: ${transcript ? 1 : 0};

          transition: opacity .2s ease;

          pointer-events: none;
        }

        @media (max-width: 600px) {
          .orb-wrapper {
            width: 280px;
            height: 280px;
          }

          .topbar {
            top: 22px;
          }

          .mic {
            width: 72px;
            height: 72px;
          }
        }

        @media (max-width: 380px) {
          .orb-wrapper {
            width: 245px;
            height: 245px;
          }
        }
      `}</style>

      {/* TOP */}
      <div className="topbar">
        <div className="voice-status">
          {micOn ? "VOICE READY" : "VOICE OFF"}
        </div>

        <button
          className="reset-button"
          onClick={resetMic}
          type="button"
        >
          RESET MIC
        </button>
      </div>

      {/* ORB */}
      <div
        className="orb-wrapper"
        style={{
          transform: `scale(${zoom})`,
        }}
        onWheel={handleWheel}
      >
        <div className="orb-glow" />

        <svg
          className="orb-svg"
          viewBox="0 0 300 300"
          aria-hidden="true"
        >
          <defs>
            <filter
              id="glow"
              x="-80%"
              y="-80%"
              width="260%"
              height="260%"
            >
              <feGaussianBlur
                stdDeviation="5"
                result="blur"
              />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="core">
              <stop
                offset="0"
                stopColor="#030914"
              />

              <stop
                offset="1"
                stopColor="#000"
              />
            </radialGr
