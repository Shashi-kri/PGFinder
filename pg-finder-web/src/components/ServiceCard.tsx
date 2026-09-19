/* ServiceCard — real photo background with gradient overlay for text legibility */

import Link from 'next/link';
import styles from './ServiceCard.module.css';

interface Props {
  label: string;
  desc: string;
  href: string;
  imageSrc: string;
  cta?: string;
  overlayColor?: string;
}

export default function ServiceCard({ label, desc, href, imageSrc, cta, overlayColor }: Props) {
  return (
    <Link href={href} className={styles.card}>
      {/* Background photo */}
      <img src={imageSrc} alt={label} className={styles.bgImage} />

      {/* Gradient overlay for readability */}
      <div
        className={styles.overlay}
        style={overlayColor ? { background: overlayColor } : undefined}
      />

      {/* Text */}
      <div className={styles.body}>
        <h3 className={styles.label}>{label}</h3>
        <p className={styles.desc}>{desc}</p>
        <span className={styles.cta}>
          {cta || 'Explore'} <span className={styles.ctaArrow}>→</span>
        </span>
      </div>
    </Link>
  );
}
