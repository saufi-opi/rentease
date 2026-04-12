import { motion, type Variants } from "framer-motion"
import { Clock, DollarSign, Headphones, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const reasons = [
  {
    icon: DollarSign,
    title: "Deals for every budget",
    description:
      "Wide range of cars available for all budget types, from economy to premium.",
  },
  {
    icon: Shield,
    title: "Best price guaranteed",
    description:
      "We guarantee the best prices. Found it cheaper elsewhere? We'll match it.",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    description:
      "Our customer support team is available round the clock to assist you.",
  },
  {
    icon: Clock,
    title: "Flexible timing",
    description:
      "Book cars for as short as a few hours or as long as several months.",
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
    <section className="bg-foreground py-24 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-96 w-96 translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/3"
          >
            <Badge className="mb-4 bg-primary text-primary-foreground border-none px-4 py-1">
              Features
            </Badge>
            <h2 className="mb-6 text-4xl font-extrabold text-background tracking-tight leading-tight">
              Why Choose <span className="text-primary italic">RentEase</span>{" "}
              for Your Next Trip?
            </h2>
            <p className="text-background/60 text-lg mb-8 leading-relaxed">
              We provide a premium experience that goes beyond just car rentals.
              Our commitment to quality and customer satisfaction is what sets
              us apart.
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 rounded-xl font-bold shadow-lg shadow-primary/25">
              Learn More
            </Button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="lg:w-2/3 grid gap-6 sm:grid-cols-2"
          >
            {reasons.map((reason, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative rounded-2xl bg-white/3 backdrop-blur-sm border border-white/10 p-8 transition-all duration-300 hover:bg-white/6 hover:border-primary/30"
              >
                <div className="absolute top-0 right-0 h-20 w-20 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 h-16 w-16 rotate-45 bg-primary/10 transition-transform group-hover:scale-150" />
                </div>

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-12 group-hover:scale-110">
                  <reason.icon className="h-7 w-7" />
                </div>

                <h3 className="mb-3 text-xl font-bold text-background group-hover:text-primary transition-colors">
                  {reason.title}
                </h3>
                <p className="text-background/50 leading-relaxed">
                  {reason.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
