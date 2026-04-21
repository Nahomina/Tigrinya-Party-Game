
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext.jsx';
import { ThemeProvider } from './contexts/ThemeProvider.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import SetupScreen from './pages/SetupScreen.jsx';
import QuestionScreen from './pages/QuestionScreen.jsx';
import RevealScreen from './pages/RevealScreen.jsx';
import SummaryScreen from './pages/SummaryScreen.jsx';
import WinnerScreen from './pages/WinnerScreen.jsx';
import LeaderboardScreen from './pages/LeaderboardScreen.jsx';

function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <Router>
          <ScrollToTop />
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/setup" element={<SetupScreen />} />
            <Route path="/question" element={<QuestionScreen />} />
            <Route path="/reveal" element={<RevealScreen />} />
            <Route path="/summary" element={<SummaryScreen />} />
            <Route path="/winner" element={<WinnerScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
          </Routes>
        </Router>
      </GameProvider>
    </ThemeProvider>
  );
}

export default App;
