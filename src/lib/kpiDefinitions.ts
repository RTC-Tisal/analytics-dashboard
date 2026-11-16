// What each KPI tile means, shown when someone hovers, taps or tabs to the tile's ⓘ icon.
// This is the ONE place to change a definition: edit the text here and every page updates.
//
// Adding a tile? Add its definition here first: KpiTile's `definition` prop only accepts
// these ids, so a tile without one (or with a misspelled id) won't build.
//
// Style: plain words, one or two short sentences, say where the number comes from.

export const KPI_DEFINITIONS = {
  // Website (GA4)
  websiteSessions:
    "Visits to the website. A visit ends after 30 minutes without activity. Source: GA4.",
  websiteEngagedSessions:
    "Visits that lasted at least 10 seconds, viewed 2 or more pages, or included a form submission. Source: GA4.",
  websiteEngagementRate:
    "Engaged sessions as a share of all sessions. Higher means more visitors found something worth staying for.",
  websiteFormSubmissions:
    "Contact and enquiry forms sent from the website. Source: GA4.",

  // LinkedIn (Campaign Manager, Company Page, HubSpot)
  linkedinAdSpend:
    "Money spent on LinkedIn ads in this period, for the selected campaign group. Source: Campaign Manager.",
  linkedinLeads:
    "LinkedIn lead form submissions from our ads. Source: Campaign Manager.",
  linkedinCostPerLead:
    "Ad spend divided by leads. Lower is better. Shows — when there were no leads.",
  linkedinPipeline:
    "Total value of deals created in this period whose original source in HubSpot is LinkedIn, from ads or organic posts.",
  linkedinFollowersGained:
    "New followers of the Rootcode Company Page in this period, from organic posts and ads.",
  linkedinPipelineFromAds:
    "Total value of deals created in this period whose original source in HubSpot is LinkedIn ads (paid only).",
} as const;

// The ids above, e.g. "websiteSessions". KpiTile only accepts these.
export type KpiDefinitionId = keyof typeof KPI_DEFINITIONS;
