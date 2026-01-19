import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { generateInviteToken, createInviteLink } from "../utils/inviteUtils";

export default function InviteTradeModal({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: myProfile } = useQuery({
    queryKey: ["myProfile", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const profiles = await base44.entities.Profile.filter({ user_id: currentUser.email });
      return profiles[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data) => {
      const token = generateInviteToken();
      await base44.entities.Invite.create({
        invited_name: data.name,
        invited_phone: data.phone,
        invited_email: "",
        invite_role: "trade",
        invited_trade_category: "",
        token,
        status: "sent",
        sent_by_user_id: currentUser.email,
        sent_by_profile_id: myProfile?.id || "",
      });
      return token;
    },
    onSuccess: (token) => {
      const link = createInviteLink(token);
      setInviteLink(link);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createInviteMutation.mutate(formData);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setFormData({ name: "", phone: "" });
    setInviteLink("");
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Trade</DialogTitle>
        </DialogHeader>

        {!inviteLink ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Generate Invite Link
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 mt-4">
            <div>
              <Label>Invite Link</Label>
              <div className="flex gap-2 mt-2">
                <Input value={inviteLink} readOnly className="flex-1" />
                <Button onClick={handleCopy} variant="outline">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Share this link with {formData.name} to complete their profile.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}