
import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext.jsx';
import QuitConfirmationModal from '@/components/QuitConfirmationModal.jsx';
import { LogOut } from 'lucide-react';

const QuestionScreen = () => {
  const navigate = useNavigate();
  const {
    currentQuestion,
    currentTeam,
    teams,
    currentRound,
    rounds,
    timeRemaining,
    setTimeRemaining,
    submitAnswer,
    questionIndex,
    resetGame,
    gameMode
  } = useGame();

  const [selectedOption, setSelectedOption] = useState(null);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryEmojis = {
    'Geography': '🗺️',
    'History': '📜',
    'Culture & Traditions': '🌿',
    'Language': '🔤',
    'Music & Art': '🎵',
    'General Knowledge': '🧠'
  };

  // Timer logic
  useEffect(() => {
    if (!currentQuestion) {
      navigate('/setup');
      return;
    }

    if (isQuitModalOpen || isSubmitting) return; // Pause timer if modal is open or submitting

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          
          if (gameMode === 'solo') {
            setIsSubmitting(true);
            submitAnswer(null, 0);
            navigate('/reveal');
          }
          
          return 0; // Timer hits zero
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, navigate, setTimeRemaining, isQuitModalOpen, gameMode, submitAnswer, isSubmitting]);

  const handleOptionClick = useCallback((letter) => {
    if (isSubmitting) return;
    
    setSelectedOption(letter);
    
    if (gameMode === 'solo') {
      setIsSubmitting(true);
      submitAnswer(letter, timeRemaining);
      navigate('/reveal');
    }
  }, [gameMode, isSubmitting, navigate, submitAnswer, timeRemaining]);

  const handleSubmit = useCallback(() => {
    if (selectedOption && !isSubmitting) {
      setIsSubmitting(true);
      submitAnswer(selectedOption, timeRemaining);
      navigate('/reveal');
    }
  }, [selectedOption, isSubmitting, submitAnswer, timeRemaining, navigate]);

  // Keyboard shortcut logic
  useEffect(() => {
    if (isQuitModalOpen || isSubmitting) return;

    const handleKeyDown = (e) => {
      if (e.key === '1') handleOptionClick('A');
      else if (e.key === '2') handleOptionClick('B');
      else if (e.key === '3') handleOptionClick('C');
      else if (e.key === '4') handleOptionClick('D');
      else if (e.key === 'Escape') setIsQuitModalOpen(true);
      else if (e.key === 'Enter' && selectedOption && gameMode !== 'solo') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, isQuitModalOpen, isSubmitting, handleOptionClick, handleSubmit, gameMode]);

  const handleQuitConfirm = () => {
    setIsQuitModalOpen(false);
    resetGame();
    navigate('/');
  };

  if (!currentQuestion) {
    return null;
  }

  const options = ['A', 'B', 'C', 'D'];
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeRemaining / 20) * circumference;

  return (
    <>
      <Helmet>
        <title>{`Question ${gameMode === 'solo' ? currentRound : questionIndex + 1} - Heto`}</title>
        <meta name="description" content="Answer the trivia question before time runs out!" />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto relative">
          
          {/* Quit Button */}
          <div className="absolute top-0 right-0 z-10">
            <button 
              onClick={() => setIsQuitModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
              aria-label="Quit Game"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Quit</span>
            </button>
          </div>

          {/* Header Info */}
          <div className="flex items-center justify-between mb-8 mt-10 sm:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span 
                className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-full text-[var(--text)] font-semibold text-sm inline-flex items-center gap-2"
              >
                <span>{categoryEmojis[currentQuestion.category]}</span>
                <span className="truncate max-w-[120px] sm:max-w-none">{currentQuestion.category}</span>
              </span>
              <span className="text-[var(--text-muted)] text-sm font-medium tracking-wide uppercase px-2">
                {gameMode === 'solo' 
                  ? `Question ${currentRound} of 10` 
                  : `Round ${currentRound} of ${rounds}`
                }
              </span>
            </div>

            {/* Timer */}
            <div className="relative ml-4 flex-shrink-0">
              <svg width="80" height="80" className="transform -rotate-90 drop-shadow-sm">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="var(--border)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={timeRemaining === 0 ? 'var(--text-muted)' : timeRemaining <= 5 ? 'var(--danger)' : 'var(--red)'}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-2xl font-bold"
                  style={{ 
                    fontFamily: "'Bebas Neue', sans-serif",
                    color: timeRemaining === 0 ? 'var(--text-muted)' : timeRemaining <= 5 ? 'var(--danger)' : 'var(--text)',
                    letterSpacing: '0.05em'
                  }}
                >
                  {timeRemaining}
                </span>
              </div>
            </div>
          </div>

          {/* Current Team / Player */}
          <div className="mb-6 text-center">
            <p className="text-[var(--text-muted)] mb-1 font-medium tracking-wider text-sm uppercase">
              {gameMode === 'solo' ? 'Playing As' : 'Current Player'}
            </p>
            <h2 
              className="text-4xl md:text-5xl font-bold text-[var(--text)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}
            >
              {teams[currentTeam]}
            </h2>
          </div>

          {/* Question */}
          <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-8 md:p-10 mb-8 border border-[var(--border)]">
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text)] leading-relaxed">
              {currentQuestion.question}
            </h1>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {options.map((letter, index) => (
              <button
                key={letter}
                onClick={() => handleOptionClick(letter)}
                disabled={isSubmitting}
                className={`w-full min-h-[64px] p-4 flex items-center gap-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed ${
                  selectedOption === letter
                    ? 'border-[var(--red)] bg-[var(--red)] text-white shadow-md'
                    : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] hover:border-[var(--border-mid)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <span 
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center font-bold text-lg rounded-lg ${
                    selectedOption === letter
                      ? 'bg-white text-[var(--red)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                  }`}
                >
                  {letter}
                </span>
                <span className="text-left font-medium flex-1 text-lg">
                  {currentQuestion.options[index]}
                </span>
              </button>
            ))}
          </div>

          {/* Submit Button (Only for team play) */}
          {gameMode !== 'solo' && (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || isSubmitting}
              className="w-full h-16 rounded-xl bg-[var(--red)] text-white text-lg font-semibold hover:bg-[var(--red-hover)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--red)] shadow-lg shadow-red-900/20"
            >
              {selectedOption ? 'Submit Answer' : 'Select an answer'}
            </button>
          )}

          <p className="text-center text-sm text-[var(--text-muted)] mt-6 font-medium">
            Keyboard: Press 1-4 to select{gameMode !== 'solo' && ', Enter to submit'}, Esc to quit
          </p>
        </div>
      </div>

      <QuitConfirmationModal 
        isOpen={isQuitModalOpen}
        onConfirm={handleQuitConfirm}
        onCancel={() => setIsQuitModalOpen(false)}
      />
    </>
  );
};

export default QuestionScreen;
