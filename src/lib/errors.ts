/** Centralized error handling and user-friendly error mapping. */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Map Supabase errors to user-friendly messages. Never expose raw errors. */
export function mapSupabaseError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "An unexpected error occurred. Please try again.";
  }

  const err = error as { message?: string; code?: string; status?: number };
  const message = err.message?.toLowerCase() ?? "";
  const code = err.code ?? "";

  // Auth errors
  if (message.includes("invalid login credentials") || code === "invalid_credentials") {
    return "Invalid email or password. Please check your credentials.";
  }
  if (message.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }
  if (message.includes("user already registered") || code === "user_already_exists") {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (message.includes("password") && message.includes("weak")) {
    return "Password is too weak. Use at least 6 characters.";
  }
  if (message.includes("rate limit") || code === "over_request_rate_limit") {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Database errors
  if (code === "23505" || message.includes("duplicate key")) {
    return "This record already exists.";
  }
  if (code === "23503" || message.includes("foreign key")) {
    return "Referenced record not found.";
  }
  if (code === "42501" || message.includes("permission denied")) {
    return "You don't have permission to perform this action.";
  }
  if (code === "PGRST116" || message.includes("no rows")) {
    return "Record not found.";
  }

  // Storage errors
  if (message.includes("payload too large") || message.includes("file size")) {
    return "File is too large. Please upload a smaller file.";
  }
  if (message.includes("mime") || message.includes("content type")) {
    return "Invalid file type. Please upload a supported format.";
  }

  // Network / generic
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return "Something went wrong. Please try again later.";
}

/** Map external API errors to user-friendly messages. */
export function mapApiError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Failed to fetch data from external service.";
  }

  const err = error as { status?: number; message?: string };

  if (err.status === 404) {
    return "The requested resource was not found.";
  }
  if (err.status === 429) {
    return "External service rate limit reached. Please try again later.";
  }
  if (err.status && err.status >= 500) {
    return "External service is temporarily unavailable.";
  }

  return "Failed to fetch data. Please try again later.";
}
