export enum UserRole {
  ADMIN_TOTAL = 'ADMIN_TOTAL',
  ADMIN_PARCIAL = 'ADMIN_PARCIAL',
  STAFF = 'STAFF'
}

export type OrderStatus = 
  | 'PROFORMA' 
  | 'CONFIRMADA' 
  | 'EN_PROCESO' 
  | 'ENTREGADO' 
  | 'EN_DESARROLLO' 
  | 'POR_RETIRAR' 
  | 'INGRESO_PARCIAL' 
  | 'RETIRO_EXITOSO'
  | 'ANULADO'
  | 'ARCHIVADO';

export interface ActionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  void: boolean;
  print: boolean;
}

export interface UserPermissions {
  [key: string]: ActionPermissions;
}

export interface CompanyData {
  id: string;
  fantasyName: string;
  ruc: string;
  legalRep: string;
  regime: 'RIMPE_POPULAR' | 'RIMPE_EMPRENDEDOR' | 'GENERAL';
  taxAddress: string;
  phoneFixed: string;
  phoneMobile: string;
  email: string;
  logoUrl?: string;
  conditionsFileUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  identification: string; 
  address: string;
  phone: string;
  email: string;
  createdAt: number;
}

export interface Product {
  id: string;
  code: string; 
  name: string;
  brand: string;
  stock: number;
  rentalPrice: number;
  replacementPrice: number;
  imageUrl?: string;
  history: { date: number; action: string; user: string; quantity?: number }[];
}

export interface OrderItem {
  productId: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  isService?: boolean;
}

export interface NoveltyItem {
  productId: string;
  name: string;
  quantityAffected: number;
  replacementPrice: number;
  resolved: boolean;
}

export interface PaymentRecord {
  id: string;
  date: number;
  amount: number;
  received: number;
  change: number;
  type: 'CONTADO' | 'PARCIAL' | 'CREDITO' | 'NOVEDAD';
  method: 'EFECTIVO' | 'CHEQUE' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CREDITO_TOTAL';
  bank?: 'BANCO_AUSTRO' | 'BANCO_GUAYAQUIL';
  checkInfo?: {
    client: string;
    bank: string;
    number: string;
    account: string;
    obs: string;
  };
  user: string;
}

export interface CashTransaction {
  id: string;
  orderId?: string;
  amount: number;
  change: number;
  type: 'INCOME' | 'EXPENSE';
  category: 'VENTA' | 'CARTERA' | 'GASTO' | 'CAJA_CHICA' | 'REPOSICION';
  reason?: string;
  beneficiary?: string;
  method: string;
  date: number;
  user: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  status: OrderStatus;
  orderDate: number; 
  eventDateStart: number;
  eventDateEnd: number;
  rentalDays: number;
  items: OrderItem[];
  noveltyItems?: NoveltyItem[];
  hasTransport: boolean;
  transportValue: number;
  deliveryAddress?: string;
  discountType: 'PERCENTAGE' | 'NOMINAL';
  discountValue: number;
  subtotal: number;
  tax: number; 
  total: number;
  paidAmount: number;
  ebNumber?: string;
  logisticsType: 'CON_TRANSPORTE' | 'SIN_TRANSPORTE';
  dispatchState?: 'CARGADO' | 'ENTREGADO_BODEGA' | 'ENTREGADO_DOMICILIO';
  nuisances?: string;
  nuisancesResolved?: boolean;
  payments: PaymentRecord[];
  createdBy: string;
  archivedAt?: number;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  status: 'ACTIVO' | 'INACTIVO';
  mustChangePassword: boolean;
  permissions: UserPermissions;
  createdAt: number;
}