'use client'

import { useEffect, useState } from 'react'

const bars = [
  7, 12, 18, 10, 24, 34, 20, 42, 27, 18, 31, 44, 23, 12, 29, 38,
  20, 30, 43, 25, 16, 28, 40, 22, 13, 8,
]

export default function Page() {
  const [listening, setListening] = useState(false)

  useEffect(() => {
    if (!listening) return

    const timer = window.setTimeout(() => {
      setListening(false)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [listening])

  return (
    <main className="noa">
      <section className="orbArea">
        <div className={`orb ${listening ? 'active' : ''}`}>
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

          <div className="waveform" aria-label="NOA waveform">
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
            {listening ? 'LISTENING' : 'IDLE'}
          </div>
        </div>

        <button
          className={`mic ${listening ? 'micActive' : ''}`}
          onClick={() => setListening((value) => !value)}
          aria-label={listening ? 'Stop listening' : 'Start listening'}
        >
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
            <rect x="8" y="3" width="8" height="13" rx="4" />
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
        }

        .orb.active::before {
          box-shadow:
            0 0 35px rgba(0, 110, 255, 0.28),
            inset 0 0 55px rgba(0, 90, 255, 0.16);
        }

        .outerRing {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
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
          box-shadow: 0 0 7px rgba(0, 126, 255, 0.75);
          opacity: 0.9;
          animation: wave 1.35s ease-in-out infinite alternate;
        }

        .orb:not(.active) .waveform i {
          animation-duration: 1.8s;
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
          text-shadow: 0 0 9px rgba(0, 126, 255, 0.65);
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
          cursor: pointer;
          box-shadow:
            0 0 10px rgba(25, 130, 255, 0.4),
            inset 0 0 14px rgba(0, 105, 255, 0.12);
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease;
        }

        .mic:active {
          transform: scale(0.94);
        }

        .micActive {
          border-color: #63b6ff;
          box-shadow:
            0 0 22px rgba(30, 145, 255, 0.8),
            inset 0 0 22px rgba(0, 105, 255, 0.2);
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
            bottom: calc(50% - 230px);
            width: 74px;
            height: 74px;
          }

          .mic svg {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </main>
  )
  }
