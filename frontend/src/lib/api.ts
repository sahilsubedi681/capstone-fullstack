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
  // Get all listings (public)
  getAll: (filters?: { suburb?: string; maxRent?: number }) => {
    const params = new URLSearchParams()
    if (filters?.suburb) params.append("suburb", filters.suburb)
    if (filters?.maxRent) params.append("maxRent", String(filters.maxRent))
    const query = params.toString() ? `?${params.toString()}` : ""
    return apiFetch(`/listings${query}`)
  },

  // Get my listings as host (returns array)
  getMine: async () => {
    const response = await apiFetch("/listings/host/mine")
    return response.listings || []
  },

  // Get single listing
  getById: (id: string) => apiFetch(`/listings/${id}`),

  // Create listing
  create: (data: object) => apiFetch("/listings", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  // Update listing
  update: (id: string, data: object) => apiFetch(`/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),

  // Delete listing
  delete: (id: string) => apiFetch(`/listings/${id}`, {
    method: "DELETE",
  }),
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