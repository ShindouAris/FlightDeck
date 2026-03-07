import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Palette,
  Bell,
  Plane,
  Info,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Globe,
  Eye,
  Volume2,
  VolumeX,
  HelpCircle,
  ExternalLink,
  Monitor,
  Clock,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";

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
  const [autoStart, setAutoStart] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [timeFormat, setTimeFormat] = useState("24-hour");
  return (
    <div>
      <SectionTitle>Behavior</SectionTitle>
      <SettingRow icon={Monitor} label="Launch on startup" description="Open app when system boots" trailing={<Toggle enabled={autoStart} onToggle={() => setAutoStart(!autoStart)} />} />
      <Divider />
      <SettingRow icon={Globe} label="Language" description="English (US)" trailing={<span className="text-red-500 font-bold">INOP</span>} />
      <Divider />
      <SettingRow icon={Clock} label="Time format" description={timeFormat} trailing={<span className="text-red-500 font-bold">INOP</span>} />
      <SectionTitle>Analytics</SectionTitle>
      <SettingRow icon={Eye} label="Usage analytics" description="Help improve the app experience" trailing={<Toggle enabled={analytics} onToggle={() => setAnalytics(!analytics)} />} />
    </div>
  );
}

function AppearanceContent() {
  const { theme: rawTheme, setTheme } = useTheme();
  const theme = (rawTheme ?? "dark") as "dark" | "light" | "system";
  return (
    <div>
      <SectionTitle>Theme</SectionTitle>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          { key: "dark", label: "Dark", icon: Moon },
          { key: "light", label: "Light", icon: Sun },
          { key: "system", label: "System", icon: Monitor },
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

function NotificationsContent() {
  const [push, setPush] = useState(true);
  const [sound, setSound] = useState(true);
  return (
    <div>
      <SectionTitle>General</SectionTitle>
      <SettingRow icon={Bell} label="Push notifications" description="Receive real-time updates" trailing={<Toggle enabled={push} onToggle={() => setPush(!push)} />} />
      <Divider />
      <SettingRow icon={sound ? Volume2 : VolumeX} label="Notification sounds" description="Play audio for alerts" trailing={<Toggle enabled={sound} onToggle={() => setSound(!sound)} />} />
    </div>
  );
}

function AboutContent() {
  return (
    <div>
      <div className="flex flex-col items-center py-8 mb-4">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}>
          <Plane size={28} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">FocusFlight</h3>
        <p className="text-xs text-white/40 mt-1">Version 0.1.0 · Build 2026.03</p>
      </div>
      <SectionTitle>Credits</SectionTitle>
      <div className="px-1">
        <p className="text-xs text-white/30 leading-relaxed">
          Built with React, Mapbox GL, and Framer Motion.<br />
          Map data © OpenStreetMap contributors.
        </p>
      </div>
    </div>
  );
}

const contentMap: Record<string, React.FC> = {
  general: GeneralContent,
  appearance: AppearanceContent,
  notifications: NotificationsContent,
  about: AboutContent,
};

/* ──────────────────── Empty State (Desktop) ────────────────── */

function EmptyState() {
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
        Select a setting to configure
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
          {category.label}
        </span>
        <span className="text-[11px] block truncate transition-colors duration-200" style={{ color: isActive ? "#A78BFA80" : "var(--ff-desc-inactive)" }}>
          {category.description}
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
        <p className="text-sm font-medium text-gray-900/88 dark:text-white/90">{category.label}</p>
        <p className="text-xs text-gray-900/40 dark:text-white/35 mt-0.5">{category.description}</p>
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
  const activeLabel = categories.find((c) => c.id === activeCategory)?.label ?? "";
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
              <p className="text-xs text-gray-900/40 dark:text-white/30 mt-1">Manage your preferences</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-2xl text-gray-900/55 hover:text-gray-900 dark:text-white/55 dark:hover:text-white"
            >
              <X size={18} />
            </Button>
          </div>
          {/* Category List */}
          <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
            {categories.map((cat) => (
              <SidebarItem key={cat.id} category={cat} isActive={activeCategory === cat.id} onClick={() => handleSelect(cat.id)} />
            ))}
          </nav>
          {/* Sidebar Footer */}
          <div className="px-6 py-4 border-t" style={{ borderColor: "var(--ff-border)" }}>
            <p className="text-[10px] text-gray-900/25 dark:text-white/15 font-medium tracking-wider uppercase">FocusFlight v0.0.1</p>
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
                      <p className="text-xs text-gray-900/40 dark:text-white/30">{categories.find((c) => c.id === activeCategory)?.description}</p>
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
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
                  <p className="text-xs text-gray-900/40 dark:text-white/30 mt-1">Manage your preferences</p>
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
              <p className="text-[10px] text-gray-900/25 dark:text-white/15 text-center font-medium tracking-wider uppercase">FocusFlight v0.0.1</p>
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
