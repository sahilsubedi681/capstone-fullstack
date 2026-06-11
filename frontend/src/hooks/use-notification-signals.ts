import { useEffect, useMemo, useState } from "react";
import {
  subscribeToConversations,
  subscribeToRoomRequests,
  type Conversation,
  type RoomRequest,
} from "@/lib/firestore";

const SEEN_MESSAGES_KEY = "seen-message-times";
const SEEN_REQUESTS_KEY = "seen-request-updates";

function getSeenMessageTimes(userId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(`${SEEN_MESSAGES_KEY}-${userId}`) || "{}");
  } catch {
    return {};
  }
}

export function markConversationSeen(userId: string, conversationId: string, lastMessageAt?: string | null) {
  const seen = getSeenMessageTimes(userId);
  seen[conversationId] = lastMessageAt || new Date().toISOString();
  localStorage.setItem(`${SEEN_MESSAGES_KEY}-${userId}`, JSON.stringify(seen));
}

export function getSeenRequestTime(userId: string): string {
  return localStorage.getItem(`${SEEN_REQUESTS_KEY}-${userId}`) || "";
}

export function markRequestsSeen(userId: string) {
  localStorage.setItem(`${SEEN_REQUESTS_KEY}-${userId}`, new Date().toISOString());
}

export function isConversationUnread(userId: string, conversation: Conversation): boolean {
  if (!conversation.lastMessageAt || !conversation.lastSenderId) return false;
  if (conversation.lastSenderId === userId) return false;
  const seen = getSeenMessageTimes(userId)[conversation.id];
  if (!seen) return true;
  return new Date(conversation.lastMessageAt).getTime() > new Date(seen).getTime();
}

export function countUnreadConversations(userId: string, conversations: Conversation[]): number {
  return conversations.filter((conv) => isConversationUnread(userId, conv)).length;
}

export function countPendingRequests(requests: RoomRequest[]): number {
  return requests.filter((req) => req.status === "pending").length;
}

export function countUpdatedRequests(userId: string, requests: RoomRequest[], role: "host" | "seeker"): number {
  const seenAt = getSeenRequestTime(userId);
  if (!seenAt) {
    return role === "host"
      ? countPendingRequests(requests)
      : requests.filter((req) => req.status !== "pending").length;
  }

  const seenTime = new Date(seenAt).getTime();
  return requests.filter((req) => {
    const updatedAt = req.updatedAt || req.createdAt;
    return new Date(updatedAt).getTime() > seenTime && (
      role === "host" ? req.status === "pending" : req.status !== "pending"
    );
  }).length;
}

export function useNotificationSignals(userId: string, role: "host" | "seeker") {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [seenVersion, setSeenVersion] = useState(0);

  useEffect(() => {
    const unsubConversations = subscribeToConversations(userId, setConversations);
    const unsubRequests = subscribeToRoomRequests(userId, role, setRequests);

    return () => {
      unsubConversations();
      unsubRequests();
    };
  }, [userId, role]);

  const unreadMessages = useMemo(
    () => countUnreadConversations(userId, conversations),
    [userId, conversations, seenVersion]
  );

  const pendingRequests = useMemo(
    () => countPendingRequests(requests),
    [requests]
  );

  const updatedRequests = useMemo(
    () => countUpdatedRequests(userId, requests, role),
    [userId, requests, role, seenVersion]
  );

  const totalSignals = unreadMessages + (role === "host" ? pendingRequests : updatedRequests);

  return {
    unreadMessages,
    pendingRequests,
    updatedRequests,
    totalSignals,
    markConversationSeen: (conversationId: string, lastMessageAt?: string | null) => {
      markConversationSeen(userId, conversationId, lastMessageAt);
      setSeenVersion((v) => v + 1);
    },
    markRequestsSeen: () => {
      markRequestsSeen(userId);
      setSeenVersion((v) => v + 1);
    },
  };
}
