import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  PlayIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const Help = () => {
  const helpSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: PlayIcon,
      items: [
        'Create your first deck with exactly 40 cards',
        'Choose a faction: Humans, Aliens, or Robots',
        'Join matchmaking or create a private game',
        'Learn the 3×5 grid formations'
      ]
    },
    {
      id: 'gameplay',
      title: 'Gameplay Mechanics',
      icon: ShieldCheckIcon,
      items: [
        'Turn phases: Resources → Draw → Actions',
        'Place units on your faction\'s formation',
        'Attack adjacent enemy units',
        'Complete secret quest objectives to win'
      ]
    },
    {
      id: 'factions',
      title: 'Faction Guide',
      icon: LightBulbIcon,
      items: [
        'Humans: Tactical lines get +2 ATK/+1 HP',
        'Aliens: Dead units reduce summon costs',
        'Robots: 30% chance to resurrect with 1 HP',
        'Each faction has unique formations and strategies'
      ]
    },
    {
      id: 'deck-building',
      title: 'Deck Building',
      icon: BookOpenIcon,
      items: [
        'Exactly 40 cards per deck',
        'Single faction only',
        'Maximum 2 copies of each card',
        'Balance cost curve and unit types'
      ]
    }
  ];

  const factionFormations = [
    {
      name: 'Humans - Tactical Phalanx',
      formation: ['-xxx-', '-xxx-', '-xxx-'],
      description: 'Focused on disciplined lines and coordination',
      color: 'humans'
    },
    {
      name: 'Aliens - Living Swarm',
      formation: ['-xxx-', 'xxxxx', '--x--'],
      description: 'Adaptive and evolutionary strategies',
      color: 'aliens'
    },
    {
      name: 'Robots - Immortal Army',
      formation: ['xxxxx', '--x--', '-xxx-'],
      description: 'Persistent and technological superiority',
      color: 'robots'
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-cyber font-black mb-6 gradient-text-cyber tracking-wider uppercase">
            ℹ️ TACTICAL MANUAL
          </h1>
          <div className="cyber-panel inline-block px-8 py-4 rounded-xl">
            <p className="font-sans tracking-wide neon-text-cyan max-w-3xl">
              MASTER STRATEGIC COMBAT PROTOCOLS AND ADVANCED WARFARE TACTICS
            </p>
          </div>
        </div>

        {/* Quick Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {helpSections.map((section, index) => {
            const getIconColor = () => {
              switch (index) {
                case 0: return 'neon-text-green';
                case 1: return 'neon-text-blue';
                case 2: return 'neon-text-pink';
                case 3: return 'neon-text-cyan';
                default: return 'neon-text-cyan';
              }
            };

            const getGlowColor = () => {
              switch (index) {
                case 0: return 'neon-glow-green';
                case 1: return 'neon-glow-blue';
                case 2: return 'neon-glow-pink';
                case 3: return 'neon-glow-cyan';
                default: return 'neon-glow-cyan';
              }
            };

            return (
              <div key={section.id} className="cyber-panel rounded-xl p-8 relative overflow-hidden transition-all duration-500 hover:scale-105 group">
                {/* Background effects */}
                <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
                <div className="absolute inset-0 holographic opacity-5 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 rounded-xl cyber-panel flex items-center justify-center mr-4 ${getGlowColor()} group-hover:animate-neon-pulse`}>
                      <section.icon className={`w-7 h-7 ${getIconColor()}`} />
                    </div>
                    <h3 className="text-lg font-cyber font-bold neon-text-cyan tracking-wider uppercase">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {section.items.map((item, index) => (
                      <li key={index} className="text-sm text-cyber-muted flex items-start font-sans">
                        <span className="neon-text-cyan mr-3 font-bold">⚡</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Corner accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-neon-cyan-400 opacity-60" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-neon-cyan-400 opacity-60" />
              </div>
            );
          })}
        </div>

        {/* Faction Formations */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-cyber font-black mb-4 neon-text-green tracking-wider uppercase">
              ⚔️ FACTION FORMATIONS
            </h2>
            <div className="cyber-panel inline-block px-6 py-3 rounded-xl">
              <p className="font-sans tracking-wide text-neon-green-300">
                STRATEGIC DEPLOYMENT PATTERNS FOR TACTICAL SUPREMACY
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {factionFormations.map((faction) => {
              const getFactionGlow = () => {
                switch (faction.color) {
                  case 'humans': return 'neon-glow-blue';
                  case 'aliens': return 'neon-glow-pink';
                  case 'robots': return 'neon-glow-green';
                  default: return 'neon-glow-cyan';
                }
              };

              const getFactionText = () => {
                switch (faction.color) {
                  case 'humans': return 'neon-text-blue';
                  case 'aliens': return 'neon-text-pink';
                  case 'robots': return 'neon-text-green';
                  default: return 'neon-text-cyan';
                }
              };

              const getFactionBorder = () => {
                switch (faction.color) {
                  case 'humans': return 'border-humans-400';
                  case 'aliens': return 'border-aliens-400';
                  case 'robots': return 'border-robots-400';
                  default: return 'border-neon-cyan-400';
                }
              };

              return (
                <div
                  key={faction.name}
                  className="cyber-panel rounded-xl p-8 relative overflow-hidden transition-all duration-500 hover:scale-105 group"
                >
                  {/* Background effects */}
                  <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
                  <div className="absolute inset-0 holographic opacity-5 pointer-events-none" />

                  <div className="relative z-10">
                    <h3 className={`text-xl font-cyber font-bold mb-6 ${getFactionText()} tracking-wider uppercase`}>
                      {faction.name}
                    </h3>

                    {/* Formation Grid */}
                    <div className="mb-6">
                      <div className="text-xs text-cyber-muted mb-3 font-cyber tracking-wider uppercase">COMBAT POSITIONS:</div>
                      <div className="cyber-card-container rounded-lg p-6 font-mono text-center space-y-2">
                        {faction.formation.map((row, index) => (
                          <div key={index} className={`${getFactionText()} tracking-[0.3em] text-lg font-bold`}>
                            {row}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-cyber-muted font-sans leading-relaxed">{faction.description}</p>
                  </div>

                  {/* Corner accents */}
                  <div className={`absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 opacity-60 ${getFactionBorder()}`} />
                  <div className={`absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 opacity-60 ${getFactionBorder()}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Rules */}
        <div className="cyber-panel rounded-xl p-10 mb-16 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
          <div className="absolute inset-0 holographic opacity-5 pointer-events-none" />

          <h2 className="text-3xl font-cyber font-black mb-8 flex items-center neon-text-blue tracking-wider uppercase relative z-10">
            <BookOpenIcon className="w-10 h-10 mr-4" />
            CORE COMBAT PROTOCOLS
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
            <div className="cyber-card-container rounded-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 holographic opacity-10" />

              <h3 className="text-xl font-cyber font-bold text-neon-green-300 mb-6 tracking-wider uppercase relative z-10">
                🏆 VICTORY PROTOCOLS
              </h3>
              <ul className="space-y-4 text-cyber-muted relative z-10">
                <li className="flex items-start">
                  <span className="neon-text-green mr-3 font-bold">⚡</span>
                  <span className="font-sans">Complete your classified mission objective</span>
                </li>
                <li className="flex items-start">
                  <span className="neon-text-green mr-3 font-bold">⚡</span>
                  <span className="font-sans">Each faction deploys 3 possible mission types</span>
                </li>
                <li className="flex items-start">
                  <span className="neon-text-green mr-3 font-bold">⚡</span>
                  <span className="font-sans">Missions range from territorial dominance to elimination quotas</span>
                </li>
              </ul>
            </div>

            <div className="cyber-card-container rounded-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 holographic opacity-10" />

              <h3 className="text-xl font-cyber font-bold text-neon-cyan-300 mb-6 tracking-wider uppercase relative z-10">
                ⚙️ RESOURCE MANAGEMENT
              </h3>
              <ul className="space-y-4 text-cyber-muted relative z-10">
                <li className="flex items-start">
                  <span className="neon-text-cyan mr-3 font-bold">⚡</span>
                  <span className="font-sans">Void Echoes: 0-10 energy units per combat cycle</span>
                </li>
                <li className="flex items-start">
                  <span className="neon-text-cyan mr-3 font-bold">⚡</span>
                  <span className="font-sans">Resources phase → Draw phase → Actions phase</span>
                </li>
                <li className="flex items-start">
                  <span className="neon-text-cyan mr-3 font-bold">⚡</span>
                  <span className="font-sans">Real-time combat synchronization via Socket.io</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Scanning line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue-400 to-transparent animate-scanline opacity-40" />
        </div>

        {/* FAQ */}
        <div className="cyber-panel rounded-xl p-10 mb-16 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />

          <h2 className="text-3xl font-cyber font-black mb-8 flex items-center neon-text-pink tracking-wider uppercase relative z-10">
            <QuestionMarkCircleIcon className="w-10 h-10 mr-4" />
            TACTICAL INTELLIGENCE QUERIES
          </h2>

          <div className="space-y-8 relative z-10">
            <div className="cyber-card-container rounded-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 holographic opacity-5" />

              <h3 className="text-xl font-cyber font-bold text-neon-cyan-300 mb-4 tracking-wider uppercase relative z-10">
                📊 DO I NEED TO ACQUIRE ARMAMENTS?
              </h3>
              <p className="text-cyber-muted font-sans leading-relaxed relative z-10">
                Negative! TCG Tactique provides equal tactical access to all 360 units in the current deployment pool.
                No acquisition protocols required - focus on strategic mastery, not resource accumulation.
              </p>
            </div>

            <div className="cyber-card-container rounded-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 holographic opacity-5" />

              <h3 className="text-xl font-cyber font-bold text-neon-cyan-300 mb-4 tracking-wider uppercase relative z-10">
                🔄 HOW OFTEN DO UNIT ROSTERS ROTATE?
              </h3>
              <p className="text-cyber-muted font-sans leading-relaxed relative z-10">
                Monthly tactical rotations deploy 120 new AI-generated units while 120 legacy units are archived.
                This maintains meta evolution and strategic freshness across all combat theaters.
              </p>
            </div>

            <div className="cyber-card-container rounded-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 holographic opacity-5" />

              <h3 className="text-xl font-cyber font-bold text-neon-cyan-300 mb-4 tracking-wider uppercase relative z-10">
                📱 MOBILE COMBAT COMPATIBILITY?
              </h3>
              <p className="text-cyber-muted font-sans leading-relaxed relative z-10">
                Affirmative! Full tactical systems operational on mobile platforms in landscape orientation.
                Rotate device horizontally for optimal battlefield visualization and control efficiency.
              </p>
            </div>
          </div>

          {/* Scanning line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-pink-400 to-transparent animate-scanline opacity-40" />
        </div>

        {/* Contact Support */}
        <div className="text-center">
          <div className="cyber-panel rounded-xl p-10 relative overflow-hidden neon-glow-cyan">
            {/* Background effects */}
            <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
            <div className="absolute inset-0 holographic opacity-10 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-xl cyber-panel flex items-center justify-center neon-glow-cyan">
                <ChatBubbleLeftRightIcon className="w-12 h-12 neon-text-cyan" />
              </div>

              <h3 className="text-2xl font-cyber font-black mb-4 neon-text-cyan tracking-wider uppercase">
                REQUIRE ADDITIONAL TACTICAL SUPPORT?
              </h3>
              <p className="text-cyber-muted mb-8 font-sans max-w-lg mx-auto leading-relaxed">
                Strategic queries remain unresolved? Our tactical community and support battalion stand ready for assistance.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="neon-button px-8 py-4 rounded-xl font-cyber tracking-wider uppercase text-sm transition-all duration-300 text-neon-blue-300 border-neon-blue-300 hover:neon-glow-blue">
                  🌍 JOIN TACTICAL NETWORK
                </button>
                <button className="neon-button px-8 py-4 rounded-xl font-cyber tracking-wider uppercase text-sm transition-all duration-300 text-neon-green-300 border-neon-green-300 hover:neon-glow-green">
                  📞 CONTACT HIGH COMMAND
                </button>
              </div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-neon-cyan-400 opacity-60" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-cyan-400 opacity-60" />
            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan-400 opacity-60" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-neon-cyan-400 opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;