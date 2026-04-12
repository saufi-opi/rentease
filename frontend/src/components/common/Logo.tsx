import { motion } from "framer-motion"

interface LogoProps {
  className?: string
  iconSize?: string
  fontSize?: string
}

export function Logo({
  className = "flex items-center gap-1",
  iconSize = "h-6",
  fontSize = "text-xl",
}: LogoProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      <img
        src="/assets/images/logo-no-text.png"
        alt="RentEase Logo"
        className={`${iconSize} w-auto`}
      />
      <span className={`${fontSize} font-bold text-foreground`}>RentEase</span>
    </motion.div>
  )
}
