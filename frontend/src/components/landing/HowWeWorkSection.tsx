import { motion } from "framer-motion"
import { MapPin, Calendar, Car } from "lucide-react"

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
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
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2 text-3xl font-bold text-foreground">HOW WE WORK ?</h2>
          <p className="text-muted-foreground">Simple steps to rent your perfect car</p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-8 md:grid-cols-3"
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="group text-center"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20"
              >
                <step.icon className="h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" />
              </motion.div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
