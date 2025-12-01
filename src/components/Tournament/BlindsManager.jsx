import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  ArrowUp, 
  ArrowDown, 
  Clock,
  PauseCircle,
  Trash2,
  Save,
  Copy,
  Calculator
} from 'lucide-react';

const BlindsManager = ({ tournament, save }) => {
  const [newLevelDuration, setNewLevelDuration] = useState(tournament.levelDuration || 10);

  const addBlindLevel = () => {
    const lastLevel = tournament.blinds[tournament.blinds.length - 1];
    const newLevel = {
      level: (lastLevel?.level || 0) + 1,
      smallBlind: (lastLevel?.smallBlind || 25) * 2,
      bigBlind: (lastLevel?.bigBlind || 50) * 2,
      ante: lastLevel?.ante || 0,
      isBreak: false,
      duration: newLevelDuration,
    };
    save({ blinds: [...tournament.blinds, newLevel] });
  };

  const addBreak = () => {
    const lastLevel = tournament.blinds[tournament.blinds.length - 1];
    const newBreak = {
      level: (lastLevel?.level || 0) + 1,
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      isBreak: true,
      breakDuration: 10,
      duration: 10,
    };
    save({ blinds: [...tournament.blinds, newBreak] });
  };

  const updateBlind = (index, patch) => {
    const updated = tournament.blinds.map((b, i) => i === index ? { ...b, ...patch } : b);
    save({ blinds: updated });
  };

  const removeBlind = (index) => {
    const newBlinds = tournament.blinds.filter((_, i) => i !== index);
    // Recalcular números dos níveis
    newBlinds.forEach((blind, idx) => {
      blind.level = idx + 1;
    });
    save({ blinds: newBlinds });
  };

  const moveBlindUp = (index) => {
    if (index === 0) return;
    const newBlinds = [...tournament.blinds];
    [newBlinds[index], newBlinds[index - 1]] = [newBlinds[index - 1], newBlinds[index]];
    // Recalcular números dos níveis
    newBlinds.forEach((blind, idx) => {
      blind.level = idx + 1;
    });
    save({ blinds: newBlinds });
  };

  const moveBlindDown = (index) => {
    if (index === tournament.blinds.length - 1) return;
    const newBlinds = [...tournament.blinds];
    [newBlinds[index], newBlinds[index + 1]] = [newBlinds[index + 1], newBlinds[index]];
    // Recalcular números dos níveis
    newBlinds.forEach((blind, idx) => {
      blind.level = idx + 1;
    });
    save({ blinds: newBlinds });
  };

  const updateAllDurations = () => {
    const updated = tournament.blinds.map(blind => ({
      ...blind,
      duration: blind.isBreak ? (blind.breakDuration || 10) : newLevelDuration
    }));
    save({ 
      blinds: updated, 
      levelDuration: newLevelDuration 
    });
  };

  const calculateTotalTime = () => {
    return tournament.blinds.reduce((total, blind) => {
      return total + (blind.duration || (blind.isBreak ? blind.breakDuration : tournament.levelDuration));
    }, 0);
  };

  const calculateTimeToBreak = () => {
    let total = 0;
    for (const blind of tournament.blinds) {
      if (blind.isBreak) break;
      total += blind.duration || tournament.levelDuration;
    }
    return total;
  };

  const calculateAverageIncrease = () => {
    const blindLevels = tournament.blinds.filter(b => !b.isBreak);
    if (blindLevels.length < 2) return 0;
    
    const increases = [];
    for (let i = 1; i < blindLevels.length; i++) {
      const prevBB = blindLevels[i - 1].bigBlind;
      const currBB = blindLevels[i].bigBlind;
      if (prevBB > 0) {
        increases.push((currBB / prevBB) * 100 - 100);
      }
    }
    
    if (increases.length === 0) return 0;
    return increases.reduce((a, b) => a + b, 0) / increases.length;
  };

  const copyToClipboard = () => {
    const structureText = tournament.blinds.map(blind => {
      if (blind.isBreak) {
        return `Nível ${blind.level}: INTERVALO - ${blind.breakDuration || 10} minutos`;
      } else {
        return `Nível ${blind.level}: ${blind.smallBlind}/${blind.bigBlind}${blind.ante > 0 ? ` + ${blind.ante}` : ''} (${blind.duration || tournament.levelDuration} min)`;
      }
    }).join('\n');
    
    navigator.clipboard.writeText(structureText);
    alert('Estrutura copiada para a área de transferência!');
  };

  const resetToDefault = () => {
    const defaultStructure = [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 10 },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 10 },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 10 },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 10, isBreak: true, breakDuration: 10 },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 10 },
    ];
    
    if (window.confirm('Deseja redefinir para a estrutura padrão? Isso substituirá todos os níveis atuais.')) {
      save({ 
        blinds: defaultStructure,
        levelDuration: 10,
        timeLeft: 10 * 60,
        currentLevelIndex: 0
      });
      setNewLevelDuration(10);
    }
  };

  const totalTime = calculateTotalTime();
  const timeToBreak = calculateTimeToBreak();
  const averageIncrease = calculateAverageIncrease();
  const blindLevelsCount = tournament.blinds.filter(b => !b.isBreak).length;
  const breakLevelsCount = tournament.blinds.filter(b => b.isBreak).length;

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">Estrutura de Blinds</h3>
        <div className="text-gray-300">
          <span className="font-semibold">Tempo Total:</span>{' '}
          <span className="text-green-400">{totalTime} minutos</span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Níveis de Blinds</div>
          <div className="text-2xl font-bold text-blue-400">{blindLevelsCount}</div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Intervalos</div>
          <div className="text-2xl font-bold text-orange-400">{breakLevelsCount}</div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Tempo até 1º Intervalo</div>
          <div className="text-2xl font-bold text-yellow-400">
            {timeToBreak > 0 ? `${timeToBreak} min` : 'Sem intervalo'}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Aumento Médio</div>
          <div className="text-2xl font-bold text-green-400">
            {averageIncrease.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Configuração de duração padrão */}
      <div className="bg-gray-900 p-5 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-gray-300 font-semibold flex items-center gap-2">
              <Clock size={20} />
              Duração Padrão dos Níveis
            </div>
            <div className="text-sm text-gray-400">
              Configuração aplicada a todos os níveis de blinds (exceto intervalos)
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-24 p-3 bg-black border border-gray-700 rounded-lg text-white text-center"
                value={newLevelDuration}
                onChange={(e) => setNewLevelDuration(Math.max(1, Number(e.target.value) || 1))}
                min="1"
              />
              <span className="text-gray-300">minutos</span>
            </div>
            
            <button
              onClick={updateAllDurations}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold flex items-center gap-2"
            >
              <Save size={18} />
              Aplicar a Todos
            </button>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-4">
        <button 
          onClick={addBlindLevel} 
          className="px-6 py-4 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold flex items-center gap-3 flex-1 justify-center"
        >
          <Plus size={22} />
          <span>Adicionar Nível de Blinds</span>
        </button>
        
        <button 
          onClick={addBreak} 
          className="px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-xl text-white font-semibold flex items-center gap-3 flex-1 justify-center"
        >
          <PauseCircle size={22} />
          <span>Adicionar Intervalo</span>
        </button>
        
        <button 
          onClick={resetToDefault} 
          className="px-6 py-4 bg-gray-600 hover:bg-gray-700 rounded-xl text-white font-semibold flex items-center gap-3 flex-1 justify-center"
        >
          <Calculator size={22} />
          <span>Redefinir Padrão</span>
        </button>
        
        <button 
          onClick={copyToClipboard} 
          className="px-6 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-semibold flex items-center gap-3 flex-1 justify-center"
        >
          <Copy size={22} />
          <span>Copiar Estrutura</span>
        </button>
      </div>

      {/* Lista de níveis */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {tournament.blinds.map((blind, index) => (
          <div 
            key={index} 
            className={`p-5 rounded-xl ${
              blind.isBreak 
                ? 'bg-gradient-to-r from-orange-900/20 to-orange-800/10 border-l-4 border-orange-500' 
                : 'bg-gradient-to-r from-gray-900 to-black border-l-4 border-blue-500'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Número do nível */}
              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  blind.isBreak ? 'bg-orange-600' : 'bg-blue-600'
                }`}>
                  <span className="font-bold text-2xl">{blind.level}</span>
                </div>
                <div className={`text-xs mt-1 font-semibold ${blind.isBreak ? 'text-orange-400' : 'text-blue-400'}`}>
                  {blind.isBreak ? 'INTERVALO' : 'NÍVEL'}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1">
                {blind.isBreak ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Descrição</label>
                      <div className="text-xl font-bold text-orange-300">
                        ⏸️ PAUSA
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Duração (minutos)</label>
                      <input
                        type="number"
                        className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                        value={blind.breakDuration || 10}
                        onChange={(e) => updateBlind(index, { 
                          breakDuration: Math.max(1, Number(e.target.value) || 10),
                          duration: Math.max(1, Number(e.target.value) || 10)
                        })}
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Observações</label>
                      <div className="text-sm text-gray-300 p-3 bg-black/30 rounded-lg">
                        As fichas não aumentam durante o intervalo
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Small Blind */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Small Blind</label>
                      <input
                        type="number"
                        className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                        value={blind.smallBlind}
                        onChange={(e) => updateBlind(index, { smallBlind: Number(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    
                    {/* Big Blind */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Big Blind</label>
                      <input
                        type="number"
                        className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                        value={blind.bigBlind}
                        onChange={(e) => updateBlind(index, { bigBlind: Number(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    
                    {/* Ante */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Ante</label>
                      <input
                        type="number"
                        className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                        value={blind.ante}
                        onChange={(e) => updateBlind(index, { ante: Number(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    
                    {/* Duração */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Duração (min)
                        {blind.duration !== tournament.levelDuration && (
                          <span className="ml-1 text-green-400">*</span>
                        )}
                      </label>
                      <input
                        type="number"
                        className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
                        value={blind.duration || tournament.levelDuration}
                        onChange={(e) => updateBlind(index, { 
                          duration: Math.max(1, Number(e.target.value) || tournament.levelDuration) 
                        })}
                        min="1"
                      />
                      {blind.duration !== tournament.levelDuration && (
                        <div className="text-xs text-green-400 mt-1">
                          Personalizado (padrão: {tournament.levelDuration} min)
                        </div>
                      )}
                    </div>
                    
                    {/* Resumo */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Resumo</label>
                      <div className="p-3 bg-black/30 rounded-lg">
                        <div className="text-lg font-bold text-white">
                          {blind.smallBlind}/{blind.bigBlind}
                          {blind.ante > 0 && ` + ${blind.ante}`}
                        </div>
                        <div className="text-sm text-gray-400">
                          {blind.duration || tournament.levelDuration} min
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => moveBlindUp(index)}
                    disabled={index === 0}
                    className={`p-3 rounded-lg ${
                      index === 0
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    title="Mover para cima"
                  >
                    <ArrowUp size={18} className="text-white" />
                  </button>
                  
                  <button
                    onClick={() => moveBlindDown(index)}
                    disabled={index === tournament.blinds.length - 1}
                    className={`p-3 rounded-lg ${
                      index === tournament.blinds.length - 1
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    title="Mover para baixo"
                  >
                    <ArrowDown size={18} className="text-white" />
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    if (window.confirm(`Remover ${blind.isBreak ? 'intervalo' : 'nível'} ${blind.level}?`)) {
                      removeBlind(index);
                    }
                  }}
                  className="p-3 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                  title="Remover nível"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Progressão */}
            {!blind.isBreak && index > 0 && !tournament.blinds[index - 1].isBreak && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Progressão do nível anterior:
                  <span className="ml-2 text-white">
                    {((blind.bigBlind / tournament.blinds[index - 1].bigBlind) * 100).toFixed(0)}%
                  </span>
                  <span className="mx-2">•</span>
                  Aumento: 
                  <span className="ml-2 text-green-400">
                    +{(blind.bigBlind - tournament.blinds[index - 1].bigBlind).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {tournament.blinds.length === 0 && (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl">
            <div className="text-gray-400 text-lg mb-2">
              Nenhum nível configurado
            </div>
            <p className="text-gray-500 mb-6">
              Adicione níveis de blinds ou intervalos para começar
            </p>
            <button
              onClick={addBlindLevel}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
            >
              Adicionar Primeiro Nível
            </button>
          </div>
        )}
      </div>

      {/* Preview da estrutura */}
      {tournament.blinds.length > 0 && (
        <div className="bg-gray-900 p-5 rounded-xl">
          <h4 className="text-lg font-semibold text-white mb-4">Pré-visualização da Estrutura</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {tournament.blinds.map((blind, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    blind.isBreak ? 'bg-orange-700' : 'bg-blue-700'
                  }`}>
                    <span className="font-bold text-sm">{blind.level}</span>
                  </div>
                  
                  <div>
                    <div className="font-medium text-white">
                      {blind.isBreak ? (
                        <span className="text-orange-300">⏸️ Intervalo</span>
                      ) : (
                        <span>Blinds: {blind.smallBlind}/{blind.bigBlind}{blind.ante > 0 && ` +${blind.ante}`}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {blind.isBreak 
                        ? `${blind.breakDuration || 10} minutos` 
                        : `${blind.duration || tournament.levelDuration} minutos`
                      }
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  {index === tournament.currentLevelIndex && (
                    <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs">
                      ATUAL
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlindsManager;
