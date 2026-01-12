
import React, { useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle2, Info, HelpCircle, X, 
  AlertCircle, ShieldAlert 
} from 'lucide-react';

export type ModalType = 'info' | 'success' | 'warning' | 'confirm' | 'danger' | 'persuade';

interface ModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  autoClose?: number;
}

const Modal: React.FC<ModalProps> = ({
  isOpen, type, title, message, confirmLabel = 'Aceptar', cancelLabel = 'Cancelar',
  onConfirm, onCancel, onClose, autoClose
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => onClose(), autoClose);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  if (!isOpen) return null;

  const styles = {
    info: { icon: <Info className="text-blue-500" size={48} />, bg: 'bg-blue-50', btn: 'bg-blue-600 hover:bg-blue-700' },
    success: { icon: <CheckCircle2 className="text-emerald-500" size={48} />, bg: 'bg-emerald-50', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    warning: { icon: <AlertTriangle className="text-amber-500" size={48} />, bg: 'bg-amber-50', btn: 'bg-amber-600 hover:bg-amber-700' },
    confirm: { icon: <HelpCircle className="text-indigo-500" size={48} />, bg: 'bg-indigo-50', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    danger: { icon: <AlertCircle className="text-red-500" size={48} />, bg: 'bg-red-50', btn: 'bg-red-600 hover:bg-red-700' },
    persuade: { icon: <ShieldAlert className="text-purple-500" size={48} />, bg: 'bg-purple-50', btn: 'bg-purple-600 hover:bg-purple-700' },
  };

  const current = styles[type];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={autoClose ? undefined : onClose} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {!autoClose && (
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        )}
        
        <div className={`p-10 text-center ${current.bg}`}>
          <div className="flex justify-center mb-6">{current.icon}</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-3">{title}</h3>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wide leading-relaxed">{message}</p>
        </div>

        {!autoClose && (
          <div className="p-8 bg-white flex flex-col sm:flex-row gap-3">
            {(type === 'confirm' || type === 'danger') && (
              <button onClick={onCancel || onClose} className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
                {cancelLabel}
              </button>
            )}
            <button
              onClick={() => { if (onConfirm) onConfirm(); onClose(); }}
              className={`flex-1 px-6 py-4 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${current.btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
