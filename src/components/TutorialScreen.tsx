import { useGame } from '@/game/GameContext';
import { BookOpen, ArrowLeft, MousePointerClick, Sliders, Lightbulb, ScrollText, Trophy } from 'lucide-react';

export function TutorialScreen() {
  const { setScreen, setTutorialDone } = useGame();

  const sections = [
    {
      icon: MousePointerClick,
      title: 'The Game Loop',
      body: 'Each quarter, you receive a situation report showing the state of your society. You then make decisions — policy changes, investments, or responses to events — before advancing to the next quarter. The simulation runs for 24 quarters (6 years).',
    },
    {
      icon: Sliders,
      title: 'Societal Indicators',
      body: 'Nine indicators track the health of your society: productivity, public trust, social equity, civil liberties, system resilience, human agency, workforce stability, infrastructure health, and information integrity. Every decision affects these indicators in different ways.',
    },
    {
      icon: Lightbulb,
      title: 'Automation Authority',
      body: 'You control how much authority to delegate to automated systems across five domains: economic, resource allocation, transportation, public safety, and healthcare. More automation can boost efficiency but may reduce human agency, oversight, and resilience.',
    },
    {
      icon: ScrollText,
      title: 'The Human Override',
      body: 'At key moments, an automated system will produce a recommendation that raises ethical or social concerns. You can accept it, request more evidence, escalate to human review, override it, or suspend the system. Each choice has different consequences.',
    },
    {
      icon: Trophy,
      title: 'Multiple Endings',
      body: 'Your final outcome depends on the state of all indicators, your automation decisions, and your override history. There are seven possible endings, from the Accountable Republic to the Efficient Machine to the Permanent Emergency. No single strategy is always best.',
    },
  ];

  return (
    <div className="min-h-screen bg-app grid-bg p-6 md:p-10 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto">
        <button className="text-muted hover:text-ivory text-sm mb-6 flex items-center gap-1" onClick={() => setScreen('title')}>
          <ArrowLeft size={14} /> Back to Main Menu
        </button>

        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={24} className="text-amber" />
          <h1 className="text-2xl text-ivory font-bold">How to Play</h1>
        </div>

        <div className="space-y-4">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="panel p-5">
                <div className="flex items-start gap-3">
                  <Icon size={18} className="text-cyan mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm text-ivory font-medium mb-2">{s.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            className="btn btn-primary"
            onClick={() => { setTutorialDone(); setScreen('campaignSelect'); }}
          >
            Begin Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
