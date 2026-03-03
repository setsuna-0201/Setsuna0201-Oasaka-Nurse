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
  const [cprPulse, setCprPulse] = useState(0);

  const transitionLockRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const slideDuration = 12000;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCprPulse((prev) => (prev + 1) % 2);
    }, 275);
    return () => window.clearInterval(interval);
  }, []);

  const startTransition = useCallback((updater: (prev: number, total: number) => number) => {
    if (transitionLockRef.current) return;
    transitionLockRef.current = true;
    setIsTransitioning(true);

    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      setCurrentSlide((prev) => updater(prev, 8));
      setIsTransitioning(false);
      transitionLockRef.current = false;
      transitionTimeoutRef.current = null;
    }, 320);
  }, []);

  const handleNext = useCallback(() => {
    startTransition((prev, total) => (prev + 1) % total);
  }, [startTransition]);

  const handlePrev = useCallback(() => {
    startTransition((prev, total) => (prev - 1 + total) % total);
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

      setIsPlaying(false);
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
        setIsPlaying(false);
        handlePrev();
      }
      if (event.key === "ArrowRight") {
        setIsPlaying(false);
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
      step: "INTRO",
      title: "救命の連鎖をつなぐのはあなた",
      subTitle: "Basic Life Support Guide",
      accentColor: "#f43f5e",
      bgGradient: "linear-gradient(135deg, #881337 0%, #111827 55%, #020617 100%)",
      content: (
        <section className="slide-grid single">
          <div className="hero-icon">
            <Heart size={92} />
          </div>
          <p className="lead">
            目の前で人が倒れたとき、何ができますか？
            <br />
            勇気ある一歩を踏み出すための
            <strong> 7つのステップ </strong>
            を、現場を想定して短時間で学べます。
          </p>
          <div className="chip-row">
            <span className="chip">反応確認</span>
            <span className="chip">119通報</span>
            <span className="chip">胸骨圧迫</span>
            <span className="chip">AED</span>
          </div>
        </section>
      ),
    },
    {
      id: 1,
      step: "STEP 01",
      title: "反応の確認",
      subTitle: "Check Response",
      accentColor: "#3b82f6",
      bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid two-col">
          <div className="card">
            <User size={84} />
            <p className="card-title">肩を叩きながら呼びかける</p>
            <p className="card-note">「大丈夫ですか!?」と耳元で大きな声で確認</p>
          </div>
          <div className="card muted">
            <Hand size={42} />
            <p className="card-title">反応なしなら次へ</p>
            <p className="card-note">迷った場合も心停止として、直ちに次の行動へ</p>
          </div>
        </section>
      ),
    },
    {
      id: 2,
      step: "STEP 02",
      title: "助けを呼ぶ",
      subTitle: "Call for Help",
      accentColor: "#f59e0b",
      bgGradient: "linear-gradient(135deg, #78350f 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid two-col">
          <div className="card">
            <Phone size={42} />
            <p className="card-title">119番通報</p>
            <p className="card-note">場所・状況・患者状態を短く順に伝える</p>
          </div>
          <div className="card">
            <Zap size={42} />
            <p className="card-title">AEDの手配</p>
            <p className="card-note">指差しで「あなた、AEDをお願いします」</p>
          </div>
          <p className="helper-note">
            <ArrowRight size={14} /> 周囲の人には「救急車の誘導」「交代要員」も依頼
          </p>
        </section>
      ),
    },
    {
      id: 3,
      step: "STEP 03",
      title: "呼吸の確認",
      subTitle: "Check Breathing",
      accentColor: "#14b8a6",
      bgGradient: "linear-gradient(135deg, #134e4a 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid two-col">
          <div className="card">
            <Activity size={44} className={cprPulse === 0 ? "pulse-soft" : "pulse-strong"} />
            <p className="card-title">10秒以内で確認</p>
            <p className="card-note">胸とお腹の動きを見て、正常呼吸か判断する</p>
          </div>
          <div className="card warning">
            <AlertTriangle size={42} />
            <p className="card-title">死戦期呼吸に注意</p>
            <p className="card-note">しゃくり上げる呼吸は「呼吸なし」で対応する</p>
          </div>
        </section>
      ),
    },
    {
      id: 4,
      step: "STEP 04",
      title: "胸骨圧迫",
      subTitle: "CPR",
      accentColor: "#ef4444",
      bgGradient: "linear-gradient(135deg, #7f1d1d 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid single">
          <div className="card wide">
            <Heart size={72} className={cprPulse === 0 ? "cpr-down" : "cpr-up"} />
            <p className="card-title">5cm沈む強さで 100〜120回/分</p>
            <p className="card-note">胸の真ん中を、強く・速く・絶え間なく圧迫</p>
            <div className="chip-row">
              <span className="chip danger">DEPTH: 約5cm</span>
              <span className="chip danger">TEMPO: 100-120</span>
              <span className="chip danger">FULL RECOIL</span>
            </div>
          </div>
        </section>
      ),
    },
    {
      id: 5,
      step: "STEP 05",
      title: "AEDパッドの位置",
      subTitle: "Pad Placement",
      accentColor: "#10b981",
      bgGradient: "linear-gradient(135deg, #064e3b 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid pad-layout">
          <div className="card pad-card">
            <TorsoWithPads />
          </div>
          <div className="card pad-info">
            <p className="card-title">心臓を挟む位置に2枚</p>
            <ol className="plain-list ordered">
              <li>右鎖骨の下（胸の右上）</li>
              <li>左脇腹（胸の左下）</li>
            </ol>
            <p className="card-note">パッド同士は重ならない。機器の音声指示に従って操作する。</p>
            <p className="helper-note">
              <ArrowRight size={14} /> 金属アクセサリを外し、濡れた肌は拭き取る
            </p>
          </div>
        </section>
      ),
    },
    {
      id: 6,
      step: "STEP 06",
      title: "電気ショック",
      subTitle: "Electric Shock",
      accentColor: "#f97316",
      bgGradient: "linear-gradient(135deg, #7c2d12 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid single">
          <div className="card shock">
            <Zap size={56} />
            <p className="card-title">離れてください！</p>
            <ul className="plain-list">
              <li>解析中・充電中は患者に触れない</li>
              <li>ショック指示が出たら周囲へ離れるよう声かけ</li>
              <li>ショック後は即座に胸骨圧迫を再開する</li>
            </ul>
          </div>
        </section>
      ),
    },
    {
      id: 7,
      step: "FINISH",
      title: "あきらめない心",
      subTitle: "Don't Give Up",
      accentColor: "#a855f7",
      bgGradient: "linear-gradient(135deg, #581c87 0%, #111827 60%, #020617 100%)",
      content: (
        <section className="slide-grid single">
          <div className="hero-icon">
            <Siren size={76} />
          </div>
          <p className="lead">
            救急隊に引き継ぐまで、絶え間なく続ける。
            <br />
            あなたの行動が誰かの未来をつなぎます。
          </p>
          <p className="finish-tag">
            <CheckCircle2 size={18} /> BLS CYCLE COMPLETE
          </p>
        </section>
      ),
    },
  ];

  const current = slides[currentSlide];

  return (
    <div className="bls-app">
      <div className="bls-bg" style={{ background: current.bgGradient }} />
      <div className="bls-overlay" />

      <header className="bls-header">
        <div className="brand-wrap">
          <span className="step-bar" style={{ backgroundColor: current.accentColor }} />
          <div>
            <p className="brand-title">AED & BLS GUIDE</p>
            <p className="brand-step">{current.step}</p>
          </div>
        </div>

        <div className="header-meta">
          <p className="slide-index">{currentSlide + 1} / {slides.length}</p>
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
        <div className={`slide-shell ${isTransitioning ? "is-transitioning" : ""}`}>
          <p className="sub-title" style={{ color: current.accentColor }}>
            {current.subTitle}
          </p>
          <h1 className="slide-title">{current.title}</h1>
          {current.content}
          <p className="gesture-hint">iPadでは左右フリックでスライド移動できます</p>
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
                  setIsPlaying(false);
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
            NEXT <ChevronRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
