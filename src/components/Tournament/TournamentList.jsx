import React, { useState } from 'react';
import { 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Users, 
  Trophy,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

const TournamentList = ({ 
  tournaments, 
  activeTournamentId, 
  setActiveTournamentId, 
  removeTournament,
  renameTournament,
  toggleTournamentVisibility
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (tournament) => {
    setEditingId(tournament.id);
    setEditName(tournament.name);
  };

  const handleSaveEdit = (id) => {
    if (editName.trim()) {
      renameTournament(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPlayerCount = (tournament) => {
    return tournament.data?.players?.length || 0;
  };

  const getActivePlayers = (tournament) => {
    return tournament.data?.players?.filter(p => p.active).length || 0;
  };

  const getTournamentStatus = (tournament) => {
    if (!tournament.data?.isRunning) return 'pausado';
    const timeLeft = tournament.data?.timeLeft || 0;
    const levelIndex = tournament.data?.currentLevelIndex || 0;
    return `nível ${levelIndex + 1} • ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 bg-gray-900 p-4 rounded-lg">
      <div className="text-gray-300 font-semibold mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} />
          <span>Meus Torneios</span>
        </div>
        <div className="text-sm text-gray-400">
          {tournaments.length} {tournaments.length === 1 ? 'torneio' : 'torneios'}
        </div>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {tournaments.map(tournament => (
          <div 
            key={tournament.id} 
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
              tournament.id === activeTournamentId 
                ? 'bg-gradient-to-r from-green-800/30 to-green-900/50 border-l-4 border-green-500' 
                : 'bg-gray-800 hover:bg-gray-700/70'
            }`}
            onClick={() => !editingId && setActiveTournamentId(tournament.id)}
          >
            {editingId === tournament.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-sm border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(tournament.id);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit(tournament.id);
                    }}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
                    title="Salvar"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                    title="Cancelar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-white font-semibold text-lg truncate">
                      {tournament.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Criado em: {formatDate(tournament.created_at)}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTournamentVisibility && toggleTournamentVisibility(tournament.id);
                      }}
                      className={`p-2 rounded-lg ${tournament.is_public ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                      title={tournament.is_public ? 'Público - Clique para tornar privado' : 'Privado - Clique para tornar público'}
                    >
                      {tournament.is_public ? (
                        <Eye size={14} className="text-white" />
                      ) : (
                        <EyeOff size={14} className="text-gray-300" />
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(tournament);
                      }}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                      title="Renomear torneio"
                    >
                      <Edit2 size={14} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Tem certeza que deseja excluir o torneio "${tournament.name}"? Esta ação não pode ser desfeita.`)) {
                          removeTournament(tournament.id);
                        }
                      }}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                      title="Excluir torneio"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users size={14} />
                    <span>
                      <span className="font-semibold text-white">{getPlayerCount(tournament)}</span> jogadores
                      {getActivePlayers(tournament) > 0 && (
                        <span className="text-green-400 ml-1">
                          ({getActivePlayers(tournament)} ativos)
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock size={14} />
                    <span className="truncate">
                      {getTournamentStatus(tournament)}
                    </span>
                  </div>
                </div>

                {tournament.data?.currentLevelIndex !== undefined && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-400">
                      Nível atual: <span className="text-white font-semibold">
                        {tournament.data.currentLevelIndex + 1}
                      </span>
                      {tournament.data.blinds && tournament.data.blinds[tournament.data.currentLevelIndex] && (
                        <>
                          {' • '}
                          <span className="text-green-400">
                            {tournament.data.blinds[tournament.data.currentLevelIndex].smallBlind}/
                            {tournament.data.blinds[tournament.data.currentLevelIndex].bigBlind}
                            {tournament.data.blinds[tournament.data.currentLevelIndex].ante > 0 && 
                              ` +${tournament.data.blinds[tournament.data.currentLevelIndex].ante}`
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {tournament.is_public && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/50 text-blue-300 border border-blue-700">
                      <Eye size={10} className="mr-1" />
                      Público
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        
        {tournaments.length === 0 && (
          <div className="text-center py-8 px-4 bg-gray-800/50 rounded-lg">
            <Trophy size={48} className="mx-auto text-gray-600 mb-3" />
            <div className="text-gray-400 font-medium mb-2">Nenhum torneio criado</div>
            <p className="text-gray-500 text-sm">
              Crie seu primeiro torneio para começar a gerenciar suas partidas de poker.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Total de torneios: <span className="text-gray-300 font-semibold">{tournaments.length}</span></span>
            <span>Total de jogadores: <span className="text-gray-300 font-semibold">
              {tournaments.reduce((total, t) => total + getPlayerCount(t), 0)}
            </span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentList;
