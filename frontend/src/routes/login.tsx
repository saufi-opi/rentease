import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Logo } from "@/components/common/Logo"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
})

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "Enter the 6-digit code from your email" })
    .regex(/^\d{6}$/, { message: "Code must be 6 digits" }),
})

type FormData = z.infer<typeof formSchema>
type OtpData = z.infer<typeof otpSchema>

const SearchSchema = z.object({
  next: z.string().optional(),
})

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search) => SearchSchema.parse(search),
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/profile",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Log In - RentEase",
      },
    ],
  }),
})

function Login() {
  const { loginMutation, verifyOtpMutation } = useAuth()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const [step, setStep] = useState<"password" | "otp">("password")
  const [otpEmail, setOtpEmail] = useState("")

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    criteriaMode: "all",
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const otpForm = useForm<OtpData>({
    resolver: zodResolver(otpSchema),
    criteriaMode: "all",
    defaultValues: { otp: "" },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data, {
      onSuccess: (result) => {
        if (result.requiresOtp && result.email) {
          setOtpEmail(result.email)
          setStep("otp")
        } else {
          navigate({ to: search.next || "/profile" })
        }
      },
    })
  }

  const onOtpSubmit = (data: OtpData) => {
    if (verifyOtpMutation.isPending) return
    verifyOtpMutation.mutate(
      { email: otpEmail, otp: data.otp },
      {
        onSuccess: () => navigate({ to: search.next || "/profile" }),
      },
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Illustration */}
      <div className="hidden w-1/2 items-center justify-center bg-linear-to-br from-primary/10 to-accent/20 lg:flex">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative p-12"
        >
          <img
            src="/assets/images/marketing/auth_bg.png"
            alt="Car rental illustration"
            className="max-w-md rounded-2xl shadow-2xl opacity-90"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="rounded-xl bg-background/80 p-8 shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-2xl font-bold text-primary">CAR</span>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
                  <span className="text-2xl font-bold text-primary-foreground">
                    RENT
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <RouterLink
            to="/"
            className="mb-8 flex items-center justify-center gap-2 transition-transform hover:scale-105"
          >
            <Logo iconSize="h-6" fontSize="text-xl" />
          </RouterLink>

          <AnimatePresence mode="wait">
            {step === "password" ? (
              <motion.div
                key="password-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="mb-8 text-center text-2xl font-bold text-foreground">
                  YOUR ADVENTURE'S
                  <br />
                  START HERE
                </h1>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="user@example.com"
                              type="email"
                              autoComplete="email"
                              {...field}
                              className="h-12 border-border focus:border-primary focus:ring-primary/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <RouterLink
                              to="."
                              className="text-xs text-primary hover:underline"
                            >
                              Forgot password?
                            </RouterLink>
                          </div>
                          <FormControl>
                            <PasswordInput
                              placeholder="••••••••"
                              autoComplete="current-password"
                              {...field}
                              className="h-12 border-border focus:border-primary focus:ring-primary/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <LoadingButton
                      type="submit"
                      className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                      loading={loginMutation.isPending}
                    >
                      Sign In
                    </LoadingButton>
                  </form>
                </Form>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Don't have an account yet?{" "}
                  <RouterLink
                    to="/signup"
                    className="font-semibold text-primary hover:underline underline-offset-4"
                  >
                    Create an account
                  </RouterLink>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="mb-3 text-center text-2xl font-bold text-foreground">
                  VERIFY YOUR
                  <br />
                  IDENTITY
                </h1>

                <p className="mb-8 text-center text-sm text-muted-foreground">
                  A 6-digit code was sent to{" "}
                  <strong className="text-foreground">{otpEmail}</strong>.
                  <br />
                  It expires in 5 minutes.
                </p>

                <Form {...otpForm}>
                  <form
                    onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123456"
                              maxLength={6}
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              {...field}
                              className="h-14 border-border text-center text-2xl tracking-widest focus:border-primary focus:ring-primary/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <LoadingButton
                      type="submit"
                      className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                      loading={verifyOtpMutation.isPending}
                    >
                      Verify &amp; Sign In
                    </LoadingButton>
                  </form>
                </Form>

                <button
                  type="button"
                  className="mt-6 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    setStep("password")
                    otpForm.reset()
                  }}
                >
                  ← Back to login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
