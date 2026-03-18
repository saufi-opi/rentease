import { motion, Variants } from "framer-motion"
import { MapPin, Calendar, Car } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const steps = [
  {
    icon: MapPin,
    title: "Choose a location",
    description: "Select your preferred pickup location from our wide network of stations.",
  },
  {
    icon: Calendar,
    title: "Pick up date",
    description: "Choose your rental dates and times that work best for your schedule.",
  },
  {
    icon: Car,
    title: "Book your car",
    description: "Browse available cars and complete your booking in just a few clicks.",
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

export function HowWeWorkSection() {
  return (
    <section className="bg-background py-24 relative overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1">Process</Badge>
          <h2 className="mb-4 text-4xl font-extrabold text-foreground tracking-tight">How it works?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg text-balance">
            Follow these simple steps to get your perfect ride. We've streamlined the process so you can spend less time booking and more time driving.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-1/2 left-0 hidden w-full -translate-y-1/2 items-center justify-between px-20 md:flex">
            <div className="h-0.5 w-full bg-linear-to-r from-transparent via-primary/20 to-transparent" />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-12 md:grid-cols-3"
          >
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 font-black text-8xl text-primary/5 select-none transition-colors group-hover:text-primary/10">
                  0{index + 1}
                </div>

                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-background border-2 border-primary/10 shadow-xl shadow-primary/5 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/10"
                >
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <step.icon className="h-10 w-10 text-primary transition-transform duration-500 group-hover:scale-110" />
                  
                  {/* Small badge for number */}
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-lg">
                    {index + 1}
                  </div>
                </motion.div>

                <div className="relative z-10 space-y-3">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-balance px-4">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
