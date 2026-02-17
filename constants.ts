
import { Fabric, Reference } from './types';

export const FABRICS: Record<string, Fabric> = {
  yute: { 
    id: 'yute',
    name: 'Yute', 
    price: 15040, 
    width: 100, 
    length: 160,
    description: 'Fibra natural biodegradable de alta resistencia.',
    bestFor: ['Mercado', 'Premium']
  },
  algodon: { 
    id: 'algodon',
    name: 'Algodón', 
    price: 10000, 
    width: 100, 
    length: 150,
    description: 'Suave y lavable, ideal para uso diario.',
    bestFor: ['Eventos']
  },
  lienzo: { 
    id: 'lienzo',
    name: 'Lienzo', 
    price: 12000, 
    width: 100, 
    length: 170,
    description: 'Tela de alta densidad muy duradera.',
    bestFor: ['Carga Pesada']
  },
  tafetan: { 
    id: 'tafetan',
    name: 'Tafetán', 
    price: 1950, 
    width: 100, 
    length: 150,
    description: 'Seda liviana para bolsas promocionales.',
    bestFor: ['Liviano']
  },
  tafetan_sublimada: { 
    id: 'tafetan_sublimada',
    name: 'Tela Tafetán Sublimada', 
    price: 6750, 
    width: 100, 
    length: 150,
    description: 'Acabado brillante con impresión total.',
    bestFor: ['Marketing']
  },
  antifluido: { 
    id: 'antifluido',
    name: 'Antifluido', 
    price: 4000, 
    width: 100, 
    length: 150,
    description: 'Repelente a líquidos y fácil limpieza.',
    bestFor: ['Salud']
  },
};

export const REFERENCES: Reference[] = [
  { 
    id: 'fu', 
    name: 'Bolsa Fuelle Único', 
    icon: '💼', 
    isUniqueGusset: true, 
    hem: 4, 
    allowCustomHandles: true,
    hasTieredPricing: true 
  },
  { 
    id: 'pm', 
    name: 'Bolsa Plana con Manija', 
    icon: '📏', 
    hem: 8, 
    allowCustomHandles: true,
    hasTieredPricing: true 
  },
  { 
    id: 'tn', 
    name: 'Bolsa Tula Náutica', 
    icon: '⚓', 
    isFixed: true, 
    hem: 8,
    hasCord: true,
    cordCost: 450,
    allowedFabrics: ['yute', 'algodon', 'lienzo'],
    fixedMedidas: { width: 23, height: 40 },
    fixedPrices: { yute: 4166, algodon: 3350, lienzo: 3426 },
    hasTieredPricing: true
  },
  { 
    id: 'td', 
    name: 'Bolsa Tipo Duffel', 
    icon: '🏋️', 
    isFixed: true, 
    hem: 8,
    allowedFabrics: ['yute', 'algodon', 'lienzo'],
    fixedMedidas: { width: 38, height: 17.5 },
    fixedPrices: { yute: 2898, algodon: 2100, lienzo: 2214 },
    hasTieredPricing: true
  },
  { 
    id: '3f', 
    name: 'Bolsa Tres Fuelles', 
    icon: '🛍️', 
    hem: 8, 
    allowCustomHandles: true,
    hasTieredPricing: true,
    previewImage: 'https://images.unsplash.com/photo-1591336373307-5ed7629b1bda?q=80&w=800&auto=format&fit=crop' 
  },
  { id: 'fa', name: 'Bolsa Fuelle Abajo', icon: '🔽', hem: 8, bottomGusset: true, allowCustomHandles: true, hasTieredPricing: true },
  { id: 'bp', name: 'Bolsa Playera', icon: '🏖️', hasCord: true, cordCost: 250, hem: 16, useSurplusForHandles: true, allowCustomHandles: true, hasTieredPricing: true },
  { id: 'tc', name: 'Bolsa Tipo Caramelo', icon: '🍬', hasCord: true, cordCost: 250, hem: 16, allowCustomHandles: false, hasTieredPricing: true },
  { id: 'ca', name: 'Bolsa Cordón Arriba', icon: '🧵', hasCord: true, cordCost: 250, hem: 8, allowCustomHandles: false, hasTieredPricing: true },
  { id: 'tm', name: 'Bolsa Tula Morral', icon: '🎒', hasCord: true, cordCost: 350, hem: 8, allowCustomHandles: false, hasTieredPricing: true },
  { id: 'tmt', name: 'Bolsa Tula Morral (Tafeta)', icon: '✨', hasCord: true, cordCost: 250, hem: 8, allowCustomHandles: false },
  { id: 'tmts', name: 'Bolsa Tula Morral Sublimada (Tafeta)', icon: '🎨', hasCord: true, cordCost: 250, hem: 8, allowCustomHandles: false },
  { id: '3fr', name: 'Bolsa Tres Fuelles Reforzada', icon: '💪', hem: 8, allowCustomHandles: true, hasTieredPricing: true },
  { id: 'fab', name: 'Bolsa Fuelle Abajo con Bolsillo', icon: '📂', bottomGusset: true, hem: 8, allowCustomHandles: true, hasTieredPricing: true },
  { id: 'fabr', name: 'Bolsa Fuelle Abajo con Bolsillo Reforzada', icon: '🛡️', bottomGusset: true, hem: 8, allowCustomHandles: true, hasTieredPricing: true },
  { id: 'ml', name: 'Bolsa Manos Libres', icon: '🚶', hem: 8, allowCustomHandles: true, hasTieredPricing: true },
];
