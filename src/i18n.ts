import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import en from "./locales/en/translation.json"
import vi from "./locales/vi/translation.json"
import ja from "./locales/ja/translation.json"

export const translationResources = {
  en: { translation: en },
  vi: { translation: vi },
  ja: { translation: ja }
} as const

export const supportedLanguages = Object.keys(translationResources)

i18n
.use(initReactI18next)
.use(LanguageDetector)
.init({
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  load: "languageOnly",
  detection: {
    order: ["querystring", "localStorage", "navigator", "htmlTag"],
    caches: ["localStorage"],
  },
  resources: translationResources,
  interpolation: {
    escapeValue: false
  }
})

export default i18n