
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, ArrowLeft, History, User, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGame } from '@/contexts/GameContext.jsx';

const LeaderboardScreen = () => {
  const navigate = useNavigate();
  const { loadTeamStats, getSoloLeaderboard, loadSoloStats } = useGame();
  
  const [rawTeamScores, setRawTeamScores] = useState([]);
  const [rawSoloScores, setRawSoloScores] = useState([]);
  
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');

  const categories = ['All', 'Geography', 'History', 'Culture & Traditions', 'Language', 'Music & Art', 'General Knowledge'];
  const tiers = [{ value: 'All', label: 'All Tiers' }, { value: 'gasha', label: 'Gasha' }, { value: 'qola', label: "Qol'a" }, { value: 'gobez', label: 'Gobez' }, { value: 'shimagile', label: 'Shimagile' }];

  useEffect(() => {
    loadLeaderboardData();
    const interval = setInterval(() => {
      loadLeaderboardData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaderboardData = () => {
    const tScores = JSON.parse(localStorage.getItem('heto_scores') || '[]');
    setRawTeamScores(tScores);
    
    const sScores = getSoloLeaderboard();
    setRawSoloScores(sScores);
  };

  // Processed Data based on filters
  const processedTeamStats = useMemo(() => {
    const filtered = rawTeamScores.filter(game => 
      (categoryFilter === 'All' || game.category === categoryFilter) &&
      (tierFilter === 'All' || game.tier === tierFilter)
    );

    const statsMap = {};
    filtered.forEach(game => {
      const t1 = game.team1;
      const t2 = game.team2;
      
      if (!statsMap[t1]) statsMap[t1] = { name: t1, wins: 0, losses: 0, ties: 0, totalGames: 0, lastPlayed: game.playedAt, category: game.category, tier: game.tier };
      if (!statsMap[t2]) statsMap[t2] = { name: t2, wins: 0, losses: 0, ties: 0, totalGames: 0, lastPlayed: game.playedAt, category: game.category, tier: game.tier };
      
      statsMap[t1].totalGames++;
      statsMap[t2].totalGames++;
      
      if (new Date(game.playedAt) > new Date(statsMap[t1].lastPlayed)) {
        statsMap[t1].lastPlayed = game.playedAt;
        statsMap[t1].category = game.category;
        statsMap[t1].tier = game.tier;
      }
      if (new Date(game.playedAt) > new Date(statsMap[t2].lastPlayed)) {
        statsMap[t2].lastPlayed = game.playedAt;
        statsMap[t2].category = game.category;
        statsMap[t2].tier = game.tier;
      }

      if (game.winner === t1) {
        statsMap[t1].wins++;
        statsMap[t2].losses++;
      } else if (game.winner === t2) {
        statsMap[t2].wins++;
        statsMap[t1].losses++;
      } else {
        statsMap[t1].ties++;
        statsMap[t2].ties++;
      }
    });

    return Object.values(statsMap)
      .sort((a, b) => b.wins - a.wins || (b.wins / b.totalGames) - (a.wins / a.totalGames))
      .slice(0, 50);
  }, [rawTeamScores, categoryFilter, tierFilter]);

  const processedH2H = useMemo(() => {
    const filtered = rawTeamScores.filter(game => 
      (categoryFilter === 'All' || game.category === categoryFilter) &&
      (tierFilter === 'All' || game.tier === tierFilter)
    );

    const h2hMap = {};
    filtered.forEach(game => {
      const teams = [game.team1, game.team2].sort();
      const matchKey = teams.join(' vs ');
      
      if (!h2hMap[matchKey]) {
        h2hMap[matchKey] = { 
          teams, 
          team1Wins: 0, 
          team2Wins: 0, 
          ties: 0, 
          lastPlayed: game.playedAt, 
          games: [],
          category: game.category,
          tier: game.tier
        };
      }
      
      const record = h2hMap[matchKey];
      if (game.winner === teams[0]) record.team1Wins++;
      else if (game.winner === teams[1]) record.team2Wins++;
      else record.ties++;
      
      if (new Date(game.playedAt) > new Date(record.lastPlayed)) {
        record.lastPlayed = game.playedAt;
        record.category = game.category;
        record.tier = game.tier;
      }
      record.games.push(game);
    });

    return Object.values(h2hMap).sort((a, b) => {
      const aMaxWins = Math.max(a.team1Wins, a.team2Wins);
      const bMaxWins = Math.max(b.team1Wins, b.team2Wins);
      return bMaxWins - aMaxWins || new Date(b.lastPlayed) - new Date(a.lastPlayed);
    });
  }, [rawTeamScores, categoryFilter, tierFilter]);

  const processedSoloStats = useMemo(() => {
    const filtered = rawSoloScores.filter(game => 
      (categoryFilter === 'All' || game.category === categoryFilter) &&
      (tierFilter === 'All' || game.tier === tierFilter)
    );

    const playerMap = {};
    filtered.forEach(score => {
      const p = score.playerName;
      if (!playerMap[p]) {
        playerMap[p] = { 
          name: p, 
          bestScore: score.score, 
          totalGames: 0, 
          totalScore: 0, 
          lastPlayed: score.playedAt,
          category: score.category,
          tier: score.tier
        };
      }
      
      playerMap[p].totalGames++;
      playerMap[p].totalScore += score.score;
      
      if (score.score > playerMap[p].bestScore) {
        playerMap[p].bestScore = score.score;
        playerMap[p].lastPlayed = score.playedAt;
        playerMap[p].category = score.category;
        playerMap[p].tier = score.tier;
      }
    });

    return Object.values(playerMap)
      .map(p => ({ ...p, averageScore: Math.round(p.totalScore / p.totalGames) }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 50);
  }, [rawSoloScores, categoryFilter, tierFilter]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-sm" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300 drop-shadow-sm" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-700 drop-shadow-sm" />;
    return <span className="text-[var(--text-muted)] font-bold text-lg">#{rank}</span>;
  };

  const getTierColor = (tier) => {
    const colors = {
      gasha: 'var(--tier-gasha)',
      qola: 'var(--tier-qola)',
      gobez: 'var(--tier-gobez)',
      shimagile: 'var(--tier-shimagile)'
    };
    return colors[tier] || 'var(--text-muted)';
  };

  const TeamScoreRow = ({ stat, rank, index }) => {
    const winRate = stat.totalGames > 0 ? Math.round((stat.wins / stat.totalGames) * 100) : 0;
    
    return (
      <div 
        className={`flex flex-col lg:flex-row lg:items-center gap-4 p-4 md:p-5 rounded-xl bg-[var(--bg-card)] border ${rank <= 3 ? 'border-2' : 'border-[var(--border)]'} hover:shadow-md transition-all duration-200 stagger-slide-in mb-3`}
        style={{ 
          animationDelay: `${index * 0.05}s`,
          borderColor: rank === 1 ? '#eab308' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#b45309' : undefined,
          backgroundColor: rank === 1 ? 'rgba(234, 179, 8, 0.03)' : undefined
        }}
      >
        <div className="flex items-center gap-4 lg:w-1/4">
          <div className="w-10 text-center flex-shrink-0 flex justify-center">
            {getRankIcon(rank)}
          </div>
          <p className="font-bold text-[var(--text)] text-lg truncate">{stat.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 lg:flex-1 text-center lg:text-left">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Record</p>
            <p className="font-bold text-[var(--text)]">{stat.wins}W - {stat.losses}L</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Win Rate</p>
            <p className="font-bold text-[var(--text)]">{winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Last Played</p>
            <p className="font-medium text-[var(--text)] text-sm">{new Date(stat.lastPlayed).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between lg:w-1/4 lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-[var(--border)]">
          <span className="text-sm font-medium text-[var(--text-muted)] truncate max-w-[120px]">{stat.category}</span>
          <div 
            className="px-3 py-1 rounded-full text-white text-xs font-bold tracking-wider uppercase flex-shrink-0"
            style={{ backgroundColor: getTierColor(stat.tier) }}
          >
            {stat.tier}
          </div>
        </div>
      </div>
    );
  };

  const SoloScoreRow = ({ stat, rank, index }) => {
    return (
      <div 
        className={`flex flex-col lg:flex-row lg:items-center gap-4 p-4 md:p-5 rounded-xl bg-[var(--bg-card)] border ${rank <= 3 ? 'border-2' : 'border-[var(--border)]'} hover:shadow-md transition-all duration-200 stagger-slide-in mb-3`}
        style={{ 
          animationDelay: `${index * 0.05}s`,
          borderColor: rank === 1 ? '#eab308' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#b45309' : undefined,
          backgroundColor: rank === 1 ? 'rgba(234, 179, 8, 0.03)' : undefined
        }}
      >
        <div className="flex items-center gap-4 lg:w-1/4">
          <div className="w-10 text-center flex-shrink-0 flex justify-center">
            {getRankIcon(rank)}
          </div>
          <p className="font-bold text-[var(--text)] text-lg truncate">{stat.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 lg:flex-1 text-center lg:text-left">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Best Score</p>
            <p className="font-bold text-[var(--text)] text-xl text-[var(--primary)]">{stat.bestScore}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Avg / Games</p>
            <p className="font-bold text-[var(--text)]">{stat.averageScore} <span className="text-sm font-normal text-[var(--text-muted)]">({stat.totalGames})</span></p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Best Date</p>
            <p className="font-medium text-[var(--text)] text-sm">{new Date(stat.lastPlayed).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between lg:w-1/4 lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-[var(--border)]">
          <span className="text-sm font-medium text-[var(--text-muted)] truncate max-w-[120px]">{stat.category}</span>
          <div 
            className="px-3 py-1 rounded-full text-white text-xs font-bold tracking-wider uppercase flex-shrink-0"
            style={{ backgroundColor: getTierColor(stat.tier) }}
          >
            {stat.tier}
          </div>
        </div>
      </div>
    );
  };

  const HeadToHeadCard = ({ match, rank, index }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { teams, team1Wins, team2Wins, ties, lastPlayed, games, category, tier } = match;
    const totalGames = team1Wins + team2Wins + ties;
    const dominantTeam = team1Wins > team2Wins ? teams[0] : team2Wins > team1Wins ? teams[1] : 'Tie';
    const dominantWins = Math.max(team1Wins, team2Wins);
    const winRate = totalGames > 0 ? Math.round((dominantWins / totalGames) * 100) : 0;

    return (
      <Card 
        className={`stagger-slide-in mb-4 bg-[var(--bg-card)] overflow-hidden border ${rank <= 3 ? 'border-2' : 'border-[var(--border)]'}`} 
        style={{ 
          animationDelay: `${index * 0.05}s`,
          borderColor: rank === 1 ? '#eab308' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#b45309' : undefined,
        }}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="p-0">
            <CollapsibleTrigger className="w-full">
              <div className="flex flex-col lg:flex-row items-center justify-between p-4 md:p-6 gap-4 hover:bg-[var(--bg-elevated)] transition-colors">
                
                <div className="flex items-center gap-4 lg:w-1/4 self-start lg:self-center w-full">
                  <div className="w-10 text-center flex-shrink-0 flex justify-center">
                    {getRankIcon(rank)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Matchup</p>
                    <p className="font-bold text-[var(--text)] text-sm md:text-base truncate">{teams[0]} <span className="text-[var(--text-muted)] font-normal mx-1">vs</span> {teams[1]}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 lg:flex-1 text-center w-full border-y lg:border-y-0 py-3 lg:py-0 border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Leader</p>
                    <p className="font-bold text-[var(--text)] truncate">{dominantTeam === 'Tie' ? 'Tied' : dominantTeam}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Record</p>
                    <p className="font-bold text-[var(--text)]">{team1Wins} - {team2Wins} {ties > 0 && <span className="text-xs text-[var(--text-muted)] font-normal">({ties}T)</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Last Match</p>
                    <p className="font-medium text-[var(--text)] text-sm">{new Date(lastPlayed).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:w-1/4 lg:justify-end gap-4 w-full">
                  <div className="flex flex-col items-start lg:items-end">
                    <span className="text-sm font-medium text-[var(--text-muted)] truncate max-w-[100px]">{category}</span>
                    <div 
                      className="px-2 py-0.5 mt-1 rounded-full text-white text-[10px] font-bold tracking-wider uppercase"
                      style={{ backgroundColor: getTierColor(tier) }}
                    >
                      {tier}
                    </div>
                  </div>
                  <div className="flex-shrink-0 p-2 bg-[var(--bg-elevated)] rounded-full">
                    {isOpen ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
                  </div>
                </div>

              </div>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:p-6 space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> Match History
              </h4>
              
              {games.sort((a,b) => new Date(b.playedAt) - new Date(a.playedAt)).map(game => (
                <div key={game.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border)] gap-2 sm:gap-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{new Date(game.playedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{game.category}</Badge>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{game.tier}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[var(--bg-elevated)] px-4 py-2 rounded-md">
                    <span className={`font-bold ${game.winner === game.team1 ? 'text-[var(--correct)]' : 'text-[var(--text)]'}`}>
                      {game.team1}: {game.team1Score}
                    </span>
                    <span className="text-[var(--text-muted)]">vs</span>
                    <span className={`font-bold ${game.winner === game.team2 ? 'text-[var(--correct)]' : 'text-[var(--text)]'}`}>
                      {game.team2}: {game.team2Score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>Global Leaderboard - Heto</title>
        <meta name="description" content="View all-time top scores, head-to-head records, and solo rankings." />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg)] pb-12 pt-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex items-center mb-8 sm:mb-10">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-medium px-2 py-1 rounded-lg hover:bg-[var(--bg-elevated)]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 
              className="flex-1 text-4xl md:text-5xl font-bold text-center text-[var(--text)] pr-10 md:pr-16"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}
            >
              Leaderboard
            </h1>
          </div>

          {/* Filters */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-sm w-full sm:w-auto">
              <Filter className="w-4 h-4" />
              Filters:
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:flex-1">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 h-10 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
              <select 
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="flex-1 h-10 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {tiers.map(tier => (
                  <option key={tier.value} value={tier.value}>{tier.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Tabs defaultValue="all-time" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-[var(--bg-elevated)] p-1 rounded-xl">
              <TabsTrigger value="all-time" className="rounded-lg font-semibold data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">
                <Trophy className="w-4 h-4 mr-2 hidden sm:inline" /> Team Play
              </TabsTrigger>
              <TabsTrigger value="h2h" className="rounded-lg font-semibold data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">
                <History className="w-4 h-4 mr-2 hidden sm:inline" /> Matchups
              </TabsTrigger>
              <TabsTrigger value="solo" className="rounded-lg font-semibold data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">
                <User className="w-4 h-4 mr-2 hidden sm:inline" /> Solo Players
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all-time" className="mt-0 focus-visible:outline-none">
              {processedTeamStats.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                  <Trophy className="w-16 h-16 text-[var(--text-muted)] opacity-50 mx-auto mb-4" />
                  <p className="text-[var(--text-muted)] text-lg">No team scores match your filters.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {processedTeamStats.map((stat, index) => (
                    <TeamScoreRow key={stat.name} stat={stat} rank={index + 1} index={index} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="h2h" className="mt-0 focus-visible:outline-none">
              {processedH2H.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                  <History className="w-16 h-16 text-[var(--text-muted)] opacity-50 mx-auto mb-4" />
                  <p className="text-[var(--text-muted)] text-lg">No matchups match your filters.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {processedH2H.map((match, index) => (
                    <HeadToHeadCard key={match.teams.join('-')} match={match} rank={index + 1} index={index} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="solo" className="mt-0 focus-visible:outline-none">
              {processedSoloStats.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                  <User className="w-16 h-16 text-[var(--text-muted)] opacity-50 mx-auto mb-4" />
                  <p className="text-[var(--text-muted)] text-lg">No solo scores match your filters.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {processedSoloStats.map((stat, index) => (
                    <SoloScoreRow key={stat.name} stat={stat} rank={index + 1} index={index} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </>
  );
};

export default LeaderboardScreen;
