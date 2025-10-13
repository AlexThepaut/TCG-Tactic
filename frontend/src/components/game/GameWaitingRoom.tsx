import { ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface GameWaitingRoomProps {
  gameId: string;
  isHost: boolean;
  opponentJoined: boolean;
  onReady: () => void;
  isReady: boolean;
  opponentReady: boolean;
}

export const GameWaitingRoom: React.FC<GameWaitingRoomProps> = ({
  gameId,
  isHost,
  opponentJoined,
  onReady,
  isReady,
  opponentReady
}) => {
  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    toast.success('Game ID copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-gothic-black/90 border-2 border-imperial-500/50 rounded-xl p-8">
          <h1 className="text-3xl font-gothic font-bold text-imperial-400 mb-6 text-center gothic-text-shadow">
            Waiting Room
          </h1>

          {/* Game ID Display */}
          <div className="bg-gothic-darkest/60 border border-void-600/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-void-400 font-tech mb-1">Game ID</div>
                <div className="text-xl font-bold text-imperial-300 font-mono">{gameId}</div>
              </div>
              <button
                onClick={copyGameId}
                className="p-3 bg-imperial-600/50 hover:bg-imperial-500 border border-imperial-400/50 rounded-lg transition-all duration-300"
                aria-label="Copy Game ID"
              >
                <ClipboardDocumentIcon className="w-6 h-6 text-imperial-200" />
              </button>
            </div>
            {isHost && !opponentJoined && (
              <div className="mt-3 text-sm text-imperial-300 font-tech">
                Share this ID with your opponent
              </div>
            )}
          </div>

          {/* Player Status */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-gothic-darkest/40 border border-void-600/20 rounded-lg">
              <span className="text-imperial-300 font-tech">
                {isHost ? 'You (Host)' : 'You'}
              </span>
              {isReady && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-tech">Ready</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gothic-darkest/40 border border-void-600/20 rounded-lg">
              <span className="text-aliens-300 font-tech">Opponent</span>
              {opponentJoined ? (
                opponentReady ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-tech">Ready</span>
                  </div>
                ) : (
                  <span className="text-void-400 font-tech">Waiting...</span>
                )
              ) : (
                <span className="text-void-500 font-tech italic">Not joined</span>
              )}
            </div>
          </div>

          {/* Ready Button */}
          {opponentJoined && !isReady && (
            <button
              onClick={onReady}
              className="w-full px-8 py-4 bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border border-imperial-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-imperial"
            >
              Ready to Start
            </button>
          )}

          {/* Waiting for opponent to ready */}
          {isReady && !opponentReady && (
            <div className="text-center text-imperial-300 font-tech animate-pulse">
              Waiting for opponent to ready up...
            </div>
          )}

          {/* Both ready - game starting */}
          {isReady && opponentReady && (
            <div className="text-center text-green-400 font-tech font-bold text-xl animate-pulse">
              Game Starting...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameWaitingRoom;
