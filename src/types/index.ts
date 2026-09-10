export interface User {
  id: string;
  fullName: string;
  email: string;
  collegeEmail?: string;
  rollNumber: string;
  phone: string;
  phoneVerified?: number | boolean;
}

export type ItemCategory = 
  | 'Electronics'
  | 'ID Cards'
  | 'Books'
  | 'Stationery'
  | 'Accessories'
  | 'Wallet / Money'
  | 'Keys'
  | 'Clothing'
  | 'Documents'
  | 'Other';

export type Location = 
  | 'Library'
  | 'Canteen'
  | 'Classroom'
  | 'Lab'
  | 'Hostel'
  | 'Auditorium'
  | 'Sports Ground'
  | 'Parking Area'
  | 'Bus Area'
  | 'Other';

export type ItemStatus = 'active' | 'matched' | 'claimed' | 'returned' | 'resolved';

export interface BaseItem {
  id: string;
  userId: string;
  title: string;
  category: ItemCategory;
  brand?: string;
  color?: string;
  date: string;
  approxTime?: string;
  location: Location;
  description: string;
  imageUrl?: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LostItem extends BaseItem {
  type: 'lost';
  privateDetails: string; // Only visible to the owner and during claim verification
}

export interface FoundItem extends BaseItem {
  type: 'found';
  contactMethod: 'in-app' | 'phone' | 'email';
}

export type Item = LostItem | FoundItem;

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  confidenceScore: number;
  status: 'pending' | 'contact_requested' | 'contact_shared' | 'resolved' | 'rejected';
  reasons: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'claim_request' | 'status_update' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedItemId?: string;
  relatedMatchId?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
}

export interface ChatConversation {
  id: string;
  itemId: string;
  itemTitle: string;
  otherUser: {
    id: string;
    fullName: string;
    rollNumber: string;
  };
  lastMessage: string;
  updatedAt: string;
  unread: boolean;
}
