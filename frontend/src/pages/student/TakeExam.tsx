import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  const [warningCount, setWarningCount] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isExamTerminated, setIsExamTerminated] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasStarted = useRef(false);
  const lastFullscreenState = useRef(false);

  // Fullscreen enforcement and Warning Logic
  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentFull = !!document.fullscreenElement;
      setIsFullscreen(currentFull);

      // If we were in fullscreen and exited, and the exam has started
      if (lastFullscreenState.current && !currentFull && hasStarted.current && !isExamTerminated) {
        handleViolation("Fullscreen Exited");
      }

      lastFullscreenState.current = currentFull;
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [sessionId, isExamTerminated, warningCount]);

  useEffect(() => {
    if (warningCount >= 3 && !isExamTerminated) {
      terminateExam();
    }
  }, [warningCount, isExamTerminated]);

  const handleViolation = async (type: string) => {
    setWarningCount(prev => prev + 1);

    if (sessionId) {
      try {
        await axios.post('/api/exams/session/warning', {
          sessionId,
          warningType: type,
          message: `User exited fullscreen (Total warnings: ${warningCount + 1})`
        });
      } catch (err) {
        console.error("Failed to log warning", err);
      }
    }
  };

  const terminateExam = () => {
    setIsExamTerminated(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
    // Finalize session in DB
    axios.post('/api/exams/submit', {
      examId: id,
      answers: {},
      completionTime: 3600 - timeLeft
    }).catch(err => console.error("Auto-submit failed", err));
  };

  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().then(async () => {
        if (!hasStarted.current) {
          hasStarted.current = true;
          try {
            const res = await axios.post('/api/exams/session/start', { examId: id });
            setSessionId(res.data.sessionId);
          } catch (err) {
            console.error("Failed to start session", err);
            // Fallback for demo if backend is not ready
            setSessionId(Math.floor(Math.random() * 1000));
          }
        }
      });
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

  if (isExamTerminated) {
    return (
      <div className="fullscreen-guard termination-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="guard-content neo-card"
        >
          <AlertTriangle size={48} className="text-error" />
          <h1 className="text-error">Exam Terminated</h1>
          <p>Your session has been terminated due to multiple rule violations (3/3 warnings). This incident has been reported to your instructor.</p>
          <button onClick={() => navigate('/student/dashboard')} className="neo-btn-primary">Return to Dashboard</button>
        </motion.div>
        <style>{`
          .termination-screen { background: rgba(20, 10, 10, 1); }
          .text-error { color: #ef4444; }
        `}</style>
      </div>
    )
  }

  if (!isFullscreen) {
    return (
      <div className="fullscreen-guard">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="guard-content neo-card"
        >
          {warningCount > 0 ? (
            <>
              <AlertTriangle size={64} className="text-warning pulse-warning" />
              <h1 className="text-warning">Rule Violation Detected</h1>
              <div className="warning-status">
                <span className="warning-pill">Warning {warningCount} of 3</span>
              </div>
              <p>You have exited the secure examination environment. Continuing to do so will result in automatic termination of your session.</p>
              <div className="warning-steps">
                <div className={`step ${warningCount >= 1 ? 'active' : ''}`}><span>1</span></div>
                <div className={`step ${warningCount >= 2 ? 'active' : ''}`}><span>2</span></div>
                <div className={`step ${warningCount >= 3 ? 'active' : ''}`}><span>3</span></div>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={48} className="text-accent" />
              <h1>Secure Session Required</h1>
              <p>This assessment requires an immersive environment. Please enable fullscreen to commence. Our AI proctoring system will monitor your session.</p>
            </>
          )}
          <button onClick={enterFullscreen} className="neo-btn-primary">
            {warningCount > 0 ? "Resume Secure Session" : "Initialize Secure Mode"}
          </button>
        </motion.div>
        <style>{`
          .fullscreen-guard {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
            position: relative;
          }
          .guard-content {
            max-width: 520px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            padding: 4rem;
            z-index: 1;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(20, 20, 22, 0.9);
          }
          .text-warning { color: #f97316; }
          .pulse-warning { animation: warning-pulse 1.5s infinite; }
          @keyframes warning-pulse {
            0% { transform: scale(1); filter: drop-shadow(0 0 0px #f97316); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 15px #f97316); }
            100% { transform: scale(1); filter: drop-shadow(0 0 0px #f97316); }
          }
          .warning-status { margin: 1rem 0; }
          .warning-pill {
            background: rgba(249, 115, 22, 0.1);
            color: #f97316;
            padding: 0.5rem 1.5rem;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.875rem;
            border: 1px solid rgba(249, 115, 22, 0.2);
          }
          .warning-steps {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
          }
          .warning-steps .step {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: var(--text-muted);
            transition: all 0.3s ease;
          }
          .warning-steps .step.active {
            border-color: #f97316;
            color: #f97316;
            background: rgba(249, 115, 22, 0.1);
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.2);
          }
          .guard-content h1 {
            font-family: var(--font-display);
            font-size: 2.25rem;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
          }
          .guard-content p {
            color: var(--text-secondary);
            line-height: 1.6;
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
          position: relative;
          overflow: hidden;
        }
        .exam-header {
          height: 80px;
          padding: 0 2.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(20, 20, 22, 0.8);
          backdrop-filter: blur(10px);
          z-index: 10;
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
          z-index: 1;
        }
        .question-area {
          flex: 1;
          padding: 3rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
          background: transparent;
        }
        .question-card {
          width: 100%;
          max-width: 800px;
          padding: 3rem;
          background: rgba(28, 28, 31, 0.6);
          backdrop-filter: blur(10px);
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
          background: rgba(20, 20, 22, 0.4);
          backdrop-filter: blur(20px);
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
