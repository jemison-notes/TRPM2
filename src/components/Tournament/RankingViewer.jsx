import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  BarChart, 
  Filter, 
  Plus, 
  Trash2,
  Award,
  TrendingUp,
  Target,
  Crown,
  Star,
  Link,
  Unlink,
  Download,
  Share2
} from 'lucide-react';

const RankingViewer = ({ tournament, tournaments, updateRankingGroups }) => {
  const [combinedRanking, setCombinedRanking] = useState([]);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [rankingGroups, setRankingGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Carregar grupos do localStorage ou contexto
  useEffect(() => {
    loadRankingGroups();
  }, []);

  const loadRankingGroups = () => {
    try {
      const groups = JSON.parse(localStorage.getItem('ranking_groups') || '[]');
      setRankingGroups(groups);
      
      // Se houver grupos, carregar o primeiro
      if (groups.length > 0 && !activeGroup) {
        setActiveGroup(groups[0]);
        calculateCombinedRanking(groups[0].tournamentIds);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const saveRankingGroups = (groups) => {
    localStorage.setItem('ranking_groups', JSON.stringify(groups));
    setRankingGroups(groups);
    if (updateRankingGroups) {
      updateRankingGroups(groups);
    }
  };

  // Fórmula de ranking
  const calculateRanking = (players, stageWeight = 1.0) => {
    return players
      .map(player => {
        const position = player.position ?? (player.active ? players.length : players.length);
        const score = position <= 0 || player.actions <= 0 ? 0 : 
          Math.pow(((player.actions / position) * 100), 0.5) * stageWeight;
        return { 
          ...player, 
          score: parseFloat(score.toFixed(2)),
          finalPosition: position 
        };
      })
      .sort((a, b) => b.score - a.score);
  };

  // Calcular ranking combinado
  const calculateCombinedRanking = async (tournamentIds) => {
    setLoading(true);
    try {
      // Filtrar torneios selecionados
      const selectedTournamentsData = tournaments.filter(t => 
        tournamentIds.includes(t.id)
      );

      // Calcular ranking para cada torneio e combinar
      const allPlayers = {};
      
      selectedTournamentsData.forEach(tournamentData => {
        const rankedPlayers = calculateRanking(
          tournamentData.players || [], 
          tournamentData.stageWeight || 1.0
        );
        
        rankedPlayers.forEach((player, index) => {
          const key = player.name.toLowerCase().trim();
          
          if (!allPlayers[key]) {
            allPlayers[key] = {
              name: player.name,
              totalPoints: 0,
              tournaments: 0,
              bestPosition: Infinity,
              worstPosition: 0,
              positions: [],
              points: [],
              totalActions: 0,
              avgPosition: 0,
              consistency: 100,
              tournamentsPlayed: new Set()
            };
          }
          
          allPlayers[key].totalPoints += player.score || 0;
          allPlayers[key].tournaments += 1;
          allPlayers[key].bestPosition = Math.min(allPlayers[key].bestPosition, index + 1);
          allPlayers[key].worstPosition = Math.max(allPlayers[key].worstPosition, index + 1);
          allPlayers[key].positions.push(index + 1);
          allPlayers[key].points.push(player.score || 0);
          allPlayers[key].totalActions += player.actions || 0;
          allPlayers[key].tournamentsPlayed.add(tournamentData.id);
        });
      });

      // Calcular métricas adicionais
      const combined = Object.values(allPlayers)
        .map(player => {
          const avgPosition = player.positions.reduce((a, b) => a + b, 0) / player.positions.length;
          const avgPoints = player.totalPoints / player.tournaments;
          
          // Calcular consistência (menor variância = maior consistência)
          const positionVariance = player.positions.reduce((sum, pos) => 
            sum + Math.pow(pos - avgPosition, 2), 0) / player.positions.length;
          const consistency = Math.max(0, 100 - (positionVariance * 10));
          
          return {
            ...player,
            avgPosition: parseFloat(avgPosition.toFixed(1)),
            avgPoints: parseFloat(avgPoints.toFixed(2)),
            consistency: parseFloat(consistency.toFixed(1)),
            tournamentsPlayed: Array.from(player.tournamentsPlayed),
            tournamentCount: player.tournaments
          };
        })
        .sort((a, b) => b.totalPoints - a.totalPoints);

      setCombinedRanking(combined);
    } catch (error) {
      console.error('Erro ao calcular ranking combinado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar novo grupo
  const createRankingGroup = () => {
    if (!newGroupName.trim() || selectedTournaments.length === 0) {
      alert('Por favor, insira um nome para o grupo e selecione pelo menos um torneio.');
      return;
    }

    const newGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newGroupName.trim(),
      tournamentIds: [...selectedTournaments],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tournamentCount: selectedTournaments.length
    };

    const updatedGroups = [...rankingGroups, newGroup];
    saveRankingGroups(updatedGroups);
    
    setNewGroupName('');
    setSelectedTournaments([]);
    setShowCreateGroup(false);
    setActiveGroup(newGroup);
    calculateCombinedRanking(newGroup.tournamentIds);
  };

  // Excluir grupo
  const deleteRankingGroup = (groupId) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo de ranking?')) {
      return;
    }

    const updatedGroups = rankingGroups.filter(g => g.id !== groupId);
    saveRankingGroups(updatedGroups);
    
    if (activeGroup?.id === groupId) {
      setActiveGroup(null);
      setCombinedRanking([]);
    }
  };

  // Carregar grupo
  const loadGroupRanking = (group) => {
    setActiveGroup(group);
    calculateCombinedRanking(group.tournamentIds);
  };

  // Exportar ranking para CSV
  const exportRankingCSV = () => {
    if (!combinedRanking.length) return;

    const headers = [
      'Posição',
      'Jogador',
      'Pontuação Total',
      'Média de Pontos',
      'Torneios Jogados',
      'Melhor Posição',
      'Pior Posição',
      'Média de Posição',
      'Consistência (%)',
      'Total de Ações'
    ];

    const rows = combinedRanking.map((player, index) => [
      index + 1,
      player.name,
      player.totalPoints.toFixed(2),
      player.avgPoints.toFixed(2),
      player.tournamentCount,
      player.bestPosition,
      player.worstPosition,
      player.avgPosition.toFixed(1),
      player.consistency.toFixed(1),
      player.totalActions
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv ? 'data:text/csv;charset=utf-8,' + csvContent : ''], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ranking_${activeGroup?.name || 'combinado'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compartilhar ranking
  const shareRanking = () => {
    if (!activeGroup || !combinedRanking.length) return;

    const top3 = combinedRanking.slice(0, 3);
    const shareText = `🏆 Ranking Poker - ${activeGroup.name}\n\n` +
      top3.map((player, index) => 
        `${['🥇', '🥈', '🥉'][index]} ${player.name}: ${player.totalPoints.toFixed(2)} pontos\n` +
        `   Média: ${player.avgPoints.toFixed(2)} • Torneios: ${player.tournamentCount}`
      ).join('\n\n');

    if (navigator.share) {
      navigator.share({
        title: `Ranking Poker - ${activeGroup.name}`,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Ranking copiado para a área de transferência!');
    }
  };

  // Ranking individual do torneio atual
  const individualRanking = calculateRanking(
    tournament.players || [], 
    tournament.stageWeight || 1.0
  );

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy size={24} />
            Sistema de Ranking
          </h3>
          <p className="text-gray-400 text-sm">
            Combine múltiplos torneios e analise o desempenho dos jogadores
          </p>
        </div>
        
        <div className="flex gap-3">
          {activeGroup && combinedRanking.length > 0 && (
            <>
              <button
                onClick={exportRankingCSV}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2"
              >
                <Download size={16} />
                Exportar
              </button>
              <button
                onClick={shareRanking}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white flex items-center gap-2"
              >
                <Share2 size={16} />
                Compartilhar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveGroup(null)}
          className={`px-6 py-3 font-medium text-lg flex items-center gap-2 ${
            !activeGroup 
              ? 'text-green-400 border-b-2 border-green-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Target size={20} />
          Ranking Individual
        </button>
        
        <button
          onClick={() => activeGroup && loadGroupRanking(activeGroup)}
          className={`px-6 py-3 font-medium text-lg flex items-center gap-2 ${
            activeGroup 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart size={20} />
          Ranking Combinado
        </button>
      </div>

      {/* Seção de Criação de Grupos */}
      {showCreateGroup && (
        <div className="bg-gradient-to-r from-gray-900 to-black p-6 rounded-xl border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus size={20} />
            Criar Novo Grupo de Ranking
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nome do Grupo</label>
              <input
                type="text"
                className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                placeholder="Ex: Liga Principal 2024"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Selecione Torneios para Incluir ({selectedTournaments.length} selecionados)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-black/30 rounded-lg">
                {tournaments.map(t => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition ${
                      selectedTournaments.includes(t.id)
                        ? 'bg-blue-600/30 border border-blue-500'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={selectedTournaments.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTournaments([...selectedTournaments, t.id]);
                        } else {
                          setSelectedTournaments(selectedTournaments.filter(id => id !== t.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white truncate">{t.name}</div>
                      <div className="text-xs text-gray-400">
                        {(t.players || []).length} jogadores
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={createRankingGroup}
                disabled={!newGroupName.trim() || selectedTournaments.length === 0}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold"
              >
                Criar Grupo
              </button>
              
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Grupos */}
      {!showCreateGroup && rankingGroups.length > 0 && (
        <div className="bg-gray-900 p-5 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Link size={20} />
              Meus Grupos de Ranking
            </h4>
            
            <button
              onClick={() => setShowCreateGroup(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2"
            >
              <Plus size={16} />
              Novo Grupo
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankingGroups.map(group => (
              <div
                key={group.id}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  activeGroup?.id === group.id
                    ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/20 border-2 border-blue-500'
                    : 'bg-gray-800 hover:bg-gray-700/70'
                }`}
                onClick={() => loadGroupRanking(group)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg truncate">{group.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Criado em {new Date(group.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRankingGroup(group.id);
                    }}
                    className="p-2 text-red-400 hover:text-red-300"
                    title="Excluir grupo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users size={14} />
                    <span>{group.tournamentCount || group.tournamentIds?.length || 0} torneios</span>
                  </div>
                  
                  {activeGroup?.id === group.id && (
                    <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs">
                      Ativo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {rankingGroups.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">Nenhum grupo criado</div>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Criar Primeiro Grupo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo baseado na aba ativa */}
      <div className="min-h-[400px]">
        {/* Ranking Individual */}
        {!activeGroup && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                <Award size={22} />
                Ranking do Torneio Atual
              </h4>
              
              <div className="text-sm text-gray-400">
                Peso da etapa: <span className="font-bold text-green-400">{tournament.stageWeight || 1.0}</span>
              </div>
            </div>
            
            {/* Estatísticas do ranking individual */}
            {individualRanking.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-400 mb-1">Total de Jogadores</div>
                  <div className="text-2xl font-bold text-white">{individualRanking.length}</div>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-400 mb-1">Maior Pontuação</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {individualRanking[0]?.score.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-400 mb-1">Pontuação Média</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {(
                      individualRanking.reduce((sum, p) => sum + p.score, 0) / individualRanking.length
                    ).toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-400 mb-1">Jogadores Ativos</div>
                  <div className="text-2xl font-bold text-green-400">
                    {individualRanking.filter(p => p.active).length}
                  </div>
                </div>
              </div>
            )}
            
            {/* Tabela de ranking individual */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="p-4 text-left text-gray-300 font-semibold">Posição</th>
                    <th className="p-4 text-left text-gray-300 font-semibold">Jogador</th>
                    <th className="p-4 text-left text-gray-300 font-semibold">Status</th>
                    <th className="p-4 text-left text-gray-300 font-semibold">Ações</th>
                    <th className="p-4 text-left text-gray-300 font-semibold">Fichas</th>
                    <th className="p-4 text-left text-gray-300 font-semibold">Pontuação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {individualRanking.map((player, index) => (
                    <tr 
                      key={player.id} 
                      className={`hover:bg-gray-900/50 ${
                        index < 3 ? 
                          index === 0 ? 'bg-yellow-900/20' :
                          index === 1 ? 'bg-gray-800/50' :
                          'bg-orange-900/20' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-500' :
                          index === 2 ? 'bg-orange-500' :
                          'bg-gray-700'
                        }`}>
                          <span className={`font-bold ${
                            index < 3 ? 'text-white' : 'text-gray-300'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        {index < 3 && (
                          <div className="text-xs text-center mt-1">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <div className="font-bold text-white">{player.name}</div>
                        <div className="text-xs text-gray-400">
                          Posição no torneio: {player.finalPosition}º
                        </div>
                      </td>
                      
                      <td className="p-4">
                        {player.active ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-900/30 text-green-300">
                            🎯 Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-900/30 text-red-300">
                            💀 Eliminado
                          </span>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <div className="font-medium text-white">{player.actions}</div>
                        <div className="text-xs text-gray-400">
                          +{player.rebuys} rebuys
                          {player.addons > 0 && `, +${player.addons} addons`}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="font-bold text-green-400 text-lg">
                          {player.chips.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="font-bold text-2xl text-yellow-400">
                          {player.score.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">pontos</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ranking Combinado */}
        {activeGroup && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp size={22} />
                  Ranking Combinado: {activeGroup.name}
                </h4>
                <p className="text-gray-400 text-sm">
                  {activeGroup.tournamentIds.length} torneios combinados • 
                  Atualizado em {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>
              
              <div className="text-sm text-gray-400">
                {combinedRanking.length} jogadores • 
                <span className="ml-2 text-green-400">
                  {activeGroup.tournamentIds.length} torneios
                </span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">Calculando ranking combinado...</div>
              </div>
            ) : combinedRanking.length > 0 ? (
              <>
                {/* Estatísticas do ranking combinado */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-gray-900 to-black p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-400 mb-1">Jogador Líder</div>
                    <div className="font-bold text-white text-lg truncate">
                      {combinedRanking[0]?.name}
                    </div>
                    <div className="text-xs text-green-400 mt-1">
                      {combinedRanking[0]?.totalPoints.toFixed(2)} pontos
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-900 to-black p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-400 mb-1">Maior Pontuação</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {combinedRanking[0]?.totalPoints.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Média: {combinedRanking[0]?.avgPoints.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-900 to-black p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-400 mb-1">Consistência Máxima</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {Math.max(...combinedRanking.map(p => p.consistency)).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {combinedRanking.find(p => p.consistency === Math.max(...combinedRanking.map(p2 => p2.consistency)))?.name}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-900 to-black p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-400 mb-1">Participação Média</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {(
                        combinedRanking.reduce((sum, p) => sum + p.tournamentCount, 0) / 
                        combinedRanking.length
                      ).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">torneios/jogador</div>
                  </div>
                </div>

                {/* Tabela de ranking combinado */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="p-4 text-left text-gray-300 font-semibold">Posição</th>
                        <th className="p-4 text-left text-gray-300 font-semibold">Jogador</th>
                        <th className="p-4 text-left text-gray-300 font-semibold">Pontuação Total</th>
                        <th className="p-4 text-left text-gray-300 font-semibold">Média</th>
                        <th className="p-4 text-left text-gray-300 font-semibold">Torneios</th>
                        <th className="p-4 text-left text-gray-300 font-semibold">Melhor Posição</th>
                        <th className="p-4 text-left text-gray-300 font-semibold">Consistência</th>
                        <th className="p-4 text-left text-gray-300 font-semibold">Ações Totais</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {combinedRanking.map((player, index) => (
                        <tr 
                          key={player.name} 
                          className={`hover:bg-gray-900/50 ${
                            index < 3 ? 
                              index === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/10' :
                              index === 1 ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/30' :
                              'bg-gradient-to-r from-orange-900/20 to-orange-800/10' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                              index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                              'bg-gradient-to-r from-gray-700 to-gray-800'
                            }`}>
                              <span className={`font-bold ${
                                index < 3 ? 'text-white' : 'text-gray-300'
                              }`}>
                                {index + 1}
                              </span>
                            </div>
                            {index < 3 && (
                              <div className="text-xs text-center mt-1">
                                {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                              </div>
                            )}
                          </td>
                          
                          <td className="p-4">
                            <div className="font-bold text-white text-lg">{player.name}</div>
                            <div className="text-xs text-gray-400">
                              Média de posição: {player.avgPosition.toFixed(1)}º
                            </div>
                          </td>
                          
                          <td className="p-4">
                            <div className="font-bold text-2xl text-yellow-400">
                              {player.totalPoints.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">pontos totais</div>
                          </td>
                          
                          <td className="p-4">
                            <div className="font-bold text-xl text-blue-400">
                              {player.avgPoints.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">por torneio</div>
                          </td>
                          
                          <td className="p-4">
                            <div className="font-bold text-white">
                              {player.tournamentCount}
                            </div>
                            <div className="text-xs text-gray-400">
                              de {activeGroup.tournamentIds.length}
                            </div>
                          </td>
                          
                          <td className="p-4">
                            <div className="font-bold text-green-400">
                              {player.bestPosition}º
                            </div>
                            <div className="text-xs text-gray-400">
                              Pior: {player.worstPosition}º
                            </div>
                          </td>
                          
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                                  style={{ width: `${player.consistency}%` }}
                                />
                              </div>
                              <div className="font-bold text-white">
                                {player.consistency.toFixed(0)}%
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {player.consistency > 80 ? 'Muito consistente' :
                               player.consistency > 60 ? 'Consistente' :
                               player.consistency > 40 ? 'Regular' : 'Variável'}
                            </div>
                          </td>
                          
                          <td className="p-4">
                            <div className="font-bold text-purple-400">
                              {player.totalActions}
                            </div>
                            <div className="text-xs text-gray-400">
                              ações totais
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-xl">
                <BarChart size={48} className="mx-auto text-gray-600 mb-4" />
                <div className="text-gray-400 text-lg mb-2">
                  Nenhum dado disponível para este grupo
                </div>
                <p className="text-gray-500 mb-4">
                  Selecione torneios com jogadores para gerar o ranking combinado
                </p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
                >
                  Editar Grupo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingViewer;
