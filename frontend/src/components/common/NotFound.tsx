import { Link } from "@tanstack/react-router"
import { AlertCircle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <AlertCircle className="mb-4 h-16 w-16 text-destructive" />
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        404
      </h1>
      <h2 className="mb-6 text-xl font-semibold text-muted-foreground">
        Page Not Found
      </h2>
      <p className="mb-8 max-w-[500px] text-muted-foreground">
        The page you are looking for doesn't exist
      </p>
      <Link to="/">
        <Button className="gap-2">
          <Home className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  )
}
