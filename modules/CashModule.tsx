
import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { CashTransaction, CompanyData } from '../types';
import { Wallet, Search, Printer, Trash2, ArrowUpRight, ArrowDownLeft, Download, Coins, FileText } from 'lucide-react';

const CashModule = ({ company }: { company: CompanyData | null }) => {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    return dbService.subscribe((data: any) => setTransactions(data.cash || []));
  }, []);

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + (t.amount || 0), 0);
  // Fixed: Corrected property access from 'vuelto' to 'change' to match the interface
  const totalVueltos = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + (t.change || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const filtered = transactions.filter(t => {
    const s = search.toUpperCase();
    return (t.id.toUpperCase().includes(s) || (t.orderId || '').toUpperCase().includes(s) || (t.reason || '').toUpperCase().includes(s)) && (filterType === 'ALL' || t.type === filterType);
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20 no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">CAJA Y ARQUEO DIARIO</h2>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="FILTRAR..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase pr-10 outline-none shadow-inner" />
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <button className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><FileText size={16}/> REPORTE PROFESIONAL</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-2 border-l-[12px] border-l-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">INGRESOS (REAL)</p>
          <h4 className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">${totalIncome.toFixed(2)}</h4>
          <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 bg-emerald-50 w-fit px-2 py-0.5 rounded-full uppercase"><ArrowUpRight size={10}/> ENTRADAS</div>
        </div>
        <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-2 border-l-[12px] border-l-blue-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">VUELTOS / CAMBIOS (+) </p>
          <h4 className="text-3xl font-black text-blue-600 tracking-tighter leading-none">${totalVueltos.toFixed(2)}</h4>
          <div className="flex items-center gap-1 text-[8px] font-black text-blue-500 bg-blue-50 w-fit px-2 py-0.5 rounded-full uppercase"><Coins size={10}/> SALDOS A FAVOR</div>
        </div>
        <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-2 border-l-[12px] border-l-red-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">EGRESOS / PAGOS</p>
          <h4 className="text-3xl font-black text-red-600 tracking-tighter leading-none">${totalExpense.toFixed(2)}</h4>
          <div className="flex items-center gap-1 text-[8px] font-black text-red-500 bg-red-50 w-fit px-2 py-0.5 rounded-full uppercase"><ArrowDownLeft size={10}/> SALIDAS</div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl space-y-2 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12"></div>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">SALDO EN CAJA</p>
          <h4 className="text-3xl font-black tracking-tighter leading-none">${balance.toFixed(2)}</h4>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ARQUEO OPERATIVO</p>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-50 border-b flex flex-wrap justify-between items-center gap-6">
          <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
            <button onClick={() => setFilterType('ALL')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterType === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>TODOS</button>
            <button onClick={() => setFilterType('INCOME')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterType === 'INCOME' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-600'}`}>INGRESOS</button>
            <button onClick={() => setFilterType('EXPENSE')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterType === 'EXPENSE' ? 'bg-red-600 text-white shadow-md' : 'text-red-600'}`}>EGRESOS</button>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} TRANSACCIONES</span>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50 border-b text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">FECHA/HORA</th>
                <th className="px-8 py-6">CÓDIGO</th>
                <th className="px-8 py-6">CATEGORÍA / DOCUMENTO</th>
                <th className="px-8 py-6">FORMA</th>
                <th className="px-8 py-6 text-right">VALOR REAL ($)</th>
                <th className="px-8 py-6 text-right text-blue-600">VUELTO / EXCEDENTE ($)</th>
                <th className="px-8 py-6 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[10px] font-bold uppercase">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 text-slate-400">{new Date(t.date).toLocaleString('es-EC')}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{t.id}</td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black mr-2 ${t.category === 'VENTA' ? 'bg-blue-50 text-blue-600' : t.category === 'CAJA_CHICA' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{t.category}</span>
                    {t.reason || t.orderId || 'TRANSACCIÓN VARIA'}
                  </td>
                  <td className="px-8 py-6"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[8px] font-black border border-slate-200">{t.method}</span></td>
                  <td className={`px-8 py-6 text-right font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>{t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}</td>
                  {/* Fixed: Corrected property access from 'vuelto' to 'change' to match the interface */}
                  <td className="px-8 py-6 text-right font-black text-blue-600">${(t.change || 0).toFixed(2)}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-2">
                      <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm" title="REIMPRIMIR"><Printer size={16}/></button>
                      <button onClick={async () => { if(confirm("¿ANULAR TRANSACCIÓN?")) await dbService.delete('cash', t.id); }} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashModule;
