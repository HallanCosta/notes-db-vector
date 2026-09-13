export type BackendMode = "supabase" | "fastapi"

const configuredMode = import.meta.env.VITE_BACKEND_MODE

export const backendMode: BackendMode = configuredMode === "fastapi" ? "fastapi" : "supabase"
export const isSupabaseMode = backendMode === "supabase"
