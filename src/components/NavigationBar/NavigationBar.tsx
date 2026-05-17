import { useState } from 'react';
import logoSrc from '../../assets/logo.svg';
import styles from './NavigationBar.module.css';

export interface NavigationBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: 'daily', label: '每日焦點' },
  { id: 'etf', label: 'ETF 持股' },
  { id: 'bigholders', label: '籌碼追蹤' },
];

export function NavigationBar({ currentPage, onNavigate }: NavigationBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (page: string) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <nav className={styles.navbar} aria-label="主導覽列">
      <img src={logoSrc} alt="Stocksimple" className={styles.logo} />

      {/* Desktop nav */}
      <div className={styles.navLinks}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.navLink} ${currentPage === item.id ? styles.navLinkActive : ''}`}
            onClick={() => handleNav(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="選單"
      >
        <span className={`${styles.hamburgerLine} ${menuOpen ? styles.hamburgerOpen : ''}`} />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`${styles.mobileLink} ${currentPage === item.id ? styles.mobileLinkActive : ''}`}
              onClick={() => handleNav(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
