export type UserRole = "learner" | "employer" | "admin";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Profile {
  userId: string;
  headline: string;
  bio: string;
  phone: string;
  location: string;
  skills: string[];
  /** Learner CV data for builder sync */
  cvData: CvData | null;
  updatedAt: string;
}

export interface CvData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  lessonIds: string[];
  createdAt: string;
}

export interface Progress {
  userId: string;
  lessonId: string;
  completedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
}

export type ApplicationStatus = "pending" | "reviewed" | "shortlisted" | "rejected";

export interface Job {
  id: string;
  employerId: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  learnerId: string;
  coverLetter: string;
  status: ApplicationStatus;
  createdAt: string;
}

export type ResourceType = "pdf" | "link" | "video";

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  description: string;
  createdAt: string;
}

export type NotificationKind =
  | "job_posted"
  | "application_received"
  | "application_status"
  | "course_completed"
  | "certificate_issued";

export interface Notification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, string>;
}
