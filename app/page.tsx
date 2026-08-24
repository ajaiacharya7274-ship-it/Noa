"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {loaded && (
        <iframe
          title="NOA"
          src="/noa.html"
          allow="microphone"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "0",
            background: "#000",
          }}
        />
      )}
    </main>
  );
      }
