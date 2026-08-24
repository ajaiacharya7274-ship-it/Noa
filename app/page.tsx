"use client";

import React, { useEffect, useRef, useState } from "react";

type MicState = "idle" | "listening" | "processing" | "speaking";

export default function Home() {
  const [state, setState] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [micPosition, setMicPosition] = useState({ x: 0, y: 0 });

  const recognitionRef = useRef<any>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      : null;

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: any) => {
      let text = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }

      setTranscript(text);
    };

    recognition.onerror = () => {
      setState("idle");
    };

    recognition.onend = () => {
      setState((current) =>
        current === "listening" ? "processing" : current
      );

      setTimeout(() => {
        setState("idle");
      }, 900);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [SpeechRecognition]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setState("listening");

      setTimeout(() => {
        setState("idle");
      }, 1500);

      return;
    }

    setTranscript("");

    try {
      recognitionRef.current.start();
    } catch {
      try {
        recognitionRef.current.stop();
      } catch {}

      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch {}
      }, 200);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) {
      setState("processing");

      setTimeout(() => {
        setState("idle");
      }, 700);

      return;
    }

    try {
      recognitionRef.current.stop();
    } catch {}

    setState("processing");
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    draggingRef.current = true;

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    positionStartRef.current = {
      x: micPosition.x,
      y: micPosition.y,
    };

    startListening();
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (!draggingRef.current) return;

    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;

    setMicPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    draggingRef.current = false;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}

    stopListening();
  };

  const resetPosition = () => {
    setMicPosition({ x: 0, y: 0 });
  };

  const stateText = {
    idle: "IDLE",
    listening: "LISTENING",
    processing: "THINKING",
    speaking: "SPEAKING",
  }[state];

  const stateColor = {
    idle: "#1683ff",
    listening: "#00e5ff",
    processing: "#a855f7",
    speaking: "#22c55e",
  }[state];

  return (
    <main className="noaPage">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          background: #000;
        }

        body {
          overflow: hidden;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button {
          font: inherit;
        }

        .noaPage {
          position: relative;
          width: 100vw;
          height: 100vh;
          min-height: 100svh;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(0, 67, 130, 0.16),
              transparent 34%
            ),
            #000;
          color: white;
          user-select: none;
          touch-action: none;
        }

        .backgroundGlow {
          position: absolute;
          width: 75vw;
          height: 75vw;
          max-width: 700px;
          max-height: 700px;
          left: 50%;
          top: 46%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: rgba(0, 92, 255, 0.06);
          filter: blur(80px);
          pointer-events: none;
        }

        .orbArea {
          position: absolute;
          left: 50%;
          top: 46%;
          width: min(78vw, 620px);
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
        }

        .orb {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          transition:
            filter 0.35s ease,
            transform 0.35s ease;
        }

        .orb.listening {
          transform: scale(1.035);
        }

        .orb.processing {
          transform: scale(1.02);
        }

        .orb.speaking {
          transform: scale(1.04);
        }

        .outerRing {
          position: absolute;
          inset: 3%;
          border-radius: 50%;
          border: 2px solid ${stateColor};
          box-shadow:
            0 0 12px ${stateColor},
            inset 0 0 20px rgba(0, 90, 255, 0.08);
          transition:
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .ringOne {
          animation: rotateRing 20s linear infinite;
        }

        .ringTwo {
          inset: 10%;
          border: 1px solid rgba(80, 160, 255, 0.18);
          animation: rotateRingReverse 14s linear infinite;
        }

        .ringThree {
          inset: 18%;
          border: 1px solid rgba(0, 120, 255, 0.1);
        }

        .dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${stateColor};
          box-shadow: 0 0 12px ${stateColor};
          transition:
            background 0.3s ease,
            box-shadow 0.3s ease;
        }

        .dot:nth-child(1) {
          left: 50%;
          top: 3%;
          transform: translateX(-50%);
        }

        .dot:nth-child(2) {
          right: 9%;
          top: 25%;
        }

        .dot:nth-child(3) {
          right: 3%;
          top: 50%;
          transform: translateY(-50%);
        }

        .dot:nth-child(4) {
          right: 9%;
          bottom: 25%;
        }

        .dot:nth-child(5) {
          left: 50%;
          bottom: 3%;
          transform: translateX(-50%);
        }

        .dot:nth-child(6) {
          left: 9%;
          bottom: 25%;
        }

        .dot:nth-child(7) {
          left: 3%;
          top: 50%;
          transform: translateY(-50%);
        }

        .dot:nth-child(8) {
          left: 9%;
          top: 25%;
        }

        .core {
          position: absolute;
          inset: 25%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(3, 22, 45, 0.95),
              rgba(0, 5, 14, 0.95) 65%,
              rgba(0, 0, 0, 0.8)
            );
          box-shadow:
            0 0 50px rgba(0, 92, 255, 0.12),
            inset 0 0 40px rgba(0, 110, 255, 0.08);
        }

        .waveform {
          height: 90px;
          width: 62%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .bar {
          width: 5px;
          min-height: 8px;
          height: 18px;
          border-radius: 20px;
          background: ${stateColor};
          box-shadow: 0 0 12px ${stateColor};
          transition:
            background 0.3s ease,
            box-shadow 0.3s ease;
          animation: wave 1.2s ease-in-out infinite;
          animation-play-state: ${state === "idle" ? "paused" : "running"};
        }

        .bar:nth-child(1) {
          animation-delay: -0.1s;
        }

        .bar:nth-child(2) {
          animation-delay: -0.25s;
        }

        .bar:nth-child(3) {
          animation-delay: -0.4s;
        }

        .bar:nth-child(4) {
          animation-delay: -0.55s;
        }

        .bar:nth-child(5) {
          animation-delay: -0.7s;
        }

        .bar:nth-child(6) {
          animation-delay: -0.85s;
        }

        .bar:nth-child(7) {
          animation-delay: -1s;
        }

        .bar:nth-child(8) {
          animation-delay: -0.65s;
        }

        .bar:nth-child(9) {
          animation-delay: -0.35s;
        }

        .bar:nth-child(10) {
          animation-delay: -0.15s;
        }

        .stateText {
          margin-top: -3px;
          color: ${stateColor};
          font-size: clamp(14px, 3vw, 20px);
          letter-spacing: 8px;
          font-weight: 500;
          text-shadow: 0 0 15px ${stateColor};
          transition:
            color 0.3s ease,
            text-shadow 0.3s ease;
        }

        .transcript {
          position: absolute;
          left: 50%;
          bottom: 13%;
          transform: translateX(-50%);
          width: min(85vw, 600px);
          min-height: 30px;
          text-align: center;
          color: rgba(190, 215, 255, 0.8);
          font-size: 14px;
          line-height: 1.5;
          padding: 0 12px;
          pointer-events: none;
        }

        .micButton {
          position: absolute;
          left: 50%;
          bottom: 7%;
          width: 116px;
          height: 116px;
          transform: translate(calc(-50% + ${micPosition.x}px), ${micPosition.y}px);
          border-radius: 50%;
          border: 3px solid ${stateColor};
          background: rgba(0, 8, 20, 0.94);
          color: ${stateColor};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          outline: none;
          box-shadow:
            0 0 12px ${stateColor},
            0 0 35px rgba(0, 90, 255, 0.25),
            inset 0 0 20px rgba(0, 100, 255, 0.08);
          transition:
            border-color 0.25s ease,
            color 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.1s linear;
          z-index: 20;
        }

        .micButton:active {
          cursor: grabbing;
        }

        .micButton.listening {
          box-shadow:
            0 0 18px ${stateColor},
            0 0 55px ${stateColor},
            inset 0 0 30px rgba(0, 200, 255, 0.15);
        }

        .micButton::before {
          content: "";
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          border: 1px solid ${stateColor};
          opacity: 0.35;
          animation: pulse 1.6s ease-out infinite;
        }

        .micButton::after {
          content: "";
          position: absolute;
          inset: -25px;
          border-radius: 50%;
          border: 1px solid ${stateColor};
          opacity: 0.12;
          animation: pulse 1.6s ease-out infinite 0.5s;
        }

        .micIcon {
          position: relative;
          z-index: 2;
          width: 38px;
          height: 48px;
        }

        .micBody {
          position: absolute;
          left: 50%;
          top: 0;
          width: 17px;
          height: 30px;
          transform: translateX(-50%);
          border: 3px solid currentColor;
          border-radius: 12px;
        }

        .micArc {
          position: absolute;
          left: 50%;
          top: 17px;
          width: 38px;
          height: 30px;
          transform: translateX(-50%);
          border: 3px solid currentColor;
          border-top: 0;
          border-radius: 0 0 22px 22px;
        }

        .micStem {
          position: absolute;
          left: 50%;
          top: 43px;
          width: 3px;
          height: 7px;
          transform: translateX(-50%);
          background: currentColor;
          border-radius: 3px;
        }

        .micBase {
          position: absolute;
          left: 50%;
          bottom: -1px;
          width: 24px;
          height: 3px;
          transform: translateX(-50%);
          background: currentColor;
          border-radius: 3px;
        }

        .resetButton {
          position: absolute;
          top: 22px;
          right: 22px;
          z-index: 30;
          padding: 8px 12px;
          border: 1px solid rgba(80, 140, 220, 0.3);
          border-radius: 10px;
          background: rgba(0, 20, 40, 0.5);
          color: rgba(180, 210, 255, 0.65);
          font-size: 11px;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .browserWarning {
          position: absolute;
          left: 50%;
          top: 22px;
          transform: translateX(-50%);
          color: rgba(150, 180, 220, 0.55);
          font-size: 10px;
          letter-spacing: 1px;
          text-align: center;
          pointer-events: none;
        }

        @keyframes rotateRing {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotateRingReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes wave {
          0%,
          100% {
            height: 12px;
          }

          50% {
            height: 55px;
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.35;
          }

          70% {
            transform: scale(1.25);
            opacity: 0;
          }

          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        @media (max-width: 600px) {
          .orbArea {
            width: 86vw;
            top: 43%;
          }

          .micButton {
            width: 92px;
            height: 92px;
            bottom: 8%;
          }

          .micIcon {
            transform: scale(0.82);
          }

          .transcript {
            bottom: 20%;
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ringOne,
          .ringTwo,
          .bar,
          .micButton::before,
          .micButton::after {
            animation: none !important;
          }
        }
      `}</style>

      <div className="backgroundGlow" />

      <button className="resetButton" onClick={resetPosition}>
        RESET MIC
      </button>

      <div className="browserWarning">
        {SpeechRecognition ? "VOICE READY" : "VOICE API UNAVAILABLE"}
      </div>

      <section className="orbArea">
        <div className={`orb ${state}`}>
          <div className="outerRing ringOne" />
          <div className="outerRing ringTwo" />
          <div className="outerRing ringThree" />

          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />

          <div className="core">
            <div className="waveform">
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </div>

            <div className="stateText">{stateText}</div>
          </div>
        </div>
      </section>

      {transcript && (
        <div className="transcript">
          {transcript}
        </div>
      )}

      <button
        className={`micButton ${state}`}
        aria-label="NOA microphone"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className="micIcon">
          <span className="micBody" />
          <span className="micArc" />
          <span className="micStem" />
          <span className="micBase" />
        </span>
      </button>
    </main>
  );
           }
