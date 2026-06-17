import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Address = {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  phone?: string;
  isDefault?: boolean;
};

export default function PatientAccountProfile() {
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddr, setNewAddr] = useState({ line1: "", line2: "", city: "", postcode: "", phone: "" });

  useEffect(() => {
    setProfile({
      firstName: localStorage.getItem("patient_name")?.split(" ")[0] ?? "",
      lastName: localStorage.getItem("patient_name")?.split(" ").slice(1).join(" ") ?? "",
      email: localStorage.getItem("patient_email") ?? "",
      phone: "",
    });
  }, []);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("patient_name", `${profile.firstName} ${profile.lastName}`.trim());
    localStorage.setItem("patient_email", profile.email);
    toast.success("Profile updated");
  }

  function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!newAddr.line1 || !newAddr.city || !newAddr.postcode) return;
    setAddresses((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...newAddr, isDefault: prev.length === 0 },
    ]);
    setNewAddr({ line1: "", line2: "", city: "", postcode: "", phone: "" });
    toast.success("Address added");
  }

  return (
    <PatientAccountLayout
      title="My Account"
      subtitle="Update your personal details and delivery addresses."
      icon={<User className="h-5 w-5" />}
    >
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#314a40] text-white font-bold">
          Personal Information
        </div>
        <form onSubmit={saveProfile} className="p-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={profile.firstName}
              onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="h-11 rounded-xl"
              placeholder="0333 000 0000"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" className="rounded-full bg-[#314a40] hover:bg-[#2a4038] px-8">
              Update Profile
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#314a40] text-white font-bold">
          Manage Address
        </div>
        <form onSubmit={addAddress} className="p-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Street Name</Label>
            <Input value={newAddr.line1} onChange={(e) => setNewAddr((a) => ({ ...a, line1: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Apartment / Suite</Label>
            <Input value={newAddr.line2} onChange={(e) => setNewAddr((a) => ({ ...a, line2: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={newAddr.city} onChange={(e) => setNewAddr((a) => ({ ...a, city: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Postcode</Label>
            <Input value={newAddr.postcode} onChange={(e) => setNewAddr((a) => ({ ...a, postcode: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" className="rounded-full bg-[#314a40] hover:bg-[#2a4038] px-8">
              Add Address
            </Button>
          </div>
        </form>
      </div>

      {addresses.length > 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-900">Saved Addresses</div>
          <ul className="divide-y divide-gray-100">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className={`px-6 py-4 flex flex-wrap items-center justify-between gap-3 ${addr.isDefault ? "bg-[#f5faf7]" : ""}`}
              >
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{addr.line1}</p>
                  {addr.line2 ? <p>{addr.line2}</p> : null}
                  <p>{addr.city}, {addr.postcode}</p>
                  {addr.phone ? <p>{addr.phone}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!addr.isDefault ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full bg-[#314a40] hover:bg-[#2a4038] text-white"
                      onClick={() =>
                        setAddresses((prev) =>
                          prev.map((a) => ({ ...a, isDefault: a.id === addr.id })),
                        )
                      }
                    >
                      Set as Default
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-[#314a40] px-2 py-1">Default</span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setAddresses((prev) => prev.filter((a) => a.id !== addr.id))}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </PatientAccountLayout>
  );
}
