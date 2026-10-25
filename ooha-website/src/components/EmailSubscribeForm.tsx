"use client";

import { useId, useState } from "react";
import styles from "../styles/EmailCapture.module.scss";

type EmailSubscribeFormProps = {
  buttonText: string;
  compact: boolean;
  placeholder: string;
};

type SubscribeResponse = {
  message?: string;
  error?: string;
};

export default function EmailSubscribeForm({
  buttonText,
  compact,
  placeholder,
}: EmailSubscribeFormProps) {
  const emailInputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await response.json()) as SubscribeResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit your email right now.");
      }

      setStatus(data.message ?? "Thanks! We’ll keep you posted.");
      setEmail("");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to submit your email right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={compact ? styles.compactForm : styles.formWrap}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.visuallyHidden} htmlFor={emailInputId}>
          Email address
        </label>
        <input
          id={emailInputId}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          className={styles.input}
        />
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? "Sending..." : buttonText}
        </button>
      </form>
      {status ? <p className={styles.status} role="status">{status}</p> : null}
    </div>
  );
}
