"use client";

import { useEffect, useRef, useState } from "react";

type NoaState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export default function Home() {
  const [state, setState] = useState<NoaState>("IDLE");
  const [micOn, setMicOn] = useState(false);
  const [text, setText] = useState("");
  const [zoom, setZoom] = useState(1);

  const [mic, setMic] = useState({
    x: window.innerWidth - 105,
    y: window.innerHeight - 105,
  });

  const recognitionRef = useRef<Recognition | null>(null);
  const micOnRef = useRef(false);

  const dragging = useRef(false);
  const moved = useRef(false);
  const pointerId = useRef<number | null>(null);

  const dragOffset = useRef({
    x: 0,
    y: 0,
  });

  /* -----------------------------
     SPEECH RECOGNITION
  ----------------------------- */

  useEffect(() => {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setMicOn(true);
      micOnRef.current = true;
      setState("LISTENING");
    };

    recognition.onresult = (event: any) => {
      let result = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        result += event.results[i][0].transcript;
      }

      result = result.trim();

      if (!result) return;

      setText(result);

      const last =
        event.results[event.results.length - 1];

      if (last.isFinal) {
        setState("THINKING");

        setTimeout(() => {
          handleCommand(result);
        }, 400);
      }
    };

    recognition.onerror = () => {
      setState("IDLE");
    };

    recognition.onend = () => {
      if (micOnRef.current) {
        setState("LISTENING");
      } else {
        setState("IDLE");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, []);

  /* -----------------------------
     SPEAK
  ----------------------------- */

  function speak(message: string) {
    if (!("speechSynthesis" in window)) {
      setState("IDLE");
      return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(
      message
    );

    voice.rate = 1;
    voice.pitch = 1;

    voice.onstart = () => {
      setState("SPEAKING");
    };

    voice.onend = () => {
      setState(
        micOnRef.current
          ? "LISTENING"
          : "IDLE"
      );
    };

    window.speechSynthesis.speak(voice);
  }

  /* -----------------------------
     COMMANDS
  ----------------------------- */

  function handleCommand(command: string) {
    const value = command.toLowerCase().trim();

    if (value.includes("zoom in")) {
      setZoom((z) =>
        Math.min(2.2, z + 0.15)
      );

      speak("Zooming in.");
      return;
    }

    if (value.includes("zoom out")) {
      setZoom((z) =>
        Math.max(0.6, z - 0.15)
      );

      speak("Zooming out.");
      return;
    }

    if (
      value.includes("reset zoom") ||
      value.includes("normal size")
    ) {
      setZoom(1);
      speak("Zoom reset.");
      return;
    }

    if (
      value === "hello noa" ||
      value === "hello"
    ) {
      speak("Hello. I am NOA.");
      return;
    }

    if (
      value === "status" ||
      value.includes("your status")
    ) {
      speak(
        `NOA is currently ${state.toLowerCase()}.`
      );
      return;
    }

    speak(
      `I heard you say ${command}.`
    );
  }

  /* -----------------------------
     MIC
  ----------------------------- */

  function toggleMic() {
    if (moved.current) {
      moved.current = false;
      return;
    }

    const recognition =
      recognitionRef.current;

    if (!micOn) {
      setMicOn(true);
      micOnRef.current = true;
      setState("LISTENING");

      if (recognition) {
        try {
          recognition.start();
        } catch {}
      }

      return;
    }

    setMicOn(false);
    micOnRef.current = false;
    setState("IDLE");

    if (recognition) {
      try {
        recognition.stop();
      } catch {}
    }
  }

  /* -----------------------------
     RESET MIC
  ----------------------------- */

  function resetMic() {
    setMicOn(false);
    micOnRef.current = false;
    setState("IDLE");
    setText("");

    if ("speechSynthesis" in window) {
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

  /* -----------------------------
     DRAG START
  ----------------------------- */

  function pointerDown(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    const element =
      event.currentTarget;

    pointerId.current =
      event.pointerId;

    const rect =
      element.getBoundingClientRect();

    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    dragging.current = true;
    moved.current = false;

    element.setPointerCapture(
      event.pointerId
    );

    event.preventDefault();
  }

  /* -----------------------------
     DRAG MOVE
  ----------------------------- */

  function pointerMove(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!dragging.current) return;

    if (
      pointerId.current !==
      event.pointerId
    ) {
      return;
    }

    const width =
      event.currentTarget.offsetWidth;

    const height =
      event.currentTarget.offsetHeight;

    let x =
      event.clientX -
      dragOffset.current.x;

    let y =
      event.clientY -
      dragOffset.current.y;

    x = Math.max(
      0,
      Math.min(
        window.innerWidth - width,
        x
      )
    );

    y = Math.max(
      0,
      Math.min(
        window.innerHeight - height,
        y
      )
    );

    if (
      Math.abs(event.movementX) > 1 ||
      Math.abs(event.movementY) > 1
    ) {
      moved.current = true;
    }

    setMic({
      x,
      y,
    });
  }

  /* -----------------------------
     DRAG END
  ----------------------------- */

  function pointerUp(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    dragging.current = false;

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    } catch {}

    pointerId.current = null;
  }

  /* -----------------------------
     COLORS
  ----------------------------- */

  let color = "#4fa3ff";

  if (micOn) {
    color = "#35e887";
  }

  if (state === "THINKING") {
    color = "#a855f7";
  }

  if (state === "SPEAKING") {
    color = "#38bdf8";
  }

  return (
    <>
      <main
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          touchAction: "none",
        }}
      >
        {/* TOP STATUS */}

        <div
          style={{
            position: "fixed",
            top: 25,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontSize: 12,
              letterSpacing: 3,
              color: color,
            }}
          >
            {micOn
              ? "VOICE READY"
              : "VOICE OFF"}
          </span>

          <button
            onClick={resetMic}
            style={{
              background:
                "rgba(5,10,20,.9)",
              color: "#7fb9ff",
              border:
                "1px solid rgba(79,163,255,.5)",
              borderRadius: 12,
              padding: "9px 14px",
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            RESET MIC
          </button>
        </div>

        {/* ORB */}

        <div
          style={{
            width: 310,
            height: 310,
            position: "relative",
            transform:
              `scale(${zoom})`,
            transition:
              "transform .2s ease",
          }}
        >
          {/* OUTER GLOW */}

          <div
            style={{
              position: "absolute",
              inset: -70,
              borderRadius: "50%",
              background:
                `radial-gradient(circle, ${color}55, transparent 68%)`,
              filter: "blur(22px)",
              animation:
                "noaGlow 2.5s ease-in-out infinite",
            }}
          />

          {/* RINGS */}

          <div
            style={{
              position: "absolute",
              inset: 5,
              borderRadius: "50%",
              border:
                `2px solid ${color}`,
              boxShadow:
                `0 0 20px ${color}88`,
              animation:
                "noaRotate 20s linear infinite",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 25,
              borderRadius: "50%",
              border:
                `1px solid ${color}88`,
              boxShadow:
                `0 0 15px ${color}55`,
              animation:
                "noaRotateReverse 15s linear infinite",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 50,
              borderRadius: "50%",
              border:
                `1px solid ${color}55`,
              animation:
                "noaRotate 11s linear infinite",
            }}
          />

          {/* CENTER */}

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            {/* WAVEFORM */}

            <div
              style={{
                height: 55,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {[
                10, 17, 25, 35, 22,
                40, 28, 45, 25, 36,
                20, 42, 28, 35, 22,
                30, 18, 12,
              ].map(
                (height, index) => (
                  <span
                    key={index}
                    style={{
                      width: 4,
                      height,
                      borderRadius: 10,
                      background: color,
                      boxShadow:
                        `0 0 10px ${color}`,
                      animation:
                        "noaWave .6s ease-in-out infinite alternate",
                      animationDelay:
                        `${index * .04}s`,
                    }}
                  />
                )
              )}
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 13,
                letterSpacing: 5,
                color: color,
                textShadow:
                  `0 0 15px ${color}`,
              }}
            >
              {state}
            </div>
          </div>
        </div>

        {/* MIC */}

        <button
          onClick={toggleMic}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          aria-label="NOA microphone"
          style={{
            position: "fixed",
            left: mic.x,
            top: mic.y,
            width: 78,
            height: 78,
            borderRadius: "50%",
            border:
              `2px solid ${micOn ? "#35e887" : "#4fa3ff"}`,
            background:
              micOn
                ? "rgba(53,232,135,.12)"
                : "rgba(79,163,255,.10)",
            color:
              micOn
                ? "#35e887"
                : "#4fa3ff",
            boxShadow:
              `0 0 28px ${
                micOn
                  ? "rgba(53,232,135,.55)"
                  : "rgba(79,163,255,.35)"
              }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 32 32"
            fill="none"
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

        {/* TRANSCRIPT */}

        {text && (
          <div
            style={{
              position: "fixed",
              bottom: 25,
              left: "50%",
              transform:
                "translateX(-50%)",
              maxWidth: "80%",
              color: "#7890aa",
              fontSize: 11,
              textAlign: "center",
              zIndex: 10,
            }}
          >
            {text}
          </div>
        )}
      </main>

      {/* ANIMATIONS */}

      <style>{`
        @keyframes noaGlow {
          0%,100% {
            transform: scale(1);
            opacity: .55;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
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
            transform: scaleY(.35);
            opacity: .45;
          }

          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
        }
