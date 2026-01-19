import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, MessageSquare, Building2 } from "lucide-react";

const roleColors = {
  client: "bg-blue-100 text-blue-700",
  subcontractor: "bg-purple-100 text-purple-700",
  supplier: "bg-green-100 text-green-700",
  architect: "bg-orange-100 text-orange-700",
  engineer: "bg-cyan-100 text-cyan-700",
  inspector: "bg-pink-100 text-pink-700",
  other: "bg-slate-100 text-slate-700",
};

export default function TradeCard({ contact, onStartChat }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-lg">
                {contact.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{contact.name}</h3>
              {contact.company && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {contact.company}
                </p>
              )}
            </div>
          </div>
          <Badge className={`${roleColors[contact.role] || roleColors.other}`}>
            {contact.role}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{contact.phone}</span>
            </a>
          )}
          {contact.address && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{contact.address}</span>
            </div>
          )}
        </div>

        <Button
          onClick={() => onStartChat(contact)}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Start Chat
        </Button>
      </CardContent>
    </Card>
  );
}