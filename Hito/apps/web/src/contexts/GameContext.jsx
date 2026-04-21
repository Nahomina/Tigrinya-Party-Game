
import React, { createContext, useContext, useState, useCallback } from 'react';
import questionsData from '@/data/questionsData.js';

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('setup');
  const [gameMode, setGameModeState] = useState('team'); // 'team' or 'solo'
  const [soloPlayerName, setSoloPlayerNameState] = useState('');
  const [teams, setTeams] = useState({ team1: '', team2: '' });
  const [rounds, setRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [scores, setScores] = useState({ team1: 0, team2: 0 });
  const [roundScores, setRoundScores] = useState({ team1: 0, team2: 0 });
  const [category, setCategory] = useState('All');
  const [tier, setTier] = useState('gasha');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentTeam, setCurrentTeam] = useState('team1');
  const [usedQuestions, setUsedQuestions] = useState([]);

  // --- Team Play Functions ---
  const loadTeamStats = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('heto_team_stats') || '{}');
    } catch (e) {
      return {};
    }
  }, []);

  const calculateHeadToHead = useCallback((teamA, teamB) => {
    try {
      const scoresList = JSON.parse(localStorage.getItem('heto_scores') || '[]');
      const matchups = scoresList.filter(game => 
        (game.team1 === teamA && game.team2 === teamB) || 
        (game.team1 === teamB && game.team2 === teamA)
      );
      
      let teamAWins = 0;
      let teamBWins = 0;
      let ties = 0;

      matchups.forEach(game => {
        if (game.winner === teamA) teamAWins++;
        else if (game.winner === teamB) teamBWins++;
        else ties++;
      });

      return { teamAWins, teamBWins, ties, matchups, total: matchups.length };
    } catch (e) {
      return { teamAWins: 0, teamBWins: 0, ties: 0, matchups: [], total: 0 };
    }
  }, []);

  const saveGameResult = useCallback((t1, t2, score1, score2, winner, cat, currentTier, totalRounds) => {
    try {
      const now = new Date().toISOString();
      const newScore = {
        id: crypto.randomUUID(),
        team1: t1,
        team2: t2,
        team1Score: score1,
        team2Score: score2,
        winner,
        category: cat,
        tier: currentTier,
        playedAt: now,
        rounds: totalRounds,
        totalPossible: totalRounds * 15 * 2
      };

      const existingScores = JSON.parse(localStorage.getItem('heto_scores') || '[]');
      existingScores.push(newScore);
      localStorage.setItem('heto_scores', JSON.stringify(existingScores));

      const stats = loadTeamStats();
      const updateTeamStats = (teamName, teamScore, isWinner, isTie) => {
        if (!stats[teamName]) {
          stats[teamName] = { wins: 0, losses: 0, ties: 0, bestScore: 0, totalGames: 0, lastPlayedDate: now };
        }
        stats[teamName].totalGames++;
        stats[teamName].lastPlayedDate = now;
        stats[teamName].bestScore = Math.max(stats[teamName].bestScore, teamScore);
        
        if (isWinner) stats[teamName].wins++;
        else if (isTie) stats[teamName].ties = (stats[teamName].ties || 0) + 1;
        else stats[teamName].losses++;
      };

      const isTie = winner === 'Tie';
      updateTeamStats(t1, score1, winner === t1, isTie);
      updateTeamStats(t2, score2, winner === t2, isTie);

      localStorage.setItem('heto_team_stats', JSON.stringify(stats));
    } catch (e) {
      console.error("Failed to save game result", e);
    }
  }, [loadTeamStats]);

  // --- Solo Play Functions ---
  const setSoloGameMode = useCallback((mode) => {
    setGameModeState(mode);
  }, []);

  const setSoloPlayerName = useCallback((name) => {
    setSoloPlayerNameState(name);
  }, []);

  const calculateSoloScore = useCallback((isCorrect, timeSeconds) => {
    if (!isCorrect) return 0;
    let points = 10;
    const timeTaken = 20 - timeSeconds;
    if (timeTaken <= 5) points += 5;
    else if (timeTaken <= 10) points += 3;
    else if (timeTaken <= 15) points += 1;
    return points;
  }, []);

  const loadSoloStats = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('heto_solo_stats') || '{}');
    } catch (e) {
      return {};
    }
  }, []);

  const getSoloLeaderboard = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('heto_solo_scores') || '[]');
    } catch (e) {
      return [];
    }
  }, []);

  const saveSoloGameResult = useCallback((playerName, finalScore, cat, currentTier, totalRounds) => {
    try {
      const now = new Date().toISOString();
      const totalPossible = totalRounds * 15; // 1 question per round in solo
      
      const newScore = {
        id: crypto.randomUUID(),
        playerName,
        score: finalScore,
        category: cat,
        tier: currentTier,
        playedAt: now,
        rounds: totalRounds,
        totalPossible
      };

      const existingScores = getSoloLeaderboard();
      existingScores.push(newScore);
      localStorage.setItem('heto_solo_scores', JSON.stringify(existingScores));

      const stats = loadSoloStats();
      if (!stats[playerName]) {
        stats[playerName] = { bestScore: 0, totalGames: 0, totalScore: 0, averageScore: 0, lastPlayedDate: now };
      }
      
      stats[playerName].totalGames++;
      stats[playerName].totalScore += finalScore;
      stats[playerName].averageScore = Math.round(stats[playerName].totalScore / stats[playerName].totalGames);
      stats[playerName].bestScore = Math.max(stats[playerName].bestScore, finalScore);
      stats[playerName].lastPlayedDate = now;

      localStorage.setItem('heto_solo_stats', JSON.stringify(stats));
      
      return stats[playerName];
    } catch (e) {
      console.error("Failed to save solo game result", e);
      return null;
    }
  }, [getSoloLeaderboard, loadSoloStats]);

  // --- Core Game Flow ---
  const initializeGame = useCallback((team1Name, team2Name, selectedRounds, selectedCategory, selectedTier, mode = 'team', soloName = '') => {
    setGameModeState(mode);
    if (mode === 'solo') {
      setSoloPlayerNameState(soloName);
      setTeams({ team1: soloName, team2: '' });
      setRounds(10); // Enforce exactly 10 rounds for solo play
    } else {
      setTeams({ team1: team1Name, team2: team2Name });
      setRounds(selectedRounds);
    }
    setCategory(selectedCategory);
    setTier(selectedTier);
    setCurrentRound(1);
    setScores({ team1: 0, team2: 0 });
    setRoundScores({ team1: 0, team2: 0 });
    setCurrentTeam('team1');
    setUsedQuestions([]);
    setQuestionIndex(0);
    loadNextQuestion(selectedCategory, selectedTier, []);
    setCurrentScreen('question');
  }, []);

  const loadNextQuestion = useCallback((cat, tr, used) => {
    let availableQuestions = questionsData.filter(q => {
      const categoryMatch = cat === 'All' || q.category === cat;
      const tierMatch = q.tier === tr;
      const notUsed = !used.includes(q.id);
      return categoryMatch && tierMatch && notUsed;
    });

    if (availableQuestions.length === 0) {
      availableQuestions = questionsData.filter(q => {
        const categoryMatch = cat === 'All' || q.category === cat;
        const tierMatch = q.tier === tr;
        return categoryMatch && tierMatch;
      });
      setUsedQuestions([]);
    }

    if (availableQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];
      setCurrentQuestion(question);
      setUsedQuestions(prev => [...prev, question.id]);
      setSelectedAnswer(null);
      setTimeRemaining(20);
    }
  }, []);

  const submitAnswer = useCallback((answer, timeLeft) => {
    setSelectedAnswer(answer);
    
    const isCorrect = answer === currentQuestion?.correct;
    const points = calculateSoloScore(isCorrect, timeLeft);

    setRoundScores(prev => ({
      ...prev,
      [currentTeam]: prev[currentTeam] + points
    }));

    setCurrentScreen('reveal');
  }, [currentQuestion, currentTeam, calculateSoloScore]);

  const nextQuestion = useCallback(() => {
    if (gameMode === 'solo') {
      setCurrentScreen('summary');
    } else {
      const nextTeam = currentTeam === 'team1' ? 'team2' : 'team1';
      setCurrentTeam(nextTeam);

      if (currentTeam === 'team2') {
        setCurrentScreen('summary');
      } else {
        loadNextQuestion(category, tier, usedQuestions);
        setCurrentScreen('question');
      }
    }
  }, [currentTeam, category, tier, usedQuestions, loadNextQuestion, gameMode]);

  const nextRound = useCallback(() => {
    setScores(prev => ({
      team1: prev.team1 + roundScores.team1,
      team2: prev.team2 + roundScores.team2
    }));
    setRoundScores({ team1: 0, team2: 0 });

    if (currentRound >= rounds) {
      setCurrentScreen('winner');
    } else {
      setCurrentRound(prev => prev + 1);
      setCurrentTeam('team1');
      loadNextQuestion(category, tier, usedQuestions);
      setCurrentScreen('question');
    }
  }, [currentRound, rounds, roundScores, category, tier, usedQuestions, loadNextQuestion]);

  const resetGame = useCallback(() => {
    setCurrentScreen('setup');
    setTeams({ team1: '', team2: '' });
    setSoloPlayerNameState('');
    setRounds(5);
    setCurrentRound(1);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setTimeRemaining(20);
    setScores({ team1: 0, team2: 0 });
    setRoundScores({ team1: 0, team2: 0 });
    setCategory('All');
    setTier('gasha');
    setQuestionIndex(0);
    setCurrentTeam('team1');
    setUsedQuestions([]);
  }, []);

  const goToLeaderboard = useCallback(() => {
    setCurrentScreen('leaderboard');
  }, []);

  const goToHome = useCallback(() => {
    setCurrentScreen('setup');
  }, []);

  const value = {
    currentScreen,
    setCurrentScreen,
    gameMode,
    setSoloGameMode,
    soloPlayerName,
    setSoloPlayerName,
    calculateSoloScore,
    saveSoloGameResult,
    loadSoloStats,
    getSoloLeaderboard,
    teams,
    rounds,
    currentRound,
    currentQuestion,
    selectedAnswer,
    timeRemaining,
    setTimeRemaining,
    scores,
    roundScores,
    category,
    tier,
    questionIndex,
    currentTeam,
    initializeGame,
    submitAnswer,
    nextQuestion,
    nextRound,
    resetGame,
    goToLeaderboard,
    goToHome,
    saveGameResult,
    loadTeamStats,
    calculateHeadToHead
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
