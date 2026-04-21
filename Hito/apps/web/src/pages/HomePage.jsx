import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Play, Trophy, Clock, Users, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider.jsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
const HomePage = () => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  const tiers = [{
    name: 'Gasha',
    nameGe: 'ጋሻ',
    description: 'Easy questions for beginners',
    color: 'var(--tier-gasha)',
    tier: 'gasha'
  }, {
    name: "Qol'a",
    nameGe: 'ቆልዓ',
    description: 'Medium difficulty for casual players',
    color: 'var(--tier-qola)',
    tier: 'qola'
  }, {
    name: 'Gobez',
    nameGe: 'ጎበዝ',
    description: 'Hard questions for experts',
    color: 'var(--tier-gobez)',
    tier: 'gobez'
  }, {
    name: 'Shimagile',
    nameGe: 'ሽማግለ',
    description: 'Expert level for true masters',
    color: 'var(--tier-shimagile)',
    tier: 'shimagile'
  }];

  // Optimized and compressed 6 FAQ items
  const faqs = [{
    id: 'solo-vs-team',
    title: 'What is the difference between Solo and Team Play?',
    content: 'Team Play is a head-to-head battle against friends, taking turns to answer questions. Solo Play is an independent challenge where you test your own knowledge and compete for a spot on the global leaderboard.'
  }, {
    id: 'solo-works',
    title: 'How does Solo Play work?',
    content: 'You will face exactly 10 questions in a row. For a faster-paced challenge, your answer is auto-submitted the moment you tap it. Be careful—there is no going back once you click!'
  }, {
    id: 'setup-options',
    title: 'What game setup options can I customize?',
    content: 'Before starting, you can choose your desired difficulty tier (from Gasha to Shimagile), a specific question category (like History or Geography), and the total number of rounds (1-10) for Team Play.'
  }, {
    id: 'scoring',
    title: 'How is the scoring calculated?',
    content: 'Every correct answer earns you 10 base points. If you answer quickly, you can earn up to +5 bonus points (under 5 seconds). There are no point deductions for incorrect answers.'
  }, {
    id: 'leaderboard-rankings',
    title: 'How do the leaderboard rankings work?',
    content: 'Teams are ranked globally based primarily on their total number of match wins. Solo players are ranked by their highest single-game score, rewarding both speed and accuracy.'
  }, {
    id: 'player-rankings',
    title: 'How does the player ranking system work?',
    content: 'The system tracks your all-time history. It highlights top scores, win rates, and even head-to-head records against rival teams to see who historically dominates the matchup.'
  }];
  return <>
      <Helmet>
        <title>Heto - Tigrinya Trivia Game</title>
        <meta name="description" content="Test your knowledge of Tigrinya culture, history, and traditions with Heto - the ultimate trivia game for Eritrean and Ethiopian communities." />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg)]">
        {/* Header */}
        <header className="border-b border-[var(--border)] bg-[var(--bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-medium">
                ← Back
              </a>

              <button onClick={toggleTheme} className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg)] transition-all duration-200 active:scale-95" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-[var(--text)]" /> : <Moon className="w-5 h-5 text-[var(--text)]" />}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 text-[var(--text)]" style={{
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '-0.02em'
          }}>
              HITO / ሕቶ
            </h1>
            <p className="text-xl md:text-2xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">
              How much do you really know?
            </p>
            <Link to="/setup" className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--red)] text-white font-semibold rounded-xl hover:bg-[var(--red-hover)] transition-all duration-200 active:scale-[0.98] text-lg shadow-lg shadow-red-900/20">
              <Play className="w-6 h-6" />
              Play Now
            </Link>
          </div>
        </section>

        {/* Difficulty Tiers */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--bg-card)] border-y border-[var(--border)]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[var(--text)]" style={{
            fontFamily: "'Bebas Neue', sans-serif"
          }}>
              Choose Your Challenge
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map(tier => <div key={tier.tier} className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl hover:shadow-md transition-all duration-200">
                  <div className="inline-block px-4 py-1 rounded-full text-white text-sm font-bold tracking-wider uppercase mb-4 shadow-sm" style={{
                backgroundColor: tier.color
              }}>
                    {tier.name}
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-[var(--text)]" style={{
                fontFamily: "'Noto Sans Ethiopic', sans-serif"
              }}>
                    {tier.nameGe}
                  </h3>
                  <p className="text-[var(--text-muted)] font-medium">{tier.description}</p>
                </div>)}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                  <Trophy className="w-8 h-8 text-[var(--red)]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--text)]">Compete & Win</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">Challenge friends and climb the global leaderboard to prove your knowledge.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                  <Clock className="w-8 h-8 text-[var(--red)]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--text)]">Speed Bonus</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">Think fast! Answer quickly to earn extra bonus points for your team.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                  <Users className="w-8 h-8 text-[var(--red)]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--text)]">Team Play</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">Gather your family and friends for an engaging head-to-head trivia battle.</p>
              </div>
            </div>
          </div>
        </section>

        {/* AdSense Slot 3 */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 text-center shadow-sm overflow-hidden flex justify-center">
              <ins className="adsbygoogle w-full" style={{
              display: 'block',
              minHeight: '90px'
            }} data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>
            </div>
          </div>
        </section>

        {/* FAQ Section (Optimized and Compressed) */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--bg-card)] border-t border-[var(--border)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-[var(--text)]" style={{
            fontFamily: "'Bebas Neue', sans-serif"
          }}>
              FAQs
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map(item => <AccordionItem key={item.id} value={item.id} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg overflow-hidden border-b-0">
                  <AccordionTrigger className="text-left font-bold text-[var(--text)] hover:text-[var(--red)] transition-colors px-3 py-3 md:px-4 md:py-3.5 no-underline hover:no-underline text-sm md:text-base">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-[var(--text-muted)] px-3 md:px-4 pb-3 pt-0" style={{
                fontSize: 'var(--faq-answer-font-size)',
                lineHeight: 'var(--faq-line-height)'
              }}>
                    {item.content}
                  </AccordionContent>
                </AccordionItem>)}
            </Accordion>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-[var(--bg-card)]">
          <div className="max-w-7xl mx-auto text-center text-[var(--text-muted)] text-sm font-medium">
            <p className="mb-4">© 2026 Tigrinya Party Games</p>
            <div className="flex items-center justify-center gap-6">
              <a href="#" className="hover:text-[var(--text)] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[var(--text)] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[var(--text)] transition-colors">Contact Us</a>
            </div>
          </div>
        </footer>
      </div>
    </>;
};
export default HomePage;