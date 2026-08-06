import { useState } from "react";
import { Link, useRoute } from "../../app/router.jsx";
import { useI18n } from "../../app/i18n.jsx";

const secondary = [
  ["/routes", "Маршруты"], ["/museums", "Музеи"], ["/education", "Образование"],
  ["/research", "Исследования"], ["/about", "О проекте"],
];

export default function SiteLayout({ children }) {
  const { path } = useRoute();
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const primary = [["/demo", t.nav.map], ["/timeline", t.nav.timeline], ["/events", t.nav.events], ["/people", t.nav.people], ["/heritage", t.nav.heritage]];

  return (
    <div className={`site-shell${path === "/map" ? " site-shell--map" : ""}`}>
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Qazaq Heritage Map — главная">
          <span className="brand__mark">Q</span><span><strong>Qazaq Heritage</strong><small>Map of Kazakhstan</small></span>
        </Link>
        <nav className={`site-nav${open ? " site-nav--open" : ""}`} aria-label="Основная навигация">
          {primary.map(([to, label]) => <Link key={to} to={to} onClick={() => setOpen(false)} className={path === to ? "is-active" : ""}>{label}</Link>)}
          <div className="site-nav__more">
            <button type="button">{t.nav.more} <span>⌄</span></button>
            <div>{secondary.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</div>
          </div>
        </nav>
        <div className="header-actions">
          <label className="language-switcher" aria-label={t.language}>
            <span className="sr-only">{t.language}</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="kk">ҚАЗ</option><option value="ru">РУС</option><option value="en">ENG</option></select>
          </label>
          <Link className="header-map-button" to="/demo">{t.openMap} <span>↗</span></Link>
          <button className="menu-button" aria-expanded={open} aria-label={t.menu} onClick={() => setOpen(!open)}><span></span><span></span></button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
