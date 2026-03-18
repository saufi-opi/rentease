import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function ReferFriendSection() {
  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-2xl bg-linear-to-r from-primary/10 to-accent/20"
        >
          <div className="grid items-center gap-8 p-8 lg:grid-cols-2 lg:p-12">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <motion.img 
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.4 }}
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80" 
                alt="Refer a friend" 
                className="rounded-xl shadow-lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="mb-4 text-3xl font-bold text-foreground">Refer your friend</h2>
              <p className="mb-6 text-muted-foreground">
                Refer a friend to RentEase and you both can earn RM 30 ride credits when they complete their first rental. 
                Share your unique referral code with friends and family to start earning rewards today.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg">
                    Invite Friends
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="border-primary text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground">
                    Learn More
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
