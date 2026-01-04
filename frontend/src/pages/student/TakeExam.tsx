import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sidebar as SidebarIcon
} from 'lucide-react';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fullscreen enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  // Timer logic
  useEffect(() => {
    if (!isFullscreen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFullscreen]);

  // Camera initialization
  useEffect(() => {
    if (isFullscreen && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Camera access denied", err));
    }
  }, [isFullscreen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isFullscreen) {
    return (
      <div className="fullscreen-guard">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="guard-content neo-card"
        >
          <AlertTriangle size={48} className="text-accent" />
          <h1>Secure Session Required</h1>
          <p>This assessment requires an immersive environment. Please enable fullscreen to commence.</p>
          <button onClick={enterFullscreen} className="neo-btn-primary">Initialize Secure Mode</button>
        </motion.div>
        <style>{`
          .fullscreen-guard {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg);
          }
          .guard-content {
            max-width: 480px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            padding: 3rem;
          }
          .guard-content h1 {
            font-family: var(--font-display);
            font-size: 2rem;
            color: var(--text-primary);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="exam-take-layout">
      <header className="exam-header">
        <div className="exam-info">
          <span className="exam-id">ID: {id?.substring(0, 8)}</span>
          <h2 className="exam-title">Quantum Mechanics Mid-Term</h2>
        </div>

        <div className={`exam-timer ${timeLeft < 300 ? 'warning' : ''}`}>
          <Clock size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <button className="neo-btn-primary finish-btn" onClick={() => navigate('/student/dashboard')}>
          Finalize Submission
        </button>
      </header>

      <div className="exam-workspace">
        <main className="question-area">
          <div className="question-card neo-card">
            <header className="q-header">
              <span className="q-number">Inquiry {currentQuestion + 1} of 20</span>
              <span className="q-points">5 Points</span>
            </header>

            <div className="q-content">
              <p>Consider a particle in a one-dimensional infinite square well of width L. If the particle is in the first excited state, what is the probability of finding the particle in the left half of the well?</p>

              <div className="options-grid">
                {['0.25', '0.50', '0.75', '1.00'].map((opt, i) => (
                  <button key={i} className="option-btn">
                    <span className="opt-idx">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            <footer className="question-nav">
              <button
                className="text-btn"
                onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
              >
                <ChevronLeft /> Previous
              </button>
              <button
                className="text-btn"
                onClick={() => setCurrentQuestion(q => Math.min(19, q + 1))}
              >
                Next <ChevronRight />
              </button>
            </footer>
          </div>
        </main>

        <aside className={`exam-sidebar ${showSidebar ? '' : 'collapsed'}`}>
          <div className="proctoring-box neo-card">
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline muted />
              <div className="proctor-status">
                <div className="status-dot pulse"></div>
                <span>AI Proctoring Active</span>
              </div>
            </div>
            <div className="proctor-metrics">
              <div className="metric"><span>Faces Detected</span> <strong>1</strong></div>
              <div className="metric"><span>Focus Score</span> <strong>98%</strong></div>
            </div>
          </div>

          <div className="question-palette neo-card">
            <h3>Navigation Palette</h3>
            <div className="palette-grid">
              {Array.from({ length: 20 }).map((_, i) => (
                <button
                  key={i}
                  className={`palette-idx ${i === currentQuestion ? 'active' : ''} ${i < 5 ? 'answered' : ''}`}
                  onClick={() => setCurrentQuestion(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <button
          className="sidebar-toggle"
          onClick={() => setShowSidebar(!showSidebar)}
          style={{ right: showSidebar ? '360px' : '1rem' }}
        >
          <SidebarIcon size={20} />
        </button>
      </div>

      <style>{`
        .exam-take-layout {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          overflow: hidden;
        }
        .exam-header {
          height: 80px;
          padding: 0 2.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-low);
        }
        .exam-timer {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: monospace;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          padding: 0.5rem 1.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .exam-timer.warning {
          color: var(--error);
          border-color: var(--error);
          animation: timer-pulse 2s infinite;
        }
        .exam-workspace {
          flex: 1;
          display: flex;
          position: relative;
          overflow: hidden;
        }
        .question-area {
          flex: 1;
          padding: 3rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
        }
        .question-card {
          width: 100%;
          max-width: 800px;
          padding: 3rem;
        }
        .q-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .q-content p {
          font-size: 1.25rem;
          line-height: 1.6;
          margin-bottom: 3rem;
          color: var(--text-primary);
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .option-btn {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.25rem 2rem;
          background: var(--surface-low);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
          text-align: left;
          color: var(--text-primary);
          font-family: inherit;
          cursor: pointer;
        }
        .option-btn:hover {
          border-color: var(--accent);
          background: var(--surface);
        }
        .opt-idx {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 50%;
          font-weight: 700;
          font-size: 0.875rem;
        }
        .question-nav {
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
        }
        .exam-sidebar {
          width: 360px;
          padding: 1.5rem;
          border-left: 1px solid var(--border);
          background: var(--surface-low);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transition: transform 0.3s ease;
        }
        .exam-sidebar.collapsed {
          position: absolute;
          right: 0;
          transform: translateX(100%);
        }
        .camera-view {
          position: relative;
          border-radius: var(--radius-sm);
          overflow: hidden;
          aspect-ratio: 4 / 3;
          background: #000;
          margin-bottom: 1rem;
        }
        .camera-view video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .proctor-status {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.8rem;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 20px;
          font-size: 0.75rem;
          color: #fff;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
        }
        .status-dot.pulse {
          animation: dot-pulse 2s infinite;
        }
        .proctor-metrics {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .metric {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }
        .metric span {
          color: var(--text-muted);
        }
        .palette-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .palette-idx {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 600;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .palette-idx.active {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--surface-high);
        }
        .palette-idx.answered {
          background: var(--accent);
          color: var(--bg);
          border-color: var(--accent);
        }
        .sidebar-toggle {
          position: absolute;
          top: 1rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-low);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          transition: right 0.3s ease;
          color: var(--text-primary);
          cursor: pointer;
          z-index: 20;
        }
        @keyframes timer-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes dot-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TakeExam;
