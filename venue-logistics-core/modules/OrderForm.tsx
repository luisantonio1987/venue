import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Client, Product, OrderItem, Order, UserAccount, CompanyData } from '../types';
import { 
  X, Check, ShoppingCart, Tag, Truck, Receipt, UserPlus, Trash2, CalendarDays
} from 'lucide-react';
import Modal, { ModalType } from '../components/Modal';
import PaymentForm from '../components/PaymentForm';

interface OrderFormProps {
  editOrderId?: string;
  onSaved: () => void;
  onCancel: () => void;
  company: CompanyData | null;
  user: UserAccount;
}

const OrderForm: React.FC<OrderFormProps> = ({ editOrderId, onSaved, onCancel, company, user }) => {
  const [activeTab, setActiveTab] = useState<'SALE' | 'PROFORMA'>('SALE');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchClient, setSearchClient] = useState('');
  const [isClientListOpen, setIsClientListOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [savedOrderRef, setSavedOrderRef] = useState<Order | null>(null);

  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void; onCancelAction?: () => void; confirmLabel?: string; cancelLabel?: string }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const [dates, setDates] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  
  const [hasTransport, setHasTransport] = useState(false);
  const [transportValue, setTransportValue] = useState<string>(''); 
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'NOMINAL'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>(''); 
  const [applyTax, setApplyTax] = useState(false);

  useEffect(() => {
    setClients(dbService.getAll('clients'));
    setProducts(dbService.getAll('products'));
    
    if (editOrderId) {
      const orders = dbService.getAll('orders');
      const o = orders.find((x: Order) => x.id === editOrderId);
      if (o) {
        setActiveTab(o.status === 'PROFORMA' ? 'PROFORMA' : 'SALE');
        const c = dbService.getAll('clients').find((client: Client) => client.id === o.clientId);
        setSelectedClient(c || null);
        setItems(o.items || []);
        setDates({
          start: new Date(o.eventDateStart).toISOString().split('T')[0],
          end: new Date(o.eventDateEnd).toISOString().split('T')[0]
        });
        setHasTransport(o.hasTransport);
        setTransportValue(o.transportValue > 0 ? o.transportValue.toString() : '');
        setDeliveryAddress(o.deliveryAddress || '');
        setDiscountType(o.discountType);
        setDiscountValue(o.discountValue > 0 ? o.discountValue.toString() : '');
        setApplyTax(o.tax > 0);
      }
    }
  }, [editOrderId]);

  const toUpper = (val: string) => (val || '').toUpperCase();
  const parseNum = (val: string) => {
    if (!val || val === '' || val === '0') return 0;
    return parseFloat(val.toString().replace(',', '.')) || 0;
  };

  const rentalDays = (() => {
    const s = new Date(dates.start);
    const e = new Date(dates.end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (86400000)) + 1;
    return diff > 0 ? diff : 1;
  })();

  const subtotalBrutoItems = items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * rentalDays;
  
  // Regla 1: Descuento excluye transporte y saloneros
  const discountableSubtotal = items.filter(i => 
    !toUpper(i.name).includes('TRANSPORTE') && !toUpper(i.name).includes('SALONERO')
  ).reduce((sum, i) => sum + (i.price * i.quantity), 0) * rentalDays;

  const dVal = parseNum(discountValue);
  const discountAmount = discountType === 'PERCENTAGE' ? (discountableSubtotal * (dVal / 100)) : dVal;
  
  const baseImponible = Math.max(0, subtotalBrutoItems - discountAmount);
  const tax = applyTax ? (baseImponible * 0.15) : 0;
  const tVal = parseNum(transportValue);
  const finalTotal = baseImponible + tax + tVal;

  const handleAddItem = (p: Product) => {
    const existing = items.find(i => i.productId === p.id);
    if (existing) {
      setItems(items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { productId: p.id, code: p.code, name: p.name, quantity: 1, price: p.rentalPrice }]);
    }
  };

  const processSave = async () => {
    if (!selectedClient || items.length === 0) {
      setModal({ isOpen: true, type: 'warning', title: 'DATOS FALTANTES', message: 'VINCULE UN CLIENTE Y AGREGUE ARTÍCULOS PARA CONTINUAR.' });
      return;
    }
    
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'CONFIRMAR OPERACIÓN',
      message: `ESTÁ POR REGISTRAR UNA ${activeTab === 'SALE' ? 'VENTA DIRECTA' : 'PROFORMA'} POR $${finalTotal.toFixed(2)}. ¿CONFIRMA?`,
      onConfirm: async () => {
        const prefix = activeTab === 'PROFORMA' ? 'PR' : 'VE';
        const seqId = editOrderId || await dbService.generateSequentialId(prefix);
        const orderData: Order = {
          id: seqId, 
          clientId: selectedClient.id, 
          clientName: selectedClient.name,
          status: activeTab === 'PROFORMA' ? 'PROFORMA' : 'CONFIRMADA',
          orderDate: Date.now(), 
          eventDateStart: new Date(dates.start).getTime(),
          eventDateEnd: new Date(dates.end).getTime(), 
          rentalDays, 
          items, 
          hasTransport,
          transportValue: tVal, 
          deliveryAddress: toUpper(deliveryAddress), 
          discountType,
          discountValue: dVal, 
          subtotal: subtotalBrutoItems, 
          tax, 
          total: finalTotal,
          paidAmount: 0, 
          logisticsType: hasTransport ? 'CON_TRANSPORTE' : 'SIN_TRANSPORTE',
          payments: [], 
          createdBy: user.name
        };

        if (editOrderId) {
            await dbService.update('orders', editOrderId, orderData);
            onSaved();
        } else {
            await dbService.add('orders', orderData);
            setSavedOrderRef(orderData);
            await dbService.sendNotification("Pedido Registrado", `${activeTab}: ${seqId} para ${selectedClient.name}`, "ORDER");

            setModal({
                isOpen: true, 
                type: 'persuade', 
                title: 'REGISTRO EXITOSO',
                message: 'EL DOCUMENTO HA SIDO GUARDADO. ¿DESEA PROCEDER AL COBRO O SERÁ UNA VENTA A CRÉDITO?',
                onConfirm: () => setShowPayment(true),
                onCancelAction: () => onSaved(),
                confirmLabel: 'REGISTRAR PAGO', 
                cancelLabel: 'A CRÉDITO'
            });
        }
      }
    });
  };

  if (showPayment && savedOrderRef) return <PaymentForm order={savedOrderRef} onSaved={onSaved} onCancel={onSaved} />;

  return (
    <div className="space-y-6 animate-fade-in pb-20 no-scrollbar overflow-x-hidden">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancelAction} confirmLabel={modal.confirmLabel} cancelLabel={modal.cancelLabel} onClose={() => setModal(p => ({...p, isOpen: false}))} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-[2.5rem] border shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onCancel} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={20}/></button>
          <div className="flex bg-slate-100 p-1 rounded-2xl border shadow-inner flex-1 md:flex-initial">
            {/* Regla 1: Pulsación latente en pestaña activa */}
            <button 
              onClick={() => setActiveTab('SALE')} 
              className={`flex-1 md:flex-none px-12 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'SALE' ? 'bg-white text-blue-600 shadow-md animate-pulse-latent' : 'text-slate-400'}`}
            >
              VENTAS
            </button>
            <button 
              onClick={() => setActiveTab('PROFORMA')} 
              className={`flex-1 md:flex-none px-12 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'PROFORMA' ? 'bg-white text-amber-600 shadow-md animate-pulse-latent' : 'text-slate-400'}`}
            >
              PROFORMAS
            </button>
          </div>
        </div>
        <button onClick={processSave} className="w-full md:w-auto px-10 py-4 shimmer-bg text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
          <Check size={18}/> FINALIZAR {activeTab === 'SALE' ? 'VENTA' : 'PROFORMA'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">CLIENTE SOLICITANTE</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="text" value={selectedClient ? selectedClient.name : searchClient} onChange={e => { setSearchClient(toUpper(e.target.value)); setSelectedClient(null); setIsClientListOpen(true); }} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs uppercase outline-none focus:border-blue-500 shadow-inner" placeholder="BUSCAR CLIENTE..." />
                    {isClientListOpen && !selectedClient && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto no-scrollbar">
                        {clients.filter(c => c.name.toUpperCase().includes(searchClient.toUpperCase())).map(c => (
                          <button key={c.id} onClick={() => { setSelectedClient(c); setIsClientListOpen(false); }} className="w-full text-left p-4 hover:bg-blue-50 font-black uppercase text-[10px] border-b last:border-0">{c.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="p-4 bg-blue-50 text-blue-600 rounded-2xl border-2 border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><UserPlus size={20}/></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">FECHA INICIO</label><input type="date" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black text-xs outline-none focus:border-blue-500 shadow-inner" /></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">FECHA RETORNO</label><input type="date" value={dates.end} min={dates.start} onChange={e => setDates({...dates, end: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black text-xs outline-none focus:border-blue-500 shadow-inner" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3"><ShoppingCart size={18} className="text-blue-600"/> DETALLE DE MENAJE Y SERVICIOS</h3>
                <span className="bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter">{rentalDays} DÍA(S) ALQUILER</span>
              </div>
              <select onChange={e => { const p = products.find(x => x.id === e.target.value); if(p) handleAddItem(p); e.target.value = ""; }} className="w-full p-5 bg-slate-900 text-white rounded-3xl font-black text-sm shadow-xl cursor-pointer hover:bg-black transition-all">
                <option value="">＋ AÑADIR ARTÍCULO AL DETALLE...</option>
                {products.map(p => <option key={p.id} value={p.id} className="bg-white text-slate-800 uppercase">{p.name} - ${p.rentalPrice.toFixed(2)}</option>)}
              </select>
              <div className="border rounded-[2.5rem] overflow-hidden bg-white shadow-inner overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">ARTÍCULO</th>
                      <th className="px-4 py-5 text-center">CANT.</th>
                      <th className="px-4 py-5 text-center">PRECIO ($)</th>
                      <th className="px-8 py-5 text-right">SUBTOTAL</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[10px] font-bold uppercase">
                    {items.map(item => (
                      <tr key={item.productId} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-8 py-5 text-slate-800">{item.name}</td>
                        <td className="px-4 py-5 text-center">
                          <input type="text" value={item.quantity === 0 ? '' : item.quantity} onChange={e => setItems(items.map(i => i.productId === item.productId ? {...i, quantity: parseInt(e.target.value.replace(/\D/g,'')) || 0} : i))} className="w-14 p-2 bg-slate-50 border-2 rounded-xl text-center font-black" />
                        </td>
                        <td className="px-4 py-5 text-center">
                          <input type="text" value={item.price === 0 ? '' : item.price} onChange={e => setItems(items.map(i => i.productId === item.productId ? {...i, price: parseNum(e.target.value)} : i))} className="w-20 p-2 bg-slate-50 border-2 rounded-xl text-center font-black text-blue-600" />
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900">${(item.price * item.quantity * rentalDays).toFixed(2)}</td>
                        <td className="px-4 py-5 text-center"><button onClick={() => setItems(items.filter(i => i.productId !== item.productId))} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6 sticky top-24 max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col">
            <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-[0.2em] flex items-center gap-3 border-b pb-5 shrink-0"><Receipt size={20} className="text-blue-600"/> LIQUIDACIÓN FINANCIERA</h3>
            <div className="space-y-4 flex-1">
              <div className={`p-5 rounded-[2rem] border-2 transition-all ${hasTransport ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-slate-50 border-transparent opacity-60'}`}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${hasTransport ? 'bg-blue-600 border-blue-600 shadow-md' : 'bg-white border-slate-300'}`}>
                    {hasTransport && <Check size={14} className="text-white" strokeWidth={3}/>}
                    <input type="checkbox" checked={hasTransport} onChange={e => setHasTransport(e.target.checked)} className="hidden" />
                  </div>
                  <span className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-2"><Truck size={16}/> TRANSPORTE (0% IVA)</span>
                </label>
                {hasTransport && (
                  <div className="mt-5 space-y-4 animate-scale-in">
                    <input type="text" value={transportValue} onChange={e => setTransportValue(e.target.value)} placeholder="VALOR TRANSPORTE" className="w-full p-4 bg-white border-2 rounded-2xl font-black text-xs text-blue-700 outline-none shadow-inner" />
                    <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(toUpper(e.target.value))} placeholder="DIRECCIÓN DE ENTREGA..." className="w-full p-4 bg-white border-2 rounded-2xl text-[10px] font-bold min-h-[100px] outline-none shadow-inner" />
                  </div>
                )}
              </div>
              <div className={`p-5 rounded-[2rem] border-2 transition-all ${parseNum(discountValue) > 0 ? 'bg-amber-50 border-amber-200 shadow-inner' : 'bg-slate-50 border-transparent opacity-60'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] font-black text-amber-800 uppercase flex items-center gap-2" title="EXCLUYE TRANSPORTE Y SERVICIO DE SALONEROS"><Tag size={16}/> DESCUENTO</span>
                  <div className="flex bg-white rounded-xl p-1 border shadow-sm">
                    <button onClick={() => setDiscountType('PERCENTAGE')} className={`px-3 py-1 rounded-lg text-[10px] font-black ${discountType === 'PERCENTAGE' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-600'}`}>%</button>
                    <button onClick={() => setDiscountType('NOMINAL')} className={`px-3 py-1 rounded-lg text-[10px] font-black ${discountType === 'NOMINAL' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-600'}`}>$</button>
                  </div>
                </div>
                <input type="text" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="0.00" className="w-full p-4 bg-white border-2 rounded-2xl font-black text-xs text-amber-800 outline-none shadow-inner" />
              </div>
              <div className={`p-5 rounded-[2rem] border-2 transition-all flex items-center gap-4 ${applyTax ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-transparent'}`}>
                <div onClick={() => setApplyTax(!applyTax)} className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${applyTax ? 'bg-indigo-600 shadow-inner' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${applyTax ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-[11px] font-black uppercase text-indigo-800">GRAVAR IVA 15%</span>
              </div>
            </div>
            <div className="pt-8 border-t-4 border-dashed border-slate-100 space-y-4 shrink-0">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>SUBTOTAL BRUTO</span><span>${subtotalBrutoItems.toFixed(2)}</span></div>
              <div className="flex justify-between text-[10px] font-black text-amber-600 uppercase tracking-widest"><span>DESCUENTO</span><span>-${discountAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase tracking-widest"><span>IVA 15%</span><span>+${tax.toFixed(2)}</span></div>
              <div className="pt-8 border-t-8 border-slate-900 mt-6 relative overflow-hidden rounded-3xl shadow-lg">
                <div className="absolute inset-0 shimmer-bg opacity-10"></div>
                <div className="flex justify-between items-end relative z-10 px-2 pb-2">
                  <div className="pb-1"><span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">TOTAL</span><p className="text-[9px] font-black text-blue-600 uppercase tracking-widest animate-pulse">LIQUIDADO</p></div>
                  <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none font-mono">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;