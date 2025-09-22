import { UserIcon, TrophyIcon, ChartBarIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  // Mock user data
  const mockUser = {
    username: 'TacticalPlayer',
    email: 'player@tcgtactique.com',
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
    humans: '🛡️ Humans',
    aliens: '👽 Aliens', 
    robots: '🤖 Robots',
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-cyber font-black mb-6 gradient-text-cyber tracking-wider uppercase">
            🛡️ TACTICAL PROFILE
          </h1>
          <div className="cyber-panel inline-block px-6 py-3 rounded-xl">
            <p className="font-sans tracking-wide neon-text-cyan">
              MONITOR COMBAT PERFORMANCE AND STRATEGIC STATISTICS
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="cyber-panel rounded-xl p-8 mb-8 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
              <div className="absolute inset-0 holographic opacity-5 pointer-events-none" />

              <div className="text-center relative z-10">
                {/* Avatar */}
                <div className="w-32 h-32 mx-auto mb-6 rounded-xl cyber-panel flex items-center justify-center relative overflow-hidden neon-glow-cyan">
                  <div className="absolute inset-0 holographic opacity-20" />
                  <UserIcon className="w-16 h-16 neon-text-cyan relative z-10" />
                </div>

                <h2 className="text-3xl font-cyber font-black mb-3 neon-text-cyan tracking-wider uppercase">
                  {mockUser.username}
                </h2>
                <p className="text-cyber-muted mb-6 font-sans">{mockUser.email}</p>

                <div className="cyber-card-container rounded-lg p-3 inline-flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-3 neon-text-green" />
                  <span className="text-sm font-cyber tracking-wider uppercase text-neon-green-300">
                    ENLISTED: {new Date(mockUser.joinDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-neon-cyan-400 opacity-60" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-cyan-400 opacity-60" />
            </div>

            {/* Quick Stats */}
            <div className="cyber-panel rounded-xl p-6 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />

              <h3 className="text-xl font-cyber font-bold mb-6 neon-text-blue tracking-wider uppercase relative z-10">
                ⚡ COMBAT STATUS
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="cyber-card-container rounded-lg p-4 flex justify-between items-center">
                  <span className="text-cyber-muted font-cyber tracking-wider uppercase text-sm">CURRENT RANK</span>
                  <span className="neon-text-yellow font-cyber font-bold tracking-wider">{mockStats.currentRank}</span>
                </div>

                <div className="cyber-card-container rounded-lg p-4 flex justify-between items-center">
                  <span className="text-cyber-muted font-cyber tracking-wider uppercase text-sm">FAVORED FACTION</span>
                  <span className={`font-cyber font-bold tracking-wider ${
                    mockStats.favoriteFaction === 'humans' ? 'neon-text-blue' :
                    mockStats.favoriteFaction === 'aliens' ? 'neon-text-pink' :
                    'neon-text-green'
                  }`}>
                    {factionNames[mockStats.favoriteFaction]}
                  </span>
                </div>

                <div className="cyber-card-container rounded-lg p-4 flex justify-between items-center">
                  <span className="text-cyber-muted font-cyber tracking-wider uppercase text-sm">COMBAT TIME</span>
                  <span className="neon-text-cyan font-cyber font-bold tracking-wider">{mockStats.totalPlayTime}</span>
                </div>
              </div>

              {/* Scanning line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue-400 to-transparent animate-scanline opacity-40" />
            </div>
          </div>

          {/* Statistics */}
          <div className="lg:col-span-2">
            {/* Win/Loss Stats */}
            <div className="cyber-panel rounded-xl p-8 mb-8 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
              <div className="absolute inset-0 holographic opacity-5 pointer-events-none" />

              <h3 className="text-2xl font-cyber font-bold mb-8 flex items-center neon-text-green tracking-wider uppercase relative z-10">
                <ChartBarIcon className="w-8 h-8 mr-3" />
                TACTICAL ANALYTICS
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="text-center cyber-card-container rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 holographic opacity-10" />
                  <div className="text-4xl font-cyber font-black neon-text-blue mb-3 relative z-10">{mockStats.gamesPlayed}</div>
                  <div className="text-cyber-muted font-cyber tracking-wider uppercase text-sm relative z-10">ENGAGEMENTS</div>
                </div>

                <div className="text-center cyber-card-container rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 holographic opacity-10" />
                  <div className="text-4xl font-cyber font-black neon-text-green mb-3 relative z-10">{mockStats.gamesWon}</div>
                  <div className="text-cyber-muted font-cyber tracking-wider uppercase text-sm relative z-10">VICTORIES</div>
                </div>

                <div className="text-center cyber-card-container rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 holographic opacity-10" />
                  <div className="text-4xl font-cyber font-black neon-text-yellow mb-3 relative z-10">{mockStats.winRate}%</div>
                  <div className="text-cyber-muted font-cyber tracking-wider uppercase text-sm relative z-10">SUCCESS RATE</div>
                </div>
              </div>

              {/* Win Rate Progress Bar */}
              <div className="mt-8 relative z-10">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-cyber tracking-wider uppercase text-cyber-muted">TACTICAL EFFICIENCY</span>
                  <span className="font-cyber tracking-wider uppercase neon-text-yellow">{mockStats.winRate}%</span>
                </div>
                <div className="w-full cyber-card-container rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-neon-green-500 via-neon-cyan-400 to-neon-yellow-500 h-4 rounded-full transition-all duration-1000 neon-glow-green"
                    style={{ width: `${mockStats.winRate}%` }}
                  />
                </div>
              </div>

              {/* Scanning line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green-400 to-transparent animate-scanline opacity-40" />
            </div>

            {/* Recent Games */}
            <div className="cyber-panel rounded-xl p-8 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />

              <h3 className="text-2xl font-cyber font-bold mb-8 flex items-center neon-text-pink tracking-wider uppercase relative z-10">
                <TrophyIcon className="w-8 h-8 mr-3" />
                RECENT ENGAGEMENTS
              </h3>
              
              <div className="space-y-4 relative z-10">
                {mockRecentGames.map((game) => (
                  <div key={game.id} className="cyber-card-container rounded-lg p-5 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 holographic opacity-5" />

                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        game.result === 'win'
                          ? 'bg-neon-green-500 border-neon-green-400 neon-glow-green'
                          : 'bg-neon-red-500 border-neon-red-400 neon-glow-red'
                      }`} />

                      <div>
                        <div className="font-cyber font-bold text-neon-cyan-300 tracking-wider uppercase">
                          VS {game.opponent}
                        </div>
                        <div className="text-sm text-cyber-muted font-sans">
                          {factionNames[game.faction as keyof typeof factionNames]} • {new Date(game.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-xl text-sm font-cyber font-bold tracking-wider uppercase cyber-panel ${
                      game.result === 'win'
                        ? 'neon-text-green border-neon-green-300 neon-glow-green'
                        : 'neon-text-red border-neon-red-300 neon-glow-red'
                    }`}>
                      {game.result === 'win' ? '⚡ VICTORY' : '💥 DEFEAT'}
                    </div>

                    {/* Corner accents for wins */}
                    {game.result === 'win' && (
                      <>
                        <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-neon-green-400 opacity-60" />
                        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-neon-green-400 opacity-60" />
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center relative z-10">
                <button className="neon-button px-8 py-3 rounded-xl font-cyber tracking-wider uppercase text-sm transition-all duration-300 text-neon-cyan-300 border-neon-cyan-300 hover:neon-glow-cyan">
                  ACCESS FULL COMBAT LOG
                </button>
              </div>

              {/* Scanning line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-pink-400 to-transparent animate-scanline opacity-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;