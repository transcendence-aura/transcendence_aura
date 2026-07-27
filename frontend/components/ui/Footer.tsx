const SHOP = ['Serums & Oils', 'Face Care', 'Ritual Sets'];
const SUPPORT = ['FAQ', 'Shipping & Returns', 'Contact'];
const ABOUT = ['Our Story', 'Sustainability', 'Journal'];
const SOCIALS = ['Instagram', 'Pinterest', 'TikTok'];

function FooterColumn({ label, links }: { label: string; links: string[] }) {
  return (
    <div>
      <span className="text-ui-label text-footer-subtle mb-2.5 block uppercase">{label}</span>
      {links.map((link) => (
        <a key={link} className="text-ui-nav text-footer-text mb-1.5 block cursor-pointer">
          {link}
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-footer-bg px-8 pt-11 pb-6">
      {/* Top grid */}
      <div className="mb-8 grid grid-cols-2 gap-7 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Brand + tagline */}
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-footer-text mb-2 text-[19px]">Aura</p>
          <p className="text-body-sm text-footer-muted max-w-50">
            Pure botanical formulations for mindful skin rituals.
          </p>
        </div>

        <FooterColumn label="Shop" links={SHOP} />
        <FooterColumn label="Support" links={SUPPORT} />
        <FooterColumn label="About" links={ABOUT} />
      </div>

      {/* Bottom bar */}
      <div className="border-footer-subtle flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
        <span className="text-ui-lang text-footer-subtle">© 2026 Aura. All rights reserved.</span>
        <div className="flex gap-4">
          {SOCIALS.map((s) => (
            <span key={s} className="text-ui-lang text-footer-subtle cursor-pointer">
              {s}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
