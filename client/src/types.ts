export type UserRole = "learner" | "employer" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  lessonCount: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
}

export interface CourseDetail extends Omit<CourseListItem, "lessonCount"> {
  lessons: Lesson[];
  lessonIds?: string[];
}

export interface JobItem {
  id: string;
  employerId: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  createdAt: string;
  employerName?: string;
}

export interface ApplicationItem {
  id: string;
  jobId: string;
  learnerId: string;
  coverLetter: string;
  status: string;
  createdAt: string;
  jobTitle?: string;
  learnerName?: string;
  learnerEmail?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: "pdf" | "link" | "video";
  url: string;
  description: string;
  createdAt: string;
}

export interface CertificateItem {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  courseTitle?: string;
}

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
