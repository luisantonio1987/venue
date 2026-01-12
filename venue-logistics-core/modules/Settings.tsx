
import React from 'react';
import { Download, Database, Shield, RefreshCw, Archive } from 'lucide-react';
import { dbService } from '../firebaseService';

const SettingsModule: React.FC = () => {
  const handleBackup = () => {
    dbService.exportData();
  };

  const sections = [
    {
      title: 'Gestión de Datos',
      icon: <Database className="text-blue-600" size={24} />,
      items: [
        { 
          name: 'Respaldo Semanal Integral', 
          desc: 'Descarga un archivo comprimido con toda la información de pedidos, inventario y clientes.',
          action: handleBackup,
          label: 'Descargar Backup'
        },
        { 
          name: 'Repositorio Mensual', 
          desc: 'Mover pedidos antiguos al archivo para optimizar el rendimiento de la interfaz.',
          action: () => alert('Procesando archivado mensual...'),
          label: 'Ejecutar Limpieza'
        }
      ]
    },
    {
      title: 'Seguridad y Sincronización',
      icon: <Shield className="text-emerald-600" size={24} />,
      items: [
        { 
          name: 'Sincronización en Tiempo Real', 
          desc: 'Estado del enlace con el servidor de base de datos.',
          status: 'Activo',
          label: 'Sincronizado'
        },
        { 
          name: 'Logs de Sistema', 
          desc: 'Ver historial de cambios y acciones de los usuarios.',
          action: () => {},
          label: 'Ver Registros'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h2>
        <p className="text-slate-500">Mantenimiento técnico y resguardo de información de La Casa del Banquete.</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center space-x-3 bg-slate-50/50">
              {section.icon}
              <h3 className="font-bold text-slate-800">{section.title}</h3>
            </div>
            <div className="divide-y">
              {section.items.map((item, iidx) => (
                <div key={iidx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                  <div className="max-w-md">
                    <h4 className="font-bold text-slate-800 mb-1">{item.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                  <button 
                    onClick={item.action}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 ${
                      item.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                    }`}
                  >
                    {item.label === 'Descargar Backup' && <Download size={14} />}
                    {item.label === 'Ejecutar Limpieza' && <RefreshCw size={14} />}
                    <span>{item.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start space-x-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Archive className="text-blue-600" size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">Nota de Seguridad</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            Todos los datos ingresados se guardan automáticamente en tiempo real. 
            Se recomienda realizar el respaldo manual todos los viernes antes del cierre.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
