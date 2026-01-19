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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, ArrowRight, ArrowLeft, Upload, X, Plus } from "lucide-react";
import { TRADE_CATEGORIES, TRADE_TAGS_BY_CATEGORY } from "@/components/config/tradeTaxonomy";
import { getInviteTokenFromUrl } from "@/components/utils/inviteUtils";
import { ensureRolodexLink } from "@/components/utils/rolodexUtils";

const STEPS = {
  ROLE: 1,
  BASIC_INFO: 2,
  CATEGORY_TAGS: 3,
  PROJECTS: 4,
  REFERENCES: 5,
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(STEPS.ROLE);
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [formData, setFormData] = useState({
    role: "",
    company_name: "",
    owner_name: "",
    email: "",
    phone: "",
    website_url: "",
    business_address: "",
    zip_code: "",
    service_radius: "",
    profile_bio: "",
    trade_category: "",
    trade_tags: [],
    projects: [],
    references: [],
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingProfile } = useQuery({
    queryKey: ["myProfile", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const profiles = await base44.entities.Profile.filter({ user_id: currentUser.email });
      return profiles[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    if (existingProfile) {
      navigate(createPageUrl("Dashboard"));
    }
  }, [existingProfile, navigate]);

  useEffect(() => {
    const token = getInviteTokenFromUrl();
    if (token) {
      setInviteToken(token);
      fetchInviteData(token);
    }
  }, []);

  const fetchInviteData = async (token) => {
    const invites = await base44.entities.Invite.filter({ token });
    if (invites.length > 0) {
      const invite = invites[0];
      setInviteData(invite);
      setFormData((prev) => ({
        ...prev,
        role: "trade",
        owner_name: invite.invited_name || "",
        phone: invite.invited_phone || "",
        trade_category: invite.invited_trade_category || "",
      }));
      setCurrentStep(STEPS.BASIC_INFO);
    }
  };

  const createProfileMutation = useMutation({
    mutationFn: async (data) => {
      const profile = await base44.entities.Profile.create({
        user_id: currentUser.email,
        role: data.role,
        onboarding_complete: true,
        company_name: data.company_name,
        owner_name: data.owner_name,
        email: data.email,
        phone: data.phone,
        website_url: data.website_url,
        business_address: data.business_address,
        zip_code: data.zip_code,
        service_radius: data.service_radius ? parseFloat(data.service_radius) : null,
        trade_category: data.trade_category,
        trade_tags: data.trade_tags,
        profile_bio: data.profile_bio,
        projects: data.projects,
        references: data.references,
      });

      // If invite exists, create rolodex link and mark invite accepted
      if (inviteToken && inviteData) {
        await ensureRolodexLink(inviteData.sent_by_profile_id, profile.id, "invite");
        await base44.entities.Invite.update(inviteData.id, {
          status: "accepted",
          accepted_date: new Date().toISOString(),
        });
      }

      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      navigate(createPageUrl("Dashboard"));
    },
  });

  const handleNext = () => {
    if (currentStep === STEPS.ROLE && !formData.role) return;
    if (currentStep === STEPS.BASIC_INFO) {
      if (!formData.company_name || !formData.owner_name || !formData.email || !formData.phone) {
        alert("Please fill in all required fields: Business Name, Name, Email, and Phone");
        return;
      }
      if (!formData.email.includes("@") || !formData.email.includes(".")) {
        alert("Please enter a valid email address");
        return;
      }
    }
    if (currentStep === STEPS.CATEGORY_TAGS && formData.role === "trade" && !formData.trade_category) {
      alert("Please select a trade category");
      return;
    }
    if (currentStep < STEPS.REFERENCES) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > STEPS.ROLE) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    createProfileMutation.mutate(formData);
  };

  const handleToggleTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      trade_tags: prev.trade_tags.includes(tag)
        ? prev.trade_tags.filter((t) => t !== tag)
        : [...prev.trade_tags, tag],
    }));
  };

  const handleAddProject = () => {
    if (formData.projects.length < 3) {
      setFormData({
        ...formData,
        projects: [...formData.projects, { title: "", description: "", photo_url: "" }],
      });
    }
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
    if (formData.references.length < 3) {
      setFormData({
        ...formData,
        references: [...formData.references, { name: "", phone: "", email: "" }],
      });
    }
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

  const availableTags = formData.trade_category ? TRADE_TAGS_BY_CATEGORY[formData.trade_category] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-10 h-10 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">Trade Talk</h1>
          </div>
          <p className="text-slate-600">Complete your profile to get started</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Step {currentStep} of 5</span>
            <span className="text-sm text-slate-600">{Math.round((currentStep / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>
              {currentStep === STEPS.ROLE && "Choose Your Role"}
              {currentStep === STEPS.BASIC_INFO && "Basic Information"}
              {currentStep === STEPS.CATEGORY_TAGS && "Category & Specializations"}
              {currentStep === STEPS.PROJECTS && "Project Examples"}
              {currentStep === STEPS.REFERENCES && "References"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Role */}
            {currentStep === STEPS.ROLE && (
              <div className="space-y-4">
                <div
                  onClick={() => setFormData({ ...formData, role: "gc" })}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.role === "gc"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-2">General Contractor</h3>
                  <p className="text-slate-600 text-sm">
                    Manage projects, invite trades, and oversee construction work
                  </p>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, role: "trade" })}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.role === "trade"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-2">Trade Professional</h3>
                  <p className="text-slate-600 text-sm">
                    Showcase your skills, connect with GCs, and grow your business
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {currentStep === STEPS.BASIC_INFO && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Business Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Name *</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website (optional)</Label>
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_address">Business Address (optional)</Label>
                  <Input
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">Zip Code (optional)</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_radius">Service Radius (miles, optional)</Label>
                    <Input
                      id="service_radius"
                      type="number"
                      value={formData.service_radius}
                      onChange={(e) => setFormData({ ...formData, service_radius: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile_bio">About Your Business (optional)</Label>
                  <Textarea
                    id="profile_bio"
                    value={formData.profile_bio}
                    onChange={(e) => setFormData({ ...formData, profile_bio: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Category & Tags */}
            {currentStep === STEPS.CATEGORY_TAGS && formData.role === "trade" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Trade Category *</Label>
                  <Select value={formData.trade_category} onValueChange={(v) => setFormData({ ...formData, trade_category: v, trade_tags: [] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your trade category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.trade_category && (
                  <div className="space-y-2">
                    <Label>Specializations (select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2">
                      {availableTags.map((tag) => (
                        <div key={tag} className="flex items-center gap-2">
                          <Checkbox
                            id={tag}
                            checked={formData.trade_tags.includes(tag)}
                            onCheckedChange={() => handleToggleTag(tag)}
                          />
                          <Label htmlFor={tag} className="cursor-pointer text-sm">
                            {tag}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === STEPS.CATEGORY_TAGS && formData.role === "gc" && (
              <div className="text-center py-8">
                <p className="text-slate-600">Category selection is for trade professionals only.</p>
                <p className="text-slate-500 text-sm mt-2">Click Next to continue.</p>
              </div>
            )}

            {/* Step 4: Projects */}
            {currentStep === STEPS.PROJECTS && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Project Examples (up to 3, optional)</Label>
                  {formData.projects.length < 3 && (
                    <Button onClick={handleAddProject} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Project
                    </Button>
                  )}
                </div>
                {formData.projects.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No project examples yet. You can add them later.</p>
                  </div>
                ) : (
                  formData.projects.map((project, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex justify-end">
                        <Button onClick={() => handleRemoveProject(idx)} size="sm" variant="ghost" className="text-red-600">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Project Title</Label>
                        <Input
                          value={project.title}
                          onChange={(e) => handleUpdateProject(idx, "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={project.description}
                          onChange={(e) => handleUpdateProject(idx, "description", e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Photo URL</Label>
                        <Input
                          value={project.photo_url}
                          onChange={(e) => handleUpdateProject(idx, "photo_url", e.target.value)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 5: References */}
            {currentStep === STEPS.REFERENCES && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>References (up to 3, optional)</Label>
                  {formData.references.length < 3 && (
                    <Button onClick={handleAddReference} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Reference
                    </Button>
                  )}
                </div>
                {formData.references.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No references yet. You can add them later.</p>
                  </div>
                ) : (
                  formData.references.map((reference, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-end mb-2">
                        <Button onClick={() => handleRemoveReference(idx)} size="sm" variant="ghost" className="text-red-600">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={reference.name}
                            onChange={(e) => handleUpdateReference(idx, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={reference.phone}
                            onChange={(e) => handleUpdateReference(idx, "phone", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={reference.email}
                            onChange={(e) => handleUpdateReference(idx, "email", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              {currentStep > STEPS.ROLE && !inviteToken ? (
                <Button onClick={handleBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              {currentStep < STEPS.REFERENCES ? (
                <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 ml-auto">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-indigo-600 hover:bg-indigo-700 ml-auto">
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}