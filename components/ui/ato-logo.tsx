import Image from "next/image"

interface AtoLogoProps {
  height?: number
  className?: string
}

export function AtoLogo({ height = 16, className = "" }: AtoLogoProps) {
  return (
    <a
      href="https://siteato.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center opacity-70 hover:opacity-100 transition-opacity ${className}`}
    >
      <Image
        src="/ato-preto.svg"
        alt="ATO"
        height={height}
        width={height * 3}
        className="block dark:hidden"
        style={{ height, width: "auto" }}
      />
      <Image
        src="/ato-branco.svg"
        alt="ATO"
        height={height}
        width={height * 3}
        className="hidden dark:block"
        style={{ height, width: "auto" }}
      />
    </a>
  )
}
