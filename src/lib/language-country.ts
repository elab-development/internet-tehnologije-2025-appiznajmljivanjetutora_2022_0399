type LanguageCountry = {
  countryCode: string;
  currency: string;
};

const LANGUAGE_COUNTRY_MAP: Record<string, LanguageCountry> = {
  engleski: { countryCode: "GB", currency: "GBP" },
  nemacki: { countryCode: "DE", currency: "EUR" },
  francuski: { countryCode: "FR", currency: "EUR" },
  spanski: { countryCode: "ES", currency: "EUR" },
  italijanski: { countryCode: "IT", currency: "EUR" },
  ruski: { countryCode: "RU", currency: "RUB" },
};

function normalizeLanguage(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getCountryForLanguage(languageName: string) {
  const normalized = normalizeLanguage(languageName);
  return LANGUAGE_COUNTRY_MAP[normalized] ?? { countryCode: "US", currency: "USD" };
}
