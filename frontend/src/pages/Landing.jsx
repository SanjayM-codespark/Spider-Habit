import { useState, useEffect } from 'react'
import logo from '../assets/spiderhabit.png'
import './Landing.css'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.spiderhabit'
const APP_STORE_URL = 'https://apps.apple.com/app/spiderhabit/id1234567890'

export default function Landing({ appName = 'SpiderHabit' }) {
  const [year] = useState(new Date().getFullYear())

  return (
    <div className="landing">
      <header className="landing__header">
      </header>

      <main className="landing__main">
        <section className="landing__hero">
          <div className="landing__logo">
            <img src={logo} alt={`${appName} logo`} />
          </div>
          <h1 className="landing__title">Build Better Habits</h1>
          <p className="landing__subtitle">
            Track your daily habits, stay consistent, and achieve your goals with SpiderHabit.
            Simple, beautiful, and effective.
          </p>

          <div className="landing__cta">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing__store-btn landing__store-btn--play"
            >
              <i className="landing__store-icon fa-brands fa-google-play"></i>
              <span>Get it on Google Play</span>
            </a>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing__store-btn landing__store-btn--appstore"
            >
              <i className="landing__store-icon fa-brands fa-apple"></i>
              <span>Download on the App Store</span>
            </a>
          </div>


        </section>
      </main>

      <footer className="landing__footer">
        <p>&copy; {year} {appName}. All rights reserved.</p>
        <div className="landing__footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-conditions">Terms of Service</a>
          <a href="/contact-us">Contact</a>
        </div>
      </footer>
    </div>
  )
}