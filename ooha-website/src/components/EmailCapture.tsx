import EmailSubscribeForm from "@/components/EmailSubscribeForm";
import styles from "../styles/EmailCapture.module.scss";

type EmailCaptureProps = {
  buttonText?: string;
  compact?: boolean;
  formOnly?: boolean;
  placeholder?: string;
};

export default function EmailCapture({
  buttonText = "Notify me",
  compact = false,
  formOnly = false,
  placeholder = "you@example.com",
}: EmailCaptureProps) {
  const form = (
    <EmailSubscribeForm
      buttonText={buttonText}
      compact={compact}
      placeholder={placeholder}
    />
  );

  if (formOnly) {
    return form;
  }

  return (
    <section id="email" className={styles.root}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>Stay in the loop</p>
        <h2 className={styles.title}>We&apos;ll send you a little note when it&apos;s time.</h2>
        {form}
      </div>
    </section>
  );
}
