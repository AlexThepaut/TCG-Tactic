import { UserIcon, TrophyIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  // Mock user data
  const mockUser = {
    username: 'WarHero',
    email: 'warrior@echoesofwar.com',
    joinDate: '2024-01-15',
    avatar: null,
  };

  const mockStats = {
    gamesPlayed: 127,
    gamesWon: 84,
    winRate: 66.1,
    favoriteFaction: 'humans' as const,
    currentRank: 'Gold II',
    totalPlayTime: '42h 30m',
  };

  const mockRecentGames = [
    { id: 1, opponent: 'AlienMaster', result: 'win', faction: 'humans', date: '2024-01-20' },
    { id: 2, opponent: 'RobotCommander', result: 'loss', faction: 'humans', date: '2024-01-19' },
    { id: 3, opponent: 'CyberTactician', result: 'win', faction: 'aliens', date: '2024-01-19' },
  ];

  const factionColors = {
    humans: 'humans-600',
    aliens: 'aliens-700',
    robots: 'robots-600',
  };

  const factionNames = {
    humans: '🛡️ Imperial',
    aliens: '👽 Alien',
    robots: '🤖 Machine',
  };

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
        <div className="mb-8 text-center">
          {/* Gothic decoration */}
          <div className="mb-6 flex justify-center">
            <div className="text-imperial-400 text-3xl font-gothic icon-glow-imperial">👤</div>
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-black mb-4 gothic-text-shadow">
            <span className="bg-gradient-to-r from-imperial-300 via-imperial-400 to-imperial-600 bg-clip-text text-transparent animate-hologram">
              WAR HERO
            </span>
          </h1>

          <div className="relative mb-6">
            <p className="text-xl md:text-2xl font-tech font-medium text-imperial-200 gothic-text-shadow tracking-wider">
              WAR RECORDS • ECHO ANALYSIS • BATTLE HISTORY
            </p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
          </div>

          <p className="text-lg text-void-300 font-tech font-light tracking-wide opacity-80">
            "Honor through war, wisdom through echoes..."
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-imperial-700/50 p-6 relative scanlines mb-6">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>

              <div className="text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-imperial-600 to-imperial-800 border-2 border-imperial-500/50 rounded-full flex items-center justify-center mx-auto mb-6 box-glow-imperial">
                  <UserIcon className="w-12 h-12 text-imperial-100" />
                </div>

                <h2 className="text-2xl font-gothic font-bold text-imperial-300 mb-3 gothic-text-shadow tracking-wider">{mockUser.username.toUpperCase()}</h2>
                <p className="text-imperial-400 mb-4 font-tech tracking-wide">{mockUser.email}</p>

                <div className="flex items-center justify-center text-sm text-imperial-500 font-tech">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span className="tracking-wide">WAR ENLISTED {new Date(mockUser.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-void-700/50 p-6 relative scanlines">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-500 to-transparent"></div>

              <h3 className="text-xl font-gothic font-bold text-void-400 mb-6 gothic-text-shadow tracking-wider">WAR SUMMARY</h3>

              <div className="space-y-6">
                <div className="bg-gothic-darker/60 border border-imperial-600/30 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-imperial-300 font-tech tracking-wide">WAR RANK</span>
                    <span className="text-imperial-400 font-gothic font-bold gothic-text-shadow">{mockStats.currentRank}</span>
                  </div>
                </div>

                <div className="bg-gothic-darker/60 border border-humans-600/30 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-humans-300 font-tech tracking-wide">PRIMARY LEGION</span>
                    <span className={`text-${factionColors[mockStats.favoriteFaction]} font-gothic font-bold gothic-text-shadow`}>
                      {factionNames[mockStats.favoriteFaction].replace('🛡️ ', '').replace('👽 ', '').replace('🤖 ', '').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-gothic-darker/60 border border-void-600/30 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-void-300 font-tech tracking-wide">ACTIVE WAR TIME</span>
                    <span className="text-void-400 font-gothic font-bold gothic-text-shadow">{mockStats.totalPlayTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="lg:col-span-2">
            {/* Win/Loss Stats */}
            <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-imperial-700/50 p-6 relative scanlines mb-6">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>

              <h3 className="text-2xl font-gothic font-bold text-imperial-400 mb-8 flex items-center gothic-text-shadow tracking-wider">
                <ChartBarIcon className="w-6 h-6 mr-3 icon-glow-imperial" />
                WAR STATISTICS
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-gothic-darker/60 border border-imperial-600/30 p-6">
                  <div className="text-4xl font-gothic font-bold text-imperial-400 mb-3 gothic-text-shadow">{mockStats.gamesPlayed}</div>
                  <div className="text-imperial-300 font-tech tracking-wider">WARS FOUGHT</div>
                </div>

                <div className="text-center bg-gothic-darker/60 border border-imperial-600/30 p-6">
                  <div className="text-4xl font-gothic font-bold text-imperial-400 mb-3 gothic-text-shadow">{mockStats.gamesWon}</div>
                  <div className="text-imperial-300 font-tech tracking-wider">WAR VICTORIES</div>
                </div>

                <div className="text-center bg-gothic-darker/60 border border-imperial-600/30 p-6">
                  <div className="text-4xl font-gothic font-bold text-imperial-400 mb-3 gothic-text-shadow">{mockStats.winRate}%</div>
                  <div className="text-imperial-300 font-tech tracking-wider">WAR SUCCESS RATIO</div>
                </div>
              </div>

              {/* Win Rate Progress Bar */}
              <div className="mt-8">
                <div className="flex justify-between text-sm text-imperial-400 mb-3 font-tech tracking-wider">
                  <span>WAR EFFICIENCY</span>
                  <span>{mockStats.winRate}%</span>
                </div>
                <div className="w-full bg-gothic-darker border border-imperial-600/30 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-imperial-500 to-imperial-400 h-4 rounded-full transition-all duration-500 shadow-lg shadow-imperial-500/50"
                    style={{ width: `${mockStats.winRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-void-700/50 p-6 relative scanlines">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-500 to-transparent"></div>

              <h3 className="text-2xl font-gothic font-bold text-void-400 mb-6 flex items-center gothic-text-shadow tracking-wider">
                <TrophyIcon className="w-6 h-6 mr-3 icon-glow-void" />
                RECENT WAR BATTLES
              </h3>
              
              <div className="space-y-4">
                {mockRecentGames.map((game) => (
                  <div key={game.id} className="bg-gothic-darker/80 border border-void-600/30 p-4 relative group hover:border-void-500/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 border-2 ${
                          game.result === 'win'
                            ? 'bg-imperial-500 border-imperial-400 shadow-lg shadow-imperial-500/50'
                            : 'bg-blood-500 border-blood-400 shadow-lg shadow-blood-500/50'
                        }`} />

                        <div>
                          <div className="font-gothic font-bold text-void-200 gothic-text-shadow">
                            VS {game.opponent.toUpperCase()}
                          </div>
                          <div className="text-sm text-void-400 font-tech tracking-wide">
                            {factionNames[game.faction as keyof typeof factionNames].replace('🛡️ ', '').replace('👽 ', '').replace('🤖 ', '').toUpperCase()} • {new Date(game.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className={`px-4 py-2 border font-tech font-bold text-sm tracking-wide ${
                        game.result === 'win'
                          ? 'bg-imperial-600/20 text-imperial-400 border-imperial-500/30'
                          : 'bg-blood-600/20 text-blood-400 border-blood-500/30'
                      }`}>
                        <span className="gothic-text-shadow">{game.result === 'win' ? 'WAR VICTORY' : 'WAR DEFEAT'}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-600 to-transparent group-hover:via-void-400 transition-colors"></div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button className="px-6 py-3 bg-void-600/80 hover:bg-void-500 text-void-100 border border-void-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-void">
                  <span className="gothic-text-shadow">ACCESS FULL WAR LOG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;