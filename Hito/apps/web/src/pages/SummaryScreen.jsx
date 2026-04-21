
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext.jsx';
import QuitConfirmationModal from '@/components/QuitConfirmationModal.jsx';
import { LogOut } from 'lucide-react';

const SummaryScreen = () => {
  const navigate = useNavigate();
  const { 
    gameMode, soloPlayerName, teams, roundScores, scores, 
    currentRound, rounds, nextRound, saveGameResult, saveSoloGameResult, 
    resetGame, category, tier 
  } = useGame();
  
  const [countdown, setCountdown] = useState(5);
  const [showScores, setShowScores] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

  useEffect(() => {
    const scoreTimer = setTimeout(() => setShowScores(true), 300);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(scoreTimer);
    };
  }, []);

  const handleNext = () => {
    nextRound();
    if (currentRound >= rounds) {
      navigate('/winner');
    } else {
      navigate('/question');
    }
  };

  const handleQuitConfirm = () => {
    setIsQuitModalOpen(false);
    
    if (gameMode === 'solo') {
      const totalScore = scores.team1 + roundScores.team1;
      saveSoloGameResult(soloPlayerName, totalScore, category, tier, currentRound);
    } else {
      const totalScore1 = scores.team1 + roundScores.team1;
      const totalScore2 = scores.team2 + roundScores.team2;
      const winner = totalScore1 > totalScore2 ? teams.team1 : totalScore2 > totalScore1 ? teams.team2 : 'Tie';
      saveGameResult(teams.team1, teams.team2, totalScore1, totalScore2, winner, category, tier, currentRound);
    }

    resetGame();
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>{gameMode === 'solo' ? `Question ${currentRound} Summary - Heto` : `Round ${currentRound} Summary - Heto`}</title>
        <meta name="description" content="Round summary and scores" />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto relative">
          
          <div className="absolute top-0 right-0 z-10">
            <button 
              onClick={() => setIsQuitModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
              aria-label="Quit Game"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Save & Quit</span>
            </button>
          </div>

          <div className="text-center mb-12 mt-10 sm:mt-0">
            <h3 className="text-sm font-bold tracking-widest text-[var(--text-muted)] uppercase mb-2">
              {gameMode === 'solo' ? 'Question Complete' : 'Round Complete'}
            </h3>
            <h1 
              className="text-5xl md:text-6xl font-bold text-[var(--text)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}
            >
              {gameMode === 'solo' ? `Question ${currentRound}` : `Round ${currentRound}`}
            </h1>
          </div>

          {/* Round Scores */}
          {gameMode === 'solo' ? (
            <div className="max-w-md mx-auto mb-10">
              <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-8 text-center border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--text-muted)] opacity-20"></div>
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-6 truncate">
                  {soloPlayerName}
                </h2>
                <div 
                  className={`text-7xl font-bold text-[var(--text)] mb-4 ${showScores ? 'float-up' : 'opacity-0'}`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  +{roundScores.team1}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] rounded-full">
                  <span className="text-sm text-[var(--text-muted)] font-medium uppercase tracking-wide">Your Score</span>
                  <span className="font-bold text-lg text-[var(--text)]">{scores.team1 + roundScores.team1}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-8 text-center border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--text-muted)] opacity-20"></div>
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-6 truncate">
                  {teams.team1}
                </h2>
                <div 
                  className={`text-7xl font-bold text-[var(--text)] mb-4 ${showScores ? 'float-up' : 'opacity-0'}`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  +{roundScores.team1}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] rounded-full">
                  <span className="text-sm text-[var(--text-muted)] font-medium uppercase tracking-wide">Total Score</span>
                  <span className="font-bold text-lg text-[var(--text)]">{scores.team1 + roundScores.team1}</span>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-8 text-center border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--text-muted)] opacity-20"></div>
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-6 truncate">
                  {teams.team2}
                </h2>
                <div 
                  className={`text-7xl font-bold text-[var(--text)] mb-4 ${showScores ? 'float-up' : 'opacity-0'}`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif", animationDelay: '0.1s' }}
                >
                  +{roundScores.team2}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] rounded-full">
                  <span className="text-sm text-[var(--text-muted)] font-medium uppercase tracking-wide">Total Score</span>
                  <span className="font-bold text-lg text-[var(--text)]">{scores.team2 + roundScores.team2}</span>
                </div>
              </div>
            </div>
          )}

          {/* AdSense Slot 1 */}
          <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-4 mb-10 overflow-hidden flex justify-center">
            <ins
              className="adsbygoogle w-full"
              style={{ display: 'block', minHeight: '90px' }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXX"
              data-ad-format="horizontal"
              data-full-width-responsive="true"
            ></ins>
          </div>

          {/* Next Round Button */}
          <button
            onClick={handleNext}
            disabled={countdown > 0}
            className="w-full h-16 rounded-xl bg-[var(--red)] text-white text-lg font-semibold hover:bg-[var(--red-hover)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--red)] shadow-lg shadow-red-900/20"
          >
            {countdown > 0 
              ? (gameMode === 'solo' ? `Next Question (${countdown}s)` : `Next Round (${countdown}s)`)
              : currentRound >= rounds 
                ? 'View Final Results' 
                : (gameMode === 'solo' ? 'Start Next Question' : 'Start Next Round')
            }
          </button>
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

export default SummaryScreen;
