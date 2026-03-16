import { Link } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1"
          >
            <img src="/assets/images/logo.png" alt="RentEase Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold text-foreground">RentEase</span>
          </motion.div>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg">
                Login / Signup
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}
