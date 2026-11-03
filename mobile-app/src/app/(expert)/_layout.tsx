import React from "react";
import { useMobileI18n } from "../../providers/MobileI18nProvider";

// Unified Expert Mobile Tab Bar (Pocket Practice Management OS): 📊 Today | 🗓️ Slots | 📥 Async | 💳 Pay (Localized dynamically)
export const EXPERT_TABS = [
  { route: "today", labelKey: "tab.today", defaultLabel: "Today", icon: "BarChart2" },
  { route: "slots", labelKey: "tab.slots", defaultLabel: "Slots", icon: "Calendar" },
  { route: "async", labelKey: "tab.async", defaultLabel: "Async", icon: "Inbox" },
  { route: "pay",   labelKey: "tab.pay",   defaultLabel: "Pay",   icon: "CreditCard" }
] as const;

export default function ExpertTabLayout() {
  const { t } = useMobileI18n();
  return EXPERT_TABS.map((tab) => ({
    ...tab,
    localizedLabel: t(tab.labelKey, tab.defaultLabel),
  })) as any;
}
