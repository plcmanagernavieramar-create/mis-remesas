export interface MarketRates {
  ves: number; // Precio de 1 USDT/USD en Bolívares
  brl: number; // Precio de 1 USDT/USD en Reales
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ExchangeRate {
  brlToVes: number;
  usdVes: number; // Tasa oficial BCV (Venezuela)
  usdBrl: number; // Tasa oficial BCB (Brasil)
  binance?: MarketRates; // Referencia 1 USD en Binance P2P
  bybit?: MarketRates;   // Referencia 1 USD en Bybit P2P
  lastUpdated: Date;
  source: string;
  groundingSources?: GroundingSource[];
}

export type Direction = 'BRL_TO_VES' | 'VES_TO_BRL';

export interface Transaction {
  direction: Direction;
  amountSource: number;
  amountTarget: number;
  rateApplied: number;
  beneficiaryName: string;
  beneficiaryId: string;
  bankName: string;
}

export interface ManualRates {
  bybitVes: number;
  bybitBrl: number;
  binanceVes: number;
  binanceBrl: number;
}

export interface AppSettings {
  profitMargin: number; 
  adminCode: string;
  brazilBankDetails: string;
  isManualMode: boolean;
  manualRates: ManualRates;
}
