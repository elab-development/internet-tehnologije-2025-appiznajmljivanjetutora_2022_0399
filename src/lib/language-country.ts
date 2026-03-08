export const languageCountryMap: Record<
  string,
  { code: string; label: string; city: string }
> = {
  Engleski: { code: "GB", label: "Ujedinjeno Kraljevstvo", city: "London" },
  Nemacki: { code: "DE", label: "Nemacka", city: "Berlin" },
  "Nemački": { code: "DE", label: "Nemačka", city: "Berlin" },
  Francuski: { code: "FR", label: "Francuska", city: "Pariz" },
  Spanski: { code: "ES", label: "Spanija", city: "Madrid" },
  "Španski": { code: "ES", label: "Španija", city: "Madrid" },
  Italijanski: { code: "IT", label: "Italija", city: "Rim" },
  Ruski: { code: "RU", label: "Rusija", city: "Moskva" },
};

export function getCountryForLanguage(language: string) {
  return languageCountryMap[language];
}
