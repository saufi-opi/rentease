import { Link } from "@tanstack/react-router"

export function Navbar() {
  return (
    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
      <Link 
        to="/" 
        className="text-muted-foreground hover:text-primary transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
        activeOptions={{ exact: true }}
      >
        Home
      </Link>
      <Link 
        to="/cars" 
        className="text-muted-foreground hover:text-primary transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        Cars
      </Link>
      <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
      <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
    </nav>
  )
}
