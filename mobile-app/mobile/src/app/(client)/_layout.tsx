import React from "react";
import { useMobileI18n } from "../../providers/MobileI18nProvider";

// Unified Client Mobile Tab Bar: 🏠 Home | 📅 Calls | 🎓 Learn | 💬 AI (Localized dynamically)
export const CLIENT_TABS = [
  { route: "index", labelKey: "tab.home", defaultLabel: "Home", icon: "Home" },
  { route: "calls", labelKey: "tab.calls", defaultLabel: "Calls", icon: "Calendar" },
  { route: "learn", labelKey: "tab.learn", defaultLabel: "Learn", icon: "GraduationCap" },
  { route: "ai",    labelKey: "tab.ai",    defaultLabel: "AI & Privacy", icon: "MessageSquare" }
] as const;

export default function ClientTabLayout() {
  const { t } = useMobileI18n();
  return CLIENT_TABS.map((tab) => ({
    ...tab,
    localizedLabel: t(tab.labelKey, tab.defaultLabel),
  })) as any;
}
