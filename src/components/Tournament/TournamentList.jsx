import React, { useState } from 'react';
import { Trash2, Edit2, Check, X, Users, Trophy } from 'lucide-react';

const TournamentList = ({ 
  tournaments, 
  activeTournamentId, 
  setActiveTournamentId, 
  removeTournament,
  renameTournament 
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

  return (
    <div className="w-72 bg-gray-900 p-4 rounded-lg">
      <div className="text-gray-300 font-semibold mb-2 flex items-center gap-2">
        <Trophy size={16} />
        Meus Torneios
      </div>
      <div className="space-y-2 max-h-80 overflow-auto">
        {tournaments.map(t => (
          <div 
            key={t.id} 
            className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${
              t.id === activeTournamentId ? 'bg-green-700' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => !editingId && setActiveTournamentId(t.id)}
          >
            {editingId === t.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-2 py-1 bg-black text-white rounded text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit(t.id);
                  }}
                  className="p-1 text-green-400 hover:text-green-300"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="text-white font-medium truncate">{t.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={10} />
                    {t.players?.length || 0} jogadores
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(t);
                    }}
                    className="p-1 text-blue-400 hover:text-blue-300"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTournament(t.id);
                    }}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {tournaments.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Nenhum torneio criado.
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentList;
