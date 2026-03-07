import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import en from "./locales/en/translation.json"
import vi from "./locales/vi/translation.json"

i18n
.use(initReactI18next)
.use(LanguageDetector)
.init({
  fallbackLng: "en",
  supportedLngs: ["en", "vi"],
  load: "languageOnly",
  detection: {
    order: ["querystring", "localStorage", "navigator", "htmlTag"],
    caches: ["localStorage"],
  },
    resources: {
    en: { translation: en },
    vi: { translation: vi },
    },
    interpolation: {
      escapeValue: false
    }
})

export default i18n