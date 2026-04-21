
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext.jsx';
import { Trophy, Home, BarChart3, RotateCcw } from 'lucide-react';

const WinnerScreen = () => {
  const navigate = useNavigate();
  const { 
    gameMode, soloPlayerName, teams, scores, roundScores, rounds, 
    category, tier, resetGame, goToLeaderboard, saveGameResult, 
    saveSoloGameResult, getSoloLeaderboard 
  } = useGame();
  
  const hasSaved = useRef(false);
  const [soloStats, setSoloStats] = useState(null);
  const [soloRank, setSoloRank] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const finalScores = {
    team1: scores.team1 + roundScores.team1,
    team2: scores.team2 + roundScores.team2
  };

  const winner = finalScores.team1 > finalScores.team2 ? teams.team1 : 
                 finalScores.team2 > finalScores.team1 ? teams.team2 : 'Tie';
  
  const totalPossibleTeam = rounds * 2 * 15;
  const totalPossibleSolo = rounds * 15;

  useEffect(() => {
    if (!hasSaved.current) {
      if (gameMode === 'solo') {
        const stats = saveSoloGameResult(soloPlayerName, finalScores.team1, category, tier, rounds);
        setSoloStats(stats);
        
        // Calculate rank
        const allScores = getSoloLeaderboard();
        const sortedScores = [...allScores].sort((a, b) => b.score - a.score);
        const rank = sortedScores.findIndex(s => s.playerName === soloPlayerName && s.score === finalScores.team1) + 1;
        const uniquePlayers = new Set(allScores.map(s => s.playerName)).size;
        
        setSoloRank(rank > 0 ? rank : 1);
        setTotalPlayers(uniquePlayers > 0 ? uniquePlayers : 1);
      } else {
        saveGameResult(
          teams.team1,
          teams.team2,
          finalScores.team1,
          finalScores.team2,
          winner,
          category,
          tier,
          rounds
        );
      }
      hasSaved.current = true;
    }
  }, [gameMode, soloPlayerName, teams, finalScores, winner, category, tier, rounds, saveGameResult, saveSoloGameResult, getSoloLeaderboard]);

  const handlePlayAgain = () => {
    resetGame();
    navigate('/setup');
  };

  const handleGoHome = () => {
    resetGame();
    navigate('/');
  };

  const handleViewLeaderboard = () => {
    goToLeaderboard();
    navigate('/leaderboard');
  };

  return (
    <>
      <Helmet>
        <title>{gameMode === 'solo' ? 'Challenge Complete - Heto' : `${winner === 'Tie' ? 'Tie Game' : winner + ' Wins!'} - Heto`}</title>
        <meta name="description" content="Game complete - see the final results!" />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="confetti-container">
          {[...Array(60)].map((_, i) => (
            <div 
              key={i} 
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
                backgroundColor: ['var(--red)', 'var(--correct)', 'var(--tier-qola)', 'var(--tier-gobez)', '#fbbf24'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto relative z-10 mt-8">
          <div className="text-center mb-12">
            <div className="inline-block bounce-trophy">
              <Trophy className="w-32 h-32 text-yellow-500 drop-shadow-lg mx-auto mb-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold tracking-widest text-[var(--text-muted)] uppercase mb-3">Final Results</h3>
            <h1 
              className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 text-[var(--text)] drop-shadow-sm"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}
            >
              {gameMode === 'solo' ? 'Challenge Complete!' : (winner === 'Tie' ? 'It\'s a Tie!' : `${winner} Wins!`)}
            </h1>
          </div>

          {gameMode === 'solo' ? (
            <div className="max-w-md mx-auto mb-10">
              <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-8 text-center border-2 border-yellow-500 scale-105 z-10 relative">
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-6 truncate">
                  {soloPlayerName}
                </h2>
                <div 
                  className="text-7xl font-bold text-[var(--text)] mb-2"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {finalScores.team1}
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium mb-6">
                  {Math.round((finalScores.team1 / totalPossibleSolo) * 100)}% accuracy
                </p>
                
                {soloStats && (
                  <div className="grid grid-cols-2 gap-4 text-left bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)]">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Best Score</p>
                      <p className="text-lg font-semibold text-[var(--text)]">{soloStats.bestScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Rank</p>
                      <p className="text-lg font-semibold text-[var(--text)]">#{soloRank} <span className="text-sm font-normal text-[var(--text-muted)]">of {totalPlayers}</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Total Games</p>
                      <p className="text-lg font-semibold text-[var(--text)]">{soloStats.totalGames}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Avg Score</p>
                      <p className="text-lg font-semibold text-[var(--text)]">{soloStats.averageScore}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className={`bg-[var(--bg-card)] shadow-lg rounded-2xl p-8 text-center border-2 transition-transform duration-500 ${winner === teams.team1 ? 'border-yellow-500 scale-105 z-10' : 'border-[var(--border)]'}`}>
                {winner === teams.team1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm">
                    Winner
                  </div>
                )}
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-6 truncate">
                  {teams.team1}
                </h2>
                <div 
                  className="text-7xl font-bold text-[var(--text)] mb-4"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {finalScores.team1}
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium">
                  {Math.round((finalScores.team1 / totalPossibleTeam) * 100)}% accuracy
                </p>
              </div>

              <div className={`bg-[var(--bg-card)] shadow-lg rounded-2xl p-8 text-center border-2 transition-transform duration-500 ${winner === teams.team2 ? 'border-yellow-500 scale-105 z-10' : 'border-[var(--border)]'}`}>
                {winner === teams.team2 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm">
                    Winner
                  </div>
                )}
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-6 truncate">
                  {teams.team2}
                </h2>
                <div 
                  className="text-7xl font-bold text-[var(--text)] mb-4"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {finalScores.team2}
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium">
                  {Math.round((finalScores.team2 / totalPossibleTeam) * 100)}% accuracy
                </p>
              </div>
            </div>
          )}

          <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-4 mb-10 overflow-hidden flex justify-center">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', minWidth: '300px', minHeight: '250px' }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXX"
              data-ad-format="rectangle"
              data-full-width-responsive="true"
            ></ins>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={handlePlayAgain}
              className="h-14 rounded-xl bg-[var(--red)] text-white font-semibold hover:bg-[var(--red-hover)] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>

            <button
              onClick={handleViewLeaderboard}
              className="h-14 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] font-semibold hover:bg-[var(--bg-card)] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
            >
              <BarChart3 className="w-5 h-5" />
              Leaderboard
            </button>

            <button
              onClick={handleGoHome}
              className="h-14 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] font-semibold hover:bg-[var(--bg-card)] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
            >
              <Home className="w-5 h-5" />
              Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WinnerScreen;
