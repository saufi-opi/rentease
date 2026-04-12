import { motion, type Variants } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const offers = [
  {
    id: 1,
    title: "RENTEASE 10",
    description: "Get 10% off on your first rental",
    image: "/assets/images/marketing/offer_newuser.png",
    discount: "10% OFF",
  },
  {
    id: 2,
    title: "RENTEASE 10",
    description: "Weekend special discount",
    image: "/assets/images/marketing/offer_weekend.png",
    discount: "15% OFF",
  },
  {
    id: 3,
    title: "NEWUSER 50",
    description: "New user welcome bonus",
    image: "/assets/images/marketing/offer_newuser.png",
    discount: "RM 50 OFF",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export function TrendingOffersSection() {
  return (
    <section className="bg-muted py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h2 className="mb-2 text-3xl font-bold text-foreground">
            TOP TRENDING OFFER
          </h2>
          <p className="text-muted-foreground">
            Grab the best deals before they expire
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {offers.map((offer) => (
            <motion.div key={offer.id} variants={cardVariants}>
              <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <div className="relative aspect-16/10 overflow-hidden">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent transition-opacity duration-300 group-hover:opacity-80" />
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110">
                      {offer.discount}
                    </Badge>
                  </motion.div>
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-1 font-bold text-foreground transition-colors duration-300 group-hover:text-primary">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {offer.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
