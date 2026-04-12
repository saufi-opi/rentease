import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is RentEase and why is it the best website option?",
    answer:
      "RentEase is a premium car rental platform that connects you with verified car owners. We offer the best prices, widest selection of vehicles, and 24/7 customer support to ensure your rental experience is seamless.",
  },
  {
    question: "What is an Instant transaction with 80% Processed?",
    answer:
      "Our instant transaction feature processes your booking within seconds. 80% of our bookings are confirmed instantly, allowing you to plan your trip without delays.",
  },
  {
    question: "How do you Take a Refund or Transactions From My RentEase?",
    answer:
      "Refunds are processed within 5-7 business days to your original payment method. You can track your refund status in the My Wallet section of your account.",
  },
  {
    question: "Why is DNA Specimen for Real DNA Wheels agency software?",
    answer:
      "We use advanced verification systems to ensure all our car owners and vehicles are legitimate, providing you with safe and reliable rental options.",
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

export function FAQSection() {
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
          <h2 className="mb-2 text-3xl font-bold text-foreground">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-muted-foreground">
            Find answers to common questions
          </p>
        </motion.div>

        <div className="mx-auto max-w-3xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.4,
                        ease: "easeOut",
                      },
                    },
                  }}
                >
                  <AccordionItem
                    value={`item-${index}`}
                    className="rounded-lg border border-border bg-background px-6 transition-all duration-300 hover:border-primary/30 hover:shadow-md"
                  >
                    <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
