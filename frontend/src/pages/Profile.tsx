import { UserIcon, TrophyIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';

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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Player Profile</h1>
          <p className="text-gray-300">Track your progress and statistics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">{mockUser.username}</h2>
                <p className="text-gray-400 mb-4">{mockUser.email}</p>
                
                <div className="flex items-center justify-center text-sm text-gray-400">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Joined {new Date(mockUser.joinDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Current Rank</span>
                  <span className="text-yellow-400 font-semibold">{mockStats.currentRank}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Favorite Faction</span>
                  <span className={`text-${factionColors[mockStats.favoriteFaction]} font-semibold`}>
                    {factionNames[mockStats.favoriteFaction]}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Play Time</span>
                  <span className="text-blue-400 font-semibold">{mockStats.totalPlayTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="lg:col-span-2">
            {/* Win/Loss Stats */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-2" />
                Game Statistics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{mockStats.gamesPlayed}</div>
                  <div className="text-gray-300">Games Played</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">{mockStats.gamesWon}</div>
                  <div className="text-gray-300">Games Won</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{mockStats.winRate}%</div>
                  <div className="text-gray-300">Win Rate</div>
                </div>
              </div>

              {/* Win Rate Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Win Rate Progress</span>
                  <span>{mockStats.winRate}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${mockStats.winRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <TrophyIcon className="w-6 h-6 mr-2" />
                Recent Games
              </h3>
              
              <div className="space-y-3">
                {mockRecentGames.map((game) => (
                  <div key={game.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        game.result === 'win' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      
                      <div>
                        <div className="font-medium text-white">
                          vs {game.opponent}
                        </div>
                        <div className="text-sm text-gray-400">
                          {factionNames[game.faction as keyof typeof factionNames]} • {new Date(game.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      game.result === 'win' 
                        ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                        : 'bg-red-600/20 text-red-400 border border-red-500/30'
                    }`}>
                      {game.result === 'win' ? 'Victory' : 'Defeat'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  View Full Match History
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