import React, { useState, useEffect, useCallback } from 'react';
import { ExchangeRate, Transaction, AppSettings } from './types';
import { fetchLatestRates } from './services/geminiService';
import AuthGate from './components/AuthGate';
import Converter from './components/Converter';
import TransferProof from './components/TransferProof';
import AdminPanel from './components/AdminPanel';

// Estas variables se deben configurar en Vercel/Netlify como Environment Variables
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_KEY || '';

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

  // Carga inicial de ajustes desde la Nube (Supabase) o LocalStorage
  const loadSettings = useCallback(async () => {
    if (SB_URL && SB_KEY) {
      try {
        const response = await fetch(`${SB_URL}/rest/v1/app_settings?id=eq.1`, {
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        });
        const data = await response.json();
        if (data && data[0]) {
          setSettings(data[0].config);
          return;
        }
      } catch (err) {
        console.warn("Error cargando de la nube, usando local:", err);
      }
    }
    const saved = localStorage.getItem('brl_ves_settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    await loadSettings();
    try {
      const data = await fetchLatestRates();
      setRate(data);
    } catch (err) {
      console.error("Error al sincronizar tasas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [loadSettings]);

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
    if (isAdminMode) {
      setShowAdminPanel(true);
    } else {
      const pass = window.prompt("Acceso restringido. Ingrese clave admin:");
      if (pass && pass.toUpperCase() === settings.adminCode) {
        setIsAdminMode(true);
        setShowAdminPanel(true);
      } else if (pass) {
        alert("Clave incorrecta.");
      }
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('brl_ves_settings', JSON.stringify(newSettings));
    
    // Guardar en la nube si está configurado
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
        console.error("Error guardando en la nube:", err);
      }
    }
    setShowAdminPanel(false);
  };

  const getSelectedBaseRate = () => {
    if (settings.isManualMode) {
      return settings.manualRates.bybitVes / settings.manualRates.bybitBrl;
    }
    if (!rate || !rate.bybit || rate.bybit.brl === 0) return 0;
    return rate.bybit.ves / rate.bybit.brl;
  };

  const baseRate = getSelectedBaseRate();
  const clientRate = baseRate * ((100 - settings.profitMargin) / 100);

  if (!isAuthenticated) {
    return <AuthGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-paper-plane text-white"></i>
            </div>
            <h1 className="font-black text-slate-800 text-lg">Envios<span className="text-green-600">BR-VE</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
            {settings.isManualMode && (
              <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-tighter">
                MODO MANUAL
              </span>
            )}
            <button 
              onClick={handleAdminAuth}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAdminMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              <i className={`fas ${isAdminMode ? 'fa-cog' : 'fa-lock'}`}></i>
            </button>
            <button 
              onClick={() => { setIsAuthenticated(false); setIsAdminMode(false); setStep(1); }}
              className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:text-red-500 transition-colors"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-6">
        {!settings.isManualMode && isLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 animate-pulse">
            <i className="fas fa-sync-alt animate-spin"></i>
            <span className="text-xs font-bold uppercase tracking-widest">Sincronizando p2p.army...</span>
          </div>
        )}

        {(rate || settings.isManualMode) && step === 1 && (
          <div className="space-y-4 mb-6">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-green-500/20 text-green-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-green-500/30 uppercase tracking-[0.2em]">
                    TASA {settings.isManualMode ? 'MANUAL' : 'DEL DÍA'}
                  </span>
                  <span className="text-slate-500 text-[10px] font-medium">
                    {settings.isManualMode ? 'Global Cloud' : `Ref: ${rate?.lastUpdated.toLocaleTimeString()}`}
                  </span>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-5xl font-black mb-1 tracking-tighter">1 BRL = {clientRate.toFixed(2)} VES</h2>
                </div>
              </div>
              <i className="fas fa-chart-line absolute -right-6 -bottom-6 text-[120px] text-white/5 rotate-12"></i>
            </div>
          </div>
        )}

        {(rate || settings.isManualMode) ? (
          step === 1 ? (
            <Converter 
              rate={rate || { brlToVes: 0, usdVes: 0, usdBrl: 0, lastUpdated: new Date(), source: 'Manual' }} 
              settings={settings} 
              onContinue={(t) => { setCurrentTransaction(t); setStep(2); }} 
            />
          ) : (
            currentTransaction && <TransferProof transaction={currentTransaction} settings={settings} onBack={() => setStep(1)} />
          )
        ) : !isLoading && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <i className="fas fa-exclamation-triangle text-amber-500 text-6xl mb-6"></i>
            <p className="text-slate-500 font-bold mb-8">Error al conectar con p2p.army.</p>
            <button onClick={initializeApp} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl">REINTENTAR</button>
          </div>
        )}
      </main>

      {showAdminPanel && (
        <AdminPanel rate={rate} settings={settings} onSave={handleSaveSettings} onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  );
};


export default App;
