import { base44 } from "@/api/base44Client";

const DEMO_TRADES = [
  {
    company_name: "123 Plumbers Inc",
    owner_name: "Mike Johnson",
    phone: "864-555-0101",
    email: "demo+plumber@tradetalk.test",
    zip_code: "29601",
    trade_category: "plumber",
    trade_tags: ["Water Heater", "Rough-in", "Service Calls"],
    business_address: "123 Main St, Greenville, SC",
    profile_bio: "Full-service plumbing with 15+ years experience",
  },
  {
    company_name: "BrightWire Electric",
    owner_name: "Sarah Williams",
    phone: "864-555-0102",
    email: "demo+electrician@tradetalk.test",
    zip_code: "29605",
    trade_category: "electrician",
    trade_tags: ["Panel Upgrade", "Lighting", "Rough-in"],
    business_address: "456 Oak Ave, Greenville, SC",
    profile_bio: "Licensed electrician specializing in residential and commercial",
  },
  {
    company_name: "Upstate HVAC Pros",
    owner_name: "David Chen",
    phone: "864-555-0103",
    email: "demo+hvac@tradetalk.test",
    zip_code: "29607",
    trade_category: "hvac",
    trade_tags: ["Install", "Service", "Ductwork"],
    business_address: "789 Pine Rd, Greenville, SC",
    profile_bio: "Professional HVAC installation and repair services",
  },
  {
    company_name: "Precision Drywall Co",
    owner_name: "James Martinez",
    phone: "864-555-0104",
    email: "demo+drywall@tradetalk.test",
    zip_code: "29609",
    trade_category: "drywall",
    trade_tags: ["Hanging", "Finishing", "Repair"],
    business_address: "321 Elm St, Greenville, SC",
    profile_bio: "Quality drywall hanging and finishing",
  },
  {
    company_name: "Carolina Roofing Group",
    owner_name: "Robert Taylor",
    phone: "864-555-0105",
    email: "demo+roofer@tradetalk.test",
    zip_code: "29611",
    trade_category: "roofer",
    trade_tags: ["Shingles", "Metal", "Repair"],
    business_address: "555 Cedar Ln, Greenville, SC",
    profile_bio: "Residential and commercial roofing experts",
  },
];

export async function seedDemoTrades(gcProfileId) {
  const createdProfiles = [];

  // Get existing profiles to check for duplicates
  const existingProfiles = await base44.entities.Profile.list();
  const existingEmails = new Set(existingProfiles.map(p => p.email?.toLowerCase()));
  const existingCompanies = new Set(existingProfiles.map(p => p.company_name?.toLowerCase()));

  for (const demoTrade of DEMO_TRADES) {
    // Check for duplicates
    const emailExists = existingEmails.has(demoTrade.email.toLowerCase());
    const companyExists = existingCompanies.has(demoTrade.company_name.toLowerCase());

    if (emailExists || companyExists) {
      // Find existing profile
      const existing = existingProfiles.find(
        p => p.email?.toLowerCase() === demoTrade.email.toLowerCase() ||
             p.company_name?.toLowerCase() === demoTrade.company_name.toLowerCase()
      );
      if (existing) {
        createdProfiles.push(existing);
      }
      continue;
    }

    // Create demo trade profile
    const profile = await base44.entities.Profile.create({
      user_id: demoTrade.email,
      role: "trade",
      onboarding_complete: true,
      company_name: demoTrade.company_name,
      owner_name: demoTrade.owner_name,
      phone: demoTrade.phone,
      email: demoTrade.email,
      zip_code: demoTrade.zip_code,
      trade_category: demoTrade.trade_category,
      trade_tags: demoTrade.trade_tags,
      business_address: demoTrade.business_address,
      profile_bio: demoTrade.profile_bio,
    });

    createdProfiles.push(profile);
  }

  // Get existing rolodex links to check for duplicates
  const existingLinks = await base44.entities.RolodexLink.filter({
    gc_profile_id: gcProfileId,
  });
  const existingTradeIds = new Set(existingLinks.map(l => l.trade_profile_id));

  // Create rolodex links
  const linksToCreate = [];
  for (const profile of createdProfiles) {
    if (!existingTradeIds.has(profile.id)) {
      linksToCreate.push({
        gc_profile_id: gcProfileId,
        trade_profile_id: profile.id,
        source: "demo",
      });
    }
  }

  if (linksToCreate.length > 0) {
    await base44.entities.RolodexLink.bulkCreate(linksToCreate);
  }

  return createdProfiles;
}