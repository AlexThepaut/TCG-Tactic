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
      title: 'War Initiation',
      icon: PlayIcon,
      items: [
        'Forge your first legion with exactly 40 echoes',
        'Choose a faction: Imperial, Alien, or Machine',
        'Join war council or create a private battlefield',
        'Master the 3×5 war formations'
      ]
    },
    {
      id: 'gameplay',
      title: 'War Mechanics',
      icon: ShieldCheckIcon,
      items: [
        'War phases: Resources → Draw → Actions',
        'Deploy echoes on your faction\'s formation',
        'Assault adjacent enemy echoes',
        'Complete secret war objectives to claim victory'
      ]
    },
    {
      id: 'factions',
      title: 'War Factions',
      icon: LightBulbIcon,
      items: [
        'Imperial: War lines get +2 ATK/+1 HP',
        'Alien: Fallen echoes reduce summon costs',
        'Machine: 30% chance to resurrect with 1 HP',
        'Each faction has unique formations and war strategies'
      ]
    },
    {
      id: 'deck-building',
      title: 'Legion Forging',
      icon: BookOpenIcon,
      items: [
        'Exactly 40 echoes per legion',
        'Single faction only',
        'Maximum 2 copies of each echo',
        'Balance void curve and echo types'
      ]
    }
  ];

  const factionFormations = [
    {
      name: 'Imperial - War Phalanx',
      formation: ['-xxx-', '-xxx-', '-xxx-'],
      description: 'Focused on disciplined war lines and coordination',
      color: 'humans'
    },
    {
      name: 'Alien - War Swarm',
      formation: ['-xxx-', 'xxxxx', '--x--'],
      description: 'Adaptive and evolutionary war strategies',
      color: 'aliens'
    },
    {
      name: 'Machine - Eternal Legion',
      formation: ['xxxxx', '--x--', '-xxx-'],
      description: 'Persistent and technological war superiority',
      color: 'robots'
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Atmospheric effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating embers */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-imperial-500 rounded-full animate-ember opacity-60"></div>
        <div className="absolute top-32 right-32 w-1 h-1 bg-void-400 rounded-full animate-ember opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-40 w-1.5 h-1.5 bg-imperial-600 rounded-full animate-ember opacity-50" style={{ animationDelay: '2s' }}></div>

        {/* Scanning beams */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-imperial-400 to-transparent opacity-30 animate-flicker"></div>
        <div className="absolute top-0 right-1/3 w-px h-24 bg-gradient-to-b from-void-500 to-transparent opacity-20 animate-flicker" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Gothic decoration */}
          <div className="mb-6 flex justify-center">
            <div className="text-imperial-400 text-3xl font-gothic icon-glow-imperial">📖</div>
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-black mb-4 gothic-text-shadow">
            <span className="bg-gradient-to-r from-imperial-300 via-imperial-400 to-imperial-600 bg-clip-text text-transparent animate-hologram">
              WAR LORE
            </span>
          </h1>

          <div className="relative mb-6">
            <p className="text-xl md:text-2xl font-tech font-medium text-imperial-200 gothic-text-shadow tracking-wider">
              WAR DOCTRINE • BATTLE PROTOCOLS • ECHO MASTERY
            </p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
          </div>

          <p className="text-lg text-void-300 font-tech font-light tracking-wide opacity-80">
            "Knowledge conquers fear, war echoes conquer enemies..."
          </p>
        </div>

        {/* Quick Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {helpSections.map((section) => (
            <div key={section.id} className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-imperial-700/50 p-6 relative scanlines group hover:border-imperial-500/70 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-center mb-4">
                <section.icon className="w-6 h-6 text-imperial-400 mr-3 icon-glow-imperial" />
                <h3 className="text-lg font-gothic font-bold text-imperial-300 gothic-text-shadow tracking-wider">{section.title.toUpperCase()}</h3>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, index) => (
                  <li key={index} className="text-sm text-imperial-200 flex items-start font-tech">
                    <span className="text-imperial-400 mr-3 font-bold">▸</span>
                    <span className="tracking-wide">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Faction Formations */}
        <div className="mb-12">
          <h2 className="text-3xl font-gothic font-bold text-imperial-400 mb-8 text-center gothic-text-shadow tracking-wider">
            WAR FORMATIONS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {factionFormations.map((faction) => {
              const factionNames = {
                humans: 'IMPERIAL PHALANX',
                aliens: 'ALIEN SWARM',
                robots: 'MACHINE LEGION'
              };

              return (
                <div
                  key={faction.name}
                  className={`bg-gothic-darkest/60 border-2 border-${faction.color}-600/50 hover:border-${faction.color}-400 p-6 relative group transition-all duration-500 hover:scale-105 overflow-hidden`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-${faction.color}-900/20 to-${faction.color}-700/10 opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                  <div className="relative z-10">
                    <h3 className={`text-lg font-gothic font-bold mb-4 text-${faction.color}-300 gothic-text-shadow tracking-wider`}>
                      {factionNames[faction.color as keyof typeof factionNames]}
                    </h3>

                    {/* Formation Grid */}
                    <div className="mb-4">
                      <div className={`text-xs text-${faction.color}-500 mb-3 font-tech tracking-wider`}>WAR MATRIX:</div>
                      <div className="font-mono text-center space-y-2 bg-gothic-darker/60 p-4 border border-${faction.color}-700/30">
                        {faction.formation.map((row, index) => (
                          <div key={index} className={`text-${faction.color}-400 tracking-[0.3em] text-lg font-bold`}>
                            {row}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className={`text-sm text-${faction.color}-300 font-tech tracking-wide opacity-90`}>{faction.description}</p>
                  </div>

                  {/* Border glow effects */}
                  <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-${faction.color}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className={`absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-${faction.color}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-imperial-700/50 p-8 relative scanlines mb-12">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>

          <h2 className="text-3xl font-gothic font-bold text-imperial-400 mb-8 flex items-center gothic-text-shadow tracking-wider">
            <BookOpenIcon className="w-8 h-8 mr-4 text-imperial-400 icon-glow-imperial" />
            CORE WAR PROTOCOLS
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gothic-darker/60 border border-imperial-600/30 p-6">
              <h3 className="text-xl font-gothic font-bold text-imperial-300 mb-4 gothic-text-shadow tracking-wider">WAR VICTORY PROTOCOLS</h3>
              <ul className="space-y-3 text-imperial-200 font-tech">
                <li className="flex items-start">
                  <span className="text-imperial-400 mr-3 font-bold">◉</span>
                  <span className="tracking-wide">Complete classified war objectives</span>
                </li>
                <li className="flex items-start">
                  <span className="text-imperial-400 mr-3 font-bold">◉</span>
                  <span className="tracking-wide">Each faction deploys 3 war mission variants</span>
                </li>
                <li className="flex items-start">
                  <span className="text-imperial-400 mr-3 font-bold">◉</span>
                  <span className="tracking-wide">Operations span territorial dominance to echo elimination</span>
                </li>
              </ul>
            </div>

            <div className="bg-gothic-darker/60 border border-imperial-600/30 p-6">
              <h3 className="text-xl font-gothic font-bold text-imperial-300 mb-4 gothic-text-shadow tracking-wider">WAR RESOURCE MANAGEMENT</h3>
              <ul className="space-y-3 text-imperial-200 font-tech">
                <li className="flex items-start">
                  <span className="text-void-400 mr-3 font-bold">▸</span>
                  <span className="tracking-wide">Void Echoes: 0-10 energy per war cycle</span>
                </li>
                <li className="flex items-start">
                  <span className="text-void-400 mr-3 font-bold">▸</span>
                  <span className="tracking-wide">War sequence: Resources → Intel → Deployment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-void-400 mr-3 font-bold">▸</span>
                  <span className="tracking-wide">Real-time war synchronization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-void-700/50 p-8 relative scanlines mb-12">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-500 to-transparent"></div>

          <h2 className="text-3xl font-gothic font-bold text-void-400 mb-8 flex items-center gothic-text-shadow tracking-wider">
            <QuestionMarkCircleIcon className="w-8 h-8 mr-4 text-void-400 icon-glow-void" />
            WAR INQUIRIES
          </h2>

          <div className="space-y-8">
            <div className="bg-gothic-darker/60 border border-void-600/30 p-6">
              <h3 className="text-xl font-gothic font-bold text-void-300 mb-3 gothic-text-shadow tracking-wider">
                ECHO ACQUISITION PROTOCOLS?
              </h3>
              <p className="text-void-200 font-tech tracking-wide leading-relaxed">
                Negative! Echoes Of War maintains war parity • All 360 echoes accessible to all warriors
                • No collection barriers • Pure strategic warfare focus
              </p>
            </div>

            <div className="bg-gothic-darker/60 border border-void-600/30 p-6">
              <h3 className="text-xl font-gothic font-bold text-void-300 mb-3 gothic-text-shadow tracking-wider">
                WAR ECHO ROTATION FREQUENCY?
              </h3>
              <p className="text-void-200 font-tech tracking-wide leading-relaxed">
                Monthly war cycle • 120 new AI-forged echoes deploy while 120 veteran echoes rotate to reserves
                • Adaptive meta-warfare ensures evolving war landscapes
              </p>
            </div>

            <div className="bg-gothic-darker/60 border border-void-600/30 p-6">
              <h3 className="text-xl font-gothic font-bold text-void-300 mb-3 gothic-text-shadow tracking-wider">
                MOBILE WAR DEPLOYMENT CAPABILITY?
              </h3>
              <p className="text-void-200 font-tech tracking-wide leading-relaxed">
                Affirmative! Portable device compatibility confirmed • Landscape orientation required
                • Optimal war visualization through horizontal display matrix
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center">
          <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-imperial-700/50 p-8 relative scanlines">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>

            <div className="mb-6 flex justify-center">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-imperial-400 icon-glow-imperial" />
            </div>

            <h3 className="text-2xl font-gothic font-bold text-imperial-400 mb-4 gothic-text-shadow tracking-wider">
              REQUIRE ADDITIONAL INTELLIGENCE?
            </h3>
            <p className="text-imperial-200 mb-6 font-tech tracking-wide">
              War support networks and tactical communities stand ready for deployment
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border border-imperial-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-imperial">
                <span className="gothic-text-shadow">JOIN COMM NETWORK</span>
              </button>
              <button className="px-8 py-4 bg-void-600/80 hover:bg-void-500 text-void-100 border border-void-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-void">
                <span className="gothic-text-shadow">REQUEST SUPPORT</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;