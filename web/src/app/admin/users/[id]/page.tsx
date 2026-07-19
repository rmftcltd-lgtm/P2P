"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";

type Driver = {
  vehicleType: string;
  kycStatus: string;
  licenseNumber: string | null;
} | null;

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  registrationComplete: boolean;
  registrationType: string | null;
  organisationName: string | null;
  nzbn: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  aboutMe: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  idVerified: boolean;
  licenceVerified: boolean;
  hasNzLicence: boolean | null;
  driver: Driver;
};

export default function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [kycStatus, setKycStatus] = useState("UNVERIFIED");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Not found");
        setLoading(false);
        return;
      }
      setUser(data.user);
      setKycStatus(data.user.driver?.kycStatus ?? "UNVERIFIED");
      setLoading(false);
    }
    void load();
  }, [id]);

  function setField<K extends keyof User>(key: K, value: User[K]) {
    setUser((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setOk("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.name,
        phone: user.phone,
        isActive: user.isActive,
        registrationComplete: user.registrationComplete,
        registrationType: user.registrationType,
        organisationName: user.organisationName,
        nzbn: user.nzbn,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        aboutMe: user.aboutMe,
        physicalAddress: user.physicalAddress,
        postalAddress: user.postalAddress,
        idVerified: user.idVerified,
        licenceVerified: user.licenceVerified,
        hasNzLicence: user.hasNzLicence,
        ...(user.driver ? { kycStatus } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setUser(data.user);
    setKycStatus(data.user.driver?.kycStatus ?? kycStatus);
    setOk("Saved.");
  }

  if (loading) {
    return (
      <AdminShell title="Edit user">
        <p className="text-slate">Loading…</p>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell title="Edit user">
        <p className="text-[#8a2f2f]">{error || "Not found"}</p>
        <Link href="/admin/users" className="mt-4 inline-block underline">
          Back
        </Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`Edit · ${user.name}`}>
      <p className="mb-6">
        <Link href="/admin/users" className="text-sm text-sea underline underline-offset-4">
          ← Users
        </Link>
      </p>
      <form className="panel max-w-3xl space-y-4" onSubmit={onSave}>
        <p className="text-sm text-slate">{user.email} · {user.role === "CUSTOMER" ? "Sender" : user.role}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Name</span>
            <input className="field" value={user.name} onChange={(e) => setField("name", e.target.value)} required />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="field" value={user.phone || ""} onChange={(e) => setField("phone", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Registration type</span>
            <select
              className="field"
              value={user.registrationType || ""}
              onChange={(e) => setField("registrationType", e.target.value || null)}
            >
              <option value="">—</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="ORGANISATION">Organisation</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Organisation name</span>
            <input
              className="field"
              value={user.organisationName || ""}
              onChange={(e) => setField("organisationName", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">NZBN</span>
            <input className="field" value={user.nzbn || ""} onChange={(e) => setField("nzbn", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Date of birth</span>
            <input
              className="field"
              type="date"
              value={user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : ""}
              onChange={(e) => setField("dateOfBirth", e.target.value || null)}
            />
          </label>
          <label className="block">
            <span className="label">Gender</span>
            <input className="field" value={user.gender || ""} onChange={(e) => setField("gender", e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="label">About me</span>
          <textarea className="field min-h-[80px]" value={user.aboutMe || ""} onChange={(e) => setField("aboutMe", e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Physical address</span>
          <textarea
            className="field min-h-[60px]"
            value={user.physicalAddress || ""}
            onChange={(e) => setField("physicalAddress", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">Postal address</span>
          <textarea
            className="field min-h-[60px]"
            value={user.postalAddress || ""}
            onChange={(e) => setField("postalAddress", e.target.value)}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={user.isActive} onChange={(e) => setField("isActive", e.target.checked)} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={user.registrationComplete}
              onChange={(e) => setField("registrationComplete", e.target.checked)}
            />
            Registration complete
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={user.idVerified} onChange={(e) => setField("idVerified", e.target.checked)} />
            ID verified
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={user.licenceVerified}
              onChange={(e) => setField("licenceVerified", e.target.checked)}
            />
            Licence verified
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={user.hasNzLicence === true}
              onChange={(e) => setField("hasNzLicence", e.target.checked)}
            />
            Holds NZ driver licence
          </label>
        </div>

        {user.driver ? (
          <div className="rounded-xl bg-mist/50 p-4">
            <p className="mb-2 text-sm font-semibold">Driver profile</p>
            <p className="mb-3 text-sm text-slate">Vehicle: {user.driver.vehicleType}</p>
            <label className="block max-w-xs">
              <span className="label">KYC status</span>
              <select className="field" value={kycStatus} onChange={(e) => setKycStatus(e.target.value)}>
                <option value="UNVERIFIED">Unverified</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>
          </div>
        ) : null}

        {error ? <p className="text-sm text-[#8a2f2f]">{error}</p> : null}
        {ok ? <p className="text-sm text-moss">{ok}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="submit">
            Save changes
          </button>
          <button className="btn btn-dark" type="button" onClick={() => router.push("/admin/users")}>
            Cancel
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
