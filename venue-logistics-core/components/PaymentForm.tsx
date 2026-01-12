
import React, { useState } from 'react';
import { dbService } from '../firebaseService';
import { Order, PaymentRecord, CashTransaction } from '../types';
import { Check, X, Wallet, CreditCard, Landmark, FileText, Printer, Calculator, Banknote } from 'lucide-react';

interface PaymentFormProps {
  order: Order;
  onSaved: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ order, onSaved, onCancel }) => {
  const toUpper = (val: string) => (val || '').toUpperCase();
  const [payType, setPayType] = useState<'TOTAL' | 'PARCIAL' | 'CREDITO'>('TOTAL');
  const [method, setMethod] = useState<'EFECTIVO' | 'CHEQUE' | 'TRANSFERENCIA' | 'DEPOSITO'>('EFECTIVO');
  const [receivedStr, setReceivedStr] = useState<string>(''); 
  const [bankTarget, setBankTarget] = useState<'BANCO_AUSTRO' | 'BANCO_GUAYAQUIL'>('BANCO_AUSTRO');
  const [checkDetails, setCheckDetails] = useState({ clientName: order.clientName, issuingBank: '', checkNumber: '', accountNumber: '', observations: '' });

  const pending = order.total - (order.paidAmount || 0);
  const received = payType === 'CREDITO' ? 0 : (parseFloat(receivedStr.replace(',', '.')) || 0);
  const applied = payType === 'TOTAL' ? pending : Math.min(received, pending);
  const vuelto = (payType === 'TOTAL' || payType === 'PARCIAL') ? Math.max(0, received - applied) : 0;
  const finalSaldo = Math.max(0, pending - applied);

  const handleSave = async () => {
    if (payType !== 'CREDITO' && received <= 0 && receivedStr !== '') {
      alert("VALOR INVÁLIDO."); return;
    }
    
    const paymentId = await dbService.generateSequentialId('RC');
    // Fixed: Corrected property mappings for PaymentRecord interface (vuelto -> change, bankTarget -> bank, etc)
    const record: PaymentRecord = {
      id: paymentId, 
      date: Date.now(), 
      amount: applied, 
      received, 
      change: vuelto, 
      type: payType === 'TOTAL' ? 'CONTADO' : (payType === 'PARCIAL' ? 'PARCIAL' : 'CREDITO'),
      method: payType === 'CREDITO' ? 'CREDITO_TOTAL' as any : method,
      user: 'SISTEMA',
      ...(method === 'TRANSFERENCIA' || method === 'DEPOSITO' ? { bank: bankTarget } : {}),
      ...(method === 'CHEQUE' ? { 
        checkInfo: {
          client: checkDetails.clientName,
          bank: checkDetails.issuingBank,
          number: checkDetails.checkNumber,
          account: checkDetails.accountNumber,
          obs: checkDetails.observations
        } 
      } : {})
    };

    await dbService.update('orders', order.id, {
      paidAmount: (order.paidAmount || 0) + applied,
      payments: [...(order.payments || []), record]
    });

    if (applied > 0 && payType !== 'CREDITO') {
      // Fixed: Corrected property mapping for CashTransaction interface (vuelto -> change)
      const cashEntry: CashTransaction = {
        id: paymentId, 
        orderId: order.id, 
        amount: applied, 
        change: vuelto, 
        type: 'INCOME', 
        category: 'VENTA', 
        method, 
        date: Date.now(), 
        user: 'SISTEMA'
      };
      await dbService.add('cash', cashEntry);
    }

    alert(`COBRO EXITOSO. SALDO PENDIENTE: $${finalSaldo.toFixed(2)}`);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl p-10 space-y-8 animate-scale-in border-t-[12px] border-emerald-500">
        <div className="flex justify-between items-center border-b pb-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">GESTIÓN DE COBROS</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">ORDEN: {order.id} | SALDO: ${pending.toFixed(2)}</p>
          </div>
          <button onClick={onCancel} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border">
          <button onClick={() => setPayType('TOTAL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${payType === 'TOTAL' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>PAGO TOTAL</button>
          <button onClick={() => setPayType('PARCIAL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${payType === 'PARCIAL' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>ABONO PARCIAL</button>
          <button onClick={() => setPayType('CREDITO')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${payType === 'CREDITO' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400'}`}>A CRÉDITO</button>
        </div>

        {payType !== 'CREDITO' && (
          <div className="grid grid-cols-4 gap-4">
            {[{id:'EFECTIVO',icon:<Wallet size={18}/>},{id:'CHEQUE',icon:<FileText size={18}/>},{id:'TRANSFERENCIA',icon:<Landmark size={18}/>},{id:'DEPOSITO',icon:<CreditCard size={18}/>}].map(m => (
              <button key={m.id} onClick={() => setMethod(m.id as any)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === m.id ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                {m.icon}<span className="text-[8px] font-black uppercase">{m.id}</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {payType !== 'CREDITO' && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">MONTO RECIBIDO ($)</label>
                <div className="relative">
                  <input type="text" value={receivedStr} onChange={e => setReceivedStr(e.target.value)} className="w-full p-6 bg-slate-50 border-2 rounded-2xl font-black text-4xl text-emerald-600 text-center outline-none focus:border-emerald-500" placeholder="0.00" />
                  <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                </div>
              </div>
            )}
            <div className="space-y-3">
              {vuelto > 0 && <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex justify-between items-center text-blue-700 font-black"><span>VUELTO:</span><span className="text-xl">${vuelto.toFixed(2)}</span></div>}
              <div className={`p-4 rounded-2xl flex justify-between items-center font-black ${finalSaldo > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'}`}><span>SALDO FINAL:</span><span className="text-xl">${finalSaldo.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
            {payType === 'CREDITO' ? (
              <div className="text-center space-y-4"><Banknote size={56} className="mx-auto text-amber-300" /><p className="text-[10px] font-black text-amber-700 uppercase leading-relaxed">ESTA VENTA PASARÁ AL SUBMÓDULO DE CARTERA.</p></div>
            ) : method === 'CHEQUE' ? (
              <div className="space-y-3">
                <input placeholder="BANCO" value={checkDetails.issuingBank} onChange={e => setCheckDetails({...checkDetails, issuingBank: toUpper(e.target.value)})} className="w-full p-3 bg-white border rounded-xl text-[10px] font-black uppercase" />
                <input placeholder="# CHEQUE" value={checkDetails.checkNumber} onChange={e => setCheckDetails({...checkDetails, checkNumber: e.target.value})} className="w-full p-3 bg-white border rounded-xl text-[10px] font-black" />
                <textarea placeholder="OBSERVACIONES" value={checkDetails.observations} onChange={e => setCheckDetails({...checkDetails, observations: toUpper(e.target.value)})} className="w-full p-3 bg-white border rounded-xl text-[10px] font-bold min-h-[60px]" />
              </div>
            ) : (
              <div className="text-center space-y-4"><Printer size={56} className="mx-auto text-slate-200" /><p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed">SE GENERARÁ UN TICKET DE COBRO RC.</p></div>
            )}
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-6 shimmer-bg text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
          <Check size={20}/> CONFIRMAR OPERACIÓN
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;
