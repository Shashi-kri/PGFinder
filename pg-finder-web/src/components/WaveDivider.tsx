import styles from './WaveDivider.module.css';

interface Props {
  /** Fill colour = the section ABOVE (default: hero dark teal) */
  fill?: string;
  /** Background colour = the section BELOW (default: inherits) */
  background?: string;
  /** Flip upside-down for reverse wave */
  flip?: boolean;
}

export default function WaveDivider({
  fill = '#061918',
  background = 'transparent',
  flip = false,
}: Props) {
  return (
    <div className={styles.wrap} style={{ background }}>
      <svg
        viewBox="0 0 1440 88"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={styles.svg}
        style={flip ? { transform: 'scaleY(-1)' } : undefined}
        aria-hidden="true"
      >
        <path
          d="M0,0 L1440,0 L1440,44
             C1200,88 960,18 720,52
             C480,86 240,22 0,66 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
