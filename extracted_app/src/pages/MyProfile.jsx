import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCircle, Upload, X, Plus } from "lucide-react";
import { TRADE_CATEGORIES, TRADE_TAGS_BY_CATEGORY } from "@/components/config/tradeTaxonomy";

export default function MyProfile() {
  const [editing, setEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [formData, setFormData] = useState({
    role: "gc",
    company_name: "",
    owner_name: "",
    website_url: "",
    email: "",
    phone: "",
    business_address: "",
    zip_code: "",
    service_radius: "",
    profile_bio: "",
    projects: [],
    references: [],
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: myProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["myProfile", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const profiles = await base44.entities.Profile.filter({ user_id: currentUser.email });
      return profiles[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    if (!profileLoading && !myProfile && currentUser) {
      navigate(createPageUrl("Onboarding"));
    }
  }, [myProfile, profileLoading, currentUser, navigate]);

  useEffect(() => {
    if (myProfile) {
      setFormData({
        role: myProfile.role || "gc",
        company_name: myProfile.company_name || "",
        owner_name: myProfile.owner_name || "",
        website_url: myProfile.website_url || "",
        email: myProfile.email || "",
        phone: myProfile.phone || "",
        business_address: myProfile.business_address || "",
        zip_code: myProfile.zip_code || "",
        service_radius: myProfile.service_radius || "",
        profile_bio: myProfile.profile_bio || "",
        projects: myProfile.projects || [],
        references: myProfile.references || [],
      });
      setSelectedCategory(myProfile.trade_category || "");
      setSelectedTags(myProfile.trade_tags || []);
    }
  }, [myProfile]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Profile.update(myProfile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      setEditing(false);
    },
  });

  const handleSave = () => {
    const data = {
      ...formData,
      trade_category: selectedCategory,
      trade_tags: selectedTags,
      service_radius: formData.service_radius ? parseFloat(formData.service_radius) : null,
    };
    updateMutation.mutate(data);
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddProject = () => {
    setFormData({
      ...formData,
      projects: [...formData.projects, { title: "", description: "", photo_url: "" }],
    });
  };

  const handleRemoveProject = (index) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== index),
    });
  };

  const handleUpdateProject = (index, field, value) => {
    const updated = [...formData.projects];
    updated[index][field] = value;
    setFormData({ ...formData, projects: updated });
  };

  const handleAddReference = () => {
    setFormData({
      ...formData,
      references: [...formData.references, { name: "", phone: "", email: "" }],
    });
  };

  const handleRemoveReference = (index) => {
    setFormData({
      ...formData,
      references: formData.references.filter((_, i) => i !== index),
    });
  };

  const handleUpdateReference = (index, field, value) => {
    const updated = [...formData.references];
    updated[index][field] = value;
    setFormData({ ...formData, references: updated });
  };

  if (userLoading || profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!myProfile) {
    return null;
  }

  const availableTags = selectedCategory ? TRADE_TAGS_BY_CATEGORY[selectedCategory] || [] : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCircle className="w-10 h-10 text-indigo-600" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500 mt-1">{formData.role === "gc" ? "General Contractor" : "Trade Professional"}</p>
          </div>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="bg-indigo-600 hover:bg-indigo-700">
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setEditing(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              {editing ? (
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              ) : (
                <p className="text-slate-700">{formData.company_name || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Owner Name</Label>
              {editing ? (
                <Input
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                />
              ) : (
                <p className="text-slate-700">{formData.owner_name || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              {editing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <p className="text-slate-700">{formData.email || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              {editing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="text-slate-700">{formData.phone || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              {editing ? (
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                />
              ) : (
                <p className="text-slate-700">{formData.website_url || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Zip Code</Label>
              {editing ? (
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                />
              ) : (
                <p className="text-slate-700">{formData.zip_code || "—"}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Business Address</Label>
            {editing ? (
              <Input
                value={formData.business_address}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
              />
            ) : (
              <p className="text-slate-700">{formData.business_address || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Service Radius (miles)</Label>
            {editing ? (
              <Input
                type="number"
                value={formData.service_radius}
                onChange={(e) => setFormData({ ...formData, service_radius: e.target.value })}
              />
            ) : (
              <p className="text-slate-700">{formData.service_radius ? `${formData.service_radius} miles` : "—"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category & Tags (for trades only) */}
      {formData.role === "trade" && (
        <Card>
          <CardHeader>
            <CardTitle>Trade Category & Specializations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              {editing ? (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-slate-700">
                  {TRADE_CATEGORIES.find((c) => c.value === selectedCategory)?.label || "—"}
                </p>
              )}
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label>Specializations</Label>
                {editing ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center gap-2">
                        <Checkbox
                          id={tag}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => handleToggleTag(tag)}
                        />
                        <Label htmlFor={tag} className="cursor-pointer text-sm">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.length > 0 ? (
                      selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-slate-500">No specializations selected</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <Textarea
              value={formData.profile_bio}
              onChange={(e) => setFormData({ ...formData, profile_bio: e.target.value })}
              rows={4}
              placeholder="Tell others about your business..."
            />
          ) : (
            <p className="text-slate-700 whitespace-pre-wrap">{formData.profile_bio || "—"}</p>
          )}
        </CardContent>
      </Card>

      {/* Project Examples */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Examples (up to 3)</CardTitle>
          {editing && formData.projects.length < 3 && (
            <Button onClick={handleAddProject} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add Project
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.projects.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No project examples yet</p>
          ) : (
            formData.projects.map((project, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-3">
                {editing && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleRemoveProject(idx)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  {editing ? (
                    <Input
                      value={project.title}
                      onChange={(e) => handleUpdateProject(idx, "title", e.target.value)}
                    />
                  ) : (
                    <p className="text-slate-700">{project.title || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  {editing ? (
                    <Textarea
                      value={project.description}
                      onChange={(e) => handleUpdateProject(idx, "description", e.target.value)}
                      rows={2}
                    />
                  ) : (
                    <p className="text-slate-700">{project.description || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Photo URL</Label>
                  {editing ? (
                    <Input
                      value={project.photo_url}
                      onChange={(e) => handleUpdateProject(idx, "photo_url", e.target.value)}
                    />
                  ) : project.photo_url ? (
                    <img src={project.photo_url} alt={project.title} className="rounded-lg max-h-48" />
                  ) : (
                    <p className="text-slate-500">No photo</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>References (up to 3)</CardTitle>
          {editing && formData.references.length < 3 && (
            <Button onClick={handleAddReference} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add Reference
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.references.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No references yet</p>
          ) : (
            formData.references.map((reference, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                {editing && (
                  <div className="flex justify-end mb-2">
                    <Button
                      onClick={() => handleRemoveReference(idx)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    {editing ? (
                      <Input
                        value={reference.name}
                        onChange={(e) => handleUpdateReference(idx, "name", e.target.value)}
                      />
                    ) : (
                      <p className="text-slate-700">{reference.name || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    {editing ? (
                      <Input
                        value={reference.phone}
                        onChange={(e) => handleUpdateReference(idx, "phone", e.target.value)}
                      />
                    ) : (
                      <p className="text-slate-700">{reference.phone || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    {editing ? (
                      <Input
                        value={reference.email}
                        onChange={(e) => handleUpdateReference(idx, "email", e.target.value)}
                      />
                    ) : (
                      <p className="text-slate-700">{reference.email || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}