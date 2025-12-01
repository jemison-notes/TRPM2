import React, { useState, useEffect } from 'react';

const TVScreenPublic = ({ tournament }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Atualizar relógio a cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Se não estiver no cliente, não renderizar
  if (!isClient) {
    return null;
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeOfDay = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const currentLevel = tournament.blinds?.[tournament.currentLevelIndex] || {
    level: 0,
    smallBlind: 0,
    bigBlind: 0,
    ante: 0,
    isBreak: false
  };

  const calculatePrizePool = () => {
    if (!tournament.players || tournament.players.length === 0) return 0;
    
    return tournament.players.reduce((total, player) => {
      const buyInCost = (player.actions || 0) * (tournament.buyInValue || 0);
      const addonCost = (player.addons || 0) * (tournament.addonValue || 0);
      const extraChipCost = player.hasExtraChip ? (tournament.extraChipValue || 0) : 0;
      const totalCost = buyInCost + addonCost + extraChipCost;
      const afterFee = totalCost * (1 - ((tournament.adminFeePercent || 0) / 100));
      return total + afterFee;
    }, 0);
  };

  const totalPrizePool = calculatePrizePool();
  const activePlayers = tournament.players?.filter(p => p.active).length || 0;
  const eliminatedPlayers = tournament.players?.filter(p => !p.active).length || 0;

  const topPlayersByChips = [...(tournament.players || [])]
    .sort((a, b) => (b.chips || 0) - (a.chips || 0))
    .slice(0, 5);

  const topPlayersByPosition = [...(tournament.players || [])]
    .filter(p => p.position && p.position <= 3)
    .sort((a, b) => (a.position || 99) - (b.position || 99));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black text-white p-4 md:p-8">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
            {tournament.name || 'Torneio de Poker'}
          </h1>
          <div className="text-gray-400 text-sm md:text-base">
            {formatTimeOfDay(currentTime)} • {tournament.players?.length || 0} Jogadores
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">Tela TV</div>
          <div className="text-xs text-gray-500">Atualizado automaticamente</div>
        </div>
      </div>

      {/* Área principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Coluna 1: Timer e blinds */}
        <div className="lg:col-span-2 bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="text-center mb-6">
            <div className={`text-7xl md:text-8xl font-mono font-bold mb-4 ${
              tournament.isRunning ? 'text-green-400 animate-pulse' : 'text-yellow-400'
            }`}>
              {formatTime(tournament.timeLeft || 0)}
            </div>
            
            <div className="text-2xl md:text-3xl font-bold mb-2">
              {currentLevel.isBreak ? (
                <span className="text-orange-400">
                  ⏸️ INTERVALO • Nível {currentLevel.level}
                </span>
              ) : (
                <span>
                  Nível <span className="text-green-300">{currentLevel.level}</span>
                </span>
              )}
            </div>
            
            {!currentLevel.isBreak && (
              <div className="text-xl md:text-2xl text-gray-300">
                Blinds: <span className="font-bold text-white">
                  {currentLevel.smallBlind}/{currentLevel.bigBlind}
                </span>
                {currentLevel.ante > 0 && (
                  <span className="ml-2">
                    Ante: <span className="font-bold text-white">{currentLevel.ante}</span>
                  </span>
                )}
              </div>
            )}
            
            {currentLevel.isBreak && (
              <div className="text-xl md:text-2xl text-orange-300">
                Pausa de <span className="font-bold">{currentLevel.breakDuration || 10}</span> minutos
              </div>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/70 p-4 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Prize Pool</div>
              <div className="text-2xl font-bold text-green-400">
                R$ {totalPrizePool.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-gray-800/70 p-4 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Jogadores Ativos</div>
              <div className="text-2xl font-bold text-white">
                {activePlayers}
                {eliminatedPlayers > 0 && (
                  <div className="text-xs text-gray-400">
                    {eliminatedPlayers} eliminados
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800/70 p-4 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Duração do Nível</div>
              <div className="text-2xl font-bold text-blue-400">
                {currentLevel.duration || tournament.levelDuration || 10} min
              </div>
            </div>
            
            <div className="bg-gray-800/70 p-4 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Progresso</div>
              <div className="text-2xl font-bold text-purple-400">
                {(tournament.currentLevelIndex || 0) + 1}/{tournament.blinds?.length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Top 3 colocação */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">🏆 Colocação Atual</h2>
          
          {topPlayersByPosition.length > 0 ? (
            <div className="space-y-4">
              {topPlayersByPosition.map((player, index) => (
                <div key={player.id} className={`p-4 rounded-xl ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/20' :
                  index === 1 ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/30' :
                  'bg-gradient-to-r from-orange-900/40 to-orange-800/20'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-500' :
                        'bg-orange-500'
                      }`}>
                        <span className="font-bold text-white">{player.position}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white">{player.name}</div>
                        <div className="text-sm text-gray-400">
                          {player.chips?.toLocaleString() || 0} fichas
                        </div>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="text-2xl">👑</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum jogador eliminado ainda
            </div>
          )}
        </div>
      </div>

      {/* Maiores pilhas */}
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">💰 Maiores Pilhas</h2>
        
        {topPlayersByChips.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topPlayersByChips.map((player, index) => (
              <div key={player.id} className={`p-4 rounded-xl ${
                index === 0 ? 'bg-gradient-to-r from-green-900/30 to-green-800/10' :
                index === 1 ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/10' :
                index === 2 ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/10' :
                'bg-gray-800/30'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-sm font-bold ${
                    index === 0 ? 'text-yellow-300' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-300' :
                    'text-gray-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    player.active 
                      ? 'bg-green-900/50 text-green-300' 
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    {player.active ? 'Ativo' : 'Eliminado'}
                  </div>
                </div>
                
                <div className="font-bold text-white truncate mb-2">{player.name}</div>
                
                <div className="text-xl font-bold text-green-400">
                  {player.chips?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-400">fichas</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhum jogador registrado
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="text-center text-gray-500 text-sm border-t border-gray-800 pt-4">
        <div>Poker Tournament Manager • Tela TV Pública</div>
        <div className="text-xs mt-1">Atualiza automaticamente a cada 5 segundos</div>
      </div>
    </div>
  );
};

export default TVScreenPublic;
