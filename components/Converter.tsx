import React, { useState, useEffect } from 'react';
import { ExchangeRate, Transaction, Direction, AppSettings } from '../types';

interface ConverterProps {
  rate: ExchangeRate;
  settings: AppSettings;
  onContinue: (transaction: Transaction) => void;
}

const Converter: React.FC<ConverterProps> = ({ rate, settings, onContinue }) => {
  const [direction, setDirection] = useState<Direction>('BRL_TO_VES');
  const [sourceAmount, setSourceAmount] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('0,00');
  
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [bankName, setBankName] = useState('');

  // LÓGICA DE CÁLCULO (Respeta Manual vs Auto)
  const getP2PBase = () => {
    if (settings.isManualMode) {
      const { bybitVes, bybitBrl } = settings.manualRates;
      return bybitBrl > 0 ? (bybitVes / bybitBrl) : 0;
    }
    const bybitVes = rate.bybit?.ves || 0;
    const bybitBrl = rate.bybit?.brl || 0;
    return bybitBrl > 0 ? (bybitVes / bybitBrl) : (rate.brlToVes || 0);
  };

  const p2pBase = getP2PBase();
  const marginFactor = (100 - settings.profitMargin) / 100;
  
  const userRate = direction === 'BRL_TO_VES' 
    ? p2pBase * marginFactor 
    : (1 / (p2pBase > 0 ? p2pBase : 1)) * marginFactor;

  useEffect(() => {
    const val = parseFloat(sourceAmount);
    if (!isNaN(val) && val > 0) {
      const calculated = val * userRate;
      setTargetAmount(calculated.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setTargetAmount('0,00');
    }
  }, [sourceAmount, userRate]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(',', '.');
    if (/^\d*\.?\d*$/.test(value)) setSourceAmount(value);
  };

  const isFormValid = sourceAmount && parseFloat(sourceAmount) > 0 && beneficiaryName.trim() && beneficiaryId.trim() && bankName.trim();

  const handleConfirm = () => {
    const val = parseFloat(sourceAmount);
    onContinue({ 
      direction, 
      amountSource: val, 
      amountTarget: val * userRate, 
      rateApplied: userRate, 
      beneficiaryName, 
      beneficiaryId, 
      bankName 
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <h3 className="font-black text-slate-800 uppercase tracking-tight">CÁLCULO DE ENVÍO</h3>
             {settings.isManualMode && (
               <i className="fas fa-hand-paper text-amber-500 text-xs" title="Modo Manual Activado"></i>
             )}
          </div>
          <button 
            onClick={() => { setDirection(d => d === 'BRL_TO_VES' ? 'VES_TO_BRL' : 'BRL_TO_VES'); setSourceAmount(''); }}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full flex items-center gap-2 active:scale-95 transition-all"
          >
            <i className="fas fa-retweet"></i> INVERTIR
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute left-4 top-3">Monto a enviar</label>
            <input
              type="text"
              value={sourceAmount}
              onChange={handleSourceChange}
              placeholder="0.00"
              className="w-full pt-8 pb-4 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-slate-900 focus:border-green-500 focus:bg-white outline-none transition-all placeholder:text-slate-200"
            />
            <span className="absolute right-4 bottom-4 font-black text-slate-400">
              {direction === 'BRL_TO_VES' ? 'BRL' : 'VES'}
            </span>
          </div>

          <div className="relative bg-green-600 p-6 rounded-2xl text-white shadow-lg">
            <label className="text-[10px] font-black text-green-200 uppercase tracking-widest block mb-1">Reciben (Calculado)</label>
            <div className="text-3xl font-black">
              {direction === 'BRL_TO_VES' ? 'Bs. ' : 'R$ '} {targetAmount}
            </div>
            <div className="mt-2 text-[10px] font-bold text-green-100 opacity-80 uppercase tracking-tighter">
              Tasa Aplicada: 1 {direction === 'BRL_TO_VES' ? 'BRL' : 'VES'} = {userRate.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-black text-slate-800 mb-6 uppercase tracking-tight">Datos del Receptor</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej: Pedro Pérez"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:border-green-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cédula / ID</label>
              <input
                type="text"
                placeholder="V-00.000.000"
                value={beneficiaryId}
                onChange={(e) => setBeneficiaryId(e.target.value)}
                className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Banco / Método</label>
              <input
                type="text"
                placeholder="Ej: Banesco"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:border-green-500 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!isFormValid}
          className={`w-full mt-8 py-5 rounded-2xl font-black text-lg shadow-xl transition-all ${isFormValid ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' : 'bg-slate-100 text-slate-300'}`}
        >
          CONFIRMAR ENVÍO
        </button>
      </div>
    </div>
  );
};

export default Converter;

