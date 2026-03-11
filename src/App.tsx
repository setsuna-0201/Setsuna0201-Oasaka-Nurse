import { useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hand,
  Heart,
  Phone,
  Siren,
  User,
  Zap,
  Activity,
} from "lucide-react";
import "./App.css";
import aedMain3091 from "./assets/photos/aed-main-3091.jpg";
import aedOpen3092 from "./assets/photos/aed-open-3092.jpg";
import breathingCheck3093 from "./assets/photos/breathing-check-3093.jpg";
import cprCenter3094 from "./assets/photos/cpr-center-3094.jpg";
import cprDepth3095 from "./assets/photos/cpr-depth-3095.jpg";

interface SlideData {
  id: number;
  step: string;
  title: string;
  subTitle: string;
  accentColor: string;
  bgGradient: string;
  content: ReactNode;
}

interface SwipeStart {
  x: number;
  y: number;
  at: number;
}

const SWIPE_MIN_DISTANCE_PX = 56;
const SWIPE_MAX_OFF_AXIS_PX = 72;
const SWIPE_MAX_DURATION_MS = 650;
const TOTAL_SLIDES = 8;

function CircularTimer({
  duration,
  isPlaying,
  onComplete,
}: {
  duration: number;
  isPlaying: boolean;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedMsRef = useRef(0);

  const cancelFrame = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      cancelFrame();
      if (startedAtRef.current !== null) {
        elapsedMsRef.current += performance.now() - startedAtRef.current;
        startedAtRef.current = null;
      }
      return;
    }

    startedAtRef.current = performance.now();

    const tick = () => {
      const startedAt = startedAtRef.current ?? performance.now();
      const totalElapsed = elapsedMsRef.current + (performance.now() - startedAt);
      const nextProgress = Math.min((totalElapsed / duration) * 100, 100);
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        elapsedMsRef.current = 0;
        startedAtRef.current = null;
        setProgress(0);
        onComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return cancelFrame;
  }, [cancelFrame, duration, isPlaying, onComplete]);

  useEffect(() => cancelFrame, [cancelFrame]);

  const size = 64;
  const strokeWidth = 5;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="timer-wrap" aria-label="Slide timer">
      <svg width={size} height={size} className="timer-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="timer-track"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="timer-progress"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="timer-text">{isPlaying ? "AUTO" : "PAUSE"}</span>
    </div>
  );
}

function TorsoWithPads() {
  return (
    <div className="torso-wrap" aria-label="AEDパッド貼付位置のイラスト">
      <svg viewBox="0 0 260 320" className="torso-base" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="50%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#d1d5db" />
          </linearGradient>
        </defs>
        <circle cx="130" cy="38" r="28" fill="url(#skinGradient)" />
        <path d="M48 92 Q130 72 212 92 L222 312 L38 312 L48 92" fill="url(#skinGradient)" />
        <path d="M74 98 Q130 112 186 98" fill="none" stroke="#9ca3af" strokeWidth="2" />
        <path d="M130 94 L130 224" fill="none" stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 5" opacity="0.7" />
      </svg>

      <div className="pad-box pad-top">
        <Zap size={22} />
        <span>右鎖骨の下</span>
      </div>

      <div className="pad-box pad-bottom">
        <Heart size={20} />
        <span>左脇腹</span>
      </div>

      <svg viewBox="0 0 260 320" className="pad-wire" aria-hidden="true">
        <path d="M96 132 C122 148, 148 172, 170 204" />
        <path d="M94 142 C130 162, 144 194, 162 230" />
      </svg>
    </div>
  );
}

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "prev">("next");
  const [cprPulse, setCprPulse] = useState(0);

  const transitionLockRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const slideDuration = 10000;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCprPulse((prev) => (prev + 1) % 2);
    }, 275);
    return () => window.clearInterval(interval);
  }, []);

  const startTransition = useCallback(
    (direction: "next" | "prev", updater: (prev: number, total: number) => number) => {
      if (transitionLockRef.current) return;
      transitionLockRef.current = true;
      setTransitionDirection(direction);
      setIsTransitioning(true);

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = window.setTimeout(() => {
        setCurrentSlide((prev) => updater(prev, TOTAL_SLIDES));
        setIsTransitioning(false);
        transitionLockRef.current = false;
        transitionTimeoutRef.current = null;
      }, 320);
    },
    [],
  );

  const handleNext = useCallback(() => {
    startTransition("next", (prev, total) => (prev + 1) % total);
  }, [startTransition]);

  const handlePrev = useCallback(() => {
    startTransition("prev", (prev, total) => (prev - 1 + total) % total);
  }, [startTransition]);

  const parseSwipe = useCallback(
    (endX: number, endY: number, endAt: number) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start) return;

      const deltaX = endX - start.x;
      const deltaY = endY - start.y;
      const duration = endAt - start.at;

      if (duration > SWIPE_MAX_DURATION_MS) return;
      if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE_PX) return;
      if (Math.abs(deltaY) > SWIPE_MAX_OFF_AXIS_PX) return;

      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    },
    [handleNext, handlePrev],
  );

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      at: performance.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      parseSwipe(touch.clientX, touch.clientY, performance.now());
    },
    [parseSwipe],
  );

  const resetSwipe = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handlePrev();
      }
      if (event.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const slides: SlideData[] = [
    {
      id: 0,
      step: "START",
      title: "だれかが たおれたら",
      subTitle: "みんなで たすける 7ステップ",
      accentColor: "#f43f5e",
      bgGradient: "linear-gradient(135deg, #881337 0%, #111827 55%, #020617 100%)",
      content: (
        <section className="slide-grid single">
          <div className="hero-icon">
            <Heart size={92} />
          </div>
          <p className="lead">
            あわてなくて大丈夫。
            <br />
            この7つを順番にすると、
            <strong> 命を守る行動 </strong>
            ができます。
          </p>
          <div className="chip-row">
            <span className="chip">こえかけ</span>
            <span className="chip">119</span>
            <span className="chip">むねをおす</span>
            <span className="chip">AED</span>
          </div>
        </section>
      ),
    },
    {
      id: 1,
      step: "STEP 1",
      title: "1. こえをかける",
      subTitle: "よびかけ",
      accentColor: "#3b82f6",
      bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid two-col">
          <div className="card">
            <User size={84} />
            <p className="card-title">かたをトントンして聞く</p>
            <p className="card-note">「だいじょうぶ？」と大きな声で</p>
          </div>
          <div className="card muted">
            <Hand size={42} />
            <p className="card-title">へんじがなければ次へ</p>
            <p className="card-note">まよったら、すぐ助けを呼ぼう</p>
          </div>
        </section>
      ),
    },
    {
      id: 2,
      step: "STEP 2",
      title: "2. おとなをよぶ",
      subTitle: "119 と AED",
      accentColor: "#f59e0b",
      bgGradient: "linear-gradient(135deg, #78350f 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid two-col">
          <div className="card">
            <Phone size={42} />
            <p className="card-title">119に電話する</p>
            <p className="card-note">「どこで」「だれが」を落ち着いて話す</p>
          </div>
          <div className="card">
            <Zap size={42} />
            <p className="card-title">AEDを持ってきてもらう</p>
            <p className="card-note">「あなた、AEDお願いします」と頼む</p>
          </div>
          <p className="helper-note">
            <ArrowRight size={14} /> ほかの人には「救急車の案内」もお願いする
          </p>
        </section>
      ),
    },
    {
      id: 3,
      step: "STEP 3",
      title: "3. いきをみる",
      subTitle: "10びょうだけ",
      accentColor: "#14b8a6",
      bgGradient: "linear-gradient(135deg, #134e4a 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid two-col">
          <div className="card">
            <Activity size={44} className={cprPulse === 0 ? "pulse-soft" : "pulse-strong"} />
            <p className="card-title">10びょうで確認</p>
            <p className="card-note">むねとおなかが動くか見る</p>
          </div>
          <div className="card warning">
            <AlertTriangle size={42} />
            <p className="card-title">おかしないきは危ない</p>
            <p className="card-note">しゃくりあげるような呼吸は「いきなし」</p>
          </div>
          <figure className="photo-panel media-span">
            <img
              src={breathingCheck3093}
              alt="顔と胸の動きを見て呼吸を確認するイラスト"
              className="slide-photo"
              loading="lazy"
            />
            <figcaption>口元と胸の動きを見て、10秒で判断する</figcaption>
          </figure>
        </section>
      ),
    },
    {
      id: 4,
      step: "STEP 4",
      title: "4. むねをおす",
      subTitle: "リズムよく",
      accentColor: "#ef4444",
      bgGradient: "linear-gradient(135deg, #7f1d1d 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid cpr-layout">
          <div className="card wide">
            <Heart size={72} className={cprPulse === 0 ? "cpr-down" : "cpr-up"} />
            <p className="card-title">まんなかを 強く・はやく</p>
            <p className="card-note">1分で100〜120回。5cmくらいしずむ強さで</p>
            <div className="chip-row">
              <span className="chip danger">ふかさ 5cm</span>
              <span className="chip danger">1分 100-120回</span>
              <span className="chip danger">おしたら もどす</span>
            </div>
          </div>
          <figure className="photo-panel cpr-photo">
            <div className="photo-frame">
              <img
                src={cprCenter3094}
                alt="胸骨圧迫で胸の中央を押しているイラスト"
                className="slide-photo"
                loading="lazy"
              />
              <span className="photo-badge">左右の胸の真ん中を押す</span>
            </div>
            <figcaption>手は胸のまんなか（胸骨）に重ねる</figcaption>
          </figure>
          <figure className="photo-panel cpr-photo">
            <div className="photo-frame">
              <img
                src={cprDepth3095}
                alt="5センチの深さで胸骨圧迫しているイラスト"
                className="slide-photo"
                loading="lazy"
              />
              <span className="photo-badge">目安は 約5cm</span>
            </div>
            <figcaption>体重をかけて、しっかり沈むまで押す</figcaption>
          </figure>
        </section>
      ),
    },
    {
      id: 5,
      step: "STEP 5",
      title: "5. AEDシールをはる",
      subTitle: "はる場所",
      accentColor: "#10b981",
      bgGradient: "linear-gradient(135deg, #064e3b 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid pad-layout">
          <div className="card pad-card aed-photo-card">
            <div className="apple-photo-stage">
              <img
                src={aedMain3091}
                alt="AED一式の写真"
                className="slide-photo apple-blend-photo"
                loading="lazy"
              />
            </div>
            <img
              src={aedOpen3092}
              alt="AEDを開いた状態の写真"
              className="slide-photo aed-sub-photo"
              loading="lazy"
            />
            <p className="card-note">3091は背景に自然になじむ見え方に調整</p>
          </div>
          <div className="card pad-info">
            <TorsoWithPads />
          </div>
          <div className="card pad-info media-span">
            <p className="card-title">シールは2まい</p>
            <ol className="plain-list ordered">
              <li>みぎむねの上</li>
              <li>ひだりわきの下</li>
            </ol>
            <p className="card-note">かさならないようにして、音声ガイドどおりに進める</p>
            <p className="helper-note">
              <ArrowRight size={14} /> ぬれていたらふく。ネックレスははずす
            </p>
          </div>
        </section>
      ),
    },
    {
      id: 6,
      step: "STEP 6",
      title: "6. ボタン前に声かけ",
      subTitle: "みんな はなれて",
      accentColor: "#f97316",
      bgGradient: "linear-gradient(135deg, #7c2d12 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid single">
          <div className="card shock">
            <Zap size={56} />
            <p className="card-title">ショックします。はなれて！</p>
            <ul className="plain-list">
              <li>からだに さわらない</li>
              <li>「みんな はなれて」と大きく言う</li>
              <li>おわったら すぐむねをおす</li>
            </ul>
          </div>
        </section>
      ),
    },
    {
      id: 7,
      step: "GOAL",
      title: "7. つづけて待つ",
      subTitle: "きゅうきゅうたいへ",
      accentColor: "#a855f7",
      bgGradient: "linear-gradient(135deg, #581c87 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid single">
          <div className="hero-icon">
            <Siren size={76} />
          </div>
          <p className="lead">
            救急隊が来るまで、
            <br />
            交代しながら続けよう。あなたの行動が命を守る。
          </p>
          <p className="finish-tag">
            <CheckCircle2 size={18} /> よくできました
          </p>
        </section>
      ),
    },
  ];

  const current = slides[currentSlide];
  const slideShellClassName = `slide-shell ${isTransitioning ? `is-transitioning to-${transitionDirection}` : ""}`;

  return (
    <div className="bls-app">
      <div className="bls-bg" style={{ background: current.bgGradient }} />
      <div className="bls-overlay" />

      <header className="bls-header">
        <div className="brand-wrap">
          <span className="step-bar" style={{ backgroundColor: current.accentColor }} />
          <div>
            <p className="brand-title">こどもでもわかる AEDガイド</p>
            <p className="brand-step">{current.step}</p>
          </div>
        </div>

        <div className="header-meta">
          <p className="slide-index">{currentSlide + 1} / {slides.length}</p>
          <p className="auto-note">10秒でつぎへ</p>
          <button
            type="button"
            className="timer-button"
            onClick={() => setIsPlaying((prev) => !prev)}
            aria-label={isPlaying ? "Pause auto slide" : "Resume auto slide"}
          >
            <CircularTimer
              key={currentSlide}
              duration={slideDuration}
              isPlaying={isPlaying}
              onComplete={handleNext}
            />
          </button>
        </div>
      </header>

      <main
        className="bls-main gesture-surface"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetSwipe}
      >
        <div className={slideShellClassName}>
          <p className="sub-title" style={{ color: current.accentColor }}>
            {current.subTitle}
          </p>
          <h1 className="slide-title">{current.title}</h1>
          {current.content}
          <p className="gesture-hint">左右スワイプでページ移動。10秒ごとに自動で進みます。</p>
        </div>
      </main>

      <footer className="bls-footer">
        <div className="dot-wrap">
          {slides.map((slide, index) => {
            const isActive = currentSlide === index;
            return (
              <button
                key={slide.id}
                type="button"
                className={`dot ${isActive ? "active" : ""}`}
                style={isActive ? { backgroundColor: slide.accentColor } : undefined}
                onClick={() => {
                  setCurrentSlide(index);
                }}
                aria-label={`Go to ${slide.step}`}
              />
            );
          })}
        </div>
        <div className="nav-wrap">
          <button type="button" className="nav-btn" onClick={handlePrev} aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="nav-btn next"
            onClick={handleNext}
            style={{ background: `linear-gradient(90deg, ${current.accentColor} 0%, #111827 100%)` }}
            aria-label="Next slide"
          >
            つぎへ <ChevronRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
