export interface MemberPoints {
  memberId: number;
  totalPoints: number; // Cipolle totali
  actions: ActionRecord[];
}

export interface ActionRecord {
  actionId: string;
  actionName: string;
  points: number;
  appliedAt: Date;
}
