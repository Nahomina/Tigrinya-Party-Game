
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '@/contexts/GameContext.jsx';
import { ArrowLeft, Users, User, CheckCircle2, AlertTriangle, Plus, Minus, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

const SetupScreen = () => {
  const navigate = useNavigate();
  const { initializeGame, setSoloGameMode, setSoloPlayerName } = useGame();
  
  const [localGameMode, setLocalGameMode] = useState('team');
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [soloName, setSoloName] = useState('');
  const [selectedRounds, setSelectedRounds] = useState(5);
  const [selectedTier, setSelectedTier] = useState('gasha');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [errors, setErrors] = useState({});

  // Map existing logic tiers to the visually requested tiers
  const tiers = [
    { value: 'gasha', label: 'Easy 🟢', labelGe: 'ጋሻ' },
    { value: 'qola', label: 'Medium 🟡', labelGe: 'ቆልዓ' },
    { value: 'gobez', label: 'Hard 🔴', labelGe: 'ጎበዝ' },
    { value: 'shimagile', label: 'Expert ☠️', labelGe: 'ሽማግለ' }
  ];

  const categories = [
    { value: 'All', label: 'All', emoji: '🎲' },
    { value: 'Geography', label: 'Geography', emoji: '🌍' },
    { value: 'History', label: 'History', emoji: '🏛️' },
    { value: 'Culture & Traditions', label: 'Culture', emoji: '🌿' },
    { value: 'Language', label: 'Language', emoji: '🔤' },
    { value: 'Music & Art', label: 'Art & Music', emoji: '🎨' },
    { value: 'General Knowledge', label: 'Knowledge', emoji: '🧠' }
  ];

  // Keyboard support for rounds
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (localGameMode !== 'team') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        setSelectedRounds(prev => Math.min(10, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        setSelectedRounds(prev => Math.max(1, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localGameMode]);

  const handleModeChange = (mode) => {
    setLocalGameMode(mode);
    setSoloGameMode(mode);
    setErrors({});
  };

  const validateInput = (value) => {
    return value.trim().length >= 2 && value.trim().length <= 30;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (localGameMode === 'team') {
      if (!validateInput(team1Name)) newErrors.team1 = 'Name must be 2-30 characters';
      if (!validateInput(team2Name)) newErrors.team2 = 'Name must be 2-30 characters';
      if (team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase() && validateInput(team1Name)) {
        newErrors.team2 = 'Team names must be different';
      }
    } else {
      if (!validateInput(soloName)) {
        newErrors.solo = 'Player name must be 2-30 characters';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (localGameMode === 'solo') {
      setSoloPlayerName(soloName.trim());
      initializeGame('', '', 10, selectedCategory, selectedTier, 'solo', soloName.trim());
    } else {
      initializeGame(team1Name.trim(), team2Name.trim(), selectedRounds, selectedCategory, selectedTier, 'team', '');
    }
    
    navigate('/question');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

  return (
    <>
      <Helmet>
        <title>Setup Game - Heto</title>
        <meta name="description" content="Set up your Heto trivia game - choose teams, rounds, difficulty, and category." />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg)] py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-[600px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="mb-8 flex items-center"
          >
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-medium p-2 -ml-2 rounded-lg hover:bg-[var(--bg-elevated)]"
              aria-label="Go back to home"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </motion.div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 sm:p-8 rounded-2xl shadow-sm">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 
                className="text-4xl md:text-5xl font-bold mb-2 text-[var(--text)]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}
              >
                Setup Game
              </h1>
              <p className="text-[var(--text-muted)] text-lg">Configure your trivia match</p>
            </motion.div>

            <motion.form 
              variants={containerVariants} 
              initial="hidden" 
              animate="show" 
              onSubmit={handleSubmit} 
              className="space-y-8"
            >
              {/* 1. GAME MODE SELECTOR */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => handleModeChange('team')}
                  className={`flex-1 h-28 md:h-[120px] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 border-2 ${
                    localGameMode === 'team'
                      ? 'bg-[var(--red)] border-[var(--red)] text-white shadow-lg shadow-red-500/25 scale-[1.02] md:scale-105 z-10'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-mid)] hover:text-[var(--text)] hover:scale-[1.02]'
                  }`}
                  aria-pressed={localGameMode === 'team'}
                >
                  <Users className={`w-8 h-8 ${localGameMode === 'team' ? 'animate-bounce-subtle' : ''}`} />
                  <span className="font-bold text-lg md:text-xl tracking-wide">Team Play</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('solo')}
                  className={`flex-1 h-28 md:h-[120px] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 border-2 ${
                    localGameMode === 'solo'
                      ? 'bg-[var(--red)] border-[var(--red)] text-white shadow-lg shadow-red-500/25 scale-[1.02] md:scale-105 z-10'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-mid)] hover:text-[var(--text)] hover:scale-[1.02]'
                  }`}
                  aria-pressed={localGameMode === 'solo'}
                >
                  <User className={`w-8 h-8 ${localGameMode === 'solo' ? 'animate-bounce-subtle' : ''}`} />
                  <span className="font-bold text-lg md:text-xl tracking-wide">Solo Play</span>
                </button>
              </motion.div>

              {/* 2. PLAYER NAME INPUTS */}
              <motion.div variants={itemVariants} className="space-y-5">
                {localGameMode === 'team' ? (
                  <>
                    <div>
                      <Label htmlFor="team1" className="text-[var(--text)] mb-2 block font-semibold text-base">Team 1 Name</Label>
                      <div className={`p-[2px] rounded-xl transition-all duration-300 bg-gradient-to-r ${errors.team1 ? 'from-red-500 to-red-600' : 'from-transparent to-transparent focus-within:from-[var(--red)] focus-within:to-[var(--accent-orange)]'}`}>
                        <div className="relative bg-[var(--bg-elevated)] rounded-[10px] flex items-center shadow-sm h-14">
                          <input
                            id="team1"
                            type="text"
                            value={team1Name}
                            onChange={(e) => { setTeam1Name(e.target.value); setErrors(prev => ({ ...prev, team1: '' })); }}
                            placeholder="Enter team 1 name"
                            className="w-full h-full bg-transparent px-4 text-[16px] font-medium text-[var(--text)] placeholder:italic placeholder:text-[var(--text-muted)] focus:outline-none rounded-[10px]"
                          />
                          {validateInput(team1Name) && !errors.team1 && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-4" />
                          )}
                        </div>
                      </div>
                      {errors.team1 && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-[var(--danger)] mt-2 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-4 h-4" /> {errors.team1}
                        </motion.p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="team2" className="text-[var(--text)] mb-2 block font-semibold text-base">Team 2 Name</Label>
                      <div className={`p-[2px] rounded-xl transition-all duration-300 bg-gradient-to-r ${errors.team2 ? 'from-red-500 to-red-600' : 'from-transparent to-transparent focus-within:from-[var(--red)] focus-within:to-[var(--accent-orange)]'}`}>
                        <div className="relative bg-[var(--bg-elevated)] rounded-[10px] flex items-center shadow-sm h-14">
                          <input
                            id="team2"
                            type="text"
                            value={team2Name}
                            onChange={(e) => { setTeam2Name(e.target.value); setErrors(prev => ({ ...prev, team2: '' })); }}
                            placeholder="Enter team 2 name"
                            className="w-full h-full bg-transparent px-4 text-[16px] font-medium text-[var(--text)] placeholder:italic placeholder:text-[var(--text-muted)] focus:outline-none rounded-[10px]"
                          />
                          {validateInput(team2Name) && !errors.team2 && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-4" />
                          )}
                        </div>
                      </div>
                      {errors.team2 && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-[var(--danger)] mt-2 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-4 h-4" /> {errors.team2}
                        </motion.p>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="soloName" className="text-[var(--text)] mb-2 block font-semibold text-base">Player Name</Label>
                    <div className={`p-[2px] rounded-xl transition-all duration-300 bg-gradient-to-r ${errors.solo ? 'from-red-500 to-red-600' : 'from-transparent to-transparent focus-within:from-[var(--red)] focus-within:to-[var(--accent-orange)]'}`}>
                      <div className="relative bg-[var(--bg-elevated)] rounded-[10px] flex items-center shadow-sm h-14">
                        <input
                          id="soloName"
                          type="text"
                          value={soloName}
                          onChange={(e) => { setSoloName(e.target.value); setErrors(prev => ({ ...prev, solo: '' })); }}
                          placeholder="Enter player name"
                          className="w-full h-full bg-transparent px-4 text-[16px] font-medium text-[var(--text)] placeholder:italic placeholder:text-[var(--text-muted)] focus:outline-none rounded-[10px]"
                        />
                        {validateInput(soloName) && !errors.solo && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-4" />
                        )}
                      </div>
                    </div>
                    {errors.solo && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-[var(--danger)] mt-2 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-4 h-4" /> {errors.solo}
                      </motion.p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* 3. DIFFICULTY TIER SELECTOR */}
              <motion.div variants={itemVariants}>
                <Label className="text-[var(--text)] mb-3 block font-semibold text-base">Difficulty Level</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tiers.map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => setSelectedTier(tier.value)}
                      className={`h-16 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border ${
                        selectedTier === tier.value
                          ? 'bg-[var(--red)] border-[var(--red)] text-white shadow-md scale-105 z-10'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-mid)] hover:text-[var(--text)] hover:scale-[1.02]'
                      }`}
                      aria-pressed={selectedTier === tier.value}
                    >
                      <span className="font-bold text-[14px]">{tier.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* 4. CATEGORY SELECTOR */}
              <motion.div variants={itemVariants}>
                <Label className="text-[var(--text)] mb-3 block font-semibold text-base">Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value)}
                      className={`h-14 px-3 rounded-xl flex items-center gap-2 transition-all duration-200 border ${
                        selectedCategory === category.value
                          ? 'bg-[var(--red)] border-[var(--red)] text-white shadow-md'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] hover:border-[var(--border-mid)] hover:bg-[var(--bg)]'
                      }`}
                      aria-pressed={selectedCategory === category.value}
                    >
                      <span className="text-xl flex-shrink-0">{category.emoji}</span>
                      <span className="font-medium text-sm sm:text-base truncate">{category.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* 5 & 6. ROUNDS / QUESTIONS BADGE */}
              <motion.div variants={itemVariants}>
                {localGameMode === 'team' ? (
                  <div>
                    <Label className="text-[var(--text)] mb-3 block font-semibold text-base flex justify-between">
                      <span>Number of Rounds</span>
                      <span className="text-[var(--text-muted)] text-sm font-normal">Min 1, Max 10</span>
                    </Label>
                    <div className="flex items-center justify-between bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden h-16 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setSelectedRounds(prev => Math.max(1, prev - 1))}
                        disabled={selectedRounds <= 1}
                        className="w-20 h-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--red)] hover:text-white transition-all duration-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text)] active:scale-[0.9] origin-center"
                        aria-label="Decrease rounds"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      
                      <div className="flex-1 text-center font-bold text-3xl text-[var(--text)] tabular-nums tracking-tight">
                        {selectedRounds}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedRounds(prev => Math.min(10, prev + 1))}
                        disabled={selectedRounds >= 10}
                        className="w-20 h-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--red)] hover:text-white transition-all duration-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text)] active:scale-[0.9] origin-center"
                        aria-label="Increase rounds"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-[var(--text)] mb-3 block font-semibold text-base">Game Length</Label>
                    <div className="h-16 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[16px] shadow-md bg-gradient-to-r from-[var(--red)] to-[var(--accent-orange)] animate-pulse-subtle border border-[var(--red)]">
                      <Check className="w-5 h-5 stroke-[3]" />
                      10 Questions Challenge
                    </div>
                  </div>
                )}
              </motion.div>

              {/* 7. START BUTTON */}
              <motion.div variants={itemVariants} className="pt-2">
                <button
                  type="submit"
                  className="w-full h-16 bg-gradient-to-r from-[var(--red)] to-[#d32f2f] text-white font-bold text-lg md:text-xl rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none disabled:grayscale"
                >
                  {localGameMode === 'solo' ? 'Start Solo Challenge' : 'Start Game'}
                </button>
              </motion.div>
            </motion.form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupScreen;
