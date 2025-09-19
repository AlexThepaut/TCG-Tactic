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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Help & Guide</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Master the tactical gameplay of TCG Tactique with our comprehensive guide
          </p>
        </div>

        {/* Quick Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {helpSections.map((section) => (
            <div key={section.id} className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center mb-4">
                <section.icon className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Faction Formations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Faction Formations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {factionFormations.map((faction) => (
              <div
                key={faction.name}
                className={`bg-${faction.color}-900/30 backdrop-blur-sm rounded-xl p-6 border border-${faction.color}-600/30`}
              >
                <h3 className={`text-lg font-semibold mb-3 text-${faction.color}-300`}>
                  {faction.name}
                </h3>

                {/* Formation Grid */}
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-2">Playable positions:</div>
                  <div className="font-mono text-center space-y-1">
                    {faction.formation.map((row, index) => (
                      <div key={index} className={`text-${faction.color}-400 tracking-wider`}>
                        {row}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-300">{faction.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <BookOpenIcon className="w-8 h-8 mr-3 text-blue-400" />
            Core Game Rules
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Victory Conditions</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Complete your secret quest objective
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Each faction has 3 possible quest types
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Quests range from territorial control to elimination quotas
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Resources & Turns</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Void Echoes: 0-10 resources per turn
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Resources phase → Draw phase → Actions phase
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Real-time multiplayer via Socket.io
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <QuestionMarkCircleIcon className="w-8 h-8 mr-3 text-blue-400" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Do I need to collect cards?
              </h3>
              <p className="text-gray-300">
                No! TCG Tactique provides equal access to all 360 cards in the current rotation.
                There's no collection system - focus on strategy, not grinding.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                How often do cards change?
              </h3>
              <p className="text-gray-300">
                Every month, 120 new AI-generated cards join the pool while 120 older cards rotate out.
                This keeps the meta fresh and evolving.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I play on mobile?
              </h3>
              <p className="text-gray-300">
                Yes! The game works on mobile devices in landscape orientation.
                Rotate your device horizontally for the best experience.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Need More Help?</h3>
            <p className="text-gray-300 mb-4">
              Still have questions? Our community and support team are here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Join Discord Community
              </button>
              <button className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;