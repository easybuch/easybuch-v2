// Mapping between German category names (stored in DB) and translation keys
export const CATEGORY_MAPPING: Record<string, string> = {
  'Büromaterial & Ausstattung': 'categories.officeMaterials',
  'Fahrtkosten (Kraftstoff & Parkplatz)': 'categories.fuelParking',
  'Fahrtkosten (ÖPNV & Bahn)': 'categories.publicTransport',
  'Verpflegung & Bewirtung': 'categories.foodCatering',
  'Unterkunft & Reisen': 'categories.accommodationTravel',
  'Software & Lizenzen': 'categories.softwareLicenses',
  'Hardware & Elektronik': 'categories.hardwareElectronics',
  'Telekommunikation & Internet': 'categories.telecommunicationInternet',
  'Marketing & Werbung': 'categories.marketingAdvertising',
  'Website & Online-Dienste': 'categories.websiteOnlineServices',
  'Steuerberatung': 'categories.taxConsulting',
  'Rechtsberatung': 'categories.legalConsulting',
  'Versicherungen': 'categories.insurance',
  'Miete & Nebenkosten': 'categories.rentUtilities',
  'Weiterbildung': 'categories.training',
  'Sonstiges': 'categories.other',
};

// All available categories (German names as stored in DB)
export const RECEIPT_CATEGORIES = [
  'Büromaterial & Ausstattung',
  'Fahrtkosten (Kraftstoff & Parkplatz)',
  'Fahrtkosten (ÖPNV & Bahn)',
  'Verpflegung & Bewirtung',
  'Unterkunft & Reisen',
  'Software & Lizenzen',
  'Hardware & Elektronik',
  'Telekommunikation & Internet',
  'Marketing & Werbung',
  'Website & Online-Dienste',
  'Steuerberatung',
  'Rechtsberatung',
  'Versicherungen',
  'Miete & Nebenkosten',
  'Weiterbildung',
  'Sonstiges',
];

// Helper function to get translation key for a category
export function getCategoryTranslationKey(category: string): string {
  return CATEGORY_MAPPING[category] || 'categories.other';
}
