import { AccountSettingsForm } from "@/components/auth/AccountSettingsForm";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-indigo">
          Account
        </p>
        <h1 className="mt-2 font-serif text-3xl text-brand-ink">Settings</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Update your profile and password.
        </p>
      </div>

      <AccountSettingsForm />
    </div>
  );
}
