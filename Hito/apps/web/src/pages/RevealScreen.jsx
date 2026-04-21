
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext.jsx';
import QuitConfirmationModal from '@/components/QuitConfirmationModal.jsx';
import { Check, X, LogOut, ArrowRight } from 'lucide-react';

const RevealScreen = () => {
  const navigate = useNavigate();
  const { currentQuestion, selectedAnswer, nextQuestion, currentTeam, resetGame, gameMode } = useGame();
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const hasAdvanced = useRef(false);

  useEffect(() => {
    if (!currentQuestion) {
      navigate('/setup');
    }
  }, [currentQuestion, navigate]);

  const handleNext = () => {
    if (hasAdvanced.current) return;
    hasAdvanced.current = true;
    
    // Remember currentTeam is the one who just played
    const movingToSummary = gameMode === 'solo' || currentTeam === 'team2';
    
    nextQuestion(); // Updates context state (switches team)
    
    if (movingToSummary) {
      navigate('/summary');
    } else {
      navigate('/question');
    }
  };

  // Auto-advance after 3 seconds
  useEffect(() => {
    if (!currentQuestion || isQuitModalOpen) return;
    
    const timer = setTimeout(() => {
      handleNext();
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentQuestion, isQuitModalOpen]);

  // Keyboard shortcut to quit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsQuitModalOpen(true);
      else if (e.key === 'Enter' && gameMode !== 'solo') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode]);

  const handleQuitConfirm = () => {
    setIsQuitModalOpen(false);
    resetGame();
    navigate('/');
  };

  if (!currentQuestion) return null;

  const options = ['A', 'B', 'C', 'D'];
  const isCorrect = selectedAnswer === currentQuestion.correct;

  return (
    <>
      <Helmet>
        <title>Answer Reveal - Heto</title>
        <meta name="description" content="See if your answer was correct!" />
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

          {/* Question */}
          <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-8 md:p-10 mb-8 border border-[var(--border)] mt-10 sm:mt-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text)] leading-relaxed mb-6">
              {currentQuestion.question}
            </h1>
            {isCorrect ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-[var(--correct)] rounded-full font-bold text-lg">
                <Check className="w-6 h-6" />
                <span>Correct!</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-[var(--danger)] rounded-full font-bold text-lg">
                <X className="w-6 h-6" />
                <span>Incorrect</span>
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {options.map((letter, index) => {
              const isThisCorrect = letter === currentQuestion.correct;
              const isThisSelected = letter === selectedAnswer;
              const isWrong = isThisSelected && !isThisCorrect;

              let className = 'w-full min-h-[64px] p-4 flex items-center gap-4 rounded-xl border-2 transition-all ';
              
              if (isThisCorrect) {
                className += 'border-[var(--correct)] bg-[var(--correct)] text-white spring-bounce shadow-lg shadow-green-900/20 z-10 relative';
              } else if (isWrong) {
                className += 'border-[var(--danger)] bg-[var(--danger)] text-white shadow-md';
              } else {
                className += 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] opacity-60';
              }

              return (
                <div key={letter} className={className}>
                  <span 
                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center font-bold text-lg rounded-lg ${
                      isThisCorrect || isWrong
                        ? 'bg-white'
                        : 'bg-[var(--bg-elevated)]'
                    }`}
                    style={{
                      color: isThisCorrect ? 'var(--correct)' : isWrong ? 'var(--danger)' : 'var(--text-muted)'
                    }}
                  >
                    {letter}
                  </span>
                  <span className="text-left font-medium flex-1 text-lg">
                    {currentQuestion.options[index]}
                  </span>
                  {isThisCorrect && (
                    <Check className="w-6 h-6 flex-shrink-0" strokeWidth={3} />
                  )}
                  {isWrong && (
                    <X className="w-6 h-6 flex-shrink-0" strokeWidth={3} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 md:p-8 mb-8 border border-[var(--border)]">
            <h3 className="font-bold text-[var(--text)] mb-3 flex items-center gap-2 uppercase tracking-wide text-sm">
              Explanation
            </h3>
            <p className="text-[var(--text)] leading-relaxed text-lg opacity-90">
              {currentQuestion.explanation}
            </p>
          </div>

          {/* Next Button (Only for team play) */}
          {gameMode !== 'solo' && (
            <button
              onClick={handleNext}
              className="w-full h-16 flex items-center justify-center gap-2 rounded-xl bg-[var(--text)] text-[var(--bg)] text-lg font-bold hover:opacity-90 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-slate-900/10"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          
          {gameMode === 'solo' && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium bg-[var(--bg-elevated)] px-4 py-2 rounded-full">
                <div className="w-4 h-4 rounded-full border-2 border-[var(--text-muted)] border-t-transparent animate-spin"></div>
                Auto-advancing...
              </div>
            </div>
          )}
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

export default RevealScreen;
