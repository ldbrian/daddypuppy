export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  memoryId: string;
  // Define or import the Role type
    role: 'admin' | 'user' | 'guest'; // Example definition
}
