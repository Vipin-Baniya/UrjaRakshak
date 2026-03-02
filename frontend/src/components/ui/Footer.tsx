export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-brand-name">⚡ UrjaRakshak</div>
          <div className="footer-brand-sub">Physics-Based Energy Integrity Platform</div>
        </div>

        <div className="footer-center">
          <div className="footer-founder-lbl">Founded by</div>
          <div className="footer-founder-name">Vipin Baniya</div>
        </div>

        <div className="footer-copy">
          © {year} UrjaRakshak. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
