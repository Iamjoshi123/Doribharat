export interface ContactDetails {
  name: string;
  phone: string;
  email?: string;
}

export interface LineItem {
  productId: string;
  name?: string;
  quantity: number;
  price?: number;
  notes?: string;
}
