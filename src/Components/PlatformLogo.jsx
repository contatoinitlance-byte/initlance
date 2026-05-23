export default function PlatformLogo({ className = 'w-8 h-8', alt = 'Initlance' }) {
  return (
    <img
      src="/LogoInitSemFundo.png"
      alt={alt}
      className={`${className} object-contain`}
    />
  );
}
