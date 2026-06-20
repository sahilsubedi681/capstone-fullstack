/// <reference types="vite/client" />
import { auth } from "./firebase"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// Get Firebase token for authenticated requests
async function getToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return await user.getIdToken()
}

// Base fetch function
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getToken()
  const isFormData = options.body instanceof FormData

 const headers: Record<string, string> = {
    // Only set Content-Type for JSON — let the browser set it for FormData
    // (browser auto-adds multipart/form-data with the correct boundary)
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || "Request failed")
  }

  return response.json()
}

// ─── Listings API ──────────────────────────────────────────────────────────────

export const listingsApi = {
  getAll: (filters?: { suburb?: string; maxRent?: number }) => {
    const params = new URLSearchParams()
    if (filters?.suburb) params.append("suburb", filters.suburb)
    if (filters?.maxRent) params.append("maxRent", String(filters.maxRent))
    const query = params.toString() ? `?${params.toString()}` : ""
    return apiFetch(`/listings${query}`)
  },

  getMine: async () => {
    const response = await apiFetch("/listings/host/mine")
    return response.listings || []
  },

  getById: (id: string) => apiFetch(`/listings/${id}`),

  create: (data: Record<string, any>, photos?: File[]) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    if (photos) {
      photos.forEach((photo) => formData.append("photos", photo))
    }
    return apiFetch("/listings", { method: "POST", body: formData })
  },

  update: (id: string, data: Record<string, any>, photos?: File[]) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    if (photos && photos.length > 0) {
      photos.forEach((photo) => formData.append("photos", photo))
    }
    return apiFetch(`/listings/${id}`, { method: "PUT", body: formData })
  },

  delete: (id: string) => apiFetch(`/listings/${id}`, { method: "DELETE" }),
}
// ─── Users API ─────────────────────────────────────────────────────────────────

export const usersApi = {
  // Get my profile
  getProfile: () => apiFetch("/users/profile"),

  // Update my profile
  updateProfile: (data: object) => apiFetch("/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  }),

  // Get all users (admin only)
  getAll: () => apiFetch("/users/all"),
}


export const verificationApi = {
  submit: (data: {
    idType: string
    idNumber: string
    dateOfBirth: string
    phone: string
    address: string
    idPhoto: File
  }) => {
    const formData = new FormData()
    formData.append("idType", data.idType)
    formData.append("idNumber", data.idNumber)
    formData.append("dateOfBirth", data.dateOfBirth)
    formData.append("phone", data.phone)
    formData.append("address", data.address)
    formData.append("idPhoto", data.idPhoto)

    return apiFetch("/users/verify", {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type — browser sets it with boundary automatically
    })
  },

  getStatus: () => apiFetch("/users/verify/status"),

  getAll: () => apiFetch("/users/verify/all"),

  approve: (uid: string) => apiFetch(`/users/verify/${uid}`, {
    method: "PUT",
    body: JSON.stringify({ status: "approved" }),
  }),

  reject: (uid: string) => apiFetch(`/users/verify/${uid}`, {
    method: "PUT",
    body: JSON.stringify({ status: "rejected" }),
  }),
}

// ─── Messages API ──────────────────────────────────────────────────────────────

export const messagesApi = {
  getConversations: async () => {
    const response = await apiFetch("/messages/conversations")
    return response.conversations || []
  },

  getMessages: async (conversationId: string) => {
    const response = await apiFetch(`/messages/conversations/${conversationId}/messages`)
    return response.messages || []
  },

  send: (data: {
    recipientId: string
    content: string
    senderName: string
    listingId?: string
    listingLabel?: string
  }) =>
    apiFetch("/messages/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  ensureConversation: (data: {
    recipientId: string
    listingId?: string
    listingLabel?: string
  }) =>
    apiFetch("/messages/conversations/ensure", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// ─── Room Requests API ─────────────────────────────────────────────────────────

export const roomRequestsApi = {
  getMine: async (role: "host" | "seeker") => {
    const response = await apiFetch(`/room-requests?role=${role}`)
    return response.requests || []
  },

  create: (data: {
    hostId: string
    listingId: string
    listingLabel: string
    type: "visit" | "book"
    scheduledDate: string
    scheduledTime: string
    notes?: string | null
    seekerName: string
    paymentStatus?: "paid"
    rentPerWeek?: number
    rentWeeks?: number
    firstWeekRent?: number
    bondAmount?: number
    totalPaid?: number
    paidAt?: string
  }) =>
    apiFetch("/room-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: "confirmed" | "declined" | "cancelled" | "refund_requested" | "refunded") =>
    apiFetch(`/room-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
}

// ─── Admin API ─────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number
  totalHosts: number
  totalSeekers: number
  newThisWeek: number
  totalRoomsAvailable: number
  totalHostBookings: number
  confirmedHostBookings: number
}

export interface AdminUser {
  uid: string
  email: string
  fullName: string
  role: "host" | "seeker" | "admin"
  status: "active" | "suspended"
  verified?: boolean
  verificationStatus?: "pending" | "approved" | "rejected"
  createdAt?: string
}

export interface VerificationRequest {
  uid: string
  idType: string
  idNumber: string
  dateOfBirth: string
  phone: string
  address: string
  idPhotoUrl: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
}

export interface AdminUserDetails {
  user: AdminUser & {
    phone?: string
    suburb?: string
    state?: string
    bio?: string
    photoUrl?: string
    age?: number
    gender?: string
  }
  verificationRequest: VerificationRequest | null
}

export interface AdminListing {
  id: string
  hostName: string
  suburb: string
  state: string
  rentPerWeek: number
  status: "active" | "pending" | "removed" | "booked"
}

export interface AdminActivity {
  id: string
  type: string
  description: string
  createdAt: string
}

export interface AdminPagedResponse<T> {
  items: T[]
  total: number
}

export const adminApi = {
  getStats: (): Promise<AdminStats> => apiFetch("/admin/stats"),

  getUsers: async (
    page = 1,
    pageSize = 10
  ): Promise<AdminPagedResponse<AdminUser>> => {
    const response = await apiFetch(
      `/admin/users?page=${page}&pageSize=${pageSize}`
    )
    return {
      items: response.users || [],
      total: typeof response.total === "number" ? response.total : 0,
    }
  },

  getUserDetails: (uid: string): Promise<AdminUserDetails> =>
    apiFetch(`/admin/users/${uid}/details`),

  verifyUser: (uid: string, verified: boolean) =>
    apiFetch(`/admin/users/${uid}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ verified }),
    }),

  updateUserStatus: (uid: string, status: "active" | "suspended") =>
    apiFetch(`/admin/users/${uid}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getListings: async (
    page = 1,
    pageSize = 10
  ): Promise<AdminPagedResponse<AdminListing>> => {
    const response = await apiFetch(
      `/admin/listings?page=${page}&pageSize=${pageSize}`
    )
    return {
      items: response.listings || [],
      total: typeof response.total === "number" ? response.total : 0,
    }
  },

  updateListingStatus: (id: string, status: "active" | "removed") =>
    apiFetch(`/admin/listings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getActivity: async (
    page = 1,
    pageSize = 10
  ): Promise<AdminPagedResponse<AdminActivity>> => {
    const response = await apiFetch(
      `/admin/activity?page=${page}&pageSize=${pageSize}`
    )
    return {
      items: response.activities || [],
      total: typeof response.total === "number" ? response.total : 0,
    }
  },
}