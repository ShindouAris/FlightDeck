import { useEffect, useState } from "react"
import {
  navigationMapStyles,
  satelliteMapStyles,
  type MapThemeStyles,
} from "@/components/ui/map/types"

export type MapAppearance = "satellite" | "navigation"
export type MapLineColor = "amber" | "sky" | "emerald" | "rose"

export type MapSettings = {
  appearance: MapAppearance
  lineColor: MapLineColor
}

const MAP_SETTINGS_STORAGE_KEY = "focusflight.map-settings"
const MAP_SETTINGS_UPDATED_EVENT = "focusflight:map-settings-updated"

export const defaultMapSettings: MapSettings = {
  appearance: "satellite",
  lineColor: "amber",
}

export const MAP_APPEARANCE_OPTIONS = ["satellite", "navigation"] as const

export const MAP_LINE_COLOR_OPTIONS = [
  { id: "amber", value: "#FACC15" },
  { id: "sky", value: "#38BDF8" },
  { id: "emerald", value: "#34D399" },
  { id: "rose", value: "#FB7185" },
] as const satisfies ReadonlyArray<{ id: MapLineColor; value: string }>

const MAP_APPEARANCE_STYLES: Record<MapAppearance, Required<MapThemeStyles>> = {
  satellite: satelliteMapStyles,
  navigation: navigationMapStyles,
}

function isMapAppearance(value: unknown): value is MapAppearance {
  return value === "satellite" || value === "navigation"
}

function isMapLineColor(value: unknown): value is MapLineColor {
  return value === "amber" || value === "sky" || value === "emerald" || value === "rose"
}

function normalizeMapSettings(value: unknown): MapSettings {
  if (!value || typeof value !== "object") {
    return defaultMapSettings
  }

  const candidate = value as Partial<MapSettings>

  return {
    appearance: isMapAppearance(candidate.appearance) ? candidate.appearance : defaultMapSettings.appearance,
    lineColor: isMapLineColor(candidate.lineColor) ? candidate.lineColor : defaultMapSettings.lineColor,
  }
}

export function getMapSettings(): MapSettings {
  if (typeof window === "undefined") {
    return defaultMapSettings
  }

  const rawValue = window.localStorage.getItem(MAP_SETTINGS_STORAGE_KEY)
  if (!rawValue) {
    return defaultMapSettings
  }

  try {
    return normalizeMapSettings(JSON.parse(rawValue))
  } catch {
    return defaultMapSettings
  }
}

function persistMapSettings(settings: MapSettings) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(MAP_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent(MAP_SETTINGS_UPDATED_EVENT, { detail: settings }))
}

export function updateMapSettings(partial: Partial<MapSettings>): MapSettings {
  const nextSettings = normalizeMapSettings({
    ...getMapSettings(),
    ...partial,
  })

  persistMapSettings(nextSettings)

  return nextSettings
}

export function getMapAppearanceStyles(appearance: MapAppearance) {
  return MAP_APPEARANCE_STYLES[appearance]
}

export function getMapLineColorValue(lineColor: MapLineColor) {
  return MAP_LINE_COLOR_OPTIONS.find((option) => option.id === lineColor)?.value ?? MAP_LINE_COLOR_OPTIONS[0].value
}

function subscribeToMapSettings(listener: (settings: MapSettings) => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== MAP_SETTINGS_STORAGE_KEY) {
      return
    }

    listener(getMapSettings())
  }

  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<MapSettings>).detail
    listener(detail ? normalizeMapSettings(detail) : getMapSettings())
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(MAP_SETTINGS_UPDATED_EVENT, handleCustomEvent)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(MAP_SETTINGS_UPDATED_EVENT, handleCustomEvent)
  }
}

export function useMapSettings() {
  const [settings, setSettings] = useState<MapSettings>(() => getMapSettings())

  useEffect(() => {
    return subscribeToMapSettings(setSettings)
  }, [])

  const setMapSettings = (partial: Partial<MapSettings>) => {
    const nextSettings = updateMapSettings(partial)
    setSettings(nextSettings)
  }

  return {
    settings,
    setMapSettings,
  }
}