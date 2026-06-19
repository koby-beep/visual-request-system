export type VisualType = 'SMM ad' | 'PPC ad' | 'Poster' | 'Landing page';
export type VisualFormat = 'static' | 'video';
export type Status = 'pending' | 'approved' | 'rejected' | 'in-progress' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface Visual {
  size: string;
  content: string;
  referenceUrl: string;
  referenceImage: string;
  logoOnVisual: boolean;
  sensitiveElement: boolean;
}

export interface VisualRequest {
  id: string;
  requester: string;
  brand: string;
  type: VisualType;
  format: VisualFormat;
  visuals: Visual[];
  date: string;
  status: Status;
  created: string;
  adminNote?: string;
  deliverables?: string[];
  assignedTo?: string;
  rating?: number;
}

export interface Designer {
  id: string;
  name: string;
  username: string;
  password: string;
}
