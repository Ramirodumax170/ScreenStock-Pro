
import React from 'react';

interface GeminiConnectProps {
  isConnected: boolean;
  onToggleConnection: () => void;
  isApiKeyAvailable: boolean;
}

const GeminiConnect: React.FC<GeminiConnectProps> = ({ isConnected, onToggleConnection, isApiKeyAvailable }) => {
  const IconCloudConnected = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-green-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-5.056-2.267.75.75 0 0 0-.706.091 3.751 3.751 0 0 0-5.938 3.185A4.5 4.5 0 0 0 2.25 15Z" />
    </svg>
  );

  const IconCloudDisconnected = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-red-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655 9.75 21.75l3.745-4.012M9.257 7.5H18a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5H9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.012 16.532 1.215-5.061m3.406 2.792L10.5 9.75M17.25 10.5a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.201 6.183A3.001 3.001 0 0 1 10.5 3a3 3 0 0 1 2.23 5.02.75.75 0 0 1 .707-.09 3.75 3.75 0 0 1 4.26 5.42M2.25 12.75A4.504 4.504 0 0 0 6.75 17.25h.665" />
    </svg>
  );
  
  if (!isApiKeyAvailable) {
    return (
      <div className="p-3 bg-yellow-900 border border-yellow-700 rounded-md text-yellow-200 text-sm flex items-center">
        <IconCloudDisconnected />
        <span>API Key para Gemini no configurada. Funciones IA no disponibles.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-md">
      {isConnected ? <IconCloudConnected /> : <IconCloudDisconnected />}
      <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        {isConnected ? 'Conectado a Gemini IA' : 'Desconectado de Gemini IA'}
      </span>
      <button
        onClick={onToggleConnection}
        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors
          ${isConnected 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-green-600 hover:bg-green-700 text-white'}`}
      >
        {isConnected ? 'Desconectar IA' : 'Conectar IA'}
      </button>
    </div>
  );
};

export default GeminiConnect;
    