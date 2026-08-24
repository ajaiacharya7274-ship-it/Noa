"use client";

export default function Home() {
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
      <iframe
        title="NOA"
        src="/Noa/noa.html"
        allow="microphone"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          background: "#000",
        }}
      />
    </main>
  );
}
