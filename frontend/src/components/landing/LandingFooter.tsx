import { Link } from "@tanstack/react-router"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <img src="/assets/images/logo.png" alt="RentEase Logo" className="h-6 w-auto" />
              <span className="text-xl font-bold">RentEase</span>
            </div>
            <p className="mb-4 text-sm text-background/70">
              Your trusted partner for car rentals. Discover freedom on wheels with our wide selection of vehicles.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/70 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link to="/cars" className="hover:text-primary">Browse Cars</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/help" className="hover:text-primary">Help Center</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold">Contact Us</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li>Email: support@rentease.com</li>
              <li>Phone: +604-34567890</li>
              <li>Address: 123 Car Street, Kuala Lumpur, Malaysia</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-background/20 pt-8 text-center text-sm text-background/70">
          <p>&copy; {new Date().getFullYear()} RentEase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
