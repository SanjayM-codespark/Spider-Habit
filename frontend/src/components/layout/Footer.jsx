import './Footer.css'

function Footer({ appName }) {
  return (
    <footer className="footer">
      <span className="footer__copy">
        © {new Date().getFullYear()} {appName} Admin. All rights reserved.
      </span>
      <nav className="footer__links" aria-label="Footer">
        <a href="/support">Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
    </footer>
  )
}

export default Footer