"use client";

import { useEffect, useRef, useState } from "react";

type NoaState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";

type SpeechRecognitionInstance = {
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

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function Home() {
  const [state, setState] = useState<NoaState>("IDLE");
  const [micOn, setMicOn] = useState(false);
  const [text, setText] = useState("");
  const [zoom, setZoom] = useState(1);

  // IMPORTANT:
  // Do NOT use window.innerWidth here.
  // GitHub Pages builds the page on the server first.
  const [mic, setMic] = useState({
    x: 20,
    y: 20,
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const micOnRef = useRef(false);

  const draggingRef = useRef(false);
  const movedRef = useRef(false);

  const dragOffsetRef = useRef({
    x: 0,
    y: 0,
  });

  // --------------------------------------------------
  // SET INITIAL MIC POSITION AFTER BROWSER LOAD
  // --------------------------------------------------

  useEffect(() => {
    const updateMicPosition = () => {
      setMic({
        x: Math.max(10, window.innerWidth - 105),
        y: Math.max(10, window.innerHeight - 105),
      });
    };

    updateMicPosition();

    window.addEventListener("resize", updateMicPosition);

    return () => {
      window.removeEventListener(
        "resize",
        updateMicPosition
      );
    };
  }, []);

  // --------------------------------------------------
  // SPEECH RECOGNITION
  // --------------------------------------------------

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

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
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      transcript = transcript.trim();

      if (!transcript) {
        return;
      }

      setText(transcript);

      const lastResult =
        event.results[event.results.length - 1];

      if (lastResult && lastResult.isFinal) {
        setState("THINKING");

        setTimeout(() => {
          handleCommand(transcript);
        }, 350);
      }
    };

    recognition.onerror = () => {
      setMicOn(false);
      micOnRef.current = false;
      setState("IDLE");
    };

    recognition.onend = () => {
      if (!micOnRef.current) {
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

  // --------------------------------------------------
  // SPEAK
  // --------------------------------------------------

  function speak(message: string) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setState("IDLE");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(message);

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setState("SPEAKING");
    };

    utterance.onend = () => {
      setState(
        micOnRef.current
          ? "LISTENING"
          : "IDLE"
      );
    };

    window.speechSynthesis.speak(
      utterance
    );
  }

  // --------------------------------------------------
  // NOA COMMANDS
  // --------------------------------------------------

  function handleCommand(command: string) {
    const value =
      command.toLowerCase().trim();

    if (
      value === "hello" ||
      value.includes("hello noa")
    ) {
      speak("Hello. I am NOA.");
      return;
    }

    if (
      value.includes("zoom in")
    ) {
      setZoom((current) =>
        Math.min(2.2, current + 0.15)
      );

      speak("Zooming in.");
      return;
    }

    if (
      value.includes("zoom out")
    ) {
      setZoom((current) =>
        Math.max(0.6, current - 0.15)
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

  // --------------------------------------------------
  // MICROPHONE ON / OFF
  // --------------------------------------------------

  function toggleMic() {
    if (movedRef.current) {
      movedRef.current = false;
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

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  function resetMic() {
    setMicOn(false);
    micOnRef.current = false;
    setState("IDLE");
    setText("");

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

  // --------------------------------------------------
  // MIC DRAG START
  // --------------------------------------------------

  function handlePointerDown(
    event: any
  ) {
    const element =
      event.currentTarget;

    const rect =
      element.getBoundingClientRect();

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    draggingRef.current = true;
    movedRef.current = false;

    try {
      element.setPointerCapture(
        event.pointerId
      );
    } catch {}

    event.preventDefault();
  }

  // --------------------------------------------------
  // MIC DRAG MOVE
  // --------------------------------------------------

  function handlePointerMove(
    event: any
  ) {
    if (!draggingRef.current) {
      return;
    }

    const element =
      event.currentTarget;

    const width =
      element.offsetWidth;

    const height =
      element.offsetHeight;

    let x =
      event.clientX -
      dragOffsetRef.current.x;

    let y =
      event.clientY -
      dragOffsetRef.current.y;

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
      movedRef.current = true;
    }

    setMic({
      x,
      y,
    });
  }

  // --------------------------------------------------
  // MIC DRAG END
  // --------------------------------------------------

  function handlePointerUp(
    event: any
  ) {
    draggingRef.current = false;

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    } catch {}
  }

  // --------------------------------------------------
  // STATE COLOR
  // --------------------------------------------------

  let stateColor = "#3b82f6";

  if (micOn) {
    stateColor = "#22c55e";
  }

  if (state === "THINKING") {
    stateColor = "#a855f7";
  }

  if (state === "SPEAKING") {
    stateColor = "#38bdf8";
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      <main
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          background: "#000",
          color: stateColor,
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {/* TOP STATUS */}

        <div
          style={{
            position: "fixed",
            top: 24,
            left: 0,
            right: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 12,
              letterSpacing: 3,
              color: stateColor,
              textShadow:
                `0 0 12px ${stateColor}`,
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
              border:
                "1px solid rgba(80,160,255,.45)",
              background:
                "rgba(5,10,20,.9)",
              color: "#8ab8ff",
              borderRadius: 12,
              padding:
                "9px 14px",
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            RESET MIC
          </button>
        </div>

        {/* MAIN ORB */}

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 310,
            height: 310,
            transform:
              `translate(-50%, -50%) scale(${zoom})`,
            transition:
              "transform .2s ease",
          }}
        >
          {/* GLOW */}

          <div
            style={{
              position: "absolute",
              inset: -75,
              borderRadius: "50%",
              background:
                `radial-gradient(circle, ${stateColor}55 0%, transparent 68%)`,
              filter: "blur(24px)",
              animation:
                "noaGlow 2.4s ease-in-out infinite",
            }}
          />

          {/* OUTER RING */}

          <div
            style={{
              position: "absolute",
              inset: 4,
              borderRadius: "50%",
              border:
                `2px solid ${stateColor}`,
              boxShadow:
                `0 0 24px ${stateColor}99`,
              animation:
                "noaRotate 20s linear infinite",
            }}
          />

          {/* SECOND RING */}

          <div
            style={{
              position: "absolute",
              inset: 25,
              borderRadius: "50%",
              border:
                `1px solid ${stateColor}99`,
              boxShadow:
                `0 0 18px ${stateColor}55`,
              animation:
                "noaRotateReverse 14s linear infinite",
            }}
          />

          {/* THIRD RING */}

          <div
            style={{
              position: "absolute",
              inset: 52,
              borderRadius: "50%",
              border:
                `1px solid ${stateColor}66`,
              animation:
                "noaRotate 10s linear infinite",
            }}
          />

          {/* CENTER */}

          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* WAVEFORM */}

            <div
              style={{
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              {[
                12,
                20,
                30,
                42,
                25,
                46,
                32,
                50,
                28,
                42,
                22,
                48,
                30,
                40,
                25,
                34,
                20,
                12,
              ].map(
                (height, index) => (
                  <span
                    key={index}
                    style={{
                      width: 4,
                      height,
                      borderRadius: 10,
                      background:
                        stateColor,
                      boxShadow:
                        `0 0 10px ${stateColor}`,
                      animation:
                        "noaWave .6s ease-in-out infinite alternate",
                      animationDelay:
                        `${index * 0.04}s`,
                    }}
                  />
                )
              )}
            </div>

            {/* STATE */}

            <div
              style={{
                marginTop: 14,
                fontSize: 14,
                letterSpacing: 6,
                color: stateColor,
                textShadow:
                  `0 0 18px ${stateColor}`,
              }}
            >
              {state}
            </div>
          </div>

          {/* ORBIT DOTS */}

          {[
            "0%",
            "25%",
            "50%",
            "75%",
          ].map(
            (position, index) => (
              <span
                key={index}
                style={{
                  position: "absolute",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background:
                    stateColor,
                  boxShadow:
                    `0 0 12px ${stateColor}`,
                  left:
                    index % 2 === 0
                      ? position
                      : "auto",
                  right:
                    index % 2 === 1
                      ? position
                      : "auto",
                  top:
                    index < 2
                      ? "0%"
                      : "auto",
                  bottom:
                    index >= 2
                      ? "0%"
                      : "auto",
                  transform:
                    "translate(-50%, -50%)",
                }}
              />
            )
          )}
        </div>

        {/* DRAGGABLE MIC */}

        <button
          type="button"
          aria-label="NOA microphone"
          onClick={toggleMic}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: "fixed",
            left: mic.x,
            top: mic.y,
            width: 80,
            height: 80,
            padding: 0,
            borderRadius: "50%",
            border:
              `2px solid ${stateColor}`,
            background:
              `rgba(5,10,25,.92)`,
            color: stateColor,
            boxShadow:
              `0 0 30px ${stateColor}77`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <svg
            width="35"
            height="35"
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
              left: "50%",
              bottom: 25,
              transform:
                "translateX(-50%)",
              maxWidth: "80%",
              textAlign: "center",
              color: "#718096",
              fontSize: 11,
              zIndex: 20,
            }}
          >
            {text}
          </div>
        )}
      </main>

      {/* ANIMATIONS */}

      <style>{`
        @keyframes noaGlow {
          0%, 100% {
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
