import { useEffect, useRef } from "react";

// Ported from kasah-kod-intro.html — the Kasah Kod brand intro shown once
// per session before the app. Runs on the Web Animations API to match the
// original's timing exactly; a plain CSS transition couldn't stagger the
// per-letter spring the same way.
const TEXT = "kasah kod";

interface SplashIntroProps {
  onComplete: () => void;
}

export function SplashIntro({ onComplete }: SplashIntroProps) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const blRef = useRef<HTMLSpanElement>(null);
  const brRef = useRef<HTMLSpanElement>(null);
  const floodRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const word = wordRef.current;
    const bl = blRef.current;
    const br = brRef.current;
    const flood = floodRef.current;
    const veil = veilRef.current;
    const logo = logoRef.current;
    if (!word || !bl || !br || !flood || !veil || !logo) return;

    const letters: HTMLSpanElement[] = [];
    for (const c of TEXT) {
      const span = document.createElement("span");
      if (c === " ") {
        span.className = "kk-sp";
      } else {
        span.className = "kk-ch";
        span.textContent = c;
        letters.push(span);
      }
      word.appendChild(span);
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onCompleteRef.current();
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animations: Animation[] = [];

    if (reduce) {
      flood.style.clipPath = "circle(150% at 50% 50%)";
      [bl, br, ...letters].forEach((el) => (el.style.opacity = "1"));
      const t = window.setTimeout(finish, 500);
      return () => window.clearTimeout(t);
    }

    const ease = "cubic-bezier(.2,.9,.25,1)";
    const spring = "cubic-bezier(.34,1.56,.64,1)";

    const animate = (el: Element, kf: Keyframe[], opt: KeyframeAnimationOptions) => {
      const a = el.animate(kf, { fill: "both", ...opt });
      animations.push(a);
      return a;
    };

    // How far each brace must travel to sit together in the centre
    const lr = logo.getBoundingClientRect();
    const cx = lr.left + lr.width / 2;
    const b1 = bl.getBoundingClientRect();
    const b2 = br.getBoundingClientRect();
    const dl = cx - (b1.left + b1.width / 2) - b1.width * 0.28;
    const dr = cx - (b2.left + b2.width / 2) + b2.width * 0.28;

    ([[bl, dl], [br, dr]] as const).forEach(([el, d]) => {
      animate(
        el,
        [
          { opacity: 0, transform: `translateX(${d}px) scale(.4)` },
          { opacity: 1, transform: `translateX(${d}px) scale(1.12)`, offset: 0.45 },
          { opacity: 1, transform: `translateX(${d}px) scale(1)`, offset: 0.6 },
          { opacity: 1, transform: "translateX(0) scale(1)" },
        ],
        { duration: 950, easing: ease },
      );
    });

    animate(
      flood,
      [
        { clipPath: "circle(0% at 50% 50%)" },
        { clipPath: "circle(0% at 50% 50%)", offset: 0.38 },
        { clipPath: "circle(150% at 50% 50%)" },
      ],
      { duration: 1150, easing: "cubic-bezier(.7,0,.3,1)" },
    );

    letters.forEach((el, i) => {
      animate(
        el,
        [
          {
            opacity: 0,
            transform: "translateY(.55em) scale(.9)",
            filter: "blur(6px)",
            textShadow:
              "0 .18em 0 rgba(28,26,23,.22), 0 .36em 0 rgba(28,26,23,.12), 0 .54em 0 rgba(28,26,23,.06)",
          },
          { opacity: 1, offset: 0.35 },
          {
            opacity: 1,
            transform: "translateY(0) scale(1)",
            filter: "blur(0)",
            textShadow: "0 0 0 rgba(28,26,23,0), 0 0 0 rgba(28,26,23,0), 0 0 0 rgba(28,26,23,0)",
          },
        ],
        { duration: 560, delay: 600 + i * 45, easing: spring },
      );
    });

    // hold, then dip to black — this is what hands off to the app underneath
    const veilAnim = animate(
      veil,
      [
        { opacity: 0 },
        { opacity: 0, offset: 0.833 },
        { opacity: 1 },
      ],
      { duration: 3000, easing: "ease-in" },
    );

    veilAnim.finished.then(finish).catch(() => {});
    // Safety net in case the Animation's finished promise never settles
    // (e.g. tab backgrounded mid-animation).
    const fallback = window.setTimeout(finish, 3600);

    return () => {
      window.clearTimeout(fallback);
      animations.forEach((a) => a.cancel());
    };
  }, []);

  return (
    <div className="kk-stage" onClick={onComplete} role="presentation">
      <style>{`
        .kk-stage {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          background: #000;
          overflow: hidden;
          cursor: pointer;
          font-family: Georgia, "Times New Roman", serif;
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .kk-flood {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 45%, #FBF8F1 0%, #F5F2EA 55%, #ECE6D8 100%);
          clip-path: circle(0% at 50% 50%);
        }
        .kk-logo {
          position: relative;
          display: flex;
          align-items: center;
          font-size: clamp(44px, 11vw, 140px);
          line-height: 1;
          white-space: nowrap;
        }
        .kk-brace {
          color: #E8762C;
          font-weight: 400;
          display: inline-block;
          opacity: 0;
          position: relative;
          z-index: 2;
        }
        .kk-l { margin-right: 0.22em; }
        .kk-r { margin-left: 0.22em; }
        .kk-word { display: inline-flex; color: #1C1A17; }
        .kk-ch { display: inline-block; opacity: 0; will-change: transform, filter, opacity; }
        .kk-sp { width: 0.28em; }
        .kk-veil {
          position: absolute;
          inset: 0;
          background: #000;
          opacity: 0;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>
      <div className="kk-flood" ref={floodRef} />
      <div className="kk-logo" ref={logoRef}>
        <span className="kk-brace kk-l" ref={blRef}>{"{"}</span>
        <span className="kk-word" ref={wordRef} />
        <span className="kk-brace kk-r" ref={brRef}>{"}"}</span>
      </div>
      <div className="kk-veil" ref={veilRef} />
    </div>
  );
}
