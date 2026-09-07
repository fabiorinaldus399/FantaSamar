export interface Action {
  id: string;
  name: string;
  points: number; // Cipolle
  type: 'positive' | 'negative';
  scope: 'single' | 'group'; // 'single' = applicabile al singolo membro, 'group' = applicabile a tutti i 7
  createdBy: string; // userId
  createdAt: Date;
  isGlobal: boolean;
}
