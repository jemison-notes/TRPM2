import React from 'react';
import { Trophy, Plus, LogOut, User, Bell, HelpCircle } from 'lucide-react';

const TopBar = ({ 
  title, 
  onCreate, 
  onLogout, 
  userEmail,
  onHelp,
  notificationCount = 0
}) => {
  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-gray-900 to-black rounded-xl border border-gray-800">
      {/* Lado esquerdo: Logo e título */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-green-600 to-green-500 rounded-xl">
          <Trophy size={28} className="text-white" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white">
            {title || 'Poker Tournament Manager'}
          </h1>
          {userEmail && (
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <User size={12} />
              <span>{userEmail}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lado direito: Ações */}
      <div className="flex items-center gap-3">
        {/* Botão de ajuda */}
        {onHelp && (
          <button
            onClick={onHelp}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
            title="Ajuda"
          >
            <HelpCircle size={20} />
          </button>
        )}

        {/* Notificações */}
        {notificationCount > 0 && (
          <button className="relative p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* Novo torneio */}
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-lg text-white font-semibold flex items-center gap-2 transition"
          >
            <Plus size={18} />
            <span>Novo Torneio</span>
          </button>
        )}

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-lg text-white font-semibold flex items-center gap-2 transition"
            title="Sair"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;
