import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Order, CompanyData, UserAccount } from '../types';
import Modal, { ModalType } from '../components/Modal';
// Fix: Added missing imports for ArrowRight and X
import { 
  Edit3, Trash2, Package, Search, Calendar, Clock, FileDigit, Wallet, CheckSquare, Square, FileText, ArrowRight, X
} from 'lucide-react';
import PaymentForm from '../components/PaymentForm';
import DeliveryGuideTemplate from '../components/DeliveryGuideTemplate';

const ConfirmedOrders = ({ onEdit, company, user }: { onEdit: (id: string) => void, company: CompanyData | null, user: UserAccount }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  useEffect(() => {
    return dbService.subscribe((data: any) => {
      const list = (data.orders || []).filter((o: Order) => 
        ['CONFIRMADA', 'PROFORMA', 'EN_PROCESO'].includes(o.status)
      );
      // Regla 2: Orden cronológico por fecha de evento
      setOrders(list.sort((a, b) => a.eventDateStart - b.eventDateStart));
    });
  }, []);

  const handleDispatch = (o: Order) => {
    // Regla 68: Evitar duplicidad en despachos
    if(o.status === 'EN_PROCESO') {
      setModal({ isOpen: true, type: 'info', title: 'ORDEN YA DESPACHADA', message: 'EL PEDIDO YA SE ENCUENTRA EN EL MÓDULO DE DESPACHOS.' });
      return;
    }

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'CONFIRMAR DESPACHO',
      message: `¿PROCEDER CON EL DESPACHO DE LA ORDEN ${o.id}? PASARÁ A ESTADO "EN PROCESO".`,
      onConfirm: async () => {
        await dbService.update('orders', o.id, { status: 'EN_PROCESO' });
        setModal({ isOpen: true, type: 'success', title: 'OPERACIÓN EXITOSA', message: 'ORDEN ENVIADA AL MÓDULO DE DESPACHOS.' });
      }
    });
  };

  const isDispatchAvailable = (startDate: number) => {
    const diff = startDate - Date.now();
    return diff <= (3 * 24 * 60 * 60 * 1000); // Regla 2: 3 días antes
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    setModal({
      isOpen: true,
      type: 'danger',
      title: 'ELIMINACIÓN MASIVA',
      message: `ESTÁ POR ELIMINAR ${selectedIds.length} REGISTROS. ¿CONFIRMA ESTA ACCIÓN?`,
      onConfirm: async () => {
        await dbService.deleteMultiple('orders', selectedIds);
        setSelectedIds([]);
        setModal({ isOpen: true, type: 'success', title: 'COMPLETADO', message: 'ELIMINACIÓN EXITOSA.' });
      }
    });
  };

  const filtered = orders.filter(o => 
    o.clientName.toUpperCase().includes(search.toUpperCase()) || o.id.toUpperCase().includes(search.toUpperCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-24 no-scrollbar">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      {activePaymentOrder && <PaymentForm order={activePaymentOrder} onSaved={() => setActivePaymentOrder(null)} onCancel={() => setActivePaymentOrder(null)} />}
      
      {printingOrder && company && (
        <div className="fixed inset-0 z-[500] bg-white overflow-auto p-10 animate-fade-in print:p-0">
           <div className="max-w-4xl mx-auto">
             <div className="flex justify-end gap-3 mb-10 print:hidden">
               <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] shadow-xl">IMPRIMIR</button>
               <button onClick={() => setPrintingOrder(null)} className="px-8 py-3 bg-slate-100 text-slate-400 rounded-xl font-black uppercase text-[10px]">CERRAR</button>
             </div>
             <DeliveryGuideTemplate 
               order={printingOrder} 
               company={company} 
               client={dbService.getAll('clients').find((c:any) => c.id === printingOrder.clientId)} 
               user={user} 
             />
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">GESTIÓN DE PEDIDOS</h2>
          {selectedIds.length > 0 && <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black">{selectedIds.length} SELECCIONADOS</span>}
        </div>
        <div className="relative w-full md:w-80">
          <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="BUSCAR PEDIDO..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase pr-12 outline-none focus:border-blue-500 shadow-inner" />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(o => (
          <div key={o.id} className={`bg-white rounded-[2rem] border shadow-sm p-5 space-y-4 hover:shadow-lg transition-all relative overflow-hidden group ${selectedIds.includes(o.id) ? 'ring-4 ring-blue-500' : ''}`}>
            {/* Regla 85: Selección múltiple habilitada */}
            <button onClick={() => toggleSelect(o.id)} className="absolute top-3 right-3 z-10 p-2 bg-white/80 rounded-xl border">
              {selectedIds.includes(o.id) ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16} className="text-slate-300"/>}
            </button>
            <div className="flex justify-between items-start pr-8">
              <div className="space-y-1">
                <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${o.status === 'PROFORMA' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{o.status}</span>
                <h4 className="font-black text-slate-800 uppercase text-[10px] leading-tight line-clamp-1">{o.clientName}</h4>
                <p className="text-[8px] font-black text-slate-400 font-mono tracking-widest leading-none">{o.id}</p>
              </div>
              <button onClick={() => setActivePaymentOrder(o)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm hover:bg-emerald-600 hover:text-white transition-all"><Wallet size={16}/></button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-[8px] font-black text-slate-400 uppercase shadow-inner space-y-3">
              <div className="flex flex-col text-[8px] font-black text-slate-400 uppercase">
                <span className="flex items-center gap-1"><Calendar size={10}/> EVENTO (REGLA 66):</span>
                <span className="text-slate-800 mt-1 font-mono tracking-tighter">
                  {new Date(o.eventDateStart).toLocaleDateString()} - {new Date(o.eventDateEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1" title="Egreso de Bodega"><FileDigit size={10}/> EB N° (OPCIONAL)</label>
                <input type="text" value={o.ebNumber || ''} placeholder="0000" onChange={e => dbService.update('orders', o.id, { ebNumber: e.target.value.replace(/\D/g,'') })} className="w-full p-2 bg-white border rounded-xl text-center font-black text-xs text-blue-600 outline-none shadow-sm" />
              </div>
            </div>

            {/* Regla 86: Botones siempre visibles */}
            <div className="grid grid-cols-3 gap-2 action-button-container">
                <button onClick={() => onEdit(o.id)} className="p-3 bg-slate-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={14}/></button>
                <button onClick={() => setPrintingOrder(o)} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><FileText size={14}/></button>
                <button onClick={() => {
                  setModal({ isOpen: true, type: 'danger', title: 'ANULAR PEDIDO', message: 'ESTA ACCIÓN MARCARÁ EL PEDIDO COMO ANULADO. ¿PROCEDER?', onConfirm: () => dbService.update('orders', o.id, { status: 'ANULADO' }) });
                }} className="p-3 bg-slate-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={14}/></button>
            </div>

            {o.status === 'PROFORMA' ? (
              <button onClick={() => dbService.update('orders', o.id, { status: 'CONFIRMADA' })} className="w-full py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">CONFIRMAR VENTA <ArrowRight size={14}/></button>
            ) : (
              isDispatchAvailable(o.eventDateStart) ? (
                <button onClick={() => handleDispatch(o)} className="w-full py-3 shimmer-bg text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 animate-pulse" title="Iniciar proceso de despacho"><Package size={14}/> DESPACHAR ORDEN</button>
              ) : (
                <div className="w-full py-3 bg-slate-50 text-slate-300 rounded-xl font-black uppercase text-[8px] flex items-center justify-center gap-2 border-2 border-dashed"><Clock size={12}/> DISPONIBLE PRÓXIMAMENTE</div>
              )
            )}
          </div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-8 animate-scale-in z-[200]">
           <p className="text-[10px] font-black uppercase tracking-widest">{selectedIds.length} SELECCIONADOS</p>
           <button onClick={handleBulkDelete} className="bg-red-600 px-6 py-2 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg active:scale-95"><Trash2 size={16}/> ELIMINAR</button>
           <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
      )}
    </div>
  );
};

export default ConfirmedOrders;