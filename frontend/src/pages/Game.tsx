import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Game = () => {

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      {/* Game Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Exit Game
          </Link>

          <div className="text-white font-semibold">
            TCG Tactique - Game Screen
          </div>

          <div className="text-sm text-gray-400">
            Turn 1 - Resources Phase
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-2xl">
          <h1 className="text-4xl font-bold mb-6 text-blue-400">
            Game Engine Coming Soon
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            This is where the 3×5 tactical grid gameplay will be implemented.
          </p>

          {/* Mock Game Grid Preview */}
          <div className="bg-black/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Expected Layout:</h3>

            {/* Player 2 Area (top) */}
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">Opponent</div>
              <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-grid-cell border border-grid-border rounded text-xs flex items-center justify-center text-gray-500"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Player 1 Area (bottom) */}
            <div>
              <div className="text-sm text-gray-400 mb-2">You</div>
              <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-grid-cell border border-grid-border rounded text-xs flex items-center justify-center text-gray-500"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 text-left bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-200">Game Features to Implement:</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Real-time Socket.io multiplayer</li>
              <li>• 3×5 tactical grid with faction formations</li>
              <li>• Drag & drop card placement</li>
              <li>• Combat system with animations</li>
              <li>• Quest-based victory conditions</li>
              <li>• Turn phases: Resources → Draw → Actions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;