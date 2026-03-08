import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Palette,
  Bell,
  Plane,
  Info,
  Map as MapIcon,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Globe,
  Eye,
  Volume2,
  VolumeX,
  Monitor,
  Clock,
  Check,
  X,
} from "lucide-react";
import { FaAngleLeft } from "react-icons/fa";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { supportedLanguages } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/animate-ui/components/radix/dialog";
import {
  MAP_LINE_COLOR_OPTIONS,
  type MapAppearance,
  getMapLineColorValue,
  useMapSettings,
} from "../lib/map-settings";

/* ─────────────────────────── Types ─────────────────────────── */

interface SettingCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

/* ─────────────────────── Category Data ─────────────────────── */

const categories: SettingCategory[] = [
  { id: "general", label: "General", icon: Settings, description: "App behavior & language" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme, colors & display" },
  { id: "map", label: "Map option", icon: MapIcon, description: "Map look & route accent" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & sounds" },
  { id: "about", label: "About", icon: Info, description: "Version & credits" },
];

/* ────────────────────── Toggle Switch ──────────────────────── */

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <Switch checked={enabled} onCheckedChange={onToggle} />
  );
}

/* ─────────────────── Setting Row Component ─────────────────── */

function SettingRow({
  icon: Icon,
  label,
  description,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-1 group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--ff-surface-raised)" }}>
          <Icon size={18} className="text-[#A78BFA]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900/88 dark:text-white/90">{label}</p>
          {description && <p className="text-xs text-gray-900/45 dark:text-white/40 mt-0.5 truncate">{description}</p>}
        </div>
      </div>
      {trailing && <div className="shrink-0 ml-4">{trailing}</div>}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full" style={{ backgroundColor: "var(--ff-border)" }} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-900/40 dark:text-white/30 mb-3 mt-6 px-1">
      {children}
    </p>
  );
}

/* ────────────────── Content Panel Sections ─────────────────── */

function GeneralContent() {
  const { t, i18n } = useTranslation();
  const [autoStart, setAutoStart] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [timeFormat, setTimeFormat] = useState("24-hour");
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0];
  const displayNames = typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames([activeLanguage], { type: "language" })
    : null;

  const languageOptions = supportedLanguages.map((code) => ({
    code,
    label: displayNames?.of(code) ?? code.toUpperCase(),
  }));

  return (
    <div>
      <SectionTitle>{t("settings.sections.behavior")}</SectionTitle>
      <SettingRow icon={Monitor} label={t("settings.general.launch_on_startup")} description={t("settings.general.launch_on_startup_desc")} trailing={<Toggle enabled={autoStart} onToggle={() => setAutoStart(!autoStart)} />} />
      <Divider />
      <SettingRow
        icon={Globe}
        label={t("settings.general.language")}
        description={t("settings.general.language_desc")}
        trailing={(
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 dark:bg-white/5">
            {languageOptions.map((option) => {
              const isActive = option.code === activeLanguage;

              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => void i18n.changeLanguage(option.code)}
                  className="min-w-22 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? "#8B5CF6" : "transparent",
                    color: isActive ? "#FFFFFF" : "var(--ff-label-inactive)",
                    boxShadow: isActive ? "0 10px 24px rgba(139, 92, 246, 0.24)" : "none",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      />
      <Divider />
      <SettingRow icon={Clock} label={t("settings.general.time_format")} description={timeFormat} trailing={<span className="text-red-500 font-bold">INOP</span>} />
      <SectionTitle>{t("settings.sections.analytics")}</SectionTitle>
      <SettingRow icon={Eye} label={t("settings.analytics.usage_analytics")} description={t("settings.analytics.usage_analytics_desc")} trailing={<Toggle enabled={analytics} onToggle={() => setAnalytics(!analytics)} />} />
    </div>
  );
}

function AppearanceContent() {
  const { t } = useTranslation();
  const { theme: rawTheme, setTheme } = useTheme();
  const theme = (rawTheme ?? "dark") as "dark" | "light" | "system";
  return (
    <div>
      <SectionTitle>{t("settings.sections.theme")}</SectionTitle>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          { key: "dark", label: t("settings.appearance.dark"), icon: Moon },
          { key: "light", label: t("settings.appearance.light"), icon: Sun },
          { key: "system", label: t("settings.appearance.system"), icon: Monitor },
        ] as const).map(({ key, label, icon: ThIcon }) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className="relative flex flex-col items-center gap-2 py-5 rounded-2xl border transition-all duration-300 cursor-pointer"
            style={{
              backgroundColor: theme === key ? "#8B5CF610" : "var(--ff-surface-mid)",
              borderColor: theme === key ? "#8B5CF6" : "var(--ff-border)",
              boxShadow: theme === key ? "0 0 24px #8B5CF620, inset 0 1px 0 #8B5CF618" : "none",
            }}
          >
            <ThIcon size={22} style={{ color: theme === key ? "#A78BFA" : "var(--ff-icon-muted)" }} />
            <span className="text-xs font-medium" style={{ color: theme === key ? "#C4B5FD" : "var(--ff-label-inactive)" }}>{label}</span>
            {theme === key && (
              <motion.div layoutId="theme-indicator" className="absolute -bottom-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#8B5CF6]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const mapAppearancePreviewSrc: Record<MapAppearance, string> = {
  satellite: "/assets/preview/themes/satelliteMapStyles.png",
  navigation: "/assets/preview/themes/navigationMapStyles.png",
};

function MapOptionsContent() {
  const { t } = useTranslation();
  const { settings, setMapSettings } = useMapSettings();
  const [isAppearanceDialogOpen, setIsAppearanceDialogOpen] = useState(false);

  const currentLineColor = getMapLineColorValue(settings.lineColor);

  return (
    <div>
      <SectionTitle>{t("settings.sections.map")}</SectionTitle>
      <SettingRow
        icon={MapIcon}
        label={t("settings.map_options.map_appearance")}
        description={t(`settings.map_options.appearance_descriptions.${settings.appearance}`)}
        trailing={(
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsAppearanceDialogOpen(true)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-gray-900/65 hover:bg-white/10 dark:text-white/75"
          >
            {t("settings.map_options.select_map_appearance")}
          </Button>
        )}
      />
      <Divider />

      <div className="px-1 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900/88 dark:text-white/90">{t("settings.map_options.line_color")}</p>
            <p className="mt-0.5 text-xs text-gray-900/45 dark:text-white/40">{t("settings.map_options.line_color_desc")}</p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${currentLineColor}1A`,
              color: currentLineColor,
            }}
          >
            {t(`settings.map_options.line_color_values.${settings.lineColor}`)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MAP_LINE_COLOR_OPTIONS.map((option) => {
            const isActive = option.id === settings.lineColor;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMapSettings({ lineColor: option.id })}
                className="rounded-2xl border px-3 py-3 text-left transition-all duration-200"
                style={{
                  borderColor: isActive ? option.value : "var(--ff-border)",
                  backgroundColor: isActive ? `${option.value}14` : "var(--ff-surface-mid)",
                  boxShadow: isActive ? `0 12px 28px ${option.value}1F` : "none",
                }}
              >
                <span className="mb-3 block h-2.5 rounded-full" style={{ backgroundColor: option.value }} />
                <span className="text-xs font-semibold" style={{ color: isActive ? option.value : "var(--ff-label-inactive)" }}>
                  {t(`settings.map_options.line_color_values.${option.id}`)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-[28px] border px-5 py-6" style={{ borderColor: "var(--ff-border)", backgroundColor: "var(--ff-surface-mid)" }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-900/35 dark:text-white/30">
                {t("settings.map_options.route_preview")}
              </p>
              <p className="mt-1 text-sm text-gray-900/60 dark:text-white/55">{t("settings.map_options.route_preview_desc")}</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-900/30 dark:text-white/25">A01</span>
          </div>
          <div className="relative mt-5 h-10 overflow-hidden rounded-full" style={{ backgroundColor: "var(--ff-surface-raised)" }}>
            <div
              className="absolute inset-x-4 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${currentLineColor}35 0%, ${currentLineColor} 50%, ${currentLineColor}35 100%)`,
              }}
            />
            <div className="absolute left-5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.08)]" />
            <div
              className="absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white/20"
              style={{ backgroundColor: currentLineColor }}
            />
          </div>
        </div>
      </div>

      <Dialog open={isAppearanceDialogOpen} onOpenChange={setIsAppearanceDialogOpen}>
        <DialogContent className="max-w-4xl border-white/10 bg-[#0b1018]/95 text-white shadow-[0_24px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight">{t("settings.map_options.dialog_title")}</DialogTitle>
            <DialogDescription className="text-white/55">{t("settings.map_options.dialog_desc")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            {(["satellite", "navigation"] as const).map((appearance) => {
              const isActive = appearance === settings.appearance;

              return (
                <button
                  key={appearance}
                  type="button"
                  onClick={() => {
                    setMapSettings({ appearance });
                    setIsAppearanceDialogOpen(false);
                  }}
                  className="group rounded-[28px] border p-3 text-left transition-all duration-300"
                  style={{
                    borderColor: isActive ? "#A78BFA66" : "rgba(255,255,255,0.08)",
                    background: isActive ? "linear-gradient(180deg, rgba(167,139,250,0.14) 0%, rgba(11,16,24,0.9) 100%)" : "rgba(255,255,255,0.03)",
                    boxShadow: isActive ? "0 18px 44px rgba(167, 139, 250, 0.18)" : "none",
                  }}
                >
                  <div className="relative overflow-hidden rounded-[22px] border border-white/8">
                    <img
                      src={mapAppearancePreviewSrc[appearance]}
                      alt={t(`settings.map_options.appearance_values.${appearance}`)}
                      className="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    {isActive && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
                        <Check size={12} />
                        {t("settings.map_options.active")}
                      </div>
                    )}
                  </div>

                  <div className="px-1 pb-1 pt-4">
                    <p className="text-sm font-semibold text-white">{t(`settings.map_options.appearance_values.${appearance}`)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      {t(`settings.map_options.appearance_descriptions.${appearance}`)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotificationsContent() {
  const { t } = useTranslation();
  const [push, setPush] = useState(true);
  const [sound, setSound] = useState(true);
  return (
    <div>
      <SectionTitle>{t("settings.sections.behavior")}</SectionTitle>
      <SettingRow icon={Bell} label={t("settings.notifications.push_notifications")} description={t("settings.notifications.push_desc")} trailing={<Toggle enabled={push} onToggle={() => setPush(!push)} />} />
      <Divider />
      <SettingRow icon={sound ? Volume2 : VolumeX} label={t("settings.notifications.sounds")} description={t("settings.notifications.sounds_desc")} trailing={<Toggle enabled={sound} onToggle={() => setSound(!sound)} />} />
    </div>
  );
}

function AboutContent() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex flex-col items-center py-8 mb-4">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}>
          <Plane size={28} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">FocusFlight</h3>
        <p className="text-xs text-white/40 mt-1">Version 0.1.0 · Build 2026.03</p>
      </div>
      <SectionTitle>{t("settings.sections.credits")}</SectionTitle>
      <div className="px-1">
        <p className="text-xs text-white/30 leading-relaxed">
          {t("settings.about.built_with")}<br />
          {t("settings.about.map_credits")}
        </p>
      </div>
    </div>
  );
}

const contentMap: Record<string, React.FC> = {
  general: GeneralContent,
  appearance: AppearanceContent,
  map: MapOptionsContent,
  notifications: NotificationsContent,
  about: AboutContent,
};

/* ──────────────────── Empty State (Desktop) ────────────────── */

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="relative">
          <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: "radial-gradient(circle, #8B5CF618 0%, transparent 70%)" }} />
          <Settings size={72} className="text-gray-900/10 dark:text-white/6 relative" strokeWidth={1} />
        </div>
      </motion.div>
      <motion.p
        className="text-sm text-gray-900/30 dark:text-white/20 mt-6 font-medium tracking-wide"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {t("settings.select_setting")}
      </motion.p>
    </div>
  );
}

/* ───────────────── Sidebar Item (Desktop) ──────────────────── */

function SidebarItem({
  category,
  isActive,
  onClick,
}: {
  category: SettingCategory;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = category.icon;
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer group"
      style={{
        backgroundColor: isActive ? "#8B5CF60F" : undefined,
      }}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-2xl border"
          style={{
            borderColor: "#8B5CF640",
            boxShadow: "0 0 20px #8B5CF612, inset 0 0 20px #8B5CF608",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
        <div className="relative z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-200" style={{ backgroundColor: isActive ? "#8B5CF620" : "var(--ff-border)" }}>
          <Icon size={16} style={{ color: isActive ? "#A78BFA" : "var(--ff-icon-muted)" }} />
      </div>
      <div className="relative z-10 min-w-0">
        <span className="text-[13px] font-medium block transition-colors duration-200" style={{ color: isActive ? "#E9DFFF" : "var(--ff-label-inactive)" }}>
          {t(`settings.categories.${category.id}.label`) || category.label}
        </span>
        <span className="text-[11px] block truncate transition-colors duration-200" style={{ color: isActive ? "#A78BFA80" : "var(--ff-desc-inactive)" }}>
          {t(`settings.categories.${category.id}.description`) || category.description}
        </span>
      </div>
    </button>
  );
}

/* ───────────────── Mobile List Item ────────────────────────── */

function MobileListItem({
  category,
  onClick,
}: {
  category: SettingCategory;
  onClick: () => void;
}) {
  const Icon = category.icon;
  const { t } = useTranslation();
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/3 transition-colors cursor-pointer"
      whileTap={{ scale: 0.985 }}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--ff-surface-raised)" }}>
        <Icon size={18} className="text-[#A78BFA]" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-gray-900/88 dark:text-white/90">{t(`settings.categories.${category.id}.label`) || category.label}</p>
        <p className="text-xs text-gray-900/40 dark:text-white/35 mt-0.5">{t(`settings.categories.${category.id}.description`) || category.description}</p>
      </div>
      <ChevronRight size={16} className="text-gray-900/20 dark:text-white/15 shrink-0" />
    </motion.button>
  );
}

/* ────────────────────── useMediaQuery ──────────────────────── */

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);

    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/* ══════════════════════ Main Component ══════════════════════ */

interface SettingProps {
  onClose?: () => void;
}

export function Setting({ onClose }: SettingProps = {}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSelect = useCallback((id: string) => setActiveCategory(id), []);
  const handleBack = useCallback(() => setActiveCategory(null), []);
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }

    navigate("/");
  }, [navigate, onClose]);

  const ActiveContent = activeCategory ? contentMap[activeCategory] : null;
  const activeLabel = activeCategory ? t(`settings.categories.${activeCategory}.label`) : "";
  const ActiveIcon = categories.find((c) => c.id === activeCategory)?.icon ?? Settings;

  /* ────────── Desktop: Master-Detail Split View ────────── */
  if (isDesktop) {
    return (
      <div className="fixed inset-0 flex" style={{ backgroundColor: "var(--ff-bg)" }}>
        {/* Sidebar */}
        <aside className="w-75 shrink-0 flex flex-col border-r" style={{ borderColor: "var(--ff-border)", backgroundColor: "var(--ff-surface)" }}>
          {/* Sidebar Header */}
          <div className="px-6 pt-8 pb-4 flex items-start justify-between gap-4">
            <div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-2xl text-gray-900/55 hover:text-gray-900 dark:text-white/55 dark:hover:text-white"
              >
                <FaAngleLeft size={18} />
              </Button>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t("settings.title")}</span>
              <div className="text-xs text-gray-900/40 dark:text-white/30 mt-1">{t("settings.manage_prefs")}</div>
            </div>
          </div>
          {/* Category List */}
          <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
            {categories.map((cat) => (
              <SidebarItem key={cat.id} category={cat} isActive={activeCategory === cat.id} onClick={() => handleSelect(cat.id)} />
            ))}
          </nav>
          {/* Sidebar Footer */}
          <div className="px-6 py-4 border-t" style={{ borderColor: "var(--ff-border)" }}>
            <p className="text-[10px] text-gray-900/25 dark:text-white/15 font-medium tracking-wider uppercase">{t("settings.footer_version")}</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {ActiveContent ? (
              <motion.div
                key={activeCategory}
                className="h-full overflow-y-auto"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="max-w-xl mx-auto px-8 py-10">
                  {/* Content Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF620 0%, #8B5CF608 100%)", border: "1px solid #8B5CF618" }}>
                      <ActiveIcon size={20} className="text-[#A78BFA]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeLabel}</h2>
                      <p className="text-xs text-gray-900/40 dark:text-white/30">{activeCategory ? t(`settings.categories.${activeCategory}.description`) : ""}</p>
                    </div>
                  </div>
                  {/* Content Body */}
                  <ActiveContent />
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  /* ────────── Mobile: Single-Column Drill-Down ─────────── */
  return (
      <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: "var(--ff-bg)" }}>
      <AnimatePresence initial={false}>
        {activeCategory === null ? (
          /* Root List */
          <motion.div
            key="root"
            className="absolute inset-0 overflow-y-auto"
            initial={{ x: "-100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="px-5 pt-14 pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t("settings.title")}</h1>
                  <p className="text-xs text-gray-900/40 dark:text-white/30 mt-1">{t("settings.manage_prefs")}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="rounded-2xl shrink-0 text-gray-900/55 hover:text-gray-900 dark:text-white/55 dark:hover:text-white"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--ff-border)" }}>
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  style={{ borderColor: "var(--ff-border)" }}
                >
                  <MobileListItem category={cat} onClick={() => handleSelect(cat.id)} />
                </motion.div>
              ))}
            </div>
            <div className="px-5 py-8">
              <p className="text-[10px] text-gray-900/25 dark:text-white/15 text-center font-medium tracking-wider uppercase">{t("settings.footer_version")}</p>
            </div>
          </motion.div>
        ) : (
          /* Detail View */
          <motion.div
            key={activeCategory}
            className="absolute inset-0 overflow-y-auto"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Mobile Back Header */}
              <div className="sticky top-0 z-10 backdrop-blur-xl" style={{ backgroundColor: "var(--ff-overlay)" }}>
              <div className="flex items-center gap-3 px-4 pt-14 pb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="rounded-xl shrink-0"
                >
                  <ChevronLeft size={18} className="text-white/60" />
                </Button>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{activeLabel}</h2>
              </div>
              <div className="h-px" style={{ backgroundColor: "var(--ff-border)" }} />
            </div>
            {/* Mobile Content */}
            <div className="px-5 py-4 pb-16">
              {ActiveContent && <ActiveContent />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Setting;
