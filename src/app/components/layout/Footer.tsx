// src/app/components/layout/Footer.tsx
// Full site footer — replaces the single-line placeholder.

import { Link } from "react-router"
import { motion } from "motion/react"
import { Zap, Twitter, Linkedin, Github } from "lucide-react"
import { viewItem, inViewConfig } from "@/app/hooks/useScrollAnimation"

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Marketplace", href: "/explore" },
    { label: "For Experts", href: "/apply" },
  ],
  Platform: [
    { label: "Documentation", href: "https://docs.experthub.io" },
    { label: "API Reference", href: "https://docs.experthub.io/api" },
    { label: "Status", href: "https://status.experthub.io" },
    { label: "Changelog", href: "/changelog" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "GDPR", href: "/gdpr" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <motion.div
            variants={viewItem}
            initial="hidden"
            whileInView="show"
            viewport={inViewConfig}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                ExpertHub
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              The complete white-label platform for businesses to launch, run, and scale expert consulting communities under their own brand.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: Twitter, href: "https://twitter.com/experthubio", label: "Twitter" },
                { icon: Linkedin, href: "https://linkedin.com/company/experthub", label: "LinkedIn" },
                { icon: Github, href: "https://github.com/experthub", label: "GitHub" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links], gi) => (
            <motion.div
              key={group}
              variants={viewItem}
              initial="hidden"
              whileInView="show"
              viewport={inViewConfig}
              transition={{ delay: gi * 0.06 }}
            >
              <h4 className="text-sm font-semibold text-white mb-4">{group}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("http") ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ExpertHub Technologies. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            Built for the next generation of expert communities.
          </p>
        </div>
      </div>
    </footer>
  )
}
