
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Ruler, 
  ChevronDown,
  Package,
  ImageIcon,
  Layers, 
  Scissors, 
  CheckCircle2, 
  Zap,
  Lock,
  Hash,
  X,
  Target,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { FABRICS, REFERENCES } from './constants';

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

    if (reference === 'fu') {
      cutHeight = (h + 2 + 4) * 2; 
      cutWidth = w + 2;
      mainPieceArea = cutHeight * cutWidth;
      unitsPerBatch = Math.floor(fabricTotalArea / mainPieceArea);
      const totalAreaBodies = unitsPerBatch * mainPieceArea;
      const initialWaste = fabricTotalArea - totalAreaBodies;

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

      if (currentRefData?.useSurplusForHandles && includeHandles) {
        const initialWaste = fabricTotalArea - (unitsPerBatch * mainPieceArea);
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
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cotizador Técnico Profesional</p>
            <p className="text-sm font-bold text-slate-700">V.3.0.0 Standard</p>
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
              </div>
            </section>

            <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border-b-8 border-emerald-500">
              <div className="relative z-10">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-70">
                  Total Orden ({calculation.qty} unds)
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-500">$</span>
                  <h3 className="text-6xl font-black tracking-tighter text-white leading-tight">
                    {calculation.roundedTotalOrder.toLocaleString()}
                  </h3>
                </div>
                <div className="mt-8 flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Unitario: ${calculation.finalPriceUnit.toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                    <span className="text-4xl bg-slate-100 p-4 rounded-3xl">{currentRef?.icon}</span>
                    {currentRef?.name}
                  </h2>
                </div>
                <div className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                  Ficha Técnica Industrial 2026
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b-2 border-slate-50 pb-4 text-emerald-600">
                    <Layers className="w-4 h-4" /> Geometría de Fabricación
                  </h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex justify-between items-center shadow-inner relative">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Corte Industrial</span>
                      <span className="text-2xl font-black text-slate-800 leading-none">{calculation.cutHeight} x {calculation.cutWidth} cm</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b-2 border-slate-50 pb-4 text-blue-400">
                    <Scissors className="w-4 h-4" /> Rendimiento
                  </h3>
                  <div className="p-10 bg-blue-50 rounded-[3rem] border-2 border-blue-100 text-center shadow-sm">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Unidades x Metro</p>
                    <div className="flex justify-center items-baseline gap-4">
                      <span className="text-7xl font-black text-blue-900 leading-none">{calculation.unitsPerBatch}</span>
                      <span className="text-sm font-bold text-blue-700 uppercase italic">UNDS MT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFabricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Catálogo de Materiales</h3>
              <button onClick={() => setIsFabricModalOpen(false)} className="p-3 text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(FABRICS).map((fabric) => (
                <button
                  key={fabric.id}
                  onClick={() => selectFabric(fabric.id)}
                  className={`text-left p-6 rounded-[2.5rem] border-2 transition-all ${formData.material === fabric.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}
                >
                  <h4 className="font-black text-slate-900 text-lg uppercase mb-2">{fabric.name}</h4>
                  <p className="text-xs text-slate-500 mb-4">{fabric.description}</p>
                  <div className="pt-4 border-t border-slate-100 text-right">
                    <span className="text-lg font-black text-slate-900">${fabric.price.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
