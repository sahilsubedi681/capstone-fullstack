import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MessageSquare, Send } from "lucide-react";
import {
  getMessages,
  sendMessage,
  ensureConversation,
  getUserProfile,
  subscribeToConversations,
  subscribeToMessages,
  type Conversation,
  type Message,
} from "@/lib/firestore";
import {
  isConversationUnread,
  markConversationSeen,
} from "@/hooks/use-notification-signals";
import { NotificationDot } from "@/components/notification-dot";
import type { UserProfile } from "@/lib/auth";

interface MessagesPanelProps {
  user: UserProfile;
  initialRecipientId?: string | null;
}

export function MessagesPanel({ user, initialRecipientId }: MessagesPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerNames, setPartnerNames] = useState<Record<string, string>>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pendingRecipientId, setPendingRecipientId] = useState<string | null>(null);
  const [pendingPartnerName, setPendingPartnerName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getPartnerId = (conv: Conversation) =>
    conv.participants.find((id) => id !== user.uid) || "";

  const loadPartnerNames = async (convs: Conversation[]) => {
    const names: Record<string, string> = {};
    await Promise.all(
      convs.map(async (conv) => {
        const partnerId = getPartnerId(conv);
        const profile = await getUserProfile(partnerId);
        names[conv.id] = profile?.fullName || "User";
      })
    );
    setPartnerNames(names);
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedId(conv.id);
    markConversationSeen(user.uid, conv.id, conv.lastMessageAt);
  };

  useEffect(() => {
    const unsubscribe = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
      loadPartnerNames(convs);
    });

    pollRef.current = setInterval(async () => {
      try {
        const { messagesApi } = await import("@/lib/api");
        const convs = await messagesApi.getConversations();
        setConversations((prev) => {
          const sorted = convs.sort(
            (a, b) =>
              new Date(b.lastMessageAt || b.createdAt).getTime() -
              new Date(a.lastMessageAt || a.createdAt).getTime()
          );
          if (JSON.stringify(prev) !== JSON.stringify(sorted)) return sorted;
          return prev;
        });
      } catch {
        // polling fallback is best-effort
      }
    }, 5000);

    return () => {
      unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user.uid]);

  useEffect(() => {
    if (!initialRecipientId) return;

    const openConversation = async () => {
      try {
        const convId = await ensureConversation(user.uid, initialRecipientId);
        const profile = await getUserProfile(initialRecipientId);
        setPendingRecipientId(initialRecipientId);
        setPendingPartnerName(profile?.fullName || "User");
        setSelectedId(convId);
        markConversationSeen(user.uid, convId);

        if (!conversations.some((conv) => conv.id === convId)) {
          setConversations((prev) => [
            {
              id: convId,
              participants: [user.uid, initialRecipientId].sort(),
              createdAt: new Date().toISOString(),
              lastMessage: null,
              lastMessageAt: null,
            },
            ...prev,
          ]);
          setPartnerNames((prev) => ({
            ...prev,
            [convId]: profile?.fullName || "User",
          }));
        }
      } catch {
        setPendingRecipientId(initialRecipientId);
        const profile = await getUserProfile(initialRecipientId);
        setPendingPartnerName(profile?.fullName || "User");
        setSelectedId([user.uid, initialRecipientId].sort().join("_"));
      }
    };

    openConversation();
  }, [initialRecipientId, user.uid]);

  useEffect(() => {
    if (!selectedId) return;

    setLoadingMessages(true);
    const unsubscribe = subscribeToMessages(selectedId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });

    const conv = conversations.find((c) => c.id === selectedId);
    if (conv) {
      markConversationSeen(user.uid, selectedId, conv.lastMessageAt);
    }

    const pollMessages = setInterval(async () => {
      try {
        const msgs = await getMessages(selectedId);
        setMessages((prev) => (JSON.stringify(prev) !== JSON.stringify(msgs) ? msgs : prev));
      } catch {
        // best-effort
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(pollMessages);
    };
  }, [selectedId, user.uid, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const selectedPartnerId =
    selectedConversation ? getPartnerId(selectedConversation) : pendingRecipientId;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartnerId) return;

    setSending(true);
    try {
      await sendMessage(user.uid, user.fullName, selectedPartnerId, newMessage.trim());
      setNewMessage("");
      if (selectedId) {
        const msgs = await getMessages(selectedId);
        setMessages(msgs);
        markConversationSeen(user.uid, selectedId, new Date().toISOString());
      }
    } finally {
      setSending(false);
    }
  };

  const displayPartnerName =
    (selectedId && partnerNames[selectedId]) || pendingPartnerName || "User";

  if (loading) {
    return (
      <div className="grid lg:grid-cols-3 gap-4">
        <Skeleton className="h-96 rounded-2xl lg:col-span-1" />
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
      </div>
    );
  }

  const hasActiveChat = Boolean(selectedId && selectedPartnerId);

  if (conversations.length === 0 && !hasActiveChat) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="p-12 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No messages yet.</p>
          <p className="text-sm mt-2">Express interest in a room to start chatting with a host or seeker.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4 min-h-[28rem]">
      <Card className="rounded-2xl border-border/50 shadow-sm lg:col-span-1 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b font-semibold">Conversations</div>
          <div className="max-h-[24rem] overflow-y-auto">
            {conversations.map((conv) => {
              const unread = isConversationUnread(user.uid, conv);
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-4 border-b hover:bg-muted/40 transition-colors ${
                    selectedId === conv.id ? "bg-primary/5" : unread ? "bg-green-500/5" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`truncate ${unread ? "font-bold" : "font-semibold"}`}>
                          {partnerNames[conv.id] || "User"}
                        </p>
                        {unread && <NotificationDot />}
                      </div>
                      {conv.listingLabel && (
                        <p className="text-xs text-primary truncate">{conv.listingLabel}</p>
                      )}
                      <p className={`text-sm truncate mt-1 ${unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 shadow-sm lg:col-span-2 flex flex-col overflow-hidden">
        {hasActiveChat ? (
          <>
            <div className="p-4 border-b">
              <p className="font-semibold">{displayPartnerName}</p>
              {selectedConversation?.listingLabel && (
                <Badge variant="outline" className="mt-1">{selectedConversation.listingLabel}</Badge>
              )}
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[20rem] min-h-[16rem]">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Start the conversation. Say hello!
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.uid ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        msg.senderId === user.uid
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user.uid ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.createdAt).toLocaleString("en-AU", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="rounded-xl"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()} className="rounded-xl shrink-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center text-muted-foreground p-8">
            Select a conversation to view messages
          </CardContent>
        )}
      </Card>
    </div>
  );
}
