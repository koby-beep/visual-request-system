export type VisualType = 'SMM ad' | 'PPC ad' | 'Poster' | 'Landing page';
export type VisualFormat = 'static' | 'video';
export type Status = 'pending' | 'approved' | 'rejected' | 'in-progress' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface Visual {
  // static fields
  size: string;
  mainTitle: string;
  subTitle: string;
  bodyText: string;
  logoOnVisual: boolean;
  sensitiveElement: boolean;
  ctaButton: boolean;
  ctaText: string;
  // video fields
  videoSizes: string[];
  customVideoSize: string;
  description: string;
  script: string;
  textInVideo: string;
  subtitle: boolean;
  // shared
  referenceUrl: string;
  referenceImage: string;
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
  requesterRating?: number;
}

export interface Designer {
  id: string;
  name: string;
  username: string;
  password: string;
}
