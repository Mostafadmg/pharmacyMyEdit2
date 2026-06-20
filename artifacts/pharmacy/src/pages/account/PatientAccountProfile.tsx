import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type SavedAddress = {
  id: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
};

type AddressForm = {
  address1: string;
  address2: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
};

const EMPTY_ADDRESS_FORM: AddressForm = {
  address1: "",
  address2: "",
  city: "",
  province: "",
  zip: "",
  country: "United Kingdom",
  phone: "",
};

function HeroAccountIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 18.5c1-2.2 3.3-3.5 6-3.5s5 1.3 6 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c1.2-3 4-4.5 7-4.5s5.8 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarBadgeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 17.5 6.8 19.2l1-5.9L3.5 9.2l5.9-.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatAddressLine(addr: SavedAddress): string {
  const line1 = addr.address1.trim();
  const line2 = addr.address2?.trim();
  if (line2) return `${line1} ${line2}`;
  return line1 || "—";
}

function formatCityMeta(addr: SavedAddress): string {
  const parts = [addr.city?.trim(), addr.province?.trim(), addr.zip?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function AddressCard({
  addr,
  busy,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  addr: SavedAddress;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div
      className={`child-all-address-area em-address-card${addr.isDefault ? " is-default" : ""}`}
      data-address-id={addr.id}
    >
      <div className="inner-all-address-area em-address-info">
        <p
          className={`address-type-cls em-address-badge${addr.isDefault ? " default-address" : ""}`}
        >
          {addr.isDefault ? (
            <>
              <StarBadgeIcon />
              Default Address
            </>
          ) : (
            "Address"
          )}
        </p>
        <p className="address-line1-cls em-address-line">{formatAddressLine(addr)}</p>
        <p className="address-city-cls em-address-meta">{formatCityMeta(addr)}</p>
        <p className="address-country-cls em-address-meta">{addr.country || "United Kingdom"}</p>
        {addr.phone ? (
          <p className="address-phone-cls em-address-meta">{addr.phone}</p>
        ) : null}
      </div>
      <div className="inner-all-address-area em-address-actions">
        {!addr.isDefault ? (
          <button
            type="button"
            className="set-default-address-button em-addr-btn em-addr-btn-solid"
            disabled={busy}
            onClick={onSetDefault}
          >
            Make Default
          </button>
        ) : null}
        <button
          type="button"
          className="edit-address-button em-addr-btn em-addr-btn-solid"
          disabled={busy}
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className="delete-address-button em-addr-btn em-addr-btn-soft"
          disabled={busy}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function PatientAccountProfile() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressBusyId, setAddressBusyId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [me, addrRes] = await Promise.all([
      apiFetch<{
        name: string;
        email: string;
        phone?: string | null;
        dateOfBirth?: string | null;
      }>("/api/auth/patient-me", { auth: "patient" }),
      apiFetch<{ addresses: SavedAddress[] }>("/api/patient/addresses", { auth: "patient" }),
    ]);
    setFullName(me.name ?? "");
    setEmail(me.email ?? "");
    setPhone(me.phone ?? "");
    setDateOfBirth(me.dateOfBirth ?? "");
    setAddresses(addrRes.addresses ?? []);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
      return;
    }
    loadData()
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load account."))
      .finally(() => setLoading(false));
  }, [loadData, navigate]);

  async function saveProfile() {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const updated = await apiFetch<{
        name: string;
        phone?: string | null;
        dateOfBirth?: string | null;
      }>("/api/patient/profile", {
        method: "PATCH",
        auth: "patient",
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim(),
          dateOfBirth: dateOfBirth || "",
        }),
      });
      setFullName(updated.name);
      setPhone(updated.phone ?? "");
      setDateOfBirth(updated.dateOfBirth ?? "");
      localStorage.setItem("patient_name", updated.name);
      toast.success("Profile updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  }

  function resetAddressForm() {
    setAddressForm(EMPTY_ADDRESS_FORM);
    setEditingAddressId(null);
  }

  function startEditAddress(addr: SavedAddress) {
    setEditingAddressId(addr.id);
    setAddressForm({
      address1: addr.address1,
      address2: addr.address2 ?? "",
      city: addr.city,
      province: addr.province ?? "",
      zip: addr.zip,
      country: addr.country || "United Kingdom",
      phone: addr.phone ?? "",
    });
    document.getElementById("updateAddressButton")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function saveAddress() {
    if (savingAddress) return;
    if (!addressForm.address1.trim()) {
      toast.error("Address line 1 is required");
      return;
    }
    setSavingAddress(true);
    try {
      const payload = {
        address1: addressForm.address1.trim(),
        address2: addressForm.address2.trim(),
        city: addressForm.city.trim(),
        province: addressForm.province.trim(),
        zip: addressForm.zip.trim(),
        country: addressForm.country.trim() || "United Kingdom",
        phone: addressForm.phone.trim(),
      };
      const res = editingAddressId
        ? await apiFetch<{ addresses: SavedAddress[] }>(
            `/api/patient/addresses/${encodeURIComponent(editingAddressId)}`,
            { method: "PUT", auth: "patient", body: JSON.stringify(payload) },
          )
        : await apiFetch<{ addresses: SavedAddress[] }>("/api/patient/addresses", {
            method: "POST",
            auth: "patient",
            body: JSON.stringify(payload),
          });
      setAddresses(res.addresses);
      resetAddressForm();
      toast.success(editingAddressId ? "Address updated" : "Address added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save address");
    } finally {
      setSavingAddress(false);
    }
  }

  async function deleteAddress(id: string) {
    if (addressBusyId) return;
    if (!window.confirm("Delete this address?")) return;
    setAddressBusyId(id);
    try {
      const res = await apiFetch<{ addresses: SavedAddress[] }>(
        `/api/patient/addresses/${encodeURIComponent(id)}`,
        { method: "DELETE", auth: "patient" },
      );
      setAddresses(res.addresses);
      if (editingAddressId === id) resetAddressForm();
      toast.success("Address deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete address");
    } finally {
      setAddressBusyId(null);
    }
  }

  async function setDefaultAddress(id: string) {
    if (addressBusyId) return;
    setAddressBusyId(id);
    try {
      const res = await apiFetch<{ addresses: SavedAddress[] }>(
        `/api/patient/addresses/${encodeURIComponent(id)}/default`,
        { method: "POST", auth: "patient", body: JSON.stringify({}) },
      );
      setAddresses(res.addresses);
      toast.success("Default address set");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set default");
    } finally {
      setAddressBusyId(null);
    }
  }

  return (
    <PatientAccountLayout
      title="My Account"
      subtitle="Manage your personal details and delivery addresses."
      icon={<HeroAccountIcon />}
    >
      {loading ? (
        <div className="em-account">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <div className="em-account">
          <div className="em-acc-card">
            <div className="em-acc-head">
              <span className="em-acc-ic">
                <PersonIcon />
              </span>
              <h3 className="em-acc-title">Personal Information</h3>
            </div>

            <div className="em-acc-grid">
              <div className="em-field">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="em-field">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="em-field">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" value={email} disabled />
              </div>
              <div className="em-field">
                <label htmlFor="phone">Phone</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="em-acc-actions">
              <button
                type="button"
                className="em-btn em-btn-primary update-profile"
                id="updateProfileButton"
                disabled={savingProfile}
                onClick={saveProfile}
              >
                <CheckIcon />
                Update Details
              </button>
            </div>
          </div>

          <div className="em-acc-card">
            <div className="em-acc-head">
              <span className="em-acc-ic">
                <PinIcon />
              </span>
              <h3 className="em-acc-title">Manage Address</h3>
            </div>

            <div className="em-acc-grid">
              <div className="em-field em-field-full">
                <label htmlFor="address1">Address Line 1</label>
                <input
                  type="text"
                  id="address1"
                  name="address1"
                  value={addressForm.address1}
                  onChange={(e) => setAddressForm((f) => ({ ...f, address1: e.target.value }))}
                />
              </div>
              <div className="em-field em-field-full">
                <label htmlFor="address2">Apartment, Suite, etc (optional)</label>
                <input
                  type="text"
                  id="address2"
                  name="address2"
                  value={addressForm.address2}
                  onChange={(e) => setAddressForm((f) => ({ ...f, address2: e.target.value }))}
                />
              </div>
              <div className="em-field">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="em-field">
                <label htmlFor="zip">Zip/Postal Code</label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={addressForm.zip}
                  onChange={(e) => setAddressForm((f) => ({ ...f, zip: e.target.value }))}
                />
              </div>
              <div className="em-field">
                <label htmlFor="addr_phone">Phone</label>
                <input
                  type="text"
                  id="addr_phone"
                  name="addr_phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="em-field">
                <label htmlFor="province">State/Province</label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={addressForm.province}
                  onChange={(e) => setAddressForm((f) => ({ ...f, province: e.target.value }))}
                />
              </div>
              <div className="em-field">
                <label htmlFor="country">Country</label>
                <input type="text" id="country" name="country" value={addressForm.country} disabled />
              </div>
            </div>

            <div className="em-acc-actions">
              <button
                type="button"
                className="em-btn em-btn-primary update-profile"
                id="updateAddressButton"
                disabled={savingAddress}
                onClick={saveAddress}
              >
                {editingAddressId ? "Update Address" : "Add Address"}
              </button>
              {editingAddressId ? (
                <button
                  type="button"
                  className="em-btn em-btn-ghost"
                  style={{ marginLeft: 8 }}
                  onClick={resetAddressForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>

          <div className="em-acc-card">
            <div className="em-acc-head">
              <span className="em-acc-ic">
                <ListIcon />
              </span>
              <h3 className="em-acc-title">All Addresses</h3>
            </div>

            <div className="parent-all-address-area em-address-list">
              {addresses.length === 0 ? (
                <div className="em-address-empty">
                  <PinIcon />
                  <p>No saved addresses yet</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <AddressCard
                    key={addr.id}
                    addr={addr}
                    busy={addressBusyId === addr.id}
                    onEdit={() => startEditAddress(addr)}
                    onDelete={() => deleteAddress(addr.id)}
                    onSetDefault={() => setDefaultAddress(addr.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PatientAccountLayout>
  );
}
