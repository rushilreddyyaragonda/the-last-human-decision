import { useGame } from '@/game/GameContext';
import { Code2, ArrowLeft, Mail, GraduationCap, Cpu, Lightbulb, Wrench, BookOpen } from 'lucide-react';

export function DeveloperScreen() {
  const { setScreen } = useGame();

  return (
    <div className="min-h-screen bg-app grid-bg p-6 md:p-10 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto">
        <button className="text-muted hover:text-ivory text-sm mb-6 flex items-center gap-1" onClick={() => setScreen('title')}>
          <ArrowLeft size={14} /> Back to Main Menu
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Code2 size={24} className="text-amber" />
          <h1 className="text-2xl text-ivory font-bold">Behind the Simulation</h1>
        </div>

        {/* Profile */}
        <div className="panel p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-light)' }}>
              <Code2 size={28} className="text-cyan" />
            </div>
            <div>
              <h2 className="text-lg text-ivory font-medium">Rushil Reddy Yaragonda</h2>
              <div className="flex items-center gap-2 mt-1">
                <GraduationCap size={14} className="text-amber" />
                <span className="text-sm text-muted">Computer Science · UIA International School of Tokyo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="panel p-6 mb-4">
          <h3 className="text-sm text-cyan font-medium mb-3">Developer Introduction</h3>
          <p className="text-sm text-muted leading-relaxed">
            I'm a Computer Science student at UIA International School of Tokyo, exploring how computational
            systems can be used to investigate complex questions about technology and society. This project
            is an original student-built exploration of algorithmic governance, human oversight, and the
            trade-offs between efficiency and accountability.
          </p>
        </div>

        {/* Motivation */}
        <div className="panel p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-amber" />
            <h3 className="text-sm text-cyan font-medium">Project Motivation</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed mb-3">
            As algorithms increasingly make decisions that affect people's lives — from employment matching
            to resource allocation to healthcare triage — the question of where human judgment should prevail
            becomes urgent. Efficiency, fairness, accountability, and resilience are not naturally aligned.
            A system optimized for one may undermine another.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            I wanted to build a simulation where players experience these tensions firsthand — not through
            abstract reading, but through consequential decisions with cascading effects. The game is designed
            to provoke reflection, not to prescribe answers.
          </p>
        </div>

        {/* Research Question */}
        <div className="panel p-6 mb-4">
          <h3 className="text-sm text-cyan font-medium mb-3">Central Research Question</h3>
          <p className="text-sm text-amber italic leading-relaxed">
            When algorithms control everything, what should remain human — and who should decide?
          </p>
        </div>

        {/* Design Philosophy */}
        <div className="panel p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-cyan" />
            <h3 className="text-sm text-cyan font-medium">Design Philosophy</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Every important decision must have a consequence. Every system must be understandable. Every major
            outcome must emerge from the player's choices and the simulation's rules. No choice is universally
            correct — what improves efficiency may damage trust, and what protects rights may increase costs.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            The simulation engine is built with explicit, inspectable rules rather than opaque heuristics.
            Players can trace why an indicator changed, which decision caused a delayed effect, and how an
            event was triggered by the current state.
          </p>
        </div>

        {/* Technical Approach */}
        <div className="panel p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={16} className="text-cyan" />
            <h3 className="text-sm text-cyan font-medium">Technical Approach</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            The game is built as a React + TypeScript application with a deterministic simulation engine.
            All game state is centralized, and state mutations happen through explicit functions — no UI
            component directly modifies statistics. A seeded random number generator ensures reproducible
            event selection. Campaigns persist to browser-local storage with a versioned schema. No backend
            server, database, or external API is required.
          </p>
        </div>

        {/* Limitations */}
        <div className="panel p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={16} className="text-amber" />
            <h3 className="text-sm text-cyan font-medium">Limitations</h3>
          </div>
          <ul className="space-y-2">
            <li className="text-sm text-muted leading-relaxed">• The simulation simplifies real-world social dynamics into game mechanics.</li>
            <li className="text-sm text-muted leading-relaxed">• The event set is finite and authored, not dynamically generated.</li>
            <li className="text-sm text-muted leading-relaxed">• The game has not been scientifically validated and does not predict real outcomes.</li>
            <li className="text-sm text-muted leading-relaxed">• Population groups are analytical categories, not representations of actual communities.</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="panel p-6 mb-4">
          <h3 className="text-sm text-cyan font-medium mb-3">Contact</h3>
          <a
            href="mailto:rushil2626reddy@gmail.com"
            className="flex items-center gap-2 text-sm text-amber hover:underline"
          >
            <Mail size={14} />
            rushil2626reddy@gmail.com
          </a>
        </div>

        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setScreen('about')}>About the Project</button>
          <button className="btn btn-primary" onClick={() => setScreen('campaignSelect')}>Play the Game</button>
        </div>
      </div>
    </div>
  );
}
