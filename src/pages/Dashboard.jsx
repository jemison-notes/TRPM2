import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tournamentService } from '../services/tournamentService';
import TournamentList from '../components/Tournament/TournamentList';
import TVScreen from '../components/Tournament/TVScreen';
import AdminPanel from '../components/Tournament/AdminPanel';
import BlindsManager from '../components/Tournament/BlindsManager';
import RankingViewer from '../components/Tournament/RankingViewer';
import TopBar from '../components/UI/TopBar';
import { Clock, Settings, FileText, Trophy, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [activeTournamentId, setActiveTournamentId] = useState(null);
  const [activeTab, setActiveTab] = useState('tv');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, [user]);

  const loadTournaments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await tournamentService.getTournaments(user.id);
      setTournaments(data);
      if (data.length > 0 && !activeTournamentId) {
        setActiveTournamentId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar torneios:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);

  const createTournament = async (name = 'Novo Torneio') => {
    if (!user) return;

    const newTournament = {
      user_id: user.id,
      name,
      data: {
        players: [],
        blinds: [
          { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 10 },
          { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 10 },
          { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 10 },
          { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 10, isBreak: true, breakDuration: 10 },
          { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 10 },
        ],
        levelDuration: 10,
        currentLevelIndex: 0,
        timeLeft: 10 * 60,
        isRunning: false,
        stageWeight: 1.0,
        buyInValue: 100,
        buyInChips: 10000,
        rebuyValue: 100,
        rebuyChips: 10000,
        addonValue: 50,
        addonChips: 5000,
        adminFeePercent: 10,
        timeChipEnabled: false,
        timeChipValue: 2000,
        extraChipEnabled: false,
        extraChipValue: 20,
        extraChipAmount: 2000,
      }
    };

    try {
      const savedTournament = await tournamentService.createTournament(newTournament);
      setTournaments([savedTournament, ...tournaments]);
      setActiveTournamentId(savedTournament.id);
    } catch (error) {
      console.error('Erro ao criar torneio:', error);
    }
  };

  const updateTournament = async (id, patch) => {
    try {
      const tournament = tournaments.find(t => t.id === id);
      const updatedData = { ...tournament.data, ...patch };
      
      await tournamentService.updateTournament(id, { data: updatedData });
      
      setTournaments(prev => prev.map(t => 
        t.id === id ? { ...t, data: updatedData } : t
      ));
    } catch (error) {
      console.error('Erro ao atualizar torneio:', error);
    }
  };

  const renameTournament = async (id, newName) => {
    try {
      await tournamentService.renameTournament(id, newName);
      setTournaments(prev => prev.map(t => 
        t.id === id ? { ...t, name: newName } : t
      ));
    } catch (error) {
      console.error('Erro ao renomear torneio:', error);
    }
  };

  const removeTournament = async (id) => {
    try {
      await tournamentService.deleteTournament(id);
      setTournaments(prev => prev.filter(t => t.id !== id));
      
      if (activeTournamentId === id) {
        setActiveTournamentId(tournaments[0]?.id || null);
      }
    } catch (error) {
      console.error('Erro ao remover torneio:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!activeTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Poker Tournament Manager</h1>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white flex items-center gap-2"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
          
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-6">
              Bem-vindo, {user?.email}!
            </div>
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-white text-xl mb-4">Nenhum torneio criado</div>
              <p className="text-gray-400 mb-6">
                Crie seu primeiro torneio para começar a gerenciar suas partidas de poker.
              </p>
              <button
                onClick={() => createTournament('Meu Primeiro Torneio')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
              >
                Criar Primeiro Torneio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-[280px_1fr] gap-6">
        {/* Coluna da Esquerda */}
        <div>
          <TopBar 
            title={activeTournament.name} 
            onCreate={() => createTournament('Torneio ' + new Date().toLocaleString())}
            onLogout={signOut}
            userEmail={user?.email}
          />
          <TournamentList
            tournaments={tournaments}
            activeTournamentId={activeTournamentId}
            setActiveTournamentId={setActiveTournamentId}
            removeTournament={removeTournament}
            renameTournament={renameTournament}
          />
        </div>

        {/* Coluna da Direita */}
        <div>
          {/* Abas */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('tv')}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition ${
                activeTab === 'tv' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Clock size={18} /> TV
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition ${
                activeTab === 'admin' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Settings size={18} /> Admin
            </button>
            <button
              onClick={() => setActiveTab('blinds')}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition ${
                activeTab === 'blinds' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FileText size={18} /> Blinds
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition ${
                activeTab === 'ranking' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Trophy size={18} /> Ranking
            </button>
          </div>

          {/* Conteúdo da Aba */}
          <div className="min-h-[600px]">
            {activeTab === 'tv' && (
              <TVScreen 
                tournament={activeTournament.data} 
                update={(patch) => updateTournament(activeTournamentId, patch)}
              />
            )}
            {activeTab === 'admin' && (
              <AdminPanel 
                tournament={activeTournament.data} 
                save={(patch) => updateTournament(activeTournamentId, patch)}
              />
            )}
            {activeTab === 'blinds' && (
              <BlindsManager 
                tournament={activeTournament.data} 
                save={(patch) => updateTournament(activeTournamentId, patch)}
              />
            )}
            {activeTab === 'ranking' && (
              <RankingViewer 
                tournament={activeTournament.data}
                tournaments={tournaments.map(t => ({ id: t.id, name: t.name, ...t.data }))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
