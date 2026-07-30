"use client";

import { Button, Input, Skeleton, useToast } from "@dashboard/ui";
import { MapPin, Plus, Trash2, Edit3, X } from "lucide-react";
import { useState } from "react";

import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@/api/addresses";

export default function AddressesPage() {
  const { data, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Form State
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");
  const [isDefaultShipping, setIsDefaultShipping] = useState(false);
  const [isDefaultBilling, setIsDefaultBilling] = useState(false);

  const openAddModal = () => {
    setEditingAddress(null);
    setLabel("Home");
    setRecipientName("");
    setPhone("");
    setLine1("");
    setLine2("");
    setCity("");
    setState("");
    setPostalCode("");
    setCountry("India");
    setIsDefaultShipping(false);
    setIsDefaultBilling(false);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: any) => {
    setEditingAddress(addr);
    setLabel(addr.label || "");
    setRecipientName(addr.recipientName || "");
    setPhone(addr.phone || "");
    setLine1(addr.line1 || "");
    setLine2(addr.line2 || "");
    setCity(addr.city || "");
    setState(addr.state || "");
    setPostalCode(addr.postalCode || "");
    setCountry(addr.country || "India");
    setIsDefaultShipping(addr.isDefaultShipping || false);
    setIsDefaultBilling(addr.isDefaultBilling || false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      label: label.trim() || null,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      line2: line2.trim() || null,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      isDefaultShipping,
      isDefaultBilling,
    };

    if (!payload.recipientName || !payload.phone || !payload.line1 || !payload.city || !payload.state || !payload.postalCode) {
      addToast({ title: "Validation Error", description: "Please fill out all required fields.", type: "error" });
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({ id: editingAddress.id, payload });
        addToast({ title: "Address Updated", description: "Your address has been saved successfully.", type: "success" });
      } else {
        await createAddress.mutateAsync(payload);
        addToast({ title: "Address Created", description: "New address has been added to your profile.", type: "success" });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      addToast({ title: "Error", description: err.message || "Failed to save address", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      addToast({ title: "Address Deleted", description: "Address was deleted successfully.", type: "success" });
    } catch (err: any) {
      addToast({ title: "Error", description: err.message || "Failed to delete address", type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif text-text-primary">Addresses</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const addresses = data?.addresses || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-text-primary">Addresses</h1>
          <p className="text-sm text-text-secondary font-light mt-1">
            Manage your saved delivery locations for faster checkout.
          </p>
        </div>
        <Button onClick={openAddModal} className="rounded-full gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border p-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-lg text-text-primary mb-2">No addresses saved</h3>
          <p className="text-sm text-text-secondary font-light mb-6">
            Add a shipping address to get started with your orders.
          </p>
          <Button onClick={openAddModal} className="rounded-full px-8">
            Add New Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr: any) => (
            <div
              key={addr.id}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              <div className="space-y-3 font-light">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                    {addr.label || "Address"}
                  </span>
                  {addr.isDefaultShipping && (
                    <span className="text-[11px] text-text-secondary border border-border px-2 py-0.5 rounded-full">
                      Default Shipping
                    </span>
                  )}
                  {addr.isDefaultBilling && (
                    <span className="text-[11px] text-text-secondary border border-border px-2 py-0.5 rounded-full">
                      Default Billing
                    </span>
                  )}
                </div>

                <div className="text-sm space-y-1 text-text-primary">
                  <p className="font-medium">{addr.recipientName}</p>
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Phone: {addr.phone}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 border-t border-border pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(addr)}
                  className="rounded-full text-text-secondary hover:text-text-primary gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(addr.id)}
                  className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-lg w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-2xl font-serif text-text-primary mb-6">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Label (e.g. Home, Office)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Home"
                  required
                />
                <Input
                  label="Recipient Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  required
                />
                <Input
                  label="Address Line 1"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Flat, House no., Apartment"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Address Line 2 (Optional)"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Landmark, Area"
                />
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bangalore"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Karnataka"
                  required
                />
                <Input
                  label="Postal Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="560001"
                  required
                />
                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  required
                />
              </div>

              <div className="space-y-2 pt-2 text-sm text-text-secondary font-light">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefaultShipping}
                    onChange={(e) => setIsDefaultShipping(e.target.checked)}
                    className="rounded text-accent focus:ring-accent border-border"
                  />
                  Set as default shipping address
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefaultBilling}
                    onChange={(e) => setIsDefaultBilling(e.target.checked)}
                    className="rounded text-accent focus:ring-accent border-border"
                  />
                  Set as default billing address
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full px-6"
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full px-6" disabled={createAddress.isPending || updateAddress.isPending}>
                  {editingAddress ? "Save Changes" : "Add Address"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
