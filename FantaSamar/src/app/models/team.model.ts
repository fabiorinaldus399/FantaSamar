import { MemberPoints } from './member-points.model';
export type { MemberPoints };

export interface ActionRecord {
  actionId: string;
  actionName: string;
  points: number;
  appliedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  userId: string;
  memberIds: number[]; // Array di 5 IDs dei members di SAMAR
  memberPoints: MemberPoints[];
  createdAt: Date;
  updatedAt: Date;
}
