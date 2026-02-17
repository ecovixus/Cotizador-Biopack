
export interface Fabric {
  id: string;
  name: string;
  price: number;
  width: number;
  length: number;
  description?: string;
  bestFor?: string[];
}

export interface Reference {
  id: string;
  name: string;
  icon: string;
  hasCord?: boolean;
  cordCost?: number;
  hem: number;
  previewImage?: string;
  bottomGusset?: boolean;
  useSurplusForHandles?: boolean;
  isFixed?: boolean;
  isUniqueGusset?: boolean;
  allowCustomHandles?: boolean;
  hasTieredPricing?: boolean;
  allowedFabrics?: string[];
  fixedMedidas?: { width: number; height: number };
  fixedPrices?: Record<string, number>;
}

export interface FormData {
  reference: string;
  material: string;
  height: number;
  width: number;
  gusset: number;
  handleLength: number;
  handleWidth: number;
  includeHandles: boolean;
  purpose: string;
  quantity: number;
}

export interface CalculationResult {
  cutHeight: number;
  cutWidth: number;
  mainPieceArea: number;
  fabricTotalArea: number;
  costPerCm2: number;
  unitsPerBatch: number;
  fabricCostPerUnit: number;
  handleCostPerUnit: number;
  cordCost: number;
  surchargePerUnit: number;
  finalPriceUnit: number;
  rawTotalOrder: number;
  roundedTotalOrder: number;
  qty: number;
}
