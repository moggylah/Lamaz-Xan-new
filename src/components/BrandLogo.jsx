export default function BrandLogo({ className = '', variant = 'full', theme = 'light' }) {
  const isDark = theme === 'dark';
  const src = variant === 'mark'
    ? (isDark ? '/lamaz-xan-logo-dark.png' : '/lamaz-xan-logo.png')
    : (isDark ? '/lamaz-xan-header-dark-v2.png' : '/lamaz-xan-header.png');

  return (
    <img
      className={className}
      src={src}
      alt="Lamaz Xan"
      draggable="false"
    />
  );
}
