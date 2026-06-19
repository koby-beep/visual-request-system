export type VisualType = 'SMM ad' | 'PPC ad' | 'Poster' | 'Landing page' | 'Video';
export type Status = 'pending' | 'in-progress' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface Visual {
  size: string;
  content: string;
  referenceUrl: string;
  referenceImage: string;
}

export interface VisualRequest {
  id: string;
  requester: string;
  brand: string;
  logoOnVisual: boolean;
  type: VisualType;
  visuals: Visual[];
  date: string;
  status: Status;
  created: string;
}
