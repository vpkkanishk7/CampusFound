import type { Item, LostItem, FoundItem, User, Match, Notification, ChatConversation, ChatMessage } from '../../types';
import { findBestMatch, runMatchingEngine } from '../matchingEngine';


// Mock Data
export const mockUser: User = {
  id: 'u-1',
  fullName: 'Alex Johnson',
  email: 'alex.j@campus.edu',
  rollNumber: 'CS2024-042',
  phone: '555-0192',
};

let items: Item[] = [
  {
    id: 'LF-1024',
    userId: 'u-2',
    type: 'lost',
    title: 'Black Casio Calculator',
    category: 'Electronics',
    location: 'Library',
    date: '2023-10-25',
    description: 'Black calculator reported missing near the library study area.',
    status: 'active',
    createdAt: '2023-10-25T10:00:00Z',
    updatedAt: '2023-10-25T10:00:00Z',
    privateDetails: 'Has a small scratch on the bottom right corner.',
  } as LostItem,
  {
    id: 'LF-1025',
    userId: 'u-3',
    type: 'found',
    title: 'Blue Water Bottle',
    category: 'Accessories',
    location: 'Canteen',
    date: '2023-10-26',
    description: 'Found a blue metal water bottle on table 4.',
    status: 'active',
    createdAt: '2023-10-26T14:30:00Z',
    updatedAt: '2023-10-26T14:30:00Z',
    contactMethod: 'in-app',
  } as FoundItem
];

let matches: Match[] = [
  {
    id: 'm-1',
    lostItemId: 'LF-1024',
    foundItemId: 'LF-1099',
    confidenceScore: 94,
    status: 'pending',
    reasons: ['Same category', 'Same location', 'Similar date', 'Similar description'],
  }
];

let notifications: Notification[] = [
  {
    id: 'n-1',
    userId: 'u-1',
    type: 'match',
    title: 'Possible Match Found',
    message: 'Your lost calculator has a possible match. Confidence: 94%. Tap to review.',
    isRead: false,
    createdAt: new Date().toISOString(),
    relatedItemId: 'LF-1024',
    relatedMatchId: 'm-1',
  }
];

let mockConversations: ChatConversation[] = [
  {
    id: 'c-1',
    itemId: 'LF-1025',
    itemTitle: 'Blue Water Bottle',
    otherUser: {
      id: 'u-3',
      fullName: 'Rahul Sharma',
      rollNumber: 'CB.EN.U4CSE21105'
    },
    lastMessage: 'Hey! I think you found my blue bottle near the canteen?',
    updatedAt: '10:45 AM',
    unread: true
  },
  {
    id: 'c-2',
    itemId: 'LF-1024',
    itemTitle: 'Black Casio Calculator',
    otherUser: {
      id: 'u-2',
      fullName: 'Priya Nair',
      rollNumber: 'CB.EN.U4ECE21088'
    },
    lastMessage: 'AI matched your calculator! Where can we meet on campus?',
    updatedAt: 'Yesterday',
    unread: false
  }
];

let mockMessages: Record<string, ChatMessage[]> = {
  'c-1': [
    {
      id: 'm-101',
      conversationId: 'c-1',
      senderId: 'u-3',
      senderName: 'Rahul Sharma',
      text: 'Hey! I think you found my blue bottle near the canteen?',
      timestamp: '10:45 AM'
    }
  ],
  'c-2': [
    {
      id: 'm-102',
      conversationId: 'c-2',
      senderId: 'u-2',
      senderName: 'Priya Nair',
      text: 'AI matched your calculator! Where can we meet on campus?',
      timestamp: 'Yesterday'
    }
  ]
};

// Mock API Service
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async sendOtp(phone: string): Promise<boolean> {
    await delay(1000);
    console.log(`Sending OTP to ${phone}`);
    return true;
  },

  async verifyOtp(_phone: string, otp: string, userData?: Partial<User>): Promise<User> {
    await delay(1000);
    if (/^\d{6}$/.test(otp)) {
      if (userData) {
        Object.assign(mockUser, userData);
      }
      return mockUser;
    }
    throw new Error('Please enter a valid 6-digit OTP code.');
  },

  async getItems(type?: 'lost' | 'found'): Promise<Item[]> {
    await delay(800);
    if (type) return items.filter(i => i.type === type);
    return items;
  },
  
  async getItem(id: string): Promise<Item | undefined> {
    await delay(500);
    return items.find(i => i.id === id);
  },

  async createItem(item: Omit<Item, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    await delay(1200);
    const newItem: Item = {
      ...item,
      id: `LF-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Item;
    items = [newItem, ...items];
    return newItem;
  },

  async closeItem(_type: 'lost' | 'found', id: string): Promise<{ success: boolean; message: string }> {
    await delay(600);
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items = items.map(i => i.id === id ? { ...i, status: 'resolved', updatedAt: new Date().toISOString() } : i);
      return { success: true, message: 'Item marked as returned and resolved.' };
    }
    return { success: false, message: 'Item not found.' };
  },

  async getMatches(_userId: string): Promise<Match[]> {
    await delay(600);
    // Build live matches from the real engine
    const lostItems  = items.filter(i => i.type === 'lost');
    const foundItems = items.filter(i => i.type === 'found');
    const liveMatches: Match[] = [];

    for (const lost of lostItems) {
      const result = findBestMatch(lost, foundItems);
      if (result) {
        liveMatches.push({
          id: `m-${lost.id}-${result.matchedItem.id}`,
          lostItemId: lost.id,
          foundItemId: result.matchedItem.id,
          confidenceScore: result.finalScore,
          status: 'pending',
          reasons: result.reasons,
        });
      }
    }
    return liveMatches.length > 0 ? liveMatches : matches;
  },

  async getDsaExplanation(itemId: string): Promise<any> {
    await delay(400);

    const targetItem = items.find(i => i.id === itemId);
    if (!targetItem) return null;

    // Find candidates from the OPPOSITE pool
    const pool = items.filter(i => i.type !== targetItem.type && i.status !== 'resolved');

    if (pool.length === 0) return null;

    const allResults = runMatchingEngine(targetItem, pool);
    if (allResults.length === 0) return null;

    const best = allResults[0];

    // Surface notifications for meaningful matches
    const existingNotif = notifications.find(
      n => n.relatedItemId === itemId && n.type === 'match'
    );
    if (!existingNotif && best.hasMatch && targetItem.userId) {
      notifications.push({
        id: `n-match-${itemId}`,
        userId: targetItem.userId,
        type: 'match',
        title: 'Possible Match Found',
        message: `Your ${targetItem.type} item "${targetItem.title}" has a ${best.finalScore}% match. Tap to review.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        relatedItemId: itemId,
        relatedMatchId: best.matchedItem.id,
      });
    }

    return {
      // Matched item info
      matchedItem: best.matchedItem,
      queryItemTitle: targetItem.title,
      matchedItemTitle: best.matchedItem.title,
      matchedItemId: best.matchedItem.id,
      matchedItemUserId: best.matchedItem.userId,
      hasMatch: best.hasMatch,

      // Scores
      dsaScore: best.dsaScore,
      aiScore: best.aiScore,
      finalScore: best.finalScore,
      matchScore: best.matchScore,

      // Breakdown
      categoryScore: best.categoryScore,
      locationScore: best.locationScore,
      titleScore: best.titleScore,
      dateScore: best.dateScore,
      descriptionScore: best.descriptionScore,
      stringSimilarity: best.stringSimilarity,

      // Pipeline metrics
      candidateCountBeforeHashMap: best.candidateCountBeforeHashMap,
      candidateCountAfterHashMap: best.candidateCountAfterHashMap,
      heapRank: best.heapRank,
      reasons: best.reasons,
      algorithmSteps: best.algorithmSteps,

      // All ranked matches (for future use)
      allMatches: allResults.map(r => ({
        foundItemId: r.matchedItem.id,
        foundItem: r.matchedItem,
        score: r.finalScore,
      })),
    };
  },

  async submitClaim(
    _matchId: string,
    _lostItemId: string,
    _submittedDetail: string,
    _foundItemId?: string
  ): Promise<{ success: boolean; verified: boolean; message: string }> {
    await delay(1000);
    // Simulate a successful verification
    return { success: true, verified: true, message: 'Ownership verified. Contact request has been sent to the finder.' };
  },

  async requestContact(_matchId: string, _finderId: string): Promise<{ success: boolean; message: string }> {
    await delay(500);
    return { success: true, message: 'Contact request sent to finder.' };
  },

  async approveContactRequest(requestId: string): Promise<{ success: boolean; status: string; message?: string; contactInfo?: any }> {
    await delay(600);
    // Update the relevant match status
    matches = matches.map(m =>
      m.id === requestId ? { ...m, status: 'contact_shared' as const } : m
    );
    return { success: true, status: 'approved', message: 'Contact info has been shared with the claimant.' };
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    await delay(400);
    return notifications.filter(n => n.userId === userId);
  },
  
  async markNotificationRead(id: string): Promise<void> {
    notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
  },

  async getConversations(): Promise<ChatConversation[]> {
    await delay(400);
    return mockConversations;
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    await delay(300);
    return mockMessages[conversationId] || [];
  },

  async sendMessage(conversationId: string, text: string, senderId: string, senderName: string): Promise<ChatMessage> {
    await delay(200);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (!mockMessages[conversationId]) mockMessages[conversationId] = [];
    mockMessages[conversationId].push(newMsg);
    
    // Update last message in conversation
    mockConversations = mockConversations.map(c => 
      c.id === conversationId ? { ...c, lastMessage: text, updatedAt: newMsg.timestamp, unread: false } : c
    );
    return newMsg;
  },

  async askAiChatbot(prompt: string): Promise<string> {
    await delay(1000);
    const lower = prompt.toLowerCase();
    
    if (lower.includes('calculator') || lower.includes('casio')) {
      return "🤖 **Amrita AI**: I found a matching report! A 'Black Casio Calculator' was reported missing near the Library. Check the Missing Registry or your notifications for a 94% match!";
    }
    if (lower.includes('bottle') || lower.includes('water')) {
      return "🤖 **Amrita AI**: A 'Blue Water Bottle' was found at the Canteen on Table 4. You can claim it in the Recovered Archive!";
    }
    if (lower.includes('id') || lower.includes('card') || lower.includes('roll')) {
      return "🤖 **Amrita AI**: ID Cards lost on campus are safely handed over to the Campus Security Office near the Main Gate. Please bring your Roll Number proof.";
    }
    if (lower.includes('how') || lower.includes('claim') || lower.includes('work')) {
      return "🤖 **Amrita AI**: To claim an item: 1. Go to Recovered Archive. 2. Click on the item. 3. Enter your private verification detail. 4. Our AI will analyze the match confidence and connect you with the finder!";
    }
    return `🤖 **Amrita AI (Gemini Powered)**: Thanks for reaching out! I searched our Amrita Vishwa Vidyapeetham database regarding "${prompt}". I recommend checking the Missing Registry or posting a report if you lost something recently!`;
  }
};
