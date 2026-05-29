interface AtoLogoProps {
  height?: number
  className?: string
}

export function AtoLogo({ height = 16, className = "" }: AtoLogoProps) {
  const width = height * 3
  return (
    <a
      href="https://siteato.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center opacity-70 hover:opacity-100 transition-opacity ${className}`}
      style={{ height: `${height}px`, lineHeight: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ato-preto.svg"
        alt="ATO"
        width={width}
        height={height}
        className="block dark:hidden"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ato-branco.svg"
        alt="ATO"
        width={width}
        height={height}
        className="hidden dark:block"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </a>
  )
}
