import React, { useState } from 'react';
import { 
  UserPlus, 
  Download, 
  Users, 
  Coins, 
  Calculator,
  Filter,
  Search,
  TrendingUp,
  Award,
  DollarSign
} from 'lucide-react';

const AdminPanel = ({ tournament, save }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'eliminated'

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    
    // Verifica se é time chip (níveis 1 ou 2)
    const isTimeChipEligible = tournament.timeChipEnabled && tournament.currentLevelIndex < 2;
    const timeChipBonus = isTimeChipEligible ? tournament.timeChipValue : 0;
    
    const newPlayer = { 
      id: Date.now(), 
      name: newPlayerName.trim(), 
      actions: 1, // começa com 1 buy-in
      rebuys: 0, 
      addons: 0,
      chips: tournament.buyInChips + timeChipBonus, 
      position: null, 
      prize: 0, 
      active: true,
      hasTimeChip: isTimeChipEligible,
      hasExtraChip: false,
    };
    
    save({ players: [...(tournament.players || []), newPlayer] });
    setNewPlayerName('');
  };

  const updatePlayer = (id, patch) => {
    const updatedPlayers = (tournament.players || []).map(p => 
      p.id === id ? { ...p, ...patch } : p
    );
    save({ players: updatedPlayers });
  };

  const removePlayer = (id) => {
    const updatedPlayers = (tournament.players || []).filter(p => p.id !== id);
    save({ players: updatedPlayers });
  };

  const calculatePlayerInvestment = (player) => {
    const buyInCost = player.actions * tournament.buyInValue;
    const addonCost = player.addons * tournament.addonValue;
    const extraChipCost = player.hasExtraChip ? tournament.extraChipValue : 0;
    return buyInCost + addonCost + extraChipCost;
  };

  const calculatePrizeForPlayer = (player, totalPrizePool, players) => {
    if (player.active || player.position === null) return 0;
    
    // Distribuição simplificada: 50% para 1º, 30% para 2º, 20% para 3º
    const activePlayers = players.filter(p => p.active).length;
    const totalEliminated = players.filter(p => !p.active).length;
    
    if (player.position === 1) return totalPrizePool * 0.50;
    if (player.position === 2) return totalPrizePool * 0.30;
    if (player.position === 3) return totalPrizePool * 0.20;
    
    // Para demais posições, distribuição proporcional
    const remainingPrize = totalPrizePool * 0; // Aqui pode implementar lógica mais complexa
    return 0;
  };

  const exportCSV = () => {
    const players = tournament.players || [];
    const headers = [
      'Nome',
      'Status',
      'Ações (Buy-ins + Rebuys)',
      'Rebuys',
      'Addons',
      'Fichas Atuais',
      'Time Chip',
      'Extra Chip',
      'Investimento Total (R$)',
      'Posição',
      'Prêmio (R$)'
    ];

    const rows = players.map(player => {
      const investment = calculatePlayerInvestment(player);
      const prize = calculatePrizeForPlayer(player, calculateTotalPrizePool(), players);
      
      return [
        player.name,
        player.active ? 'Ativo' : `Eliminado (${player.position}º)`,
        player.actions,
        player.rebuys,
        player.addons,
        player.chips,
        player.hasTimeChip ? 'Sim' : 'Não',
        player.hasExtraChip ? 'Sim' : 'Não',
        investment.toFixed(2),
        player.position || '-',
        prize.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `torneio_${tournament.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotalPrizePool = () => {
    if (!tournament.players || tournament.players.length === 0) return 0;
    
    return tournament.players.reduce((total, player) => {
      const investment = calculatePlayerInvestment(player);
      const afterFee = investment * (1 - (tournament.adminFeePercent / 100));
      return total + afterFee;
    }, 0);
  };

  const totalPrizePool = calculateTotalPrizePool();
  const totalInvestment = tournament.players?.reduce((total, player) => 
    total + calculatePlayerInvestment(player), 0) || 0;
  const adminFeeAmount = totalInvestment * (tournament.adminFeePercent / 100);

  // Filtrar jogadores
  const filteredPlayers = (tournament.players || [])
    .filter(player => {
      // Filtro por status
      if (filterActive === 'active' && !player.active) return false;
      if (filterActive === 'eliminated' && player.active) return false;
      
      // Filtro por busca
      if (searchTerm && !player.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Ordenar por: ativos primeiro, depois por fichas
      if (a.active !== b.active) return a.active ? -1 : 1;
      return b.chips - a.chips;
    });

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} />
          Painel Administrativo
        </h3>
        <div className="text-sm text-gray-400">
          {tournament.players?.length || 0} jogadores registrados
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="bg-gradient-to-r from-gray-900 to-black p-5 rounded-lg border border-gray-700">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Total Arrecadado</div>
            <div className="text-2xl font-bold text-green-400">
              R$ {totalInvestment.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Prize Pool</div>
            <div className="text-2xl font-bold text-yellow-400">
              R$ {totalPrizePool.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Taxa de Admin ({tournament.adminFeePercent}%)</div>
            <div className="text-2xl font-bold text-red-400">
              R$ {adminFeeAmount.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Jogadores Ativos</div>
            <div className="text-2xl font-bold text-blue-400">
              {tournament.players?.filter(p => p.active).length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Configurações Financeiras */}
      <div className="bg-gray-900 p-5 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Coins size={20} />
          Configurações Financeiras
        </h4>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Buy-in */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Buy-in (R$)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                value={tournament.buyInValue}
                onChange={(e) => save({ buyInValue: Number(e.target.value) || 0 })}
              />
              <div className="p-3 bg-gray-800 rounded-lg text-gray-300 min-w-[80px]">
                {tournament.buyInChips.toLocaleString()}
                <div className="text-xs text-gray-500">fichas</div>
              </div>
            </div>
          </div>
          
          {/* Rebuy */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Rebuy (R$)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                value={tournament.rebuyValue}
                onChange={(e) => save({ rebuyValue: Number(e.target.value) || 0 })}
              />
              <div className="p-3 bg-gray-800 rounded-lg text-gray-300 min-w-[80px]">
                {tournament.rebuyChips.toLocaleString()}
                <div className="text-xs text-gray-500">fichas</div>
              </div>
            </div>
          </div>
          
          {/* Addon */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Addon (R$)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                value={tournament.addonValue}
                onChange={(e) => save({ addonValue: Number(e.target.value) || 0 })}
              />
              <div className="p-3 bg-gray-800 rounded-lg text-gray-300 min-w-[80px]">
                {tournament.addonChips.toLocaleString()}
                <div className="text-xs text-gray-500">fichas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Chip e Extra Chip */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Time Chip */}
          <div className="bg-black/50 p-4 rounded-lg">
            <label className="flex items-center gap-3 text-white mb-3">
              <input
                type="checkbox"
                checked={tournament.timeChipEnabled}
                onChange={(e) => save({ timeChipEnabled: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-semibold flex items-center gap-2">
                <TrendingUp size={16} />
                Time Chip
              </span>
            </label>
            <div className="text-xs text-gray-400 mb-3">
              Fichas extras para inscritos nos 2 primeiros níveis
            </div>
            <input
              type="number"
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
              value={tournament.timeChipValue}
              onChange={(e) => save({ timeChipValue: Number(e.target.value) || 0 })}
              disabled={!tournament.timeChipEnabled}
              placeholder="Quantidade de fichas"
            />
          </div>
          
          {/* Extra Chip */}
          <div className="bg-black/50 p-4 rounded-lg">
            <label className="flex items-center gap-3 text-white mb-3">
              <input
                type="checkbox"
                checked={tournament.extraChipEnabled}
                onChange={(e) => save({ extraChipEnabled: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-semibold flex items-center gap-2">
                <Award size={16} />
                Extra Chip
              </span>
            </label>
            <div className="text-xs text-gray-400 mb-3">
              Fichas extras compradas no buy-in
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="p-2 bg-gray-800 border border-gray-700 rounded text-white"
                value={tournament.extraChipValue}
                onChange={(e) => save({ extraChipValue: Number(e.target.value) || 0 })}
                disabled={!tournament.extraChipEnabled}
                placeholder="Valor (R$)"
              />
              <input
                type="number"
                className="p-2 bg-gray-800 border border-gray-700 rounded text-white"
                value={tournament.extraChipAmount}
                onChange={(e) => save({ extraChipAmount: Number(e.target.value) || 0 })}
                disabled={!tournament.extraChipEnabled}
                placeholder="Fichas"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Adicionar Jogador */}
      <div className="bg-gray-900 p-5 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus size={20} />
          Adicionar Jogador
        </h4>
        
        {tournament.timeChipEnabled && tournament.currentLevelIndex < 2 && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
            <div className="text-green-400 font-medium">
              ⚡ Time Chip ativo!
            </div>
            <div className="text-sm text-green-300">
              Jogadores receberão +{tournament.timeChipValue} fichas extras
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 p-3 bg-black border border-gray-700 rounded-lg text-white"
            placeholder="Nome completo do jogador"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          />
          <button
            onClick={addPlayer}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
          >
            Adicionar
          </button>
          <button
            onClick={exportCSV}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold flex items-center gap-2"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
            placeholder="Buscar jogador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-4 py-2 rounded-lg ${filterActive === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-4 py-2 rounded-lg ${filterActive === 'active' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Ativos
          </button>
          <button
            onClick={() => setFilterActive('eliminated')}
            className={`px-4 py-2 rounded-lg ${filterActive === 'eliminated' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Eliminados
          </button>
        </div>
      </div>

      {/* Lista de Jogadores */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-4 text-left text-gray-300 font-semibold">Jogador</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Status</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Ações</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Fichas</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Investimento</th>
                <th className="p-4 text-left text-gray-300 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredPlayers.map(player => {
                const investment = calculatePlayerInvestment(player);
                const isTimeChipEligible = tournament.timeChipEnabled && tournament.currentLevelIndex < 2;
                
                return (
                  <tr key={player.id} className={`hover:bg-gray-800/50 ${!player.active ? 'bg-red-900/20' : ''}`}>
                    {/* Nome */}
                    <td className="p-4">
                      <div className="font-medium text-white">{player.name}</div>
                      <div className="flex gap-1 mt-1">
                        {player.hasTimeChip && (
                          <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
                            TIME
                          </span>
                        )}
                        {player.hasExtraChip && (
                          <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded-full">
                            EXTRA
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="p-4">
                      {player.active ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-900/30 text-green-300">
                          🎯 Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-900/30 text-red-300">
                          💀 {player.position}º
                        </span>
                      )}
                    </td>
                    
                    {/* Ações */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-300">Buy-ins:</span>{' '}
                          <span className="text-white font-medium">{player.actions}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-300">Rebuys:</span>{' '}
                          <span className="text-blue-300 font-medium">{player.rebuys}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-300">Addons:</span>{' '}
                          <span className="text-purple-300 font-medium">{player.addons}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Fichas */}
                    <td className="p-4">
                      <div className="font-bold text-xl text-green-400">
                        {player.chips.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Buy-in: {tournament.buyInChips.toLocaleString()}
                        {player.hasTimeChip && ` + ${tournament.timeChipValue} (TIME)`}
                        {player.hasExtraChip && ` + ${tournament.extraChipAmount} (EXTRA)`}
                      </div>
                    </td>
                    
                    {/* Investimento */}
                    <td className="p-4">
                      <div className="font-bold text-lg text-yellow-400">
                        R$ {investment.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Taxa admin: {tournament.adminFeePercent}%
                      </div>
                    </td>
                    
                    {/* Ações */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {/* Rebuy */}
                        <button
                          onClick={() => updatePlayer(player.id, {
                            rebuys: player.rebuys + 1,
                            actions: player.actions + 1,
                            chips: player.chips + tournament.rebuyChips
                          })}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm flex items-center gap-1"
                        >
                          <DollarSign size={14} />
                          Rebuy
                        </button>
                        
                        {/* Addon */}
                        <button
                          onClick={() => updatePlayer(player.id, {
                            addons: player.addons + 1,
                            chips: player.chips + tournament.addonChips
                          })}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm flex items-center gap-1"
                        >
                          <Calculator size={14} />
                          Addon
                        </button>
                        
                        {/* Extra Chip */}
                        {tournament.extraChipEnabled && !player.hasExtraChip && (
                          <button
                            onClick={() => updatePlayer(player.id, {
                              hasExtraChip: true,
                              chips: player.chips + tournament.extraChipAmount
                            })}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm"
                          >
                            +Extra
                          </button>
                        )}
                        
                        {/* Eliminar */}
                        {player.active && (
                          <button
                            onClick={() => {
                              const position = (tournament.players?.filter(p => !p.active).length || 0) + 1;
                              updatePlayer(player.id, {
                                active: false,
                                position: position
                              });
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                        
                        {/* Remover */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Remover ${player.name} do torneio?`)) {
                              removePlayer(player.id);
                            }
                          }}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    {searchTerm ? 'Nenhum jogador encontrado' : 'Nenhum jogador adicionado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
