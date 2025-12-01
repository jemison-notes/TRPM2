import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Tv, Share2 } from 'lucide-react';

const TVScreen = ({ tournament, update }) => {
  const [tick, setTick] = useState(0);

  // Timer effect com duração específica por nível
  useEffect(() => {
    let interval;
    if (tournament.isRunning && tournament.timeLeft > 0) {
      interval = setInterval(() => {
        update({ timeLeft: tournament.timeLeft - 1 });
        setTick((t) => t + 1);
      }, 1000);
    } else if (tournament.isRunning && tournament.timeLeft === 0) {
      const nextIndex = clamp(tournament.currentLevelIndex + 1, 0, tournament.blinds.length - 1);
      const nextBlind = tournament.blinds[nextIndex];
      const duration = nextBlind?.duration || (nextBlind?.isBreak ? nextBlind.breakDuration : tournament.levelDuration);
      
      update({ 
        currentLevelIndex: nextIndex, 
        timeLeft: duration * 60,
        isRunning: nextIndex === tournament.blinds.length - 1 ? false : tournament.isRunning 
      });
    }
    return () => clearInterval(interval);
  }, [tournament.isRunning, tournament.timeLeft, tournament.currentLevelIndex, tournament.blinds, tournament.levelDuration, update]);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const currentLevel = tournament.blinds[tournament.currentLevelIndex] || { 
    level: 0, 
    smallBlind: 0, 
    bigBlind: 0, 
    ante: 0, 
    isBreak: false 
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const calculatePrizePool = () => {
    if (!tournament.players || tournament.players.length === 0) return 0;
    
    return tournament.players.reduce((total, player) => {
      const buyInCost = player.actions * tournament.buyInValue;
      const addonCost = player.addons * tournament.addonValue;
      const extraChipCost = player.hasExtraChip ? tournament.extraChipValue : 0;
      const totalCost = buyInCost + addonCost + extraChipCost;
      const afterFee = totalCost * (1 - (tournament.adminFeePercent / 100));
      return total + afterFee;
    }, 0);
  };

  const totalPrizePool = calculatePrizePool();
  const activePlayers = tournament.players?.filter(p => p.active).length || 0;
  const eliminatedPlayers = tournament.players?.filter(p => !p.active).length || 0;

  // Função para abrir TV em nova janela
  const openTVWindow = () => {
    const tvUrl = `${window.location.origin}/tv`;
    const tvWindow = window.open(tvUrl, 'tv-screen', 'width=1200,height=800,menubar=no,toolbar=no,location=no');
    
    if (tvWindow) {
      // Salva o torneio atual no localStorage para a TV acessar
      const tvData = {
        tournament: {
          ...tournament,
          timeLeft: tournament.timeLeft, // Garantir que o tempo seja atual
          currentLevelIndex: tournament.currentLevelIndex
        },
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('current_tv_tournament', JSON.stringify(tvData));
      
      // Atualiza a cada 5 segundos
      const updateInterval = setInterval(() => {
        if (tvWindow.closed) {
          clearInterval(updateInterval);
          return;
        }
        const updatedData = {
          tournament: {
            ...tournament,
            timeLeft: tournament.timeLeft,
            currentLevelIndex: tournament.currentLevelIndex
          },
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('current_tv_tournament', JSON.stringify(updatedData));
      }, 5000);
    }
  };

  // Compartilhar link da TV
  const shareTVLink = () => {
    const tvUrl = `${window.location.origin}/tv`;
    if (navigator.share) {
      navigator.share({
        title: `${tournament.name} - Poker Tournament`,
        text: `Acompanhe o torneio de poker ${tournament.name} em tempo real!`,
        url: tvUrl
      });
    } else {
      navigator.clipboard.writeText(tvUrl);
      alert('Link da TV copiado para a área de transferência!');
    }
  };

  // Avançar para próximo nível
  const advanceLevel = () => {
    const nextIndex = clamp(tournament.currentLevelIndex + 1, 0, tournament.blinds.length - 1);
    const nextBlind = tournament.blinds[nextIndex];
    const duration = nextBlind?.duration || (nextBlind?.isBreak ? nextBlind.breakDuration : tournament.levelDuration);
    
    update({ 
      currentLevelIndex: nextIndex, 
      timeLeft: duration * 60
    });
  };

  // Voltar para nível anterior
  const previousLevel = () => {
    const prevIndex = clamp(tournament.currentLevelIndex - 1, 0, tournament.blinds.length - 1);
    const prevBlind = tournament.blinds[prevIndex];
    const duration = prevBlind?.duration || (prevBlind?.isBreak ? prevBlind.breakDuration : tournament.levelDuration);
    
    update({ 
      currentLevelIndex: prevIndex, 
      timeLeft: duration * 60
    });
  };

  // Top 3 jogadores por pilha
  const topPlayersByChips = [...(tournament.players || [])]
    .sort((a, b) => b.chips - a.chips)
    .slice(0, 3);

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">Tela TV - Modo Administrativo</h3>
          <p className="text-gray-400 text-sm">
            Controle o torneio aqui e exiba a tela TV para os jogadores
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={openTVWindow}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold flex items-center gap-2 transition duration-200"
            title="Abrir tela TV em nova janela"
          >
            <Tv size={18} />
            Abrir Tela TV
          </button>
          
          <button 
            onClick={shareTVLink}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold flex items-center gap-2 transition duration-200"
            title="Compartilhar link da TV"
          >
            <Share2 size={18} />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Área principal do relógio */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 text-center border border-gray-700">
        {/* Timer grande */}
        <div className="mb-6">
          <div className={`text-8xl font-mono font-extrabold mb-2 ${
            tournament.isRunning ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {formatTime(tournament.timeLeft)}
          </div>
          
          <div className="text-xl mb-4">
            {currentLevel.isBreak ? (
              <span className="text-orange-400">
                ⏸️ INTERVALO • Nível {currentLevel.level}
              </span>
            ) : (
              <span className="text-white">
                Nível <span className="font-bold text-green-300">{currentLevel.level}</span>
              </span>
            )}
          </div>
          
          {!currentLevel.isBreak && (
            <div className="text-2xl text-gray-300 mb-2">
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
            <div className="text-2xl text-orange-300 mb-2">
              Pausa de <span className="font-bold">{currentLevel.breakDuration || 10}</span> minutos
            </div>
          )}
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Prize Pool</div>
            <div className="text-2xl font-bold text-green-400">
              R$ {totalPrizePool.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Jogadores Ativos</div>
            <div className="text-2xl font-bold text-white">
              {activePlayers}
              {eliminatedPlayers > 0 && (
                <span className="text-sm text-gray-400 ml-1">
                  ({eliminatedPlayers} eliminados)
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Duração do Nível</div>
            <div className="text-2xl font-bold text-blue-400">
              {currentLevel.duration || tournament.levelDuration} min
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Progresso</div>
            <div className="text-2xl font-bold text-purple-400">
              {tournament.currentLevelIndex + 1}/{tournament.blinds.length}
            </div>
          </div>
        </div>

        {/* Top 3 por fichas */}
        {topPlayersByChips.length > 0 && (
          <div className="mb-8">
            <div className="text-lg font-semibold text-gray-300 mb-3">Maiores Pilhas</div>
            <div className="grid grid-cols-3 gap-4">
              {topPlayersByChips.map((player, index) => (
                <div key={player.id} className={`p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-900/30' :
                  index === 1 ? 'bg-gray-700/50' :
                  'bg-orange-900/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-sm font-semibold ${
                      index === 0 ? 'text-yellow-300' :
                      index === 1 ? 'text-gray-300' :
                      'text-orange-300'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="text-xs text-gray-400">
                      {player.active ? '🎯 Ativo' : '💀 Eliminado'}
                    </div>
                  </div>
                  <div className="font-bold text-white truncate">{player.name}</div>
                  <div className="text-lg font-bold text-green-400 mt-1">
                    {player.chips.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button 
            onClick={() => update({ isRunning: !tournament.isRunning })} 
            className={`px-6 py-4 rounded-xl font-bold flex items-center gap-3 transition duration-200 ${
              tournament.isRunning 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {tournament.isRunning ? (
              <>
                <Pause size={20} />
                <span>Pausar Timer</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>Iniciar Timer</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => update({ isRunning: false, currentLevelIndex: 0, timeLeft: tournament.levelDuration * 60 })} 
            className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center gap-3 transition duration-200"
          >
            <RotateCcw size={20} />
            <span>Reiniciar Torneio</span>
          </button>
          
          <button 
            onClick={previousLevel}
            disabled={tournament.currentLevelIndex === 0}
            className={`px-6 py-4 rounded-xl flex items-center gap-3 transition duration-200 ${
              tournament.currentLevelIndex === 0
                ? 'bg-gray-800 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <SkipBack size={20} />
            <span>Nível Anterior</span>
          </button>
          
          <button 
            onClick={advanceLevel}
            disabled={tournament.currentLevelIndex === tournament.blinds.length - 1}
            className={`px-6 py-4 rounded-xl flex items-center gap-3 transition duration-200 ${
              tournament.currentLevelIndex === tournament.blinds.length - 1
                ? 'bg-gray-800 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <SkipForward size={20} />
            <span>Próximo Nível</span>
          </button>
        </div>
      </div>

      {/* Informações da TV */}
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <div className="text-gray-300">
          <strong className="text-green-400">💡 Dica:</strong> A tela TV é ideal para exibir em um monitor ou projetor para os jogadores. 
          Ela mostra apenas as informações essenciais sem os controles administrativos.
        </div>
        <div className="text-sm text-gray-400 mt-2">
          • Use o botão "Abrir Tela TV" para abrir em uma nova janela
          <br />
          • Use "Compartilhar" para enviar o link para os jogadores
          <br />
          • A tela TV atualiza automaticamente a cada 5 segundos
        </div>
      </div>
    </div>
  );
};

export default TVScreen;
