
import React, { useState } from 'react';
import { dbService } from '../firebaseService';
import { FileText, Download, Calendar, Filter, FileSpreadsheet } from 'lucide-react';

const ReportsModule = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const downloadReport = (format: 'PDF' | 'EXCEL', module: string) => {
    // Simulación de generación de reporte
    alert(`GENERANDO REPORTE DE ${module.toUpperCase()} EN FORMATO ${format} PARA EL RANGO ${dateRange.start} AL ${dateRange.end}...`);
  };

  const reportCards = [
    { title: 'VENTAS Y PROFORMAS', id: 'sales' },
    { title: 'LOGÍSTICA DE DESPACHO', id: 'logistics' },
    { title: 'MOVIMIENTOS DE CAJA', id: 'cash' },
    { title: 'CONTROL DE INVENTARIO', id: 'inventory' },
    { title: 'CARTERA DE CLIENTES', id: 'clients' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20 no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">CENTRO DE REPORTES</h2>
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
           <div className="flex items-center gap-2 px-2">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DESDE</span>
             <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 bg-white rounded-xl text-[10px] font-black border border-slate-200 shadow-sm" />
           </div>
           <div className="flex items-center gap-2 px-2">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HASTA</span>
             <input type="date" value={dateRange.end} min={dateRange.start} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 bg-white rounded-xl text-[10px] font-black border border-slate-200 shadow-sm" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map(report => (
          <div key={report.id} className="bg-white p-8 rounded-[3rem] border shadow-sm hover:shadow-xl transition-all space-y-6 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all shadow-inner">
              <FileText size={32} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">{report.title}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-wide">REPORTE ACUMULATIVO POR FECHAS</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full pt-4">
              <button onClick={() => downloadReport('PDF', report.title)} className="flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Descargar reporte en formato PDF">
                <Download size={14}/> PDF
              </button>
              <button onClick={() => downloadReport('EXCEL', report.title)} className="flex items-center justify-center gap-2 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Descargar reporte en formato Excel">
                <FileSpreadsheet size={14}/> EXCEL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsModule;
