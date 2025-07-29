import React, { useState } from 'react';
import { X, User, Code, ArrowLeft } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  username: string;
  email: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, username, email }) => {
  const [view, setView] = useState<'main' | 'account'>('main');

  const renderMainView = () => (
    <>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Settings</h2>
      <div className="space-y-4">
        <button 
          onClick={() => setView('account')}
          className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="text-gray-600 dark:text-gray-300" />
            <span className="font-medium text-gray-800 dark:text-gray-200">Account</span>
          </div>
        </button>
        <a 
          href="https://www.instagram.com/sanchitkhate_10/" // You can change this link to your portfolio or social media
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Code className="text-gray-600 dark:text-gray-300" />
            <span className="font-medium text-gray-800 dark:text-gray-200">Created by</span>
          </div>
          <p className="text-l font-medium text-gray-700 dark:text-gray-300">Sanchit Khate</p>
        </a>
      </div>
      <button onClick={onClose} className="w-full mt-8 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200">
        Done
      </button>
    </>
  );

  const renderAccountView = () => (
    <>
      <div className="flex items-center mb-6">
        <button onClick={() => setView('main')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
           <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white flex-grow">Account Details</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <span className="font-medium text-gray-500 dark:text-gray-400">Username</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{username}</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <span className="font-medium text-gray-500 dark:text-gray-400">Email</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{email}</span>
        </div>
      </div>
       <button onClick={() => setView('main')} className="w-full mt-8 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200">
        Back
      </button>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col border border-gray-200 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">
          <X size={24} />
        </button>
        {view === 'main' ? renderMainView() : renderAccountView()}
      </div>
    </div>
  );
};
