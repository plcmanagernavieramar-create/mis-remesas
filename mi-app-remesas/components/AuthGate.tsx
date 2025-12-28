import React, { useState } from 'react';

interface AuthGateProps {
  onUnlock: (code: string) => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onUnlock }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const VALID_CODES = ['ENVIO2024', 'BRASIL2024', 'VES2024', 'ADMIN2024'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_CODES.includes(code.toUpperCase())) {
      onUnlock(code.toUpperCase());
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-600 to-blue-900 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-auto max-w-md border border-white/20">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <i className="fas fa-shield-alt text-3xl text-green-600"></i>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Acceso Seguro</h2>
        <p className="text-slate-500 text-center mb-8">
          Introduce tu código de acceso personal.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="CÓDIGO"
              className={`w-full px-4 py-4 border-2 rounded-xl text-center text-xl font-mono text-slate-900 bg-slate-50 focus:outline-none transition-all ${
                error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-green-500'
              }`}
            />
            {error && <p className="text-red-500 text-sm text-center mt-2 animate-bounce font-medium">Acceso denegado</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthGate;