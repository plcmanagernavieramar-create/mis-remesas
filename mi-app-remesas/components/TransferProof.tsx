import React, { useState } from 'react';
import { Transaction, AppSettings } from '../types';

interface TransferProofProps {
  transaction: Transaction;
  settings: AppSettings;
  onBack: () => void;
}

const TransferProof: React.FC<TransferProofProps> = ({ transaction, settings, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleFinalize = () => {
    const phoneNumber = "584120000000"; 
    const sSymbol = transaction.direction === 'BRL_TO_VES' ? 'R$' : 'Bs.';
    const tSymbol = transaction.direction === 'BRL_TO_VES' ? 'Bs.' : 'R$';
    
    const message = `*SOLICITUD DE ENVÍO*%0A%0A` +
      `*Monto enviado:* ${sSymbol} ${transaction.amountSource.toFixed(2)}%0A` +
      `*Monto a recibir:* ${tSymbol} ${transaction.amountTarget.toFixed(2)}%0A` +
      `*Tasa aplicada:* ${transaction.rateApplied.toFixed(4)}%0A%0A` +
      `*DATOS DEL BENEFICIARIO:*%0A` +
      `👤 Nombre: ${transaction.beneficiaryName}%0A` +
      `🆔 Cédula: ${transaction.beneficiaryId}%0A` +
      `🏦 Banco: ${transaction.bankName}%0A%0A` +
      `_Envío el comprobante adjunto para verificación inmediata._`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-xs mb-8 font-black uppercase tracking-[0.2em] transition-colors">
          <i className="fas fa-arrow-left"></i> Modificar Solicitud
        </button>
        
        <div className="bg-blue-600 text-white p-10 rounded-[2rem] mb-10 shadow-2xl shadow-blue-100 text-center relative overflow-hidden">
          <p className="text-[10px] font-black mb-2 uppercase tracking-[0.3em] text-blue-100 relative z-10">Monto Neto a Transferir</p>
          <p className="text-5xl font-black relative z-10">
            {transaction.direction === 'BRL_TO_VES' ? 'R$' : 'Bs.'} {transaction.amountSource.toFixed(2)}
          </p>
          <i className="fas fa-wallet absolute -left-4 -bottom-4 text-7xl text-white/10 -rotate-12"></i>
        </div>

        {/* DATOS BANCARIOS (DINÁMICOS) */}
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl mb-10">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Depositar en Brasil a:</h4>
          <div className="text-slate-700 font-bold whitespace-pre-line text-sm leading-relaxed">
            {settings.brazilBankDetails || "Solicite los datos bancarios por WhatsApp."}
          </div>
        </div>

        <div className="space-y-6 text-left mb-10">
          <div>
            <h4 className="font-black text-slate-800 text-lg mb-1">Subir Comprobante</h4>
            <p className="text-xs text-slate-400 font-medium">Capture su comprobante de transferencia y adjúntelo aquí.</p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`w-full h-64 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all ${
                preview ? 'border-green-500 bg-green-50 shadow-inner' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              {preview ? (
                <img src={preview} alt="Vista previa del comprobante" className="h-full w-full object-contain p-6 rounded-[2rem]" />
              ) : (
                <>
                  <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110">
                    <i className="fas fa-camera-retro text-3xl text-slate-300"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seleccionar Captura</span>
                </>
              )}
            </label>
          </div>
        </div>

        <button
          onClick={handleFinalize}
          disabled={!file}
          className={`w-full py-6 rounded-2xl font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-4 ${
            file 
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-100 active:scale-95' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
          }`}
        >
          <i className="fab fa-whatsapp text-2xl"></i>
          ENVIAR POR WHATSAPP
        </button>
      </div>
    </div>
  );
};


export default TransferProof;
