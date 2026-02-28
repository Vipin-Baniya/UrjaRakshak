export function Footer() {
  return (
    <footer className="py-10 px-4 border-t border-accent-electric/10 mt-auto">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-lg font-bold mb-1">⚡ UrjaRakshak</p>
        <p className="text-text-muted text-sm mb-6">
          Energy is a civilizational lifeline. We protect it with intelligence, humility, and ethics.
        </p>
        <div className="border-t border-accent-electric/10 pt-6">
          <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Developer &amp; Founder</p>
          <p className="text-white font-bold text-base">Vipin Baniya</p>
          <p className="text-text-muted text-sm mt-1">Developer &amp; Founder — UrjaRakshak</p>
        </div>
        <p className="text-text-muted/40 text-xs mt-6">
          &copy; {new Date().getFullYear()} UrjaRakshak. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
