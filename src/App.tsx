import { GameProvider, useGame } from '@/game/GameContext';
import { TitleScreen } from '@/components/TitleScreen';
import { CampaignSelectScreen } from '@/components/CampaignSelectScreen';
import { BriefingScreen } from '@/components/BriefingScreen';
import { GameScreen } from '@/components/GameScreen';
import { EndingScreen } from '@/components/EndingScreen';
import { AnalyticsScreen } from '@/components/AnalyticsScreen';
import { DeveloperScreen } from '@/components/DeveloperScreen';
import { AboutScreen } from '@/components/AboutScreen';
import { TutorialScreen } from '@/components/TutorialScreen';
import { HistoryScreen } from '@/components/HistoryScreen';

function ScreenRouter() {
  const { screen } = useGame();

  switch (screen) {
    case 'title':
      return <TitleScreen />;
    case 'campaignSelect':
      return <CampaignSelectScreen />;
    case 'briefing':
      return <BriefingScreen />;
    case 'game':
      return <GameScreen />;
    case 'ending':
      return <EndingScreen />;
    case 'analytics':
      return <AnalyticsScreen />;
    case 'developer':
      return <DeveloperScreen />;
    case 'about':
      return <AboutScreen />;
    case 'tutorial':
      return <TutorialScreen />;
    case 'history':
      return <HistoryScreen />;
    default:
      return <TitleScreen />;
  }
}

function App() {
  return (
    <GameProvider>
      <ScreenRouter />
    </GameProvider>
  );
}

export default App;
