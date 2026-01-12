import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Order } from '../types';
import { Truck, Package, MapPin, CheckCircle2, Search, Navigation, Edit3, AlertTriangle } from 'lucide-react';
import Modal, { ModalType } from '../components/Modal';

const DispatchModule = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const [novedadFlow, setNovedadFlow] = useState<{ isOpen: boolean, order: Order | null, state: any, status: any }>({
    isOpen: false, order: null, state: null, status: null
  });

  useEffect(() => {
    return dbService.subscribe((data: any) => {
      const list = (data.orders || []).filter((o: Order) => o.status === 'EN_PROCESO');
      setOrders(list);
    });
  }, []);

  const openStatusUpdate = (o: Order, state: any, status: any) => {
    setNovedadFlow({ isOpen: true, order: o, state, status });
  };

  const handleStatusUpdate = async (obs: string) => {
    const { order, state, status } = novedadFlow;
    if (!order) return;

    await dbService.update('orders', order.id, { 
      dispatchState: state, 
      status: status,
      nuisances: obs.toUpperCase() || ""
    });
    setNovedadFlow({ isOpen: false, order: null, state: null, status: null });
    setModal({ isOpen: true, type: 'success', title: 'LOGÍSTICA ACTUALIZADA', message: 'ESTADO DE ENTREGA ACTUALIZADO CORRECTAMENTE.' });
  };

  const filtered = orders.filter(o => 
    o.clientName.toUpperCase().includes(search.toUpperCase()) || o.id.toUpperCase().includes(search.toUpperCase())
  );

  const withTransport = filtered.filter(o => o.logisticsType === 'CON_TRANSPORTE');
  const withoutTransport = filtered.filter(o => o.logisticsType === 'SIN_TRANSPORTE');

  const DispatchCard: React.FC<{ o: Order }> = ({ o }) => (
    <div className="bg-white rounded-[2rem] border shadow-sm p-6 space-y-4 hover:shadow-md transition-all group border-l-8 border-blue-500">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-blue-600 font-mono leading-none">{o.id}</p>
          <h4 className="font-black text-slate-800 uppercase text-xs truncate max-w-[140px] mt-1">{o.clientName}</h4>
        </div>
        <div className="flex gap-1 action-button-container">
          <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-colors" title="EDITAR NOVEDADES"><Edit3 size={16}/></button>
          <div className="p-2 bg-slate-50 text-slate-300 rounded-xl">
            {o.logisticsType === 'CON_TRANSPORTE' ? <Truck size={16}/> : <Package size={16}/>}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 text-[9px] font-bold text-slate-500 space-y-2 shadow-inner">
        <div className="flex gap-2 items-start"><MapPin size={12} className="shrink-0 mt-0.5 text-red-400" /> <span className="uppercase">{o.deliveryAddress || 'RETIRO EN BODEGA'}</span></div>
        {o.nuisances && <div className="flex gap-2 items-start text-amber-600"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> <span className="uppercase italic">"{o.nuisances}"</span></div>}
      </div>

      <div className="pt-2 flex flex-col gap-2 action-button-container">
        {o.logisticsType === 'CON_TRANSPORTE' ? (
          <>
            <button 
              onClick={() => openStatusUpdate(o, 'CARGADO', 'EN_PROCESO')}
              className={`w-full py-3 rounded-xl font-black uppercase text-[9px] border-2 transition-all ${o.dispatchState === 'CARGADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-300'}`}
            >
              {o.dispatchState === 'CARGADO' ? '✓ CARGADO' : 'CARGADO'}
            </button>
            <button 
              disabled={o.dispatchState !== 'CARGADO'}
              onClick={() => openStatusUpdate(o, 'ENTREGADO_DOMICILIO', 'ENTREGADO')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] shadow-lg disabled:opacity-30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Navigation size={14}/> ENTREGADO EN DOMICILIO
            </button>
          </>
        ) : (
          <button 
            onClick={() => openStatusUpdate(o, 'ENTREGADO_BODEGA', 'ENTREGADO')}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl"
          >
            <CheckCircle2 size={16}/> ENTREGADO EN BODEGA
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 no-scrollbar relative">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />
      
      {novedadFlow.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-10 space-y-6 animate-scale-in border-t-[12px] border-blue-600">
              <div className="text-center">
                 <h3 className="text-xl font-black uppercase text-slate-800 tracking-tighter">ANOTAR NOVEDAD</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">OPCIONAL AL MOMENTO DE ENTREGA</p>
              </div>
              <textarea id="logNuisance" className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-bold min-h-[100px] outline-none uppercase shadow-inner" placeholder="DETALLES DE LA ENTREGA..." />
              <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => handleStatusUpdate((document.getElementById('logNuisance') as HTMLTextAreaElement).value)} className="w-full py-5 shimmer-bg text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">CONFIRMAR ESTADO</button>
                 <button onClick={() => setNovedadFlow({ ...novedadFlow, isOpen: false })} className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-black uppercase text-[9px]">OMITIR / CANCELAR</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">RUTAS DE DESPACHO</h2>
        <div className="relative w-full md:w-64">
          <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="BUSCAR..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase pr-12 outline-none shadow-inner" />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-blue-600 pb-3">
            <h3 className="text-[12px] font-black uppercase text-slate-600 tracking-widest">CON TRANSPORTE ({withTransport.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {withTransport.map(o => <DispatchCard key={o.id} o={o} />)}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-slate-900 pb-3">
            <h3 className="text-[12px] font-black uppercase text-slate-600 tracking-widest">RETIRO EN LOCAL ({withoutTransport.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {withoutTransport.map(o => <DispatchCard key={o.id} o={o} />)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DispatchModule;