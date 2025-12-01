import { supabase } from './supabase';

export const tournamentService = {
  // CRUD de torneios
  async getTournaments(userId) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTournament(id) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createTournament(tournamentData) {
    const { data, error } = await supabase
      .from('tournaments')
      .insert([tournamentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTournament(id, updates) {
    const { data, error } = await supabase
      .from('tournaments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTournament(id) {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async renameTournament(id, newName) {
    return this.updateTournament(id, { name: newName });
  },

  // Grupos de ranking
  async getRankingGroups(userId) {
    const { data, error } = await supabase
      .from('ranking_groups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createRankingGroup(groupData) {
    const { data, error } = await supabase
      .from('ranking_groups')
      .insert([groupData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRankingGroup(id, updates) {
    const { data, error } = await supabase
      .from('ranking_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRankingGroup(id) {
    const { error } = await supabase
      .from('ranking_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Salvar resultados
  async saveTournamentResults(tournamentId, players) {
    const results = players.map(player => ({
      tournament_id: tournamentId,
      player_name: player.name,
      position: player.position,
      points: player.score || 0,
      actions: player.actions
    }));

    const { error } = await supabase
      .from('tournament_results')
      .upsert(results, { onConflict: 'tournament_id,player_name' });

    if (error) throw error;
  },

  // Buscar ranking combinado
  async getCombinedRanking(tournamentIds) {
    const { data, error } = await supabase
      .from('tournament_results')
      .select('*')
      .in('tournament_id', tournamentIds);

    if (error) throw error;

    // Agrupar por jogador e somar pontos
    const playerMap = {};
    data.forEach(result => {
      if (!playerMap[result.player_name]) {
        playerMap[result.player_name] = {
          name: result.player_name,
          totalPoints: 0,
          tournaments: 0,
          bestPosition: Infinity,
          totalActions: 0
        };
      }
      playerMap[result.player_name].totalPoints += result.points;
      playerMap[result.player_name].tournaments += 1;
      playerMap[result.player_name].bestPosition = Math.min(
        playerMap[result.player_name].bestPosition,
        result.position || Infinity
      );
      playerMap[result.player_name].totalActions += result.actions || 0;
    });

    return Object.values(playerMap)
      .map(player => ({
        ...player,
        averagePoints: player.totalPoints / player.tournaments
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }
};
