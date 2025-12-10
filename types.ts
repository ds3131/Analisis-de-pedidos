
export interface RawRow {
  [key: string]: any;
}

export interface ProcessedRow {
  docId: string;
  status: string;
  groupName: string;
  district: string; // Condado
  salesRep: string; // Nombre de empleado
  totalAmount: number;
  itemId: string;
  itemDesc: string;
  quantity: number;
  clientName: string; // Nombre de cliente/proveedor
  destination: string; // Destino
}

export interface PivotData {
  rowKey: string; // Can be District or Item ID
  rowLabel?: string; // Additional description (e.g., Item Name)
  total: number;
  values: {
    [salesRep: string]: number;
  };
}

export interface ReportResult {
  columns: string[]; // List of sales reps (columns)
  data: PivotData[];
  grandTotal: number;
}

export enum ReportType {
  ORDER_COUNT = 'ORDER_COUNT',
  NET_AMOUNT = 'NET_AMOUNT',
  PRODUCT_LIST = 'PRODUCT_LIST',
  CLIENT_SEARCH = 'CLIENT_SEARCH',
}
