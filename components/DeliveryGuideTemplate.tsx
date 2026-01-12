
import React from 'react';
import { Order, CompanyData, Client, UserAccount } from '../types';

interface GuideProps {
  order: Order;
  company: CompanyData;
  client?: Client;
  user: UserAccount;
}

const DeliveryGuideTemplate: React.FC<GuideProps> = ({ order, company, client, user }) => {
  const pendingBalance = order.total - order.paidAmount;

  return (
    <div className="p-10 bg-white text-slate-900 font-sans print:p-0" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
      {/* Cabecera Blanco y Negro - Ahorro de Tinta (Regla 14) */}
      <div className="flex justify-between items-start border-b-8 border-slate-900 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">{company.fantasyName}</h1>
          <p className="text-[12px] font-black uppercase tracking-[0.2em]">RUC: {company.ruc} | {company.regime.replace('_', ' ')}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-4 max-w-sm">{company.taxAddress}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <h2 className="text-2xl font-black uppercase text-slate-400 tracking-widest">GUÍA DE REMISIÓN / ENTREGA</h2>
          <div className="text-lg font-mono font-black border-4 border-slate-900 px-6 py-2 inline-block mt-4">
            N° {order.id}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase mt-4">OPERADOR: {user.name.toUpperCase()}</p>
        </div>
      </div>

      {/* Datos del Cliente y Logística (Regla 67) */}
      <div className="grid grid-cols-2 gap-12 py-12 border-b-2 border-slate-100">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">DATOS DEL BENEFICIARIO</h3>
          <p className="text-sm font-black uppercase border-l-4 border-slate-900 pl-4 py-1">{client?.name || order.clientName}</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 pl-4">IDENTIFICACIÓN: {client?.identification || 'S/N'}</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 pl-4">TELF: {client?.phone || 'S/N'}</p>
          <p className="text-[11px] font-bold lowercase text-slate-400 pl-4">{client?.email || ''}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">DETALLES LOGÍSTICOS</h3>
          <p className="text-[11px] font-black uppercase"><span className="text-slate-400">FECHAS EVENTO:</span> {new Date(order.eventDateStart).toLocaleDateString('es-EC')} AL {new Date(order.eventDateEnd).toLocaleDateString('es-EC')}</p>
          <p className="text-[11px] font-bold uppercase text-slate-700 mt-2 leading-relaxed italic border-2 border-slate-100 p-4 rounded-2xl"><span className="text-slate-400 block not-italic mb-1 text-[9px] tracking-widest">LUGAR DE ENTREGA:</span> {order.deliveryAddress || 'RETIRO EN BODEGA CLIENTE'}</p>
        </div>
      </div>

      {/* Detalle de Productos (SIN PRECIOS - Regla 67) */}
      <div className="py-12">
        <table className="w-full border-collapse border-4 border-slate-900 text-[12px]">
          <thead className="bg-slate-100 uppercase font-black tracking-widest">
            <tr className="border-b-4 border-slate-900">
              <th className="p-4 text-center border-r-4 border-slate-900 w-24">CANTIDAD</th>
              <th className="p-4 text-left">DESCRIPCIÓN DE MENAJE / MOBILIARIO / SERVICIOS</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {order.items.map((item, idx) => (
              <tr key={idx} className="border-b-2 border-slate-200">
                <td className="p-4 border-r-4 border-slate-900 font-black text-center text-lg">{item.quantity}</td>
                <td className="p-4 uppercase tracking-tight">{item.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Solo Saldo Pendiente (Regla 67) */}
      {pendingBalance > 0 && (
        <div className="flex justify-end pt-8">
          <div className="bg-slate-900 text-white px-10 py-6 rounded-l-[3rem] flex items-center gap-10 shadow-xl">
            <span className="text-[12px] font-black uppercase tracking-[0.4em]">SALDO PENDIENTE A COBRAR EN SITIO:</span>
            <span className="text-4xl font-black font-mono tracking-tighter">${pendingBalance.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Líneas de Firma (Regla 67) */}
      <div className="mt-40 grid grid-cols-2 gap-32">
        <div className="text-center space-y-3">
          <div className="border-t-4 border-slate-900 pt-4 px-4">
             <p className="text-[12px] font-black uppercase leading-none">{company.legalRep}</p>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">DESPACHADO POR / RESPONSABLE</p>
          </div>
        </div>
        <div className="text-center space-y-3">
          <div className="border-t-4 border-slate-900 pt-4 px-4">
             <p className="text-[12px] font-black uppercase leading-none">{client?.name || order.clientName}</p>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">RECIBÍ CONFORME / CLIENTE</p>
          </div>
        </div>
      </div>

      {/* Pie de Página (Regla 14) */}
      <div className="absolute bottom-12 left-10 right-10 text-center border-t-2 border-slate-100 pt-8">
        <div className="flex justify-center gap-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
          <span className="flex items-center gap-2">{company.phoneMobile} / {company.phoneFixed}</span>
          <span className="flex items-center gap-2">{company.email}</span>
          <span className="flex items-center gap-2">{company.fantasyName.toUpperCase()}</span>
        </div>
        <p className="text-[8px] font-bold text-slate-300 uppercase mt-4 tracking-[0.5em]">"EXCELENCIA LOGÍSTICA PARA EVENTOS DE ALTO IMPACTO"</p>
      </div>
    </div>
  );
};

export default DeliveryGuideTemplate;
