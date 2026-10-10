"use client";
import {
  createContext,
  useContext,
  useState,
  useId,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import type { Creator } from "@/lib/schemas";
const ToastContext = createContext<(message: string, error?: boolean) => void>(
  () => {},
);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  return (
    <ToastContext.Provider
      value={(message, error = false) => setToast({ message, error })}
    >
      {children}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function Button({
  children,
  pending = false,
  variant = "",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  variant?: string;
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || pending}
      className={`button ${variant} ${className}`}
    >
      {pending && <LoaderCircle className="spin" size={16} />} {children}
    </button>
  );
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "note"}
    >
      <AlertCircle size={17} />
      <div>{children}</div>
    </div>
  );
}
export function Art({
  index = 0,
  className = "",
  label = "Fictional creative portfolio study",
}: {
  index?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`art art-${index % 4} ${className}`}
    />
  );
}
export function Portrait({
  creator,
  large = false,
}: {
  creator: Pick<Creator, "name" | "portrait">;
  large?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`${creator.name}, fictional AI-generated portrait`}
      className={`portrait ${large ? "large" : ""}`}
      style={{
        backgroundPosition: `${((creator.portrait % 4) * 100) / 3}% ${creator.portrait < 4 ? "0%" : "100%"}`,
      }}
    />
  );
}
export function Tags({ items }: { items: string[] }) {
  return (
    <div className="tags">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}
export async function request<T>(
  url: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw Error("The server returned an unexpected response.");
  }
  if (!res.ok) throw Error(data.error || "Request failed.");
  return data as T;
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
