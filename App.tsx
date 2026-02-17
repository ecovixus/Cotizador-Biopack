
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  ShoppingBag, 
  Ruler, 
  Info, 
  ArrowRight, 
  Layers, 
  Scissors, 
  CheckCircle2, 
  Zap,
  ChevronDown,
  Package,
  Sparkles,
  ImageIcon,
  RefreshCw,
  Copy,
  ClipboardCheck,
  Lock,
  Hash,
  X,
  Target,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { FABRICS, REFERENCES } from './constants';
import { CalculationResult, FormData } from './types';
import { getAIRecommendation, generateProfessionalQuotation } from './services/geminiService';

export default function App() {
  const [formData, setFormData] = useState<any>({
    reference: 'fu',
    material: 'yute',
    height: 40,
    width: 30,
    gusset: 12,
    handleLength: 60,
    handleWidth: 5,
    includeHandles: true,
    purpose: 'Comercial',
    quantity: 50
  });

  const [aiAnalysis, setAiAnalysis] = useState<{ advice: string; ecoTip: string; marketPositioning: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [quotation, setQuotation] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isFabricModalOpen, setIsFabricModalOpen] = useState(false);

  // Ajustes estructurales automáticos para referencias fijas
  useEffect(() => {
    const currentRef = REFERENCES.find(r => r.id === formData.reference);
    if (currentRef?.isFixed && currentRef.fixedMedidas) {
      setFormData((prev: any) => ({
        ...prev,
        height: currentRef.fixedMedidas!.height,
        width: currentRef.fixedMedidas!.width,
        gusset: 0,
        includeHandles: false,
        material: currentRef.allowedFabrics?.includes(prev.material) ? prev.material : (currentRef.allowedFabrics?.[0] || 'yute')
      }));
    }
  }, [formData.reference]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const currentRef = REFERENCES.find(r => r.id === formData.reference);
    
    if (currentRef?.isFixed && (name === 'height' || name === 'width' || name === 'gusset')) return;
    
    setFormData((prev: any) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value) 
    }));
  };

  const selectFabric = (id: string) => {
    setFormData((prev: any) => ({ ...prev, material: id }));
    setIsFabricModalOpen(false);
  };

  const safeParse = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const calculation = useMemo<any>(() => {
    const { reference, material, height, width, gusset, handleLength, handleWidth, includeHandles, quantity } = formData;
    const fabric = FABRICS[material] || FABRICS.yute;
    const currentRefData: any = REFERENCES.find(r => r.id === reference);
    
    const h = safeParse(height);
    const w = safeParse(width);
    
    const noGussetRefs = ['pm', 'tc', 'ca', 'bp', 'ml', 'tm', 'tmt', 'tmts', 'fa'];
    const g = noGussetRefs.includes(reference) ? 0 : safeParse(gusset);
    
    const hl = safeParse(handleLength);
    const hw = safeParse(handleWidth);
    const qty = Math.max(1, safeParse(quantity));
    
    const fabricTotalArea = (fabric.width || 100) * (fabric.length || 160);
    const costPerCm2 = (fabric.price || 0) / (fabricTotalArea || 1);
    const hemSize = currentRefData?.hem || 8;

    let finalPriceUnit = 0;
    let fabricCostPerUnit = 0;
    let handleCostPerUnit = 0;
    let cordCost = 0;
    let surchargePerUnit = 0;
    let unitsPerBatch = 0;
    let mainPieceArea = 0;
    let cutHeight = 0;
    let cutWidth = 0;
    let initialWaste = 0;

    if (reference === 'fu') {
      cutHeight = (h + 2 + 4) * 2; 
      cutWidth = w + 2;
      mainPieceArea = cutHeight * cutWidth;
      unitsPerBatch = Math.floor(fabricTotalArea / mainPieceArea);
      const totalAreaBodies = unitsPerBatch * mainPieceArea;
      initialWaste = fabricTotalArea - totalAreaBodies;

      const extraGussetsNeeded = Math.max(0, unitsPerBatch - Math.floor(initialWaste / ((g + 2) * cutHeight || 1)));
      fabricCostPerUnit = unitsPerBatch > 0 ? ((fabricTotalArea + (extraGussetsNeeded * (g + 2) * cutHeight)) * costPerCm2) / unitsPerBatch : 0;
      if (includeHandles) handleCostPerUnit = (hl * hw * 2 * costPerCm2);
    } else if (currentRefData?.isFixed) {
      finalPriceUnit = currentRefData.fixedPrices[material] || 0;
      fabricCostPerUnit = finalPriceUnit;
      cutHeight = currentRefData.fixedMedidas.height;
      cutWidth = currentRefData.fixedMedidas.width;
      mainPieceArea = cutHeight * cutWidth;
      unitsPerBatch = Math.floor(fabricTotalArea / mainPieceArea);
    } else {
      const is3Piece = ['3f', '3fr'].includes(reference);
      const bottomGussetVal = currentRefData?.bottomGusset ? g : 0;
      cutHeight = (h * 2) + hemSize + 2 + (currentRefData?.bottomGusset ? bottomGussetVal : (is3Piece ? g : 0)); 
      cutWidth = w + 2;
      mainPieceArea = cutHeight * cutWidth;
      unitsPerBatch = Math.floor(fabricTotalArea / mainPieceArea);
      initialWaste = fabricTotalArea - (unitsPerBatch * mainPieceArea);

      if (currentRefData?.useSurplusForHandles && includeHandles) {
        const extraHandles = Math.max(0, (unitsPerBatch * 2) - Math.floor(initialWaste / (hl * hw || 1)));
        fabricCostPerUnit = unitsPerBatch > 0 ? ((fabricTotalArea + (extraHandles * (hl * hw))) * costPerCm2) / unitsPerBatch : 0;
      } else {
        fabricCostPerUnit = unitsPerBatch > 0 ? (fabricTotalArea * costPerCm2) / unitsPerBatch : 0;
        handleCostPerUnit = includeHandles ? (hl * hw * 2 * costPerCm2) : 0;
      }
    }

    if (currentRefData?.hasTieredPricing && qty >= 50) {
      if (['3f', '3fr', 'fu'].includes(reference)) {
        if (qty <= 200) surchargePerUnit = 4500;
        else if (qty <= 1500) surchargePerUnit = 4000;
        else surchargePerUnit = 3650;
      } else if (reference === 'fabr') {
        if (qty <= 200) surchargePerUnit = 3800;
        else if (qty <= 1500) surchargePerUnit = 3500;
        else surchargePerUnit = 3300;
      } else if (reference === 'fab') {
        if (qty <= 200) surchargePerUnit = 3600;
        else if (qty <= 1500) surchargePerUnit = 3300;
        else surchargePerUnit = 3100;
      } else if (['pm', 'bp', 'fa'].includes(reference)) {
        if (qty <= 200) surchargePerUnit = 2300;
        else if (qty <= 1500) surchargePerUnit = 2000;
        else surchargePerUnit = 1800;
      } else if (reference === 'tc') {
        if (qty <= 200) surchargePerUnit = 1900;
        else if (qty <= 1500) surchargePerUnit = 1600;
        else surchargePerUnit = 1400;
      } else if (reference === 'ca') {
        if (qty <= 200) surchargePerUnit = 2100;
        else if (qty <= 1500) surchargePerUnit = 1800;
        else surchargePerUnit = 1600;
      } else if (['ml', 'tm'].includes(reference)) {
        if (qty <= 200) surchargePerUnit = 2000;
        else if (qty <= 1500) surchargePerUnit = 1700;
        else surchargePerUnit = 1500;
      } else if (reference === 'tn') {
        if (qty <= 200) surchargePerUnit = 3800;
        else if (qty <= 1500) surchargePerUnit = 3500;
        else surchargePerUnit = 3300;
      } else if (reference === 'td') {
        if (qty <= 200) surchargePerUnit = 5500;
        else if (qty <= 1500) surchargePerUnit = 5000;
        else surchargePerUnit = 4650;
      }
    }

    cordCost = currentRefData?.hasCord ? (currentRefData.cordCost || 0) : 0;
    
    if (!currentRefData?.isFixed || (['tn', 'td'].includes(reference) && qty >= 50) || reference === 'fu') {
       finalPriceUnit = Math.ceil((fabricCostPerUnit + handleCostPerUnit + cordCost + surchargePerUnit) / 10) * 10;
    }

    const rawTotalOrder = finalPriceUnit * qty;
    let roundedTotalOrder = rawTotalOrder;
    const remainder = rawTotalOrder % 100;
    if (remainder > 0 && remainder <= 50) roundedTotalOrder = Math.floor(rawTotalOrder / 100) * 100 + 50;
    else if (remainder > 50) roundedTotalOrder = Math.ceil(rawTotalOrder / 100) * 100;

    return {
      cutHeight, cutWidth, mainPieceArea, unitsPerBatch, fabricCostPerUnit, 
      handleCostPerUnit, cordCost, surchargePerUnit, finalPriceUnit, 
      rawTotalOrder, roundedTotalOrder, qty, costPerCm2: costPerCm2 || 0
    };
  }, [formData]);

  const triggerAI = async () => {
    setIsAiLoading(true);
    const rec = await getAIRecommendation(formData, FABRICS[formData.material]);
    setAiAnalysis(rec);
    setIsAiLoading(false);
  };

  const triggerQuotation = async () => {
    setIsAiLoading(true);
    const q = await generateProfessionalQuotation(formData, calculation, FABRICS[formData.material]);
    setQuotation(q);
    setIsAiLoading(false);
  };

  const handleCopy = () => {
    if (quotation) {
      navigator.clipboard.writeText(quotation);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const currentRef = REFERENCES.find(r => r.id === formData.reference);
  const currentFabric = FABRICS[formData.material];
  const HIDE_GUSSET_REFS = ['pm', 'tc', 'ca', 'bp', 'ml', 'tm', 'tmt', 'tmts', 'fa'];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="p-4 bg-emerald-600 rounded-3xl shadow-xl">
              <ShoppingBag className="text-white w-10 h-10 md:w-12 md:h-12" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-2 uppercase">
                BIOPACK <span className="text-emerald-600 italic">S.A.S</span>
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full tracking-widest border border-emerald-200">
                  Fábrica de Bolsas Ecológicas
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">Gestión Pro 2026</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={triggerAI}
              disabled={isAiLoading}
              className="flex items-center gap-3 bg-slate-900 text-emerald-400 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
              Consultor IA
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" /> Referencia de Catálogo
              </label>
              
              <div className="relative mb-6">
                <select 
                  name="reference" 
                  value={formData.reference} 
                  onChange={handleInputChange} 
                  className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 font-black text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                >
                  {REFERENCES.map((ref) => (<option key={ref.id} value={ref.id}>{ref.icon} {ref.name.toUpperCase()}</option>))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>

              {(currentRef?.isFixed || currentRef?.hasTieredPricing) && (
                <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-3xl flex flex-col gap-2 mb-6 animate-in zoom-in duration-500">
                  <div className="flex items-center gap-3 text-blue-800">
                    {currentRef?.isFixed ? <Lock className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    <p className="text-[10px] font-black uppercase tracking-tighter">{currentRef?.isFixed ? 'Modelo Estandarizado' : 'Escala por Volumen'}</p>
                  </div>
                  <p className="text-[9px] text-blue-600/80 font-bold italic tracking-tight leading-relaxed">
                    {currentRef?.isFixed ? "Precios y medidas blindados Biopack." : "Recargos por volumen aplicados al neto unitario."}
                  </p>
                </div>
              )}

              <div className="space-y-6 pt-6 border-t-2 border-slate-50">
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                  <label className="block text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Hash className="w-4 h-4" /> Cantidad Solicitada
                  </label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleInputChange} 
                    min="1" 
                    className="w-full bg-slate-800 border-none rounded-2xl px-5 py-4 text-xl font-black text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Base Textil</label>
                  <button 
                    onClick={() => setIsFabricModalOpen(true)}
                    className="w-full flex items-center justify-between bg-slate-50 border-2 border-emerald-500/30 rounded-2xl px-6 py-5 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{currentFabric.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cambiar material</p>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-emerald-600" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">Alto (cm)</label>
                    <input type="number" name="height" value={formData.height} onChange={handleInputChange} disabled={currentRef?.isFixed} className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black outline-none transition-all ${currentRef?.isFixed ? 'border-blue-100 opacity-50 cursor-not-allowed' : 'border-slate-100 focus:border-emerald-500'}`} />
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">Ancho (cm)</label>
                    <input type="number" name="width" value={formData.width} onChange={handleInputChange} disabled={currentRef?.isFixed} className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black outline-none transition-all ${currentRef?.isFixed ? 'border-blue-100 opacity-50 cursor-not-allowed' : 'border-slate-100 focus:border-emerald-500'}`} />
                  </div>
                </div>

                {!currentRef?.isFixed && !HIDE_GUSSET_REFS.includes(formData.reference) && (
                   <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter flex items-center gap-1"><Maximize2 className="w-3 h-3 text-emerald-500" /> Ancho del Fuelle (cm)</label>
                    <input type="number" name="gusset" value={formData.gusset} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 font-black text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-sm" />
                  </div>
                )}

                {!currentRef?.isFixed && (
                  <div className="p-6 bg-emerald-50/50 border-2 border-emerald-100/50 rounded-[2.5rem] space-y-4 shadow-inner">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-800 group-hover:text-emerald-700 transition-colors">Incluir Manijas</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">Refuerzo Biopack</span>
                      </div>
                      <input type="checkbox" name="includeHandles" checked={formData.includeHandles} onChange={handleInputChange} className="w-7 h-7 rounded-xl accent-emerald-600 cursor-pointer shadow-sm" />
                    </label>

                    {formData.includeHandles && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200 animate-in slide-in-from-top-2">
                        <div>
                          <label className="block text-[9px] font-black text-emerald-600 mb-1 uppercase tracking-widest">Largo (cm)</label>
                          <input type="number" name="handleLength" value={formData.handleLength} onChange={handleInputChange} className="w-full bg-white border-2 border-emerald-100 rounded-xl px-4 py-2 text-xs font-black outline-none shadow-inner" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-emerald-600 mb-1 uppercase tracking-widest">Ancho (cm)</label>
                          <input type="number" name="handleWidth" value={formData.handleWidth} onChange={handleInputChange} className="w-full bg-white border-2 border-emerald-100 rounded-xl px-4 py-2 text-xs font-black outline-none shadow-inner" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border-b-8 border-emerald-500">
              <div className="relative z-10">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-70">
                  {currentRef?.isFixed || currentRef?.hasTieredPricing || formData.reference === 'fu' ? `Total Orden (${calculation.qty} unds)` : 'Precio Neto Proyectado'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-500">$</span>
                  <h3 className="text-6xl font-black tracking-tighter text-white leading-tight">
                    {calculation.roundedTotalOrder.toLocaleString()}
                  </h3>
                  <span className="text-xs font-black text-slate-400 uppercase">COP</span>
                </div>
                <div className="mt-8 flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Unitario: ${calculation.finalPriceUnit.toLocaleString()}</span>
                </div>
              </div>
              <Scissors className="absolute -right-10 -bottom-10 w-48 h-48 text-white/5 rotate-12 transition-transform duration-1000" />
            </section>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 text-center md:text-left">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                    <span className="text-4xl bg-slate-100 p-4 rounded-3xl shadow-inner">{currentRef?.icon}</span>
                    {currentRef?.name}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 ml-2">Análisis de Ingeniería Biopack</p>
                </div>
                <div className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-3">
                  Ficha Técnica Industrial 2026
                </div>
              </div>

              {/* IMAGEN DE CATÁLOGO DINÁMICA */}
              <div className="mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-slate-100 relative group h-80 bg-slate-50">
                <img 
                  src={formData.reference === 'fu' ? "/image (22).jpg" : `/${formData.reference}.jpg`} 
                  alt={`Referencia ${currentRef?.name}`}
                  className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                  onError={(e: any) => {
                    e.target.onerror = null; 
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 absolute inset-0">
                  <ImageIcon className="w-20 h-20 mb-2 opacity-50" />
                  <span className="text-xs font-black uppercase tracking-widest">Visual no disponible</span>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-transparent p-10 pt-24">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-1 drop-shadow-md">
                    {currentRef?.name}
                  </h2>
                  <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Modelo Industrial Biopack Pro
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b-2 border-slate-50 pb-4 text-emerald-600">
                    <Layers className="w-4 h-4" /> Geometría de Fabricación
                  </h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex justify-between items-center shadow-inner relative">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">
                        {formData.reference === 'fu' ? 'Cuerpos (2 piezas)' : `Cuerpo Neto${!HIDE_GUSSET_REFS.includes(formData.reference) && formData.reference !== 'fu' ? ` (+${formData.gusset} fuelle)` : ''}`}
                      </span>
                      <span className="text-2xl font-black text-slate-800 leading-none">{calculation.cutHeight} x {calculation.cutWidth} cm</span>
                    </div>
                    {formData.includeHandles && (
                      <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 flex justify-between items-center shadow-inner">
                        <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tight">Manijas (x2)</span>
                        <span className="text-2xl font-black text-slate-800">{formData.handleLength} x {formData.handleWidth} cm</span>
                      </div>
                    )}
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] border-b-4 border-emerald-600 flex justify-between items-center text-white shadow-xl">
                      <span className="text-xs font-black text-emerald-400 uppercase italic tracking-widest">Área Unitaria:</span>
                      <span className="text-3xl font-black">{calculation.mainPieceArea.toLocaleString()} <small className="text-sm font-normal opacity-50 ml-1">cm²</small></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b-2 border-slate-50 pb-4 text-blue-400">
                    <Scissors className="w-4 h-4" /> Rendimiento Industrial
                  </h3>
                  <div className="space-y-6">
                    <div className="p-10 bg-blue-50 rounded-[3rem] border-2 border-blue-100 text-center relative overflow-hidden shadow-sm">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Unidades x Metro</p>
                      <div className="flex justify-center items-baseline gap-4 relative z-10">
                        <span className="text-7xl font-black text-blue-900 leading-none">{calculation.unitsPerBatch}</span>
                        <span className="text-sm font-bold text-blue-700 uppercase italic underline">UNDS MT</span>
                      </div>
                    </div>
                    {calculation.surchargePerUnit > 0 && (
                      <div className="p-8 bg-orange-600 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
                        <div className="flex items-center gap-3 mb-3 text-orange-200">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Recargo por Escala</span>
                        </div>
                        <p className="text-3xl font-black tracking-tighter leading-none">+ ${calculation.surchargePerUnit.toLocaleString()} <small className="text-xs opacity-70">x unidad</small></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-10 border-t-2 border-slate-50">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Desglose Unitario Neto</h3>
                  <button onClick={triggerQuotation} className="text-xs font-black text-emerald-600 hover:text-emerald-800 uppercase flex items-center gap-2 group tracking-tighter">
                    Descargar Propuesta Formal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest leading-none">Tela Base</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">${Math.round(calculation.fabricCostPerUnit).toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest leading-none">Insumos</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">${Math.round(calculation.handleCostPerUnit + calculation.cordCost).toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-white rounded-3xl border-2 border-orange-100 text-center">
                    <p className="text-[9px] font-black text-orange-400 uppercase mb-2 tracking-widest leading-none">Volumen</p>
                    <p className="text-2xl font-black text-orange-600 leading-none">+${calculation.surchargePerUnit.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-blue-900 rounded-3xl text-white shadow-xl text-center">
                    <p className="text-[9px] font-black text-blue-300 uppercase mb-2 tracking-widest leading-none">Orden Final</p>
                    <p className="text-2xl font-black leading-none">${calculation.roundedTotalOrder.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* IA ANALYSIS & QUOTATION */}
            {(aiAnalysis || quotation) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {aiAnalysis && (
                  <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-emerald-500 p-3 rounded-2xl">
                        <Sparkles className="w-6 h-6 text-slate-900" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Estrategia Biopack IA</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Consejo Técnico Biopack</p>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{aiAnalysis.advice}</p>
                      </div>
                      <div className="flex items-center justify-between pt-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Segmentación:</span>
                        <span className="bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full text-[10px] font-black uppercase border border-emerald-500/10">{aiAnalysis.marketPositioning}</span>
                      </div>
                    </div>
                  </section>
                )}

                {quotation && (
                  <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border-2 border-emerald-100 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-emerald-600 p-3 rounded-2xl text-white">
                        <ClipboardCheck className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Resumen Comercial</h3>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[2rem] text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto mb-6 scrollbar-hide border border-slate-100 shadow-inner">
                      {quotation}
                    </div>
                    <button 
                      onClick={handleCopy}
                      className={`w-full py-6 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-3 ${copyStatus === 'copied' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'}`}
                    >
                      {copyStatus === 'copied' ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copyStatus === 'copied' ? 'Copiado al Portapapeles' : 'Copiar para WhatsApp'}
                    </button>
                  </section>
                )}
              </div>
            )}

            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center border-4 border-slate-100 shadow-2xl text-emerald-400 p-6">
                    <Ruler className="w-full h-full" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-2xl tracking-tighter uppercase leading-none">{currentFabric.name}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">Sustrato Industrial Biopack</p>
                  </div>
               </div>
               <div className="text-center md:text-right px-12 py-6 bg-slate-950 rounded-[3rem] text-white border-b-8 border-emerald-600 shadow-2xl">
                  <span className="text-[10px] font-black uppercase block mb-3 opacity-40">Valor cm² Neto</span>
                  <span className="text-5xl font-black font-mono tracking-tighter text-emerald-400 leading-none">${calculation.costPerCm2.toFixed(4)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE TELAS */}
      {isFabricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-3 rounded-2xl text-emerald-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Catálogo de Materiales</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escoge la base textil para tu fabricación</p>
                </div>
              </div>
              <button onClick={() => setIsFabricModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scrollbar-hide">
              {Object.values(FABRICS).map((fabric) => {
                const isAllowed = !currentRef?.allowedFabrics || currentRef.allowedFabrics.includes(fabric.id);
                const isSelected = formData.material === fabric.id;
                return (
                  <button
                    key={fabric.id}
                    disabled={!isAllowed}
                    onClick={() => selectFabric(fabric.id)}
                    className={`text-left p-6 rounded-[2.5rem] border-2 transition-all flex flex-col h-full relative group ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02]' : isAllowed ? 'border-slate-100 bg-white hover:border-emerald-200 hover:shadow-xl' : 'opacity-40 grayscale border-slate-50 cursor-not-allowed'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter">{fabric.name}</h4>
                      {isSelected && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 flex-grow">{fabric.description}</p>
                    <div className="space-y-4 mt-auto">
                      <div className="flex flex-wrap gap-2">
                        {fabric.bestFor?.map((usage, idx) => (
                          <span key={idx} className="bg-slate-900/5 text-slate-500 text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1"><Target className="w-2.5 h-2.5" /> {usage}</span>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Industrial</span>
                        <span className="text-lg font-black text-slate-900 font-mono tracking-tighter leading-none">${fabric.price.toLocaleString()}</span>
                      </div>
                    </div>
                    {!isAllowed && <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px] rounded-[2.5rem]"><span className="bg-slate-800 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-2"><Lock className="w-3 h-3" /> No compatible</span></div>}
                  </button>
                );
              })}
            </div>
            <div className="p-6 bg-slate-900 text-center"><p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]">Sostenibilidad Industrial • Biopack Solutions</p></div>
          </div>
        </div>
      )}

      <style>{`
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
