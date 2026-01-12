import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { CashTransaction } from '../types';
import { Banknote, Plus, Trash2, Search, Check, X, FileDigit } from 'lucide-react';
import Modal, { ModalType } from '../components/Modal';

const PettyCashModule = () => {
  const [expenses, setExpenses] = useState<CashTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: '', reason: '', beneficiary: '' });
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  useEffect(() => {
    return dbService.subscribe((data: any) => {
      setExpenses((data.cash || []).filter((t: CashTransaction) => t.category === 'CAJA_CHICA'));
    });
  }, []);

  const toUpper = (val: string) => (val || '').toUpperCase();

  const handleSave = async () => {
    if (!formData.amount || !formData.reason) {
      setModal({ isOpen: true, type: 'warning', title: 'DATOS FALTANTES', message: 'VALOR Y MOTIVO SON CAMPOS OBLIGATORIOS.' });
      return;
    }
    
    // Regla 11/73: Generar código de 10 dígitos con prefijo CC
    const sequentialId = await dbService.generateSequentialId('CC');
    const expense: CashTransaction = {
      id: sequentialId,
      amount: parseFloat(formData.amount.replace(',', '.')) || 0,
      change: 0,
      type: 'EXPENSE',
      category: 'CAJA_CHICA',
      reason: toUpper(formData.reason),
      beneficiary: toUpper(formData.beneficiary),
      method: 'EFECTIVO',
      date: Date.now(),
      user: 'SISTEMA'
    };

    await dbService.add('cash', expense);
    setIsFormOpen(false);
    setFormData({ amount: '', reason: '', beneficiary: '' });
    setModal({ isOpen: true, type: 'success', title: 'EGRESO REGISTRADO', message: `VALE ${sequentialId} GUARDADO CORRECTAMENTE EN EGRESOS DE CAJA.` });
  };

  const filtered = expenses.filter(e => 
    toUpper(e.reason).includes(search.toUpperCase()) || toUpper(e.id).includes(search.toUpperCase()) || toUpper(e.beneficiary).includes(search.toUpperCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 no-scrollbar">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={() => setModal(p => ({...p, isOpen: false}))} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-red-50 text-red-600 rounded-3xl"><Banknote size={24}/></div>
           <div>
              <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">CAJA CHICA / GASTOS</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">GESTIÓN DE VALES Y PAGOS MENORES</p>
           </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="BUSCAR VALE..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase pr-12 outline-none focus:border-red-500 shadow-inner" />
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <button onClick={() => setIsFormOpen(true)} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl hover:bg-red-700 active:scale-95 transition-all"><Plus size={16}/> REGISTRAR GASTO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(e => (
          <div key={e.id} className="bg-white rounded-[2rem] border shadow-sm p-6 space-y-4 border-l-[12px] border-red-500 hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 font-mono tracking-widest">{e.id}</p>
                <h4 className="font-black text-slate-800 uppercase text-xs truncate max-w-[150px] leading-tight">{e.reason}</h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase">{e.beneficiary || 'VARIOS'}</p>
              </div>
              <FileDigit className="text-red-100 group-hover:text-red-500 transition-colors" size={24} />
            </div>
            <div className="flex justify-between items-end border-t pt-4 border-slate-50">
               <div><p className="text-[7px] font-black text-slate-300 uppercase">VALOR EGRESO</p><p className="text-xl font-black text-red-600 font-mono">-${e.amount.toFixed(2)}</p></div>
               <button onClick={() => dbService.delete('cash', e.id)} className="p-3 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Eliminar registro de gasto"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.4em] italic border-2 border-dashed rounded-[3rem]">SIN EGRESOS ACTIVOS</p>}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 space-y-8 animate-scale-in my-auto border-t-[16px] border-red-600">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">VALE DE CAJA CHICA</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-red-600 transition-all"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-2 tracking-widest">Monto del Desembolso ($)</label><input type="text" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-5 bg-slate-50 border-2 rounded-2xl font-black text-2xl text-red-600 text-center outline-none focus:border-red-500 shadow-inner" placeholder="0.00" /></div>
              <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-2 tracking-widest">Concepto / Motivo</label><textarea value={formData.reason} onChange={e => setFormData({...formData, reason: toUpper(e.target.value)})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[11px] font-bold min-h-[100px] outline-none focus:border-red-500 shadow-inner" placeholder="DESCRIBA EL GASTO REALIZADO..." /></div>
              <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-2 tracking-widest">Beneficiario (Opcional)</label><input type="text" value={formData.beneficiary} onChange={e => setFormData({...formData, beneficiary: toUpper(e.target.value)})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-500 shadow-inner" placeholder="NOMBRE DE PERSONA O LOCAL" /></div>
            </div>
            <button onClick={handleSave} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
              <Check size={24} strokeWidth={3} /> CONFIRMAR Y REGISTRAR EGRESO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PettyCashModule;