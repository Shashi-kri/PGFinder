/* ServiceCard — real photo background with gradient overlay for text legibility */

import Link from 'next/link';
import styles from './ServiceCard.module.css';

interface Props {
  icon: string;
  label: string;
  desc: string;
  href: string;
  imageSrc: string;   /* path to background photo */
  overlayColor?: string; /* optional tint on top of photo, default semi-dark */
}

export default function ServiceCard({ icon, label, desc, href, imageSrc, overlayColor }: Props) {
  return (
    <Link href={href} className={styles.card}>
      {/* Background photo */}
      <img src={imageSrc} alt={label} className={styles.bgImage} />

      {/* Gradient overlay for readability */}
      <div
        className={styles.overlay}
        style={overlayColor ? { background: overlayColor } : undefined}
      />

      {/* Icon circle */}
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
      </div>

      {/* Text */}
      <div className={styles.body}>
        <h3 className={styles.label}>{label}</h3>
        <p className={styles.desc}>{desc}</p>
        <span className={styles.arrow}>→</span>
      </div>
    </Link>
  );
}
