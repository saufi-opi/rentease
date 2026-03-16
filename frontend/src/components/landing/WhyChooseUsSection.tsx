import { motion, Variants } from "framer-motion"
import { DollarSign, Shield, Headphones, Clock } from "lucide-react"

const reasons = [
  {
    icon: DollarSign,
    title: "Deals for every budget",
    description: "Wide range of cars available for all budget types, from economy to premium.",
  },
  {
    icon: Shield,
    title: "Best price guaranteed",
    description: "We guarantee the best prices. Found it cheaper elsewhere? We'll match it.",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    description: "Our customer support team is available round the clock to assist you.",
  },
  {
    icon: Clock,
    title: "Flexible timing",
    description: "Book cars for as short as a few hours or as long as several months.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export function WhyChooseUsSection() {
  return (
    <section className="bg-muted py-16">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2 text-3xl font-bold text-foreground">WHY CHOOSE US ?</h2>
          <p className="text-muted-foreground">Reasons to rent with RentEase</p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {reasons.map((reason, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group rounded-xl bg-background p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-xl"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20"
              >
                <reason.icon className="h-7 w-7 text-primary" />
              </motion.div>
              <h3 className="mb-2 font-semibold text-foreground">{reason.title}</h3>
              <p className="text-sm text-muted-foreground">{reason.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
