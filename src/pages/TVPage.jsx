import React, { useState, useEffect } from 'react';
import TVScreenPublic from '../components/Tournament/TVScreenPublic';

const TVPage = () => {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTournamentData = () => {
      try {
        const tournamentData = localStorage.getItem('current_tv_tournament');
        
        if (tournamentData) {
          const parsed = JSON.parse(tournamentData);
          setTournament(parsed.tournament);
        } else {
          setError('Nenhum torneio ativo. Abra a TV pelo painel administrativo.');
        }
      } catch (err) {
        setError('Erro ao carregar dados do torneio');
        console.error('Erro ao carregar torneio:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTournamentData();

    // Atualizar a cada 5 segundos
    const interval = setInterval(loadTournamentData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Carregando torneio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">{error}</div>
          <div className="text-gray-400">
            Acesse o painel administrativo para iniciar um torneio
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Torneio não encontrado</div>
          <div className="text-gray-400">
            O torneio pode ter sido encerrado ou não está configurado
          </div>
        </div>
      </div>
    );
  }

  return <TVScreenPublic tournament={tournament} />;
};

export default TVPage;
