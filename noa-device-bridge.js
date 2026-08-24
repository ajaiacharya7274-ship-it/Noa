(function () {
  "use strict";

  function init() {
    const center = document.getElementById("center");

    if (!center) return;

    // Spoken text layer — orb ke andar hi rahega.
    const spoken = document.createElement("div");
    spoken.id = "spokenText";
    spoken.setAttribute("aria-live", "polite");
    spoken.setAttribute("aria-atomic", "false");

    center.appendChild(spoken);

    // Visual styling. Existing orb/mic ko touch nahi karta.
    const style = document.createElement("style");

    style.textContent = `
      #spokenText {
        position: absolute;
        left: 50%;
        top: calc(50% + 27px);
        transform: translateX(-50%);

        width: 190px;

        text-align: center;

        color: #4fa3ff;

        font-family: Inter, Arial, sans-serif;
        font-size: 11px;
        line-height: 1.45;
        font-weight: 500;
        letter-spacing: .5px;

        text-shadow:
          0 0 6px rgba(79,163,255,.9),
          0 0 14px rgba(79,163,255,.5);

        opacity: 0;

        pointer-events: none;

        z-index: 10;

        transition: opacity .12s ease;
      }

      /* Speaking ke time normal SPEAKING label hide */
      body[data-state="speaking"] #state {
        opacity: 0;
      }

      /* Spoken words visible */
      body[data-state="speaking"] #spokenText {
        opacity: 1;
      }

      /* Baaki states mein words hidden */
      body[data-state="idle"] #spokenText,
      body[data-state="thinking"] #spokenText,
      body[data-state="listening"] #spokenText,
      body[data-state="executing"] #spokenText,
      body[data-state="complete"] #spokenText {
        opacity: 0;
      }

      @media (max-width: 500px) {
        #spokenText {
          width: 180px;
          font-size: 11px;
          top: calc(50% + 27px);
        }
      }
    `;

    document.head.appendChild(style);

    let currentUtterance = null;
    let words = [];
    let shownWords = 0;

    let fallbackTimer = null;
    let clearTimer = null;

    let hasBoundaryEvents = false;

    function cleanText(text) {
      return String(text || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function clearTimers() {
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
      }

      if (clearTimer) {
        clearTimeout(clearTimer);
        clearTimer = null;
      }
    }

    function renderWords(count) {
      shownWords = Math.max(
        0,
        Math.min(words.length, count)
      );

      spoken.textContent = words
        .slice(0, shownWords)
        .join(" ");
    }

    function startSpeaking(utterance) {
      clearTimers();

      currentUtterance = utterance;

      words = cleanText(utterance.text)
        .split(" ")
        .filter(Boolean);

      shownWords = 0;

      hasBoundaryEvents = false;

      renderWords(0);

      if (
        window.NOA &&
        typeof window.NOA.setState === "function"
      ) {
        window.NOA.setState("SPEAKING");
      }

      /*
       * Fallback:
       * Kuch mobile browsers speech boundary event
       * nahi dete. Isliye words ko estimated timing
       * ke saath reveal karenge.
       */
      const duration = Math.max(
        1000,
        Math.min(
          30000,
          words.length * 190
        )
      );

      const interval = Math.max(
        70,
        duration / Math.max(1, words.length)
      );

      fallbackTimer = setInterval(() => {

        if (hasBoundaryEvents) {
          return;
        }

        if (shownWords < words.length) {

          renderWords(
            shownWords + 1
          );

        } else {

          clearInterval(
            fallbackTimer
          );

          fallbackTimer = null;
        }

      }, interval);
    }

    function finishSpeaking(utterance) {

      if (
        utterance &&
        currentUtterance &&
        utterance !== currentUtterance
      ) {
        return;
      }

      clearTimers();

      // Final complete sentence.
      renderWords(words.length);

      /*
       * Last words thodi der visible rahenge.
       * Uske baad IDLE.
       */
      clearTimer = setTimeout(() => {

        spoken.textContent = "";

        if (
          window.NOA &&
          typeof window.NOA.setState === "function"
        ) {
          window.NOA.setState("IDLE");
        }

        currentUtterance = null;

        words = [];

        shownWords = 0;

      }, 450);
    }

    /*
     * Browser Speech Synthesis available?
     */
    if (
      !window.speechSynthesis ||
      !window.speechSynthesis.speak
    ) {
      return;
    }

    const nativeSpeak =
      window.speechSynthesis.speak.bind(
        window.speechSynthesis
      );

    /*
     * Existing NOA code jab:
     *
     * speechSynthesis.speak(utterance)
     *
     * call karega, ye layer automatically
     * spoken words ko display karegi.
     */
    window.speechSynthesis.speak =
      function (utterance) {

        if (
          utterance &&
          typeof utterance.addEventListener ===
            "function"
        ) {

          /*
           * Speech start
           */
          utterance.addEventListener(
            "start",
            function () {

              startSpeaking(
                utterance
              );

            }
          );

          /*
           * Best case:
           * browser actual speech boundary deta hai.
           */
          utterance.addEventListener(
            "boundary",
            function (event) {

              if (
                !currentUtterance ||
                utterance !== currentUtterance
              ) {
                return;
              }

              hasBoundaryEvents = true;

              const charIndex =
                Number(
                  event.charIndex || 0
                );

              const prefix =
                cleanText(
                  utterance.text
                ).slice(
                  0,
                  charIndex
                );

              const count =
                prefix
                  ? prefix
                      .split(" ")
                      .filter(Boolean)
                      .length + 1
                  : 1;

              renderWords(
                Math.min(
                  words.length,
                  count
                )
              );
            }
          );

          /*
           * Speech finished
           */
          utterance.addEventListener(
            "end",
            function () {

              finishSpeaking(
                utterance
              );

            }
          );

          /*
           * Speech error
           */
          utterance.addEventListener(
            "error",
            function () {

              finishSpeaking(
                utterance
              );

            }
          );
        }

        return nativeSpeak(
          utterance
        );
      };

    /*
     * Public NOA speech API.
     *
     * Future AI brain can simply call:
     *
     * NOA.speak("Hello Ajay");
     */
    window.NOA =
      window.NOA || {};

    window.NOA.speak =
      function (
        text,
        options
      ) {

        const value =
          cleanText(text);

        if (!value) return;

        const utterance =
          new SpeechSynthesisUtterance(
            value
          );

        options =
          options || {};

        if (options.lang) {
          utterance.lang =
            options.lang;
        }

        if (
          Number.isFinite(
            options.rate
          )
        ) {
          utterance.rate =
            options.rate;
        }

        if (
          Number.isFinite(
            options.pitch
          )
        ) {
          utterance.pitch =
            options.pitch;
        }

        if (
          Number.isFinite(
            options.volume
          )
        ) {
          utterance.volume =
            options.volume;
        }

        window.speechSynthesis.cancel();

        window.speechSynthesis.speak(
          utterance
        );
      };
  }

  /*
   * Start after DOM is ready.
   */
  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );

  } else {

    init();

  }

})();
