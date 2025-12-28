
import React, { useState } from 'react';
import { AppSettings, ExchangeRate, ManualRates } from '../types';

interface AdminPanelProps {
  settings: AppSettings;
  rate: ExchangeRate | null;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ settings, rate, onSave, onClose }) => {
  const [isManual, setIsManual] = useState(settings.isManualMode);
  const [margin, setMargin] = useState(settings.profitMargin.toString());
  const [bankDetails, setBankDetails] = useState(settings.brazilBankDetails);
  
  const [manualRates, setManualRates] = useState<ManualRates>(settings.manualRates);

  const handleSave = () => {
    onSave({
      ...settings,
      profitMargin: parseFloat(margin) || 0,
      brazilBankDetails: bankDetails,
      isManualMode: isManual,
      manualRates: manualRates
    });
  };

  const updateManualRate = (key: keyof ManualRates, value: string) => {
    const val = parseFloat(value) || 0;
    setManualRates(prev => ({ ...prev, [key]: val }));
  };

  // Valores mostrados (Manual vs Automático)
  const displayBybitVes = isManual ? manualRates.bybitVes : (rate?.bybit?.ves || 0);
  const displayBybitBrl = isManual ? manualRates.bybitBrl : (rate?.bybit?.brl || 0);
  const displayBinanceVes = isManual ? manualRates.binanceVes : (rate?.binance?.ves || 0);
  const displayBinanceBrl = isManual ? manualRates.binanceBrl : (rate?.binance?.brl || 0);

  const baseRate = displayBybitBrl > 0 ? (displayBybitVes / displayBybitBrl) : 0;
  const finalRate = baseRate * ((100 - parseFloat(margin)) / 100);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-white/20 overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-sliders-h text-blue-600"></i>
              Gestión de Tasas
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Fuente: p2p.army (Actualizado)</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-red-500 transition-all hover:rotate-90">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {/* SWITCH MODO */}
          <section className={`p-6 rounded-[2rem] flex items-center justify-between transition-colors ${isManual ? 'bg-amber-50 border-2 border-amber-200' : 'bg-green-50 border-2 border-green-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isManual ? 'bg-amber-500' : 'bg-green-600'} text-white shadow-lg`}>
                <i className={`fas ${isManual ? 'fa-hand-paper' : 'fa-robot'}`}></i>
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase text-xs">Modo de Captura</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                  {isManual ? 'Entrada manual de datos p2p.army' : 'Sincronización automática vía IA'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsManual(!isManual)}
              className={`relative w-20 h-10 rounded-full transition-all ${isManual ? 'bg-amber-500' : 'bg-green-600'}`}
            >
              <div className={`absolute top-1 bg-white w-8 h-8 rounded-full shadow-lg transition-transform ${isManual ? 'translate-x-11' : 'translate-x-1'}`} />
            </button>
          </section>

          {/* GRID DE TASAS */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Valores P2P (USD/Fiat)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BYBIT (Base de cálculo) */}
              <div className={`p-6 rounded-3xl border-2 transition-all ${isManual ? 'border-amber-200 bg-white' : 'border-blue-100 bg-blue-50/30'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-black rounded flex items-center justify-center text-[10px] font-black text-white">BY</span>
                    <h4 className="font-black text-slate-800 uppercase text-[11px]">Bybit (PagoMovil/PIX)</h4>
                  </div>
                  {!isManual && <span className="text-[8px] font-black text-blue-500 bg-blue-100 px-2 py-1 rounded">AUTO</span>}
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">VES Section SELL</label>
                    <input 
                      type="number" 
                      step="0.01"
                      disabled={!isManual}
                      value={displayBybitVes}
                      onChange={(e) => updateManualRate('bybitVes', e.target.value)}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-black text-xl transition-all"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">BRL Section BUY</label>
                    <input 
                      type="number" 
                      step="0.01"
                      disabled={!isManual}
                      value={displayBybitBrl}
                      onChange={(e) => updateManualRate('bybitBrl', e.target.value)}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-black text-xl transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* BINANCE (Referencia) */}
              <div className="p-6 rounded-3xl border-2 border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <i className="fab fa-bitcoin text-[#F3BA2F] text-lg"></i>
                    <h4 className="font-black text-slate-800 uppercase text-[11px]">Binance (Ref)</h4>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">VES Section SELL</label>
                    <input 
                      type="number" 
                      disabled={!isManual}
                      value={displayBinanceVes}
                      onChange={(e) => updateManualRate('binanceVes', e.target.value)}
                      className="w-full bg-white p-4 rounded-2xl border-2 border-transparent font-black text-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">BRL Section BUY</label>
                    <input 
                      type="number" 
                      disabled={!isManual}
                      value={displayBinanceBrl}
                      onChange={(e) => updateManualRate('binanceBrl', e.target.value)}
                      className="w-full bg-white p-4 rounded-2xl border-2 border-transparent font-black text-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RESUMEN FINAL */}
          <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tasa Cliente Calculada</h3>
                   <p className="text-5xl font-black text-green-400">1 BRL = {finalRate.toFixed(2)} VES</p>
                   <p className="text-[10px] font-bold text-slate-500 mt-2 italic">
                     Base: {baseRate.toFixed(4)} (Bybit) - Margen: {margin}%
                   </p>
                </div>
                <div className="bg-white/5 p-4 rounded-3xl border border-white/10 w-full md:w-auto">
                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 text-center">Margen de Ganancia</label>
                   <div className="flex items-center gap-3">
                     <input 
                      type="number"
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                      className="w-24 bg-white/10 p-3 rounded-xl border-2 border-white/20 text-center font-black text-2xl outline-none focus:border-green-400 transition-all"
                     />
                     <span className="font-black text-2xl text-slate-500">%</span>
                   </div>
                </div>
             </div>
             <i className="fas fa-chart-line absolute -right-4 -bottom-4 text-9xl text-white/5 -rotate-12"></i>
          </section>

          {/* DATOS BANCARIOS */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Datos para Transferencias Brasil</label>
            <textarea
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              rows={3}
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-slate-800 font-bold focus:outline-none focus:border-blue-500 bg-white text-sm transition-all"
              placeholder="Nombre del Banco, PIX, Titular..."
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-100 transition-all active:scale-95 text-lg uppercase tracking-widest"
          >
            CONFIRMAR AJUSTES
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
