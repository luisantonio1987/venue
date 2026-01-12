
import React from 'react';
import { Order, CompanyData, Client, UserAccount } from '../types';

interface PrintProps {
  order: Order;
  company: CompanyData;
  client: Client;
  user: UserAccount;
}

const PrintTemplate: React.FC<PrintProps> = ({ order, company, client, user }) => {
  return (
    <div className="p-12 bg-white text-slate-900 font-sans" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
      {/* Black & White Ink Save Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter">{company.fantasyName}</h1>
          <p className="text-[11px] font-black uppercase leading-none">RUC: {company.ruc} | {company.regime.replace('_', ' ')}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">{company.taxAddress}</p>
        </div>
        <div className="text-right space-y-1">
          <h2 className="text-2xl font-black uppercase text-slate-400">{order.status === 'PROFORMA' ? 'Cotización' : 'Nota de Venta'}</h2>
          <p className="text-sm font-mono font-black border-2 border-slate-900 px-3 py-1 inline-block mt-2">{order.id}</p>
          <p className="text-[10px] font-bold uppercase block mt-2 text-slate-400">Emisión: {new Date(order.orderDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 py-10">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-1.5 w-fit rounded-r-full">Información del Cliente</h3>
          <p className="text-xs font-black uppercase">{client.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest">ID/RUC: {client.identification}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">TELF: {client.phone}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-1.5 w-fit rounded-r-full">Logística del Evento</h3>
          <p className="text-[10px] font-bold uppercase">FECHA: {new Date(order.eventDateStart).toLocaleDateString()} al {new Date(order.eventDateEnd).toLocaleDateString()}</p>
          <p className="text-[10px] font-bold uppercase text-slate-600">LUGAR: {order.deliveryAddress || 'RETIRO EN BODEGA'}</p>
          <p className="text-[10px] font-black uppercase text-slate-400">OPERADOR: {user.name}</p>
        </div>
      </div>

      <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
        <thead className="bg-slate-100 uppercase font-black">
          <tr className="border-b-2 border-slate-900">
            <th className="p-3 text-left border-r-2 border-slate-900">Cant.</th>
            <th className="p-3 text-left border-r-2 border-slate-900">Descripción / Artículo</th>
            <th className="p-3 text-right border-r-2 border-slate-900">P. Unit</th>
            <th className="p-3 text-right border-r-2 border-slate-900">Días</th>
            <th className="p-3 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="p-3 border-r-2 border-slate-900 font-bold">{item.quantity}</td>
              <td className="p-3 border-r-2 border-slate-900 uppercase font-bold">{item.name}</td>
              <td className="p-3 border-r-2 border-slate-900 text-right">${item.price.toFixed(2)}</td>
              <td className="p-3 border-r-2 border-slate-900 text-right">{item.isService ? '1' : order.rentalDays}</td>
              <td className="p-3 text-right font-black">${(item.price * item.quantity * (item.isService ? 1 : order.rentalDays)).toFixed(2)}</td>
            </tr>
          ))}
          {order.hasTransport && (
            <tr className="border-b-2 border-slate-900 italic font-bold">
              <td className="p-3 border-r-2 border-slate-900">1</td>
              <td className="p-3 border-r-2 border-slate-900 uppercase">SERVICIO LOGÍSTICO DE TRANSPORTE</td>
              <td className="p-3 border-r-2 border-slate-900 text-right">${order.transportValue.toFixed(2)}</td>
              <td className="p-3 border-r-2 border-slate-900 text-right">1</td>
              <td className="p-3 text-right font-black">${order.transportValue.toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end pt-10">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase"><span>Subtotal Neto:</span><span>${order.subtotal.toFixed(2)}</span></div>
          {order.discountValue > 0 && <div className="flex justify-between text-[10px] font-bold italic uppercase text-slate-400"><span>Descuento Aplicado:</span><span>-${(order.discountType === 'NOMINAL' ? order.discountValue : (order.subtotal * order.discountValue / 100)).toFixed(2)}</span></div>}
          <div className="flex justify-between text-[10px] font-bold uppercase border-b-2 pb-2"><span>IVA 15%:</span><span>${order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-lg font-black pt-2 uppercase"><span>Total General:</span><span>${order.total.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Manual Signature Lines */}
      <div className="mt-32 grid grid-cols-2 gap-24">
        <div className="text-center space-y-2">
          <div className="border-t-2 border-slate-900 pt-3">
             <p className="text-[10px] font-black uppercase leading-none">{company.legalRep}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Firma Autorizada</p>
          </div>
        </div>
        <div className="text-center space-y-2">
          <div className="border-t-2 border-slate-900 pt-3">
             <p className="text-[10px] font-black uppercase leading-none">{client.name}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Recibí Conforme / Cliente</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-12 right-12 text-center border-t-2 border-slate-100 pt-6 space-y-2">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter italic">"Elegancia y Precisión Logística para sus Eventos"</p>
        <div className="flex justify-center gap-8 text-[9px] font-black text-slate-600 uppercase">
          <span>{company.phoneMobile} / {company.phoneFixed}</span>
          <span>{company.email}</span>
          <span>{company.taxAddress}</span>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate;
