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
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile } from "./auth";
import { messagesApi, roomRequestsApi } from "./api";

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
  status: "active" | "pending" | "removed" | "booked";
  createdAt: string;
  bookedAt?: string | null;
  bookedBySeekerId?: string | null;
  bookedRequestId?: string | null;
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

export async function deleteSavedListingsForListing(listingId: string): Promise<void> {
  const q = query(collection(db, "saved_listings"), where("listingId", "==", listingId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function removeListing(listingId: string): Promise<void> {
  await deleteSavedListingsForListing(listingId);
  await deleteDoc(doc(db, "listings", listingId));
}

export async function updateListingStatus(id: string, status: "active" | "removed" | "booked"): Promise<void> {
  if (status === "removed") {
    await deleteSavedListingsForListing(id);
    await updateDoc(doc(db, "listings", id), { status: "removed" });
    return;
  }
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
  const ids: string[] = [];

  for (const savedDoc of snap.docs) {
    const listingId = savedDoc.data().listingId as string;
    const listingSnap = await getDoc(doc(db, "listings", listingId));

    if (listingSnap.exists() && listingSnap.data()?.status === "active") {
      ids.push(listingId);
    } else {
      await deleteDoc(savedDoc.ref);
    }
  }

  return ids;
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

export async function expressInterest(
  seekerId: string,
  hostId: string,
  listingId: string,
  options?: { seekerName?: string; listingLabel?: string }
): Promise<void> {
  const listingSnap = await getDoc(doc(db, "listings", listingId));
  if (!listingSnap.exists() || listingSnap.data()?.status !== "active") {
    throw new Error("This room is no longer available.");
  }

  const ref = doc(db, "interests", `${seekerId}_${listingId}`);
  await setDoc(ref, {
    seekerId,
    hostId,
    listingId,
    createdAt: new Date().toISOString(),
  });

  const listingLabel = options?.listingLabel || "your room";
  await ensureConversation(seekerId, hostId, { listingId, listingLabel });

  if (options?.seekerName) {
    await sendMessage(
      seekerId,
      options.seekerName,
      hostId,
      `Hi, I expressed interest in ${listingLabel}. I would love to connect about this room.`
    );
  }
}

export async function hasSeekerExpressedInterest(seekerId: string, listingId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "interests", `${seekerId}_${listingId}`));
  return snap.exists();
}

export async function hasListingInterests(listingId: string): Promise<boolean> {
  const q = query(collection(db, "interests"), where("listingId", "==", listingId));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function getInterestedListingIds(hostId: string): Promise<Set<string>> {
  const q = query(collection(db, "interests"), where("hostId", "==", hostId));
  const snap = await getDocs(q);
  return new Set(
    snap.docs
      .map((d) => d.data().listingId as string | null)
      .filter((id): id is string => Boolean(id))
  );
}

export interface InterestRecord {
  seekerId: string;
  hostId: string;
  listingId: string | null;
  createdAt: string;
}

export async function getHostInterests(hostId: string): Promise<InterestRecord[]> {
  const q = query(collection(db, "interests"), where("hostId", "==", hostId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InterestRecord);
}

export interface SeekerInterest {
  listingId: string;
  hostId: string;
  createdAt: string;
  listing: Listing | null;
}

export async function getSeekerInterests(seekerId: string): Promise<SeekerInterest[]> {
  const q = query(collection(db, "interests"), where("seekerId", "==", seekerId));
  const snap = await getDocs(q);

  const interests = await Promise.all(
    snap.docs.map(async (interestDoc) => {
      const data = interestDoc.data();
      const listingId = data.listingId as string | null;
      if (!listingId) return null;

      const listingSnap = await getDoc(doc(db, "listings", listingId));
      const listing = listingSnap.exists()
        ? ({ id: listingSnap.id, ...listingSnap.data() } as Listing)
        : null;

      return {
        listingId,
        hostId: data.hostId as string,
        createdAt: data.createdAt as string,
        listing,
      };
    })
  );

  return interests.filter((interest): interest is SeekerInterest => interest !== null);
}

export interface SeekerStats {
  savedCount: number;
  interestCount: number;
  availableRooms: number;
}

export async function getSeekerStats(seekerId: string): Promise<SeekerStats> {
  const [savedIds, interests, listings] = await Promise.all([
    getSavedListingIds(seekerId),
    getSeekerInterests(seekerId),
    getListings(),
  ]);

  return {
    savedCount: savedIds.length,
    interestCount: interests.length,
    availableRooms: listings.length,
  };
}

export async function updateUserVerification(uid: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { verified });
}

export interface HostInterestEntry {
  interest: InterestRecord;
  seeker: UserProfile | null;
  listing: Listing | null;
}

export async function getHostInterestEntries(hostId: string): Promise<HostInterestEntry[]> {
  const interests = await getHostInterests(hostId);

  return Promise.all(
    interests.map(async (interest) => {
      const [seeker, listingSnap] = await Promise.all([
        getUserProfile(interest.seekerId),
        interest.listingId
          ? getDoc(doc(db, "listings", interest.listingId))
          : Promise.resolve(null),
      ]);

      const listing = listingSnap?.exists()
        ? ({ id: listingSnap.id, ...listingSnap.data() } as Listing)
        : null;

      return { interest, seeker, listing };
    })
  );
}

export async function getInterestedSeekers(hostId: string): Promise<UserProfile[]> {
  const interests = await getHostInterests(hostId);
  const uniqueSeekerIds = [...new Set(interests.map((interest) => interest.seekerId))];
  const seekers = await Promise.all(uniqueSeekerIds.map((id) => getUserProfile(id)));
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
  lastSenderId?: string | null;
  listingId?: string | null;
  listingLabel?: string | null;
  createdAt: string;
}

export async function ensureConversation(
  _userId1: string,
  userId2: string,
  meta?: { listingId?: string; listingLabel?: string }
): Promise<string> {
  const response = await messagesApi.ensureConversation({
    recipientId: userId2,
    listingId: meta?.listingId,
    listingLabel: meta?.listingLabel,
  });
  return response.conversationId;
}

export async function sendMessage(senderId: string, senderName: string, recipientId: string, content: string): Promise<void> {
  await messagesApi.send({ recipientId, content, senderName });
}

export async function getConversations(_userId: string): Promise<Conversation[]> {
  return messagesApi.getConversations();
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return messagesApi.getMessages(conversationId);
}

function sortConversations(conversations: Conversation[]): Conversation[] {
  return conversations.sort(
    (a, b) =>
      new Date(b.lastMessageAt || b.createdAt).getTime() -
      new Date(a.lastMessageAt || a.createdAt).getTime()
  );
}

function sortMessages(messages: Message[]): Message[] {
  return messages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const q = query(collection(db, "conversations"), where("participants", "array-contains", userId));
  return onSnapshot(
    q,
    (snap) => {
      const conversations = sortConversations(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation)
      );
      callback(conversations);
    },
    () => {
      messagesApi.getConversations().then((conversations) => callback(sortConversations(conversations)));
    }
  );
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  return onSnapshot(
    collection(db, "conversations", conversationId, "messages"),
    (snap) => {
      const messages = sortMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message));
      callback(messages);
    },
    () => {
      messagesApi.getMessages(conversationId).then((messages) => callback(sortMessages(messages)));
    }
  );
}

// ─── Room Requests (Visit / Book) ─────────────────────────────────────────────

export type RoomRequestType = "visit" | "book";
export type RoomRequestStatus = "pending" | "confirmed" | "declined" | "cancelled" | "refund_requested" | "refunded";

export type PaymentStatus = "paid";

export interface RoomRequest {
  id: string;
  seekerId: string;
  seekerName: string;
  hostId: string;
  listingId: string;
  listingLabel: string;
  type: RoomRequestType;
  scheduledDate: string;
  scheduledTime: string;
  status: RoomRequestStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  paymentStatus?: PaymentStatus;
  rentPerWeek?: number;
  rentWeeks?: number;
  firstWeekRent?: number;
  bondAmount?: number;
  totalPaid?: number;
  paidAt?: string;
}

export interface BookedRoom {
  request: RoomRequest;
  listing: Listing | null;
}

function isPaidBooking(request: RoomRequest): boolean {
  return (
    request.type === "book" &&
    request.paymentStatus === "paid" &&
    request.status !== "cancelled" &&
    request.status !== "declined" &&
    request.status !== "refunded"
  );
}

async function enrichBookedRooms(requests: RoomRequest[]): Promise<BookedRoom[]> {
  const booked = requests.filter(isPaidBooking);
  return Promise.all(
    booked.map(async (request) => {
      const listingSnap = await getDoc(doc(db, "listings", request.listingId));
      const listing = listingSnap.exists()
        ? ({ id: listingSnap.id, ...listingSnap.data() } as Listing)
        : null;
      return { request, listing };
    })
  );
}

export async function createRoomRequest(
  data: Omit<RoomRequest, "id" | "status" | "createdAt">
): Promise<RoomRequest> {
  const response = await roomRequestsApi.create({
    hostId: data.hostId,
    listingId: data.listingId,
    listingLabel: data.listingLabel,
    type: data.type,
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    notes: data.notes,
    seekerName: data.seekerName,
    paymentStatus: data.paymentStatus,
    rentPerWeek: data.rentPerWeek,
    rentWeeks: data.rentWeeks,
    firstWeekRent: data.firstWeekRent,
    bondAmount: data.bondAmount,
    totalPaid: data.totalPaid,
    paidAt: data.paidAt,
  });
  return response.request;
}

export async function getSeekerBookedRooms(seekerId: string): Promise<BookedRoom[]> {
  const requests = await getUserRoomRequests(seekerId, "seeker");
  return enrichBookedRooms(requests);
}

export function subscribeToBookedRooms(
  seekerId: string,
  callback: (rooms: BookedRoom[]) => void
): () => void {
  return subscribeToRoomRequests(seekerId, "seeker", (requests) => {
    enrichBookedRooms(requests).then(callback);
  });
}

export async function getUserRoomRequests(_userId: string, role: "host" | "seeker"): Promise<RoomRequest[]> {
  return roomRequestsApi.getMine(role);
}

export function subscribeToRoomRequests(
  userId: string,
  role: "host" | "seeker",
  callback: (requests: RoomRequest[]) => void
): () => void {
  const field = role === "host" ? "hostId" : "seekerId";
  const q = query(collection(db, "room_requests"), where(field, "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const requests = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as RoomRequest)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(requests);
    },
    () => {
      roomRequestsApi.getMine(role).then(callback);
    }
  );
}

export async function updateRoomRequestStatus(
  requestId: string,
  status: RoomRequestStatus,
  _actorId: string,
  _actorName: string,
  _recipientId: string,
  _listingLabel: string
): Promise<void> {
  await roomRequestsApi.updateStatus(requestId, status);
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  type:
    | "signup"
    | "new_listing"
    | "room_visit_request"
    | "room_booking_request"
    | "booking_confirmed"
    | "visit_confirmed"
    | "refund_requested"
    | "refunded"
    | "request_declined"
    | "request_cancelled"
    | "report";
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
  booked: number;
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
    booked: listings.filter((l) => l.status === "booked").length,
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
