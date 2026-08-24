"use client";

import { useEffect, useRef, useState } from "react";

type State = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";

export default function Home() {
  const [state, setState] = useState<State>("IDLE");
  const [micOn, setMicOn] = useState(false);

  const [micPosition, setMicPosition] = useState({
    right: 28,
    bottom: 105,
  });

  const [zoom, setZoom] = useState(1);

  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);

  const draggingRef = useRef(false);
  const draggedRef = useRef(false);

  const pointerIdRef = useRef<number | null>(null);
  const grabXRef = useRef(0);
  const grabYRef = useRef(0);

  const micRef = useRef<HTMLButtonElement | null>(null);

  /* --------------------------------------------------
     STATE COLORS
  -------------------------------------------------- */

  const color =
    state === "LISTENING"
      ? "#35e887"
      : state === "THINKING"
      ? "#a855f7"
      : state === "SPEAKING"
      ? "#38bdf8"
      : "#4fa3ff";

  /* --------------------------------------------------
     BROWSER-ONLY SETUP
  -------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      listeningRef.current = true;
      setMicOn(true);
      setState("LISTENING");
    };

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      if (transcript.trim()) {
        setState("THINKING");

        if (
          event.results[event.results.length - 1]
            ?.isFinal
        ) {
          handleCommand(transcript.trim());
        }
      }
    };

    recognition.onerror = () => {
      listeningRef.current = false;
      setMicOn(false);
      setState("IDLE");
    };

    recognition.onend = () => {
      listeningRef.current = false;

      if (!micOn) {
        setState("IDLE");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, [micOn]);

  /* --------------------------------------------------
     SPEAK
  -------------------------------------------------- */

  function speak(text: string) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setState("IDLE");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 1.02;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setState("SPEAKING");
    };

    utterance.onend = () => {
      setState("IDLE");
    };

    window.speechSynthesis.speak(utterance);
  }

  /* --------------------------------------------------
     COMMANDS
  -------------------------------------------------- */

  function handleCommand(command: string) {
    const text = command
      .toLowerCase()
      .trim();

    if (
      text === "hello" ||
      text.includes("hello noa")
    ) {
      speak("Hello. I am NOA.");
      return;
    }

    if (
      text.includes("zoom in") ||
      text.includes("make it bigger")
    ) {
      setZoom((value) =>
        Math.min(2.4, value + 0.15)
      );

      speak("Zooming in.");
      return;
    }

    if (
      text.includes("zoom out") ||
      text.includes("make it smaller")
    ) {
      setZoom((value) =>
        Math.max(0.55, value - 0.15)
      );

      speak("Zooming out.");
      return;
    }

    if (
      text.includes("reset zoom") ||
      text.includes("normal size")
    ) {
      setZoom(1);
      speak("Zoom reset.");
      return;
    }

    if (
      text === "status" ||
      text.includes("what is your state")
    ) {
      speak(
        `NOA is currently ${state.toLowerCase()}.`
      );
      return;
    }

    speak(`I heard you say ${command}.`);
  }

  /* --------------------------------------------------
     MIC TOGGLE
  -------------------------------------------------- */

  function toggleMic() {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }

    const recognition =
      recognitionRef.current;

    if (!micOn) {
      setMicOn(true);

      if (recognition) {
        try {
          recognition.start();
        } catch {
          setState("LISTENING");
        }
      } else {
        setState("LISTENING");
      }

      return;
    }

    setMicOn(false);
    listeningRef.current = false;
    setState("IDLE");

    if (recognition) {
      try {
        recognition.stop();
      } catch {}
    }
  }

  /* --------------------------------------------------
     RESET MIC
  -------------------------------------------------- */

  function resetMic() {
    setMicOn(false);
    listeningRef.current = false;
    setState("IDLE");

    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}

      try {
        recognitionRef.current.abort();
      } catch {}
    }
  }

  /* --------------------------------------------------
     MIC DRAG START
  -------------------------------------------------- */

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    const mic = micRef.current;

    if (!mic) return;

    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    const rect =
      mic.getBoundingClientRect();

    pointerIdRef.current =
      event.pointerId;

    grabXRef.current =
      event.clientX - rect.left;

    grabYRef.current =
      event.clientY - rect.top;

    draggingRef.current = true;
    draggedRef.current = false;

    try {
      mic.setPointerCapture(
        event.pointerId
      );
    } catch {}

    event.preventDefault();
  }

  /* --------------------------------------------------
     MIC DRAG MOVE
  -------------------------------------------------- */

  function handlePointerMove(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (
      !draggingRef.current ||
      pointerIdRef.current !==
        event.pointerId
    ) {
      return;
    }

    const mic = micRef.current;

    if (!mic) return;

    const rect =
      mic.getBoundingClientRect();

    const x =
      event.clientX -
      grabXRef.current;

    const y =
      event.clientY -
      grabYRef.current;

    if (
      Math.abs(
        event.clientX -
          (rect.left + grabXRef.current)
      ) > 3 ||
      Math.abs(
        event.clientY -
          (rect.top + grabYRef.current)
      ) > 3
    ) {
      draggedRef.current = true;
    }

    const maxX =
      window.innerWidth - rect.width;

    const maxY =
      window.innerHeight - rect.height;

    const newX = Math.max(
      0,
      Math.min(maxX, x)
    );

    const newY = Math.max(
      0,
      Math.min(maxY, y)
    );

    setMicPosition({
      right:
        window.innerWidth -
        newX -
        rect.width,

      bottom:
        window.innerHeight -
        newY -
        rect.height,
    });
  }

  /* --------------------------------------------------
     MIC DRAG END
  -------------------------------------------------- */

  function handlePointerUp(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return;
    }

    draggingRef.current = false;
    pointerIdRef.current = null;

    const mic = micRef.current;

    if (mic) {
      try {
        mic.releasePointerCapture(
          event.pointerId
        );
      } catch {}
    }

    if (draggedRef.current) {
      setTimeout(() => {
        draggedRef.current = false;
      }, 100);
    }
  }

  /* --------------------------------------------------
     WAVEFORM
  -------------------------------------------------- */

  const bars = [
    5, 8, 12, 18, 11,
    23, 16, 29, 19,
    24, 14, 9, 6,
    10, 16, 22, 15,
    20, 27, 17, 10,
    14, 20, 25, 15,
    9, 5,
  ];

  /* --------------------------------------------------
     RENDER
  -------------------------------------------------- */

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#000",
        color,
        touchAction: "none",
      }}
    >
      {/* TOP */}

      <div
        style={{
          position: "fixed",
          top: 24,
          left: 0,
          right: 0,
          zIndex: 30,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: 3,
            color,
            textShadow:
              `0 0 10px ${color}`,
          }}
        >
          {micOn
            ? "VOICE READY"
            : "VOICE OFF"}
        </span>

        <button
          type="button"
          onClick={resetMic}
          style={{
            height: 38,
            padding: "0 16px",
            borderRadius: 12,
            border:
              "1px solid rgba(79,163,255,.45)",
            background:
              "rgba(3,8,18,.75)",
            color: "#8fc8ff",
            letterSpacing: 1,
            fontSize: 10,
          }}
        >
          RESET MIC
        </button>
      </div>

      {/* ORB */}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width:
            "clamp(250px, 70vw, 280px)",
          height:
            "clamp(250px, 70vw, 280px)",
          transform:
            `translate(-50%, -50%) scale(${zoom})`,
          transformOrigin: "center",
          willChange: "transform",
        }}
      >
        {/* GLOW */}

        <div
          style={{
            position: "absolute",
            inset: -55,
            borderRadius: "50%",
            background:
              `radial-gradient(
                circle,
                ${color}55,
                ${color}18 42%,
                transparent 72%
              )`,
            filter: "blur(18px)",
            animation:
              state === "THINKING"
                ? "noaBreathe 1.6s ease-in-out infinite"
                : "noaBreathe 4.5s ease-in-out infinite",
          }}
        />

        {/* OUTER RINGS */}

        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border:
              `2px solid ${color}`,
            boxShadow:
              `0 0 18px ${color}88`,
            animation:
              "noaRotate 22s linear infinite",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 12,
            borderRadius: "50%",
            border:
              `1px solid ${color}99`,
            animation:
              "noaRotateReverse 17s linear infinite",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 30,
            borderRadius: "50%",
            border:
              `1px dashed ${color}66`,
            animation:
              "noaRotate 13s linear infinite",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 22,
            borderRadius: "50%",
            border:
              `1px dashed ${color}55`,
            animation:
              "noaRotateReverse 27s linear infinite",
          }}
        />

        {/* CENTER */}

        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          {/* WAVE */}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 150,
              height: 30,
              transform:
                "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            {bars.map((height, index) => (
              <i
                key={index}
                style={{
                  display: "block",
                  width: 2,
                  height,
                  borderRadius: 3,
                  background: color,
                  boxShadow:
                    `0 0 7px ${color}`,
                  animation:
                    `noaWave ${
                      state === "SPEAKING"
                        ? ".45s"
                        : state === "THINKING"
                        ? ".3s"
                        : "1s"
                    } ease-in-out infinite alternate`,
                  animationDelay:
                    `${index * 0.04}s`,
                }}
              />
            ))}
          </div>

          {/* STATE */}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top:
                "calc(50% + 27px)",
              transform:
                "translateX(-50%)",
              fontSize: 10,
              lineHeight: 1,
              letterSpacing: 3,
              textTransform:
                "uppercase",
              whiteSpace: "nowrap",
              color,
              textShadow:
                `0 0 10px ${color}`,
            }}
          >
            {state}
          </div>
        </div>

        {/* ORBIT POINTS */}

        <span
          style={{
            position: "absolute",
            left: "50%",
            top: -3,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#eaf6ff",
            boxShadow:
              `0 0 8px ${color}`,
          }}
        />

        <span
          style={{
            position: "absolute",
            right: 5,
            top: 30,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "#cfe8ff",
          }}
        />

        <span
          style={{
            position: "absolute",
            right: 4,
            bottom: 28,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#eaf6ff",
          }}
        />

        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: -3,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#cfe8ff",
          }}
        />

        <span
          style={{
            position: "absolute",
            left: 3,
            bottom: 30,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "#eaf6ff",
          }}
        />

        <span
          style={{
            position: "absolute",
            left: 5,
            top: 30,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "#cfe8ff",
          }}
        />
      </div>

      {/* FLOATING MIC */}

      <button
        ref={micRef}
        type="button"
        aria-label="Microphone"
        aria-pressed={micOn}
        onClick={toggleMic}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: "fixed",

          right:
            micPosition.right,

          bottom:
            micPosition.bottom,

          width: 48,
          height: 48,

          borderRadius: "50%",

          zIndex: 50,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          border:
            `2px solid ${color}`,

          background:
            micOn
              ? "rgba(53,232,135,.16)"
              : "rgba(79,163,255,.12)",

          color,

          boxShadow:
            micOn
              ? "0 0 30px rgba(53,232,135,.42), inset 0 0 12px rgba(53,232,135,.12)"
              : "0 0 22px rgba(79,163,255,.25), inset 0 0 10px rgba(79,163,255,.08)",

          fontSize: 18,

          userSelect: "none",
          touchAction: "none",
          cursor: draggingRef.current
            ? "grabbing"
            : "grab",

          WebkitTapHighlightColor:
            "transparent",

          padding: 0,
        }}
      >
        {/* MICROPHONE ICON */}

        <svg
          width="22"
          height="22"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="11"
            y="3"
            width="10"
            height="17"
            rx="5"
            stroke="currentColor"
            strokeWidth="2"
          />

          <path
            d="M7 15C7 20 10.5 23 16 23C21.5 23 25 20 25 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <path
            d="M16 23V28"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <path
            d="M12 28H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* GLOBAL CSS */}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          width: 100%;
          height: 100%;
          background: #000;
          overflow: hidden;
        }

        body {
          font-family:
            Inter,
            Arial,
            sans-serif;
        }

        button {
          font-family: inherit;
          -webkit-tap-highlight-color: transparent;
        }

        @keyframes noaBreathe {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes noaRotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes noaRotateReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes noaWave {
          from {
            transform: scaleY(0.28);
            opacity: 0.38;
          }

          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
    }
