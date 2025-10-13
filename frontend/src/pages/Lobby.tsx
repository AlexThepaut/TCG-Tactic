import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSocket } from '@/hooks';
import toast from 'react-hot-toast';

const Lobby = () => {
  const navigate = useNavigate();
  const { createGame, joinGame } = useGameSocket();
  const [gameId, setGameId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const response = await createGame({
        timeLimit: 300,
        ranked: false,
        spectatorMode: false,
        faction: 'humans', // Default faction
        deck: [] // Mock deck for now
      });

      if (response.success && response.gameId) {
        toast.success(`Game created! ID: ${response.gameId}`);
        navigate(`/game/${response.gameId}`);
      }
    } catch (error) {
      toast.error('Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameId.trim()) {
      toast.error('Please enter a game ID');
      return;
    }

    setIsJoining(true);
    try {
      const response = await joinGame(gameId);

      if (response.success) {
        navigate(`/game/${gameId}`);
      }
    } catch (error) {
      toast.error('Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <h1 className="text-4xl font-gothic font-bold text-imperial-400 mb-8 text-center gothic-text-shadow">
          Game Lobby
        </h1>

        {/* Create Game Section */}
        <div className="bg-gothic-black/90 border-2 border-imperial-500/50 rounded-xl p-8 mb-6">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>

          <h2 className="text-2xl font-tech text-imperial-300 mb-4">Create New Game</h2>
          <p className="text-void-400 mb-6">Start a new game and share the Game ID with your opponent</p>

          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className="w-full px-8 py-4 bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border border-imperial-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-imperial disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Game'}
          </button>
        </div>

        {/* Join Game Section */}
        <div className="bg-gothic-black/90 border-2 border-aliens-500/50 rounded-xl p-8">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-aliens-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-aliens-500 to-transparent"></div>

          <h2 className="text-2xl font-tech text-aliens-300 mb-4">Join Existing Game</h2>
          <p className="text-void-400 mb-6">Enter the Game ID provided by your opponent</p>

          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Game ID..."
            className="w-full px-4 py-3 bg-gothic-darkest border border-void-600 text-void-200 rounded-lg mb-4 focus:outline-none focus:border-aliens-500 font-tech"
          />

          <button
            onClick={handleJoinGame}
            disabled={isJoining || !gameId.trim()}
            className="w-full px-8 py-4 bg-aliens-600/80 hover:bg-aliens-500 text-aliens-100 border border-aliens-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-aliens disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
