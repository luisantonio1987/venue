
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Trash2, Save, MapPin, ChevronLeft, 
  Percent, DollarSign, ReceiptText, UserPlus, X, Check, ShoppingCart, Box, Edit3, CalendarDays
} from 'lucide-react';
import { Client, Product, OrderItem, Order } from '../types';
import { dbService } from '../firebaseService';
import { TAX_RATE } from '../constants';
import Modal, { ModalType } from './Modal';

interface OrderFormProps {
  initialType: 'ORDER' | 'PROFORMA';
  editOrderId?: string;
  onSaved: () => void;
  onCancel?: () => void;
}

const EVENT_TYPES = [
  "Boda", "15 Años", "Bautizo", "Aniversario", 
  "Primera Comunión", "Agasajo", "Inauguración", "Otro"
];

const OrderForm: React.FC<OrderFormProps> = ({ initialType, editOrderId, onSaved, onCancel }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientListOpen, setIsClientListOpen] = useState(false);
  
  const [hasTransport, setHasTransport] = useState(false);
  const [transportValue, setTransportValue] = useState<string>('0');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [hasInvoice, setHasInvoice] = useState(false);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [eventType, setEventType] = useState<string>('Boda');
  const [dates, setDates] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  const [isExpressClientOpen, setIsExpressClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', cedula: '', phone: '', address: '' });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    const allClients = dbService.getAll('clients') as Client[];
    setClients(allClients);
    setProducts(dbService.getAll('products') as Product[]);

    if (editOrderId) {
      const order = dbService.getAll('orders').find((o: Order) => o.id === editOrderId);
      if (order) {
        setSelectedClient(allClients.find((c: Client) => c.id === order.clientId) || null);
        setItems(order.items || []);
        setHasTransport(order.hasTransport);
        setTransportValue(order.transportValue.toString());
        setDeliveryAddress(order.deliveryAddress || '');
        setHasInvoice(order.hasInvoice);
        setDiscountType(order.discountType);
        setDiscountValue(order.discountValue.toString());
        setEventType(order.eventType || 'Boda');
        setDates({ 
          start: new Date(order.eventDateStart).toISOString().split('T')[0], 
          end: new Date(order.eventDateEnd).toISOString().split('T')[0] 
        });
      }
    }
  }, [editOrderId]);

  const resetForm = () => {
    setItems([]);
    setClientSearch('');
    setSelectedClient(null);
    setIsClientListOpen(false); // CERRAMOS EL FILTRO SIEMPRE AL REINICIAR
    setHasTransport(false);
    setTransportValue('0');
    setDeliveryAddress('');
    setHasInvoice(false);
    setDiscountValue('0');
    setDates({ 
      start: new Date().toISOString().split('T')[0], 
      end: new Date().toISOString().split('T')[0] 
    });
    setEventType('Boda');
  };

  const handleSaveExpressClient = async () => {
    if (!newClient.name || !newClient.cedula || !newClient.phone || !newClient.address) { 
      alert("Por favor complete los campos obligatorios del cliente."); 
      return; 
    }
    const saved = await dbService.add('clients', { ...newClient, email: '', createdAt: Date.now() });
    const allClients = dbService.getAll('clients') as Client[];
    setClients(allClients);
    setSelectedClient(saved as Client);
    setIsExpressClientOpen(false);
    setIsClientListOpen(false); // ASEGURAR QUE SE CIERRE AL SELECCIONAR EXPRESS
    setNewClient({ name: '', cedula: '', phone: '', address: '' });
  };

  const parseDecimal = (val: string): number => {
    const sanitized = val.toString().replace(',', '.');
    return parseFloat(sanitized) || 0;
  };

  const rentalDays = (() => {
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  })();

  const addItem = (p: Product) => {
    const existing = items.find(i => i.productId === p.id);
    if (existing) {
      setItems(items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { productId: p.id, name: p.name, quantity: 1, price: p.rentalPrice }]);
    }
  };

  const updateItem = (productId: string, field: 'quantity' | 'price', value: string) => {
    setItems(items.map(item => item.productId === productId ? { 
      ...item, 
      [field]: field === 'quantity' ? (parseInt(value) || 0) : parseDecimal(value)
    } : item));
  };

  const subtotalBase = items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * rentalDays;
  const numDiscountValue = parseDecimal(discountValue);
  const discountAmount = discountType === 'PERCENTAGE' ? (subtotalBase * (numDiscountValue / 100)) : numDiscountValue;
  const subtotalWithDiscount = Math.max(0, subtotalBase - discountAmount);
  const taxAmount = hasInvoice ? (subtotalWithDiscount * TAX_RATE) : 0;
  const numTransportValue = hasTransport ? parseDecimal(transportValue) : 0;
  const totalGeneral = subtotalWithDiscount + taxAmount + numTransportValue;

  const handleFinalSave = () => {
    if (!selectedClient || items.length === 0) {
      setModalConfig({ isOpen: true, type: 'warning', title: 'Faltan Datos', message: 'Cliente y Artículos son obligatorios.' });
      return;
    }

    setModalConfig({
      isOpen: true, type: 'confirm', title: editOrderId ? 'Actualizar Registro' : 'Confirmar Venta',
      message: `¿Desea registrar esta venta por un total de $${totalGeneral.toFixed(2)}?`,
      confirmLabel: editOrderId ? 'Actualizar' : 'Registrar Venta',
      onConfirm: async () => {
        const orderData = {
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          status: editOrderId ? undefined : (initialType === 'PROFORMA' ? 'PROFORMA' : 'CONFIRMADA'),
          orderDate: Date.now(),
          eventDateStart: new Date(dates.start).getTime(),
          eventDateEnd: new Date(dates.end).getTime(),
          eventType,
          items,
          hasTransport,
          transportValue: numTransportValue,
          deliveryAddress: hasTransport ? deliveryAddress : '',
          hasInvoice,
          discountType,
          discountValue: numDiscountValue,
          subtotal: subtotalBase,
          tax: taxAmount,
          total: totalGeneral,
          isConfirmed: initialType === 'ORDER'
        };

        try {
          if (editOrderId) {
            await dbService.update('orders', editOrderId, orderData);
            setModalConfig({ isOpen: true, type: 'success', title: 'Actualizado', message: 'La información se actualizó correctamente.', onConfirm: onSaved });
          } else {
            await dbService.add('orders', { ...orderData, paidAmount: 0 });
            resetForm(); // LIMPIA TODO, INCLUYENDO DROPDOWNS
            setModalConfig({ isOpen: true, type: 'success', title: '¡Venta Registrada!', message: 'El formulario se ha limpiado para una nueva entrada.' });
          }
        } catch (e) {
          setModalConfig({ isOpen: true, type: 'warning', title: 'Error', message: 'No se pudo procesar la transacción.' });
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Modal isOpen={modalConfig.isOpen} type={modalConfig.type} title={modalConfig.title} message={modalConfig.message} confirmLabel={modalConfig.confirmLabel} onConfirm={modalConfig.onConfirm} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />

      {isExpressClientOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Registro Express de Cliente</h3>
              <button onClick={() => setIsExpressClientOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Nombre / Razón Social" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500 shadow-sm" />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="ID / RUC" value={newClient.cedula} onChange={e => setNewClient({...newClient, cedula: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-mono font-black outline-none focus:border-blue-500" />
                <input placeholder="Teléfono" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-500" />
              </div>
              <textarea placeholder="Dirección Completa" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold min-h-[80px] outline-none focus:border-blue-500" />
            </div>
            <button onClick={handleSaveExpressClient} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">
              <Check size={18} /> Validar y Registrar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onCancel || onSaved} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">
              {editOrderId ? 'Editando Registro' : (initialType === 'ORDER' ? 'Nueva Venta' : 'Nueva Proforma')}
            </h2>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">{editOrderId || 'Documento Electrónico'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={resetForm} className="px-6 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">Limpiar Formulario</button>
          <button onClick={handleFinalSave} className="shimmer-bg text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
            {editOrderId ? <Edit3 size={18} /> : <ShoppingCart size={18} />} {editOrderId ? 'Actualizar Registro' : 'Registrar Venta'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente Solicitante</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="text" placeholder="Buscar cliente existente..." className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold uppercase" value={selectedClient ? selectedClient.name : clientSearch} onChange={(e) => { setClientSearch(e.target.value); setSelectedClient(null); setIsClientListOpen(true); }} onFocus={() => setIsClientListOpen(true)} />
                    {isClientListOpen && !selectedClient && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-2xl shadow-2xl z-50 max-h-40 overflow-y-auto no-scrollbar">
                        {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                          <button key={c.id} onClick={() => { setSelectedClient(c); setIsClientListOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-blue-50 font-black uppercase text-[11px] border-b border-slate-50 last:border-0">{c.name}</button>
                        ))}
                        {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase">Sin resultados</div>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setIsExpressClientOpen(true)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl border-2 border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Registro Express"><UserPlus size={20} /></button>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                <div className="relative">
                   <select 
                    value={eventType} 
                    onChange={(e) => setEventType(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-black uppercase appearance-none focus:border-blue-500 outline-none transition-all shadow-sm"
                   >
                     {EVENT_TYPES.map(type => (
                       <option key={type} value={type}>{type}</option>
                     ))}
                   </select>
                   <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Fecha de Retiro / Inicio</label>
                 <input type="date" value={dates.start} onChange={(e) => setDates({...dates, start: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-black shadow-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Fecha de Retorno / Fin</label>
                 <input type="date" value={dates.end} min={dates.start} onChange={(e) => setDates({...dates, end: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-black shadow-sm" />
               </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detalle de Menaje y Mobiliario</h3>
                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter">{rentalDays} Día(s) de Alquiler</span>
              </div>
              <select className="w-full p-4 bg-slate-900 text-white rounded-2xl outline-none font-black text-sm shadow-xl transition-all active:scale-95" onChange={(e) => { const p = products.find(prod => prod.id === e.target.value); if (p) addItem(p); e.target.value = ""; }} value="">
                <option value="">＋ Añadir Artículo al Pedido...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} className="text-slate-800 bg-white">
                    {p.name} - ${p.rentalPrice.toFixed(2)} {p.brand ? `(${p.brand})` : ''}
                  </option>
                ))}
              </select>
              <div className="border rounded-[2rem] overflow-hidden bg-white shadow-inner">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Artículo</th>
                      <th className="px-4 py-4 text-center">Cant.</th>
                      <th className="px-4 py-4 text-center">Precio Unit.</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map(item => (
                      <tr key={item.productId} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-black uppercase text-slate-800">{item.name}</td>
                        <td className="px-4 py-4">
                          <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.productId, 'quantity', e.target.value)} className="w-20 p-2 bg-slate-50 border rounded-xl text-center font-black text-xs" />
                        </td>
                        <td className="px-4 py-4">
                          <input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(item.productId, 'price', e.target.value)} className="w-24 p-2 bg-slate-50 border rounded-xl text-center font-black text-xs text-blue-600" />
                        </td>
                        <td className="px-6 py-4 text-right font-black text-xs text-slate-800">
                          ${(item.price * item.quantity * rentalDays).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => setItems(items.filter(i => i.productId !== item.productId))} className="text-slate-200 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Seleccione artículos del catálogo para comenzar</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6 sticky top-24">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4">Liquidación de Venta</h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${hasTransport ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-slate-50 border-transparent'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={hasTransport} onChange={e => setHasTransport(e.target.checked)} className="w-5 h-5 rounded-lg text-blue-600 border-slate-300" />
                  <span className={`text-[11px] font-black uppercase ${hasTransport ? 'text-blue-800' : 'text-slate-500'}`}>Logística de Transporte</span>
                  {hasTransport && <input type="number" value={transportValue} onChange={e => setTransportValue(e.target.value)} className="ml-auto w-24 p-2 bg-white border border-blue-200 rounded-xl text-xs font-black text-blue-700 text-center" />}
                </div>
                {hasTransport && (
                  <textarea placeholder="Punto de entrega / Instrucciones..." value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="w-full p-3 bg-white border border-blue-100 rounded-xl text-[10px] font-bold min-h-[60px] outline-none shadow-sm" />
                )}
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Descuento Especial</span>
                  <div className="flex gap-1 bg-white p-1 rounded-lg shadow-inner">
                    <button onClick={() => setDiscountType('PERCENTAGE')} className={`px-2 py-0.5 text-[10px] font-black rounded transition-colors ${discountType === 'PERCENTAGE' ? 'bg-amber-600 text-white' : 'text-amber-600 hover:bg-amber-50'}`}>%</button>
                    <button onClick={() => setDiscountType('FIXED')} className={`px-2 py-0.5 text-[10px] font-black rounded transition-colors ${discountType === 'FIXED' ? 'bg-amber-600 text-white' : 'text-amber-600 hover:bg-amber-50'}`}>$</button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-800 opacity-50">{discountType === 'PERCENTAGE' ? '%' : '$'}</span>
                  <input type="number" step="0.01" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full p-3 pl-8 bg-white border border-amber-100 rounded-xl text-xs font-black text-amber-800 outline-none" placeholder="0.00" />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${hasInvoice ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-transparent'}`}>
                <input type="checkbox" checked={hasInvoice} onChange={e => setHasInvoice(e.target.checked)} className="w-5 h-5 rounded-lg text-indigo-600 border-slate-300" />
                <span className={`text-[11px] font-black uppercase ${hasInvoice ? 'text-indigo-800' : 'text-slate-500'}`}>Gravar IVA {TAX_RATE * 100}%</span>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-dashed border-slate-100 space-y-3">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Total Bruto</span>
                <span>${subtotalBase.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[10px] font-black text-amber-600 uppercase tracking-widest">
                  <span>Descuento aplicado</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {hasTransport && numTransportValue > 0 && (
                <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  <span>Servicio Transporte</span>
                  <span>+${numTransportValue.toFixed(2)}</span>
                </div>
              )}
              {hasInvoice && (
                <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  <span>IVA Calculado</span>
                  <span>+${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Total a Pagar</span>
                <span className="text-4xl font-black text-blue-600 tracking-tighter leading-none">${totalGeneral.toFixed(2)}</span>
              </div>
            </div>
            
            <button onClick={handleFinalSave} className="w-full py-5 shimmer-bg text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              <ShoppingCart size={20} /> Registrar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
