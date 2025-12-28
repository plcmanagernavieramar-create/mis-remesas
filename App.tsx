import React, { useState, useEffect, useCallback } from 'react';
import { ExchangeRate, Transaction, AppSettings } from './types';
import { fetchLatestRates } from './services/geminiService';
import AuthGate from './components/AuthGate';
import Converter from './components/Converter';
import TransferProof from './components/TransferProof';
import AdminPanel from './components/AdminPanel';

// Acceso seguro a variables de entorno
const getEnv = (key: string) => {
  try {
    return process.env[key] || '';
  } catch {
    return '';
  }
};

const SB_URL = getEnv('SUPABASE_URL').replace(/\/$/, '');
const SB_KEY = getEnv('SUPABASE_KEY');

const DEFAULT_SETTINGS: AppSettings = {
  profitMargin: 2, 
  adminCode: 'ADMIN2024',
  brazilBankDetails: 'PIX: su-email-o-telefono@pix.com.br\nBanco: Nubank\nNombre: Tu Nombre',
  isManualMode: false,
  manualRates: {
    bybitVes: 545.00,
    bybitBrl: 5.80,
    binanceVes: 544.00,
    binanceBrl: 5.82
  }
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (SB_URL && SB_KEY) {
      try {
        const response = await fetch(`${SB_URL}/rest/v1/app_settings?id=eq.1`, {
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        });
        if (!response.ok) throw new Error("Supabase error");
        const data = await response.json();
        if (data && data[0]) {
          setSettings(data[0].config);
          return;
        }
      } catch (err) {
        console.warn("Usando configuración local por defecto");
      }
    }
    const saved = localStorage.getItem('brl_ves_settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    setInitError(null);
    await loadSettings();
    try {
      const data = await fetchLatestRates();
      setRate(data);
    } catch (err) {
      console.error("Error al sincronizar tasas:", err);
      // No bloqueamos la app si falla el fetch, permitimos modo manual si hay settings
      if (!settings.isManualMode) {
        setInitError("No se pudo obtener la tasa automática. Verifica tu API_KEY o usa modo manual.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadSettings, settings.isManualMode]);

  useEffect(() => {
    initializeApp();
    const interval = setInterval(initializeApp, 300000); 
    return () => clearInterval(interval);
  }, [initializeApp]);

  const handleUnlock = (code: string) => {
    setIsAuthenticated(true);
    if (code.toUpperCase() === settings.adminCode) {
      setIsAdminMode(true);
    }
  };

  const handleAdminAuth = () => {
    const pass = window.prompt("Ingrese clave admin:");
    if (pass && pass.toUpperCase() === settings.adminCode) {
      setIsAdminMode(true);
      setShowAdminPanel(true);
    } else if (pass) {
      alert("Clave incorrecta.");
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('brl_ves_settings', JSON.stringify(newSettings));
    
    if (SB_URL && SB_KEY) {
      try {
        await fetch(`${SB_URL}/rest/v1/app_settings?id=eq.1`, {
          method: 'PATCH',
          headers: { 
            'apikey': SB_KEY, 
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ config: newSettings })
        });
      } catch (err) {
        console.error("Error nube:", err);
      }
    }
    setShowAdminPanel(false);
  };

  const getClientRate = () => {
    let base = 0;
    if (settings.isManualMode) {
      base = settings.manualRates.bybitVes / settings.manualRates.bybitBrl;
    } else if (rate && rate.bybit && rate.bybit.brl !== 0) {
      base = rate.bybit.ves / rate.bybit.brl;
    }
    return base * ((100 - settings.profitMargin) / 100);
  };

  const clientRate = getClientRate();

  if (!isAuthenticated) {
    return <AuthGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-paper-plane"></i>
            </div>
            <h1 className="font-black text-slate-800 text-lg">Envios<span className="text-green-600">BR-VE</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleAdminAuth} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200">
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-6">
        {isLoading && !rate && !settings.isManualMode && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold animate-pulse uppercase text-xs tracking-widest">Iniciando sistema...</p>
          </div>
        )}

        {initError && !settings.isManualMode && (
          <div className="mb-6 bg-red-50 border border-red-100 p-6 rounded-3xl text-red-600">
            <div className="flex gap-3 items-center mb-2">
              <i className="fas fa-exclamation-circle text-xl"></i>
              <p className="font-black text-sm uppercase">Atención</p>
            </div>
            <p className="text-sm opacity-80">{initError}</p>
            <button onClick={handleAdminAuth} className="mt-4 text-xs font-black underline">ENTRAR COMO ADMIN PARA ACTIVAR MODO MANUAL</button>
          </div>
        )}

        {(rate || settings.isManualMode) && (
          <>
            {step === 1 && (
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl mb-6">
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Tasa del día</p>
                <h2 className="text-4xl font-black">1 BRL = {clientRate.toFixed(2)} VES</h2>
              </div>
            )}

            {step === 1 ? (
              <Converter 
                rate={rate || { brlToVes: 0, usdVes: 0, usdBrl: 0, lastUpdated: new Date(), source: 'Manual' }} 
                settings={settings} 
                onContinue={(t) => { setCurrentTransaction(t); setStep(2); }} 
              />
            ) : (
              currentTransaction && <TransferProof transaction={currentTransaction} settings={settings} onBack={() => setStep(1)} />
            )}
          </>
        )}
      </main>

      {showAdminPanel && (
        <AdminPanel rate={rate} settings={settings} onSave={handleSaveSettings} onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  );
};

export default App;
