import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile } from "./auth";

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, "users", profile.uid), {
    ...profile,
    profileViews: 0,
    createdAt: new Date().toISOString(),
  });

  await addActivityLog("signup", `New ${profile.role} joined: ${profile.fullName}`);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, "users", uid), data as Record<string, unknown>);
}

export async function incrementProfileViews(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { profileViews: increment(1) });
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function updateUserStatus(uid: string, status: "active" | "suspended"): Promise<void> {
  await updateDoc(doc(db, "users", uid), { status });
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export interface Listing {
  id: string;
  hostId: string;
  hostName: string;
  hostAge?: number | null;
  hostPhotoUrl?: string | null;
  suburb: string;
  state: string;
  spareRooms: number;
  roomSize: "single" | "double";
  rentPerWeek: number;
  billsIncluded: boolean;
  bathroomType: "private" | "shared";
  furnished: boolean;
  availableFrom?: string | null;
  houseRules?: string | null;
  photoUrl?: string | null;
  photoUrls?: string[] | null;
  status: "active" | "pending" | "removed";
  createdAt: string;
}

export async function createListing(data: Omit<Listing, "id" | "createdAt">): Promise<Listing> {
  const ref = await addDoc(collection(db, "listings"), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  await addActivityLog("new_listing", `New listing posted in ${data.suburb}, ${data.state} - $${data.rentPerWeek}/week`);
  return { ...data, id: ref.id, createdAt: new Date().toISOString() };
}

export async function getListings(filters?: { suburb?: string; maxRent?: number }): Promise<Listing[]> {
  const q = query(collection(db, "listings"), where("status", "==", "active"));
  const snap = await getDocs(q);
  let listings = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing);
  if (filters?.suburb) {
    listings = listings.filter((l) => l.suburb.toLowerCase().includes(filters.suburb!.toLowerCase()));
  }
  if (filters?.maxRent) {
    listings = listings.filter((l) => l.rentPerWeek <= filters.maxRent!);
  }
  return listings;
}

export async function getHostListing(hostId: string): Promise<Listing | null> {
  const q = query(collection(db, "listings"), where("hostId", "==", hostId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Listing;
}

export async function updateListing(id: string, data: Partial<Listing>): Promise<void> {
  await updateDoc(doc(db, "listings", id), data as Record<string, unknown>);
}

export async function updateListingStatus(id: string, status: "active" | "removed"): Promise<void> {
  await updateDoc(doc(db, "listings", id), { status });
}

export async function getAllListings(): Promise<Listing[]> {
  const snap = await getDocs(collection(db, "listings"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing);
}

// ─── Saved Listings ───────────────────────────────────────────────────────────

export async function toggleSavedListing(userId: string, listingId: string): Promise<boolean> {
  const ref = doc(db, "saved_listings", `${userId}_${listingId}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  } else {
    await setDoc(ref, {
      userId,
      listingId,
      createdAt: new Date().toISOString(),
    });
    return true;
  }
}

export async function isListingSaved(userId: string, listingId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "saved_listings", `${userId}_${listingId}`));
  return snap.exists();
}

export async function getSavedListingIds(userId: string): Promise<string[]> {
  const q = query(collection(db, "saved_listings"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().listingId as string);
}

export async function getSavedListings(userId: string): Promise<Listing[]> {
  const ids = await getSavedListingIds(userId);
  if (ids.length === 0) return [];
  const listings = await Promise.all(
    ids.map((id) => getDoc(doc(db, "listings", id)))
  );
  return listings
    .map((snap) => (snap.exists() ? ({ id: snap.id, ...snap.data() } as Listing) : null))
    .filter(Boolean) as Listing[];
}

// ─── Interests ────────────────────────────────────────────────────────────────

export async function expressInterest(seekerId: string, hostId: string, listingId?: string): Promise<void> {
  const ref = doc(db, "interests", `${seekerId}_${hostId}`);
  await setDoc(ref, { seekerId, hostId, listingId: listingId || null, createdAt: new Date().toISOString() });
}

export async function updateUserVerification(uid: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { verified });
}

export async function getInterestedSeekers(hostId: string): Promise<UserProfile[]> {
  const q = query(collection(db, "interests"), where("hostId", "==", hostId));
  const snap = await getDocs(q);
  const seekerIds = snap.docs.map((d) => d.data().seekerId as string);
  const seekers = await Promise.all(seekerIds.map((id) => getUserProfile(id)));
  return seekers.filter(Boolean) as UserProfile[];
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
}

function conversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export async function sendMessage(senderId: string, senderName: string, recipientId: string, content: string): Promise<void> {
  const convId = conversationId(senderId, recipientId);
  const convRef = doc(db, "conversations", convId);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) {
    await setDoc(convRef, {
      participants: [senderId, recipientId],
      createdAt: new Date().toISOString(),
      lastMessage: content,
      lastMessageAt: new Date().toISOString(),
    });
  } else {
    await updateDoc(convRef, { lastMessage: content, lastMessageAt: new Date().toISOString() });
  }
  await addDoc(collection(db, "conversations", convId, "messages"), {
    conversationId: convId,
    senderId,
    senderName,
    content,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const q = query(collection(db, "conversations"), where("participants", "array-contains", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const snap = await getDocs(collection(db, "conversations", conversationId, "messages"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message).sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  type: "signup" | "new_listing" | "report";
  description: string;
  createdAt: string;
}

export async function addActivityLog(type: ActivityLog["type"], description: string): Promise<void> {
  await addDoc(collection(db, "activity_logs"), {
    type,
    description,
    createdAt: new Date().toISOString(),
  });
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const snap = await getDocs(collection(db, "activity_logs"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ActivityLog)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(userId: string, role: string) {
  const profile = await getUserProfile(userId);
  const profileFields = [profile?.gender, profile?.suburb, profile?.state, profile?.phone, profile?.bio, profile?.smokes, profile?.hasPets, profile?.lifestyle, profile?.communicationStyle];
  const filled = profileFields.filter((f) => f !== null && f !== undefined).length;
  const profileCompletionPercent = Math.round((filled / profileFields.length) * 100);

  const convs = await getConversations(userId);
  let messageCount = 0;
  for (const conv of convs) {
    const msgs = await getMessages(conv.id);
    messageCount += msgs.filter((m) => m.senderId !== userId && !m.isRead).length;
  }

  const savedIds = role === "seeker" ? await getSavedListingIds(userId) : [];
  const interests = role === "host" ? await getInterestedSeekers(userId) : [];

  return {
    profileCompletionPercent,
    messageCount,
    profileViews: profile?.profileViews || 0,
    savedListingsCount: savedIds.length,
    interestedSeekersCount: interests.length,
  };
}

export interface HostStats {
  total: number;
  active: number;
  pending: number;
  removed: number;
  totalViews: number;
}

export async function getHostStats(hostId: string): Promise<HostStats> {
  const q = query(collection(db, "listings"), where("hostId", "==", hostId));
  const snap = await getDocs(q);
  const listings = snap.docs.map((d) => d.data() as Listing);
  
  return {
    total: listings.length,
    active: listings.filter((l) => l.status === "active").length,
    pending: listings.filter((l) => l.status === "pending").length,
    removed: listings.filter((l) => l.status === "removed").length,
    totalViews: 0,
  };
}

export interface LocationStats {
  location: string;
  count: number;
}

export async function getListingsByLocation(hostId?: string): Promise<LocationStats[]> {
  let q = hostId
    ? query(collection(db, "listings"), where("hostId", "==", hostId))
    : query(collection(db, "listings"), where("status", "==", "active"));
  const snap = await getDocs(q);
  const listings = snap.docs.map((d) => d.data() as Listing);
  
  const locationMap = new Map<string, number>();
  listings.forEach((l) => {
    const location = l.state; // Group by state only
    locationMap.set(location, (locationMap.get(location) || 0) + 1);
  });
  
  return Array.from(locationMap, ([location, count]) => ({ location, count })).sort(
    (a, b) => b.count - a.count
  );
}
