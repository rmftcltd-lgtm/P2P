"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";

type User = {
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  registrationComplete?: boolean;
  physicalAddress?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  aboutMe?: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) {
          router.push("/login?next=/account");
          return;
        }
        const data = await res.json();
        const u = data.user as User;
        setUser(u);
        setName(u.name ?? "");
        setPhone(u.phone ?? "");
        setPhysicalAddress(u.physicalAddress ?? "");
        setDateOfBirth(u.dateOfBirth ?? "");
        setGender(u.gender ?? "");
        setAboutMe(u.aboutMe ?? "");
      })
      .catch(() => router.push("/login?next=/account"));
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        physicalAddress,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        aboutMe: aboutMe || undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save profile");
      return;
    }
    setUser(data.user);
    setStatus("Profile saved — you can list and book now.");
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto max-w-xl px-5 py-8 md:px-10">
        <h1 className="font-display text-4xl font-bold tracking-tight">My account</h1>
        <p className="mt-2 text-slate">
          {user?.registrationComplete
            ? "Update your details any time."
            : "Please complete your profile to start listing and booking."}
        </p>

        <form onSubmit={onSubmit} className="panel mt-6 space-y-4 p-5">
          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              className="field"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              className="field"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="address">
              Physical address
            </label>
            <input
              id="address"
              className="field"
              required
              value={physicalAddress}
              onChange={(e) => setPhysicalAddress(e.target.value)}
              placeholder="Suburb, City"
            />
          </div>
          <div>
            <label className="label" htmlFor="dob">
              Date of birth (optional)
            </label>
            <input
              id="dob"
              className="field"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <label className="label" htmlFor="gender">
              Gender (optional)
            </label>
            <select
              id="gender"
              className="field"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="about">
              About me (optional)
            </label>
            <textarea
              id="about"
              className="field min-h-24"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-[#8a2f2f]">{error}</p> : null}
          {status ? <p className="text-sm text-moss">{status}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate">
          <Link href={user?.role === "DRIVER" ? "/driver" : "/customer"} className="underline underline-offset-4">
            Back to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
