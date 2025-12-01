import React, { useState, useEffect } from 'react';
import { tournamentService } from '../../services/tournamentService';
import { Trophy, Users, BarChart, Filter, Plus, Trash2 } from 'lucide-react';

const RankingViewer = ({ tournament, tournaments }) => {
  const [combinedRanking, setCombinedRanking] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [rankingGroups, setRankingGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRankingGroups();
  }, []);

  const loadRankingGroups = async () => {
    try {
      // Em uma implementação real, isso viria do banco de dados
      // Por enquanto, vamos usar localStorage
      const groups = JSON.parse(localStorage.getItem('ranking_groups') || '[]');
      setRankingGroups(groups);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const calculateRanking = (players, stageWeight) => {
    return players.map(p => {
      const position = p.position ?? (p.active ? players.length : players.length);
      const score = p.position <= 0 || p.actions <= 0 ? 0 : 
        Math.pow(((p.actions / position) * 100), 0.5) * stageWeight;
      return { ...p, score, finalPosition: position };
    }).sort((a, b) => b.score - a.score);
  };

  const calculateCombinedRanking = async (tournamentIds) => {
    setLoading(true);
    try {
      // Em uma implementação real, usaria o tournamentService
      // Por enquanto, vamos simular com os torneios em memória
      const selectedTournaments = tournaments.filter(t => 
        tournamentIds.includes(t.id)
      );

      const allPlayers = {};
      
      selectedTournaments.forEach(tournament => {
        const rankedPlayers = calculateRanking(tournament.players, tournament.stageWeight);
        
        rankedPlayers.forEach((player, index) => {
          const key = player.name.toLowerCase();
          if (!allPlayers[key]) {
            allPlayers[key] = {
              name: player.name,
              totalPoints: 0,
              tournaments: 0,
              bestPosition: Infinity,
              positions: [],
              points: []
            };
          }
          
          allPlayers[key].totalPoints += player.score || 0;
          allPlayers[key].tournaments += 1;
          allPlayers[key].bestPosition = Math.min(allPlayers[key].bestPosition, index + 1);
          allPlayers[key].positions.push(index + 1);
          allPlayers[key].points.push(player.score || 0);
        });
      });

      const combined = Object.values(allPlayers)
        .map(player => ({
          ...player,
          averagePoints: player.totalPoints / player.tournaments,
          averagePosition: player.positions.reduce((a, b) => a + b, 0) / player.positions.length,
          consistency: calculateConsistency(player.positions)
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);

      setCombinedRanking(combined);
    } catch (error) {
      console.error('Erro ao calcular ranking combinado:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateConsistency = (positions) => {
    if (positions.length < 2) return 100;
    const avg = positions.reduce((a, b) => a + b, 0) / positions.length;
    const variance = positions.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / positions.length;
    return Math.max(0, 100 - (variance * 10));
  };

  const createRankingGroup = () => {
    if (!newGroupName.trim() || selectedGroups.length === 0) return;

    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      tournamentIds: selectedGroups,
      createdAt: new Date().toISOString()
    };

    const updatedGroups = [...rankingGroups, newGroup];
    setRankingGroups(updatedGroups);
    localStorage.setItem('ranking_groups', JSON.stringify(updatedGroups));
    setNewGroupName('');
    setSelectedGroups([]);
    setActiveGroup(newGroup);
    calculateCombinedRanking(selectedGroups);
  };

  const deleteRankingGroup = (groupId) => {
    const updatedGroups = rankingGroups.filter(g => g.id !== groupId);
    setRankingGroups(updatedGroups);
    localStorage.setItem('ranking_groups', JSON.stringify(updatedGroups));
    if (activeGroup?.id === groupId) {
      setActiveGroup(null);
      setCombinedRanking([]);
    }
  };

  const loadGroupRanking = (group) => {
    setActiveGroup(group);
    calculateCombinedRanking(group.tournamentIds);
  };

  // Ranking individual do torneio atual
  const individualRanking = calculateRanking(tournament.players, tournament.stageWeight);

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy size={24} />
          Sistema de Ranking
        </h3>
        <div className="text-sm text-gray-400">
          Peso da etapa: <span className="font-bold">{tournament.stageWeight}</span>
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveGroup(null)}
          className={`px-4 py-2 font-medium ${!activeGroup ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
        >
          Ranking Individual
        </button>
        <button
          onClick={() => activeGroup && loadGroupRanking(activeGroup)}
          className={`px-4 py-2 font-medium ${activeGroup ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Ranking Combinado
        </button>
      </div>

      {/* Seção de Grupos */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={18} />
            Grupos de Ranking
          </h4>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              value={selectedGroups}
              onChange={(e) => setSelectedGroups(Array.from(e.target.selectedOptions, opt => opt.value))}
              multiple
              size="3"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              placeholder="Nome do grupo"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button
              onClick={createRankingGroup}
              disabled={!newGroupName.trim() || selectedGroups.length === 0}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Criar
            </button>
          </div>
        </div>

        {/* Lista de Grupos */}
        <div className="space-y-2">
          {rankingGroups.map(group => (
            <div
              key={group.id}
              className={`p-3 rounded flex items-center justify-between cursor-pointer ${activeGroup?.id === group.id ? 'bg-blue-900' : 'bg-gray-800 hover:bg-gray-700'}`}
              onClick={() => loadGroupRanking(group)}
            >
              <div>
                <div className="font-medium text-white">{group.name}</div>
                <div className="text-sm text-gray-400">
                  {group.tournamentIds.length} torneio(s)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  Criado em: {new Date(group.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRankingGroup(group.id);
                  }}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {rankingGroups.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              Nenhum grupo criado. Selecione torneios e crie um grupo para combinar rankings.
            </div>
          )}
        </div>
      </div>

      {/* Ranking Individual */}
      {!activeGroup && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Trophy size={20} />
            Ranking do Torneio: {tournament.name}
          </div>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {individualRanking.map((player, index) => (
              <div
                key={player.id}
                className={`p-4 rounded flex items-center justify-between ${
                  index === 0 ? 'bg-yellow-900' :
                  index === 1 ? 'bg-gray-700' :
                  index === 2 ? 'bg-orange-900' : 'bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`font-bold text-lg w-8 h-8 flex items-center justify-center rounded ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-500 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-800 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{player.name}</div>
                    <div className="text-sm opacity-75">
                      Posição: {player.finalPosition}º • Ações: {player.actions} • Pontos: {player.score.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl">{player.score.toFixed(2)}</div>
                  <div className="text-xs opacity-75">pontos</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranking Combinado */}
      {activeGroup && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold">
              <BarChart size={20} />
              Ranking Combinado: {activeGroup.name}
            </div>
            <div className="text-sm text-gray-400">
              {combinedRanking.length} jogadores • {activeGroup.tournamentIds.length} torneios
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Calculando ranking...</div>
          ) : combinedRanking.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {combinedRanking.map((player, index) => (
                <div
                  key={player.name}
                  className={`p-4 rounded flex items-center justify-between ${
                    index === 0 ? 'bg-purple-900' :
                    index === 1 ? 'bg-blue-900' :
                    index === 2 ? 'bg-teal-900' : 'bg-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`font-bold text-lg w-8 h-8 flex items-center justify-center rounded ${
                      index === 0 ? 'bg-purple-500 text-white' :
                      index === 1 ? 'bg-blue-500 text-white' :
                      index === 2 ? 'bg-teal-500 text-white' : 'bg-gray-700 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">{player.name}</div>
                      <div className="text-sm opacity-75">
                        Torneios: {player.tournaments} • Melhor posição: {player.bestPosition}º • Consistência: {player.consistency.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl">{player.totalPoints.toFixed(2)}</div>
                    <div className="text-xs opacity-75">
                      Média: {player.averagePoints.toFixed(2)} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Nenhum dado disponível para os torneios selecionados.
            </div>
          )}

          {/* Estatísticas do Grupo */}
          {combinedRanking.length > 0 && (
            <div className="bg-gray-900 p-4 rounded-lg mt-4">
              <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Filter size={16} />
                Estatísticas do Grupo
              </h5>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-400">Jogador Top</div>
                  <div className="font-bold text-white">{combinedRanking[0]?.name}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Maior Pontuação</div>
                  <div className="font-bold text-green-400">{combinedRanking[0]?.totalPoints.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Média de Torneios</div>
                  <div className="font-bold text-white">
                    {(combinedRanking.reduce((sum, p) => sum + p.tournaments, 0) / combinedRanking.length).toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Consistência Média</div>
                  <div className="font-bold text-blue-400">
                    {(combinedRanking.reduce((sum, p) => sum + p.consistency, 0) / combinedRanking.length).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RankingViewer;
