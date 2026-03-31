
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { removeAccents } from '../../utils/helpers';

interface AutocompleteInputProps {
    label: string;
    icon: React.ReactNode;
    value: string;
    onChange: (val: string) => void;
    suggestions: string[];
    placeholder: string;
    disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ label, icon, value, onChange, suggestions, placeholder, disabled }) => {
    const [show, setShow] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = suggestions.filter(s => {
        if (!value.trim()) return true;
        return removeAccents(s).includes(removeAccents(value));
    }).slice(0, 10); 

    useEffect(() => {
        const clickOut = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShow(false);
        };
        document.addEventListener('mousedown', clickOut);
        return () => document.removeEventListener('mousedown', clickOut);
    }, []);

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                {icon} {label}
            </label>
            <div className="relative group">
                <input 
                    disabled={disabled}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 pr-10 text-white outline-none focus:border-emerald-500 font-bold shadow-inner placeholder:text-slate-700 transition-all disabled:opacity-50"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => { onChange(e.target.value); setShow(true); }}
                    onFocus={() => setShow(true)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                    <ChevronDown size={16}/>
                </div>
                {value && (
                    <button 
                        onClick={() => { onChange(''); setShow(false); }}
                        className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"
                    >
                        <X size={14}/>
                    </button>
                )}
            </div>

            {show && filtered.length > 0 && (
                <div className="absolute z-[100] left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filtered.map((s, idx) => (
                            <button 
                                key={idx}
                                onClick={() => { onChange(s); setShow(false); }}
                                className="w-full text-left p-4 text-xs font-bold text-slate-300 hover:bg-emerald-600 hover:text-white transition-colors border-b border-slate-800 last:border-0"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutocompleteInput;
