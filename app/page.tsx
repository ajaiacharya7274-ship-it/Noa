'use client'

import { useEffect, useRef, useState } from 'react'

type NoaState = 'idle' | 'listening' | 'processing' | 'speaking'

const bars = [
  7, 12, 18, 10, 24, 34, 20, 42, 27, 18, 31, 44, 23, 12, 29, 38,
  20, 30, 43, 25, 16, 28, 40, 22, 13, 8,
]

export default function Page() {
  const [state, setState] = useState<NoaState>('idle')
  const [micPosition, setMicPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startMicX: 0,
    startMicY: 0,
    moved: false,
  })

  const recognitionRef = useRef<any>(null)

  const stateLabel = {
    idle: 'IDLE',
    listening: 'LISTENING',
    processing: 'THINKING',
    speaking: 'SPEAKING',
  }[state]

  const startListening = () => {
    setState('listening')

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      return
    }

    try {
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const result = event.results?.[0]?.[0]?.transcript || ''

        if (result.trim()) {
          setState('processing')

          // Temporary processing/speaking simulation.
          // Replace this section later with NOA's actual AI backend.
          window.setTimeout(() => {
            setState('speaking')

            window.setTimeout(() => {
              setState('idle')
            }, 1800)
          }, 700)
        }
      }

      recognition.onerror = () => {
        setState('idle')
      }

      recognition.onend = () => {
        if (state === 'listening') {
          setState('idle')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setState('idle')
    }
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop()
    } catch {}

    recognitionRef.current = null
    setState('idle')
  }

  const handleMicClick = () => {
    if (dragRef.current.moved) {
      return
    }

    if (state === 'idle') {
      startListening()
      return
    }

    if (state === 'listening') {
      stopListening()
      return
    }

    if (state === 'processing' || state === 'speaking') {
      stopListening()
    }
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId)

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startMicX: micPosition.x,
      startMicY: micPosition.y,
      moved: false,
    }

    setDragging(true)
  }

  const handlePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const drag = dragRef.current

    if (!drag.active || drag.pointerId !== event.pointerId) {
      return
    }

    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      drag.moved = true
    }

    const buttonSize = window.innerWidth <= 480 ? 74 : 92

    const halfButton = buttonSize / 2

    const maxX = window.innerWidth / 2 - halfButton - 8
    const minX = -window.innerWidth / 2 + halfButton + 8

    const maxY = window.innerHeight / 2 - halfButton - 8
    const minY = -window.innerHeight / 2 + halfButton + 8

    const nextX = Math.max(
      minX,
      Math.min(maxX, drag.startMicX + dx),
    )

    const nextY = Math.max(
      minY,
      Math.min(maxY, drag.startMicY + dy),
    )

    setMicPosition({
      x: nextX,
      y: nextY,
    })
  }

  const finishDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (
      dragRef.current.pointerId !== event.pointerId
    ) {
      return
    }

    dragRef.current.active = false
    setDragging(false)

    window.setTimeout(() => {
      dragRef.current.moved = false
    }, 50)
  }

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop()
      } catch {}
    }
  }, [])

  return (
    <main className={`noa state-${state}`}>
      <section className="orbArea">
        <div className={`orb ${state}`}>
          <div className="outerRing ringOne" />
          <div className="outerRing ringTwo" />
          <div className="outerRing ringThree" />

          <div className="particles">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div
            className="waveform"
            aria-label={`NOA ${stateLabel}`}
          >
            {bars.map((height, index) => (
              <i
                key={index}
                style={{
                  height: `${height}px`,
                  animationDelay: `${index * 45}ms`,
                }}
              />
            ))}
          </div>

          <div className="state">
            {stateLabel}
          </div>
        </div>

        <button
          className={`mic ${state} ${
            dragging ? 'dragging' : ''
          }`}
          style={{
            transform: `translate(${micPosition.x}px, ${micPosition.y}px)`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onClick={handleMicClick}
          aria-label={
            state === 'listening'
              ? 'Stop listening'
              : 'Start listening'
          }
        >
          <span className="micGlow" />

          <svg
            viewBox="0 0 24 24"
            width="34"
            height="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect
              x="8"
              y="3"
              width="8"
              height="13"
              rx="4"
            />

            <path d="M5 11a7 7 0 0 0 14 0" />

            <path d="M12 18v3" />

            <path d="M9 21h6" />
          </svg>
        </button>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .noa {
          min-height: 100svh;
          width: 100%;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 48%,
              rgba(0, 56, 130, 0.13) 0%,
              rgba(0, 18, 45, 0.07) 24%,
              rgba(0, 0, 0, 0) 47%
            ),
            #000;

          color: #168cff;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;

          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
        }

        .orbArea {
          width: 330px;
          height: 430px;

          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orb {
          width: 280px;
          height: 280px;

          position: relative;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          transform: translateY(-8px);

          transition:
            filter 250ms ease,
            transform 250ms ease;
        }

        .orb::before {
          content: '';

          position: absolute;

          inset: 5px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(0, 8, 20, 0.98) 0%,
              rgba(0, 3, 10, 0.98) 65%,
              rgba(0, 25, 55, 0.35) 100%
            );

          box-shadow:
            0 0 25px rgba(0, 100, 255, 0.12),
            inset 0 0 40px rgba(0, 75, 180, 0.08);

          z-index: 1;

          transition:
            box-shadow 300ms ease,
            background 300ms ease;
        }

        /* LISTENING */

        .orb.listening::before {
          box-shadow:
            0 0 45px rgba(0, 130, 255, 0.55),
            inset 0 0 65px rgba(0, 100, 255, 0.25);
        }

        /* PROCESSING */

        .orb.processing::before {
          box-shadow:
            0 0 50px rgba(155, 70, 255, 0.55),
            inset 0 0 70px rgba(130, 50, 255, 0.24);
        }

        /* SPEAKING */

        .orb.speaking::before {
          box-shadow:
            0 0 50px rgba(0, 255, 210, 0.5),
            inset 0 0 65px rgba(0, 220, 190, 0.2);
        }

        .outerRing {
          position: absolute;

          border-radius: 50%;

          pointer-events: none;

          transition:
            border-color 300ms ease,
            box-shadow 300ms ease,
            transform 400ms ease;
        }

        .ringOne {
          inset: 0;

          border: 1px solid rgba(28, 132, 255, 0.65);

          box-shadow:
            0 0 8px rgba(0, 110, 255, 0.35),
            inset 0 0 8px rgba(0, 100, 255, 0.12);
        }

        .ringTwo {
          inset: 10px;

          border: 1px dotted rgba(36, 134, 255, 0.35);

          transform: rotate(18deg);
        }

        .ringThree {
          inset: 17px;

          border: 1px solid rgba(33, 111, 220, 0.16);

          border-left-color: rgba(40, 145, 255, 0.55);

          border-bottom-color: rgba(40, 145, 255, 0.5);

          transform: rotate(-32deg);
        }

        .listening .ringOne {
          border-color: rgba(75, 175, 255, 0.95);

          box-shadow:
            0 0 20px rgba(0, 140, 255, 0.85),
            inset 0 0 15px rgba(0, 130, 255, 0.3);

          animation: ringPulse 1.1s ease-in-out infinite;
        }

        .listening .ringTwo {
          border-color: rgba(70, 160, 255, 0.65);

          animation: rotateRing 5s linear infinite;
        }

        .processing .ringOne {
          border-color: rgba(190, 110, 255, 0.95);

          box-shadow:
            0 0 22px rgba(150, 60, 255, 0.8),
            inset 0 0 15px rgba(150, 60, 255, 0.3);

          animation: rotateRing 2.2s linear infinite;
        }

        .processing .ringTwo {
          border-color: rgba(170, 90, 255, 0.65);

          animation: rotateRingReverse 3s linear infinite;
        }

        .speaking .ringOne {
          border-color: rgba(50, 255, 220, 0.95);

          box-shadow:
            0 0 22px rgba(0, 255, 210, 0.8),
            inset 0 0 15px rgba(0, 255, 210, 0.3);

          animation: ringPulse 0.9s ease-in-out infinite;
        }

        .speaking .ringTwo {
          border-color: rgba(60, 240, 220, 0.65);

          animation: rotateRing 4s linear infinite;
        }

        @keyframes ringPulse {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.025);
          }
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

        .particles {
          position: absolute;

          inset: 0;

          z-index: 3;
        }

        .particles span {
          position: absolute;

          width: 4px;
          height: 4px;

          border-radius: 50%;

          background: #9ed4ff;

          box-shadow: 0 0 8px #168cff;

          opacity: 0.65;

          transition:
            background 300ms ease,
            box-shadow 300ms ease;
        }

        .listening .particles span {
          background: #8dd0ff;

          box-shadow:
            0 0 12px #168cff,
            0 0 22px rgba(0, 140, 255, 0.8);

          animation: particlePulse 0.8s ease-in-out infinite;
        }

        .processing .particles span {
          background: #d2a5ff;

          box-shadow:
            0 0 12px #9a45ff,
            0 0 22px rgba(150, 50, 255, 0.8);
        }

        .speaking .particles span {
          background: #aaffee;

          box-shadow:
            0 0 12px #00e8c0,
            0 0 22px rgba(0, 255, 210, 0.8);
        }

        @keyframes particlePulse {
          0%,
          100% {
            opacity: 0.45;
          }

          50% {
            opacity: 1;
          }
        }

        .particles span:nth-child(1) {
          top: 0;
          left: 50%;
        }

        .particles span:nth-child(2) {
          top: 35px;
          right: 18px;
        }

        .particles span:nth-child(3) {
          top: 50%;
          right: -2px;
        }

        .particles span:nth-child(4) {
          bottom: 35px;
          right: 20px;
        }

        .particles span:nth-child(5) {
          bottom: 0;
          left: 50%;
        }

        .particles span:nth-child(6) {
          bottom: 35px;
          left: 20px;
        }

        .particles span:nth-child(7) {
          top: 50%;
          left: -2px;
        }

        .particles span:nth-child(8) {
          top: 35px;
          left: 20px;
        }

        .waveform {
          position: relative;

          z-index: 4;

          width: 220px;
          height: 70px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 4px;
        }

        .waveform i {
          display: block;

          width: 3px;

          min-height: 5px;

          border-radius: 3px;

          background: linear-gradient(
            to bottom,
            #58b0ff,
            #0879ed
          );

          box-shadow:
            0 0 7px rgba(0, 126, 255, 0.75);

          opacity: 0.9;

          animation:
            wave 1.8s ease-in-out infinite alternate;

          transition:
            background 300ms ease,
            box-shadow 300ms ease;
        }

        .orb.listening .waveform i {
          background: linear-gradient(
            to bottom,
            #a7ddff,
            #0784ff
          );

          box-shadow:
            0 0 10px rgba(0, 145, 255, 0.95);

          animation-duration: 0.75s;
        }

        .orb.processing .waveform i {
          background: linear-gradient(
            to bottom,
            #e0baff,
            #933dff
          );

          box-shadow:
            0 0 11px rgba(150, 60, 255, 0.95);

          animation-duration: 0.55s;
        }

        .orb.speaking .waveform i {
          background: linear-gradient(
            to bottom,
            #bafff2,
            #00d9b5
          );

          box-shadow:
            0 0 11px rgba(0, 255, 210, 0.9);

          animation-duration: 0.5s;
        }

        @keyframes wave {
          0% {
            transform: scaleY(0.55);
            opacity: 0.55;
          }

          50% {
            transform: scaleY(1);
            opacity: 1;
          }

          100% {
            transform: scaleY(0.65);
            opacity: 0.7;
          }
        }

        .state {
          position: absolute;

          z-index: 5;

          top: 174px;

          left: 0;

          width: 100%;

          text-align: center;

          font-size: 17px;

          line-height: 1;

          letter-spacing: 5px;

          font-weight: 400;

          color: #168cff;

          text-shadow:
            0 0 9px rgba(0, 126, 255, 0.65);

          transition:
            color 300ms ease,
            text-shadow 300ms ease;
        }

        .state-listening .state {
          color: #63b9ff;

          text-shadow:
            0 0 12px rgba(0, 150, 255, 0.95);
        }

        .state-processing .state {
          color: #c58bff;

          text-shadow:
            0 0 12px rgba(155, 65, 255, 0.95);
        }

        .state-speaking .state {
          color: #6dffe5;

          text-shadow:
            0 0 12px rgba(0, 255, 210, 0.95);
        }

        .mic {
          position: absolute;

          right: 18px;
          bottom: 43px;

          width: 92px;
          height: 92px;

          border-radius: 50%;

          border: 3px solid #328eff;

          background:
            radial-gradient(
              circle,
              rgba(6, 20, 35, 0.98),
              rgba(0, 0, 0, 0.96)
            );

          color: #bce3ff;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: grab;

          touch-action: none;

          user-select: none;

          -webkit-user-select: none;

          box-shadow:
            0 0 10px rgba(25, 130, 255, 0.4),
            inset 0 0 14px rgba(0, 105, 255, 0.12);

          transition:
            box-shadow 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
        }

        .mic.dragging {
          cursor: grabbing;

          transition: none;

          transform-origin: center;
        }

        .mic.idle {
          border-color: #328eff;

          color: #bce3ff;
        }

        .mic.listening {
          border-color: #ff4d61;

          color: #ff9eaa;

          box-shadow:
            0 0 18px rgba(255, 45, 75, 0.75),
            0 0 40px rgba(255, 45, 75, 0.28),
            inset 0 0 22px rgba(255, 45, 75, 0.16);

          animation: micListening 1s ease-in-out infinite;
        }

        .mic.processing {
          border-color: #a34cff;

          color: #d2a2ff;

          box-shadow:
            0 0 20px rgba(150, 60, 255, 0.8),
            0 0 42px rgba(150, 60, 255, 0.25),
            inset 0 0 22px rgba(150, 60, 255, 0.16);

          animation: micProcessing 1.2s linear infinite;
        }

        .mic.speaking {
          border-color: #00e8c0;

          color: #9affed;

          box-shadow:
            0 0 20px rgba(0, 255, 210, 0.8),
            0 0 42px rgba(0, 255, 210, 0.25),
            inset 0 0 22px rgba(0, 255, 210, 0.16);

          animation: micSpeaking 0.8s ease-in-out infinite;
        }

        @keyframes micListening {
          0%,
          100% {
            box-shadow:
              0 0 14px rgba(255, 45, 75, 0.65),
              0 0 28px rgba(255, 45, 75, 0.2);
          }

          50% {
            box-shadow:
              0 0 28px rgba(255, 45, 75, 1),
              0 0 55px rgba(255, 45, 75, 0.35);
          }
        }

        @keyframes micProcessing {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes micSpeaking {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.08);
          }
        }

        .micGlow {
          position: absolute;

          inset: -5px;

          border-radius: 50%;

          pointer-events: none;

          opacity: 0;

          transition: opacity 200ms ease;
        }

        .mic.listening .micGlow {
          opacity: 1;

          box-shadow:
            0 0 25px rgba(255, 50, 80, 0.35);
        }

        .mic.processing .micGlow {
          opacity: 1;

          box-shadow:
            0 0 25px rgba(160, 60, 255, 0.35);
        }

        .mic.speaking .micGlow {
          opacity: 1;

          box-shadow:
            0 0 25px rgba(0, 255, 210, 0.35);
        }

        @media (max-width: 480px) {
          .orbArea {
            width: 100vw;
            height: 100svh;
          }

          .orb {
            width: 280px;
            height: 280px;

            transform: translateY(-35px);
          }

          .mic {
            right: calc(50% - 140px);

            bot
