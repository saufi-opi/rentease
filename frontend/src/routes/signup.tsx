import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "framer-motion"

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
import { Logo } from "@/components/common/Logo"

const formSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    full_name: z.string().min(1, { message: "Full Name is required" }),
    phone_number: z.string().min(1, { message: "Phone number is required" }),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirm_password: z
      .string()
      .min(1, { message: "Password confirmation is required" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "The passwords don't match",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/signup")({
  component: SignUp,
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
        title: "Sign Up - RentEase",
      },
    ],
  }),
})

function SignUp() {
  const { signUpMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      phone_number: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (signUpMutation.isPending) return

    // exclude confirm_password from submission data
    const { confirm_password: _confirm_password, ...submitData } = data
    signUpMutation.mutate(submitData)
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
            alt="Sign up illustration" 
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
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">RE</div>
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">Join RentEase</span>
                  <span className="text-xs text-muted-foreground">Start your journey today</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <RouterLink to="/" className="mb-6 flex items-center justify-center transition-transform hover:scale-105">
            <Logo iconSize="h-6" fontSize="text-xl" />
          </RouterLink>

          <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
            CREATE YOUR ACCOUNT
          </h1>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your full name"
                        type="text"
                        {...field}
                        className="h-11 border-border focus:border-primary focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+6012-345-6789"
                        type="tel"
                        {...field}
                        className="h-11 border-border focus:border-primary focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="h-11 border-border focus:border-primary focus:ring-primary/20"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                        className="h-11 border-border focus:border-primary focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                        className="h-11 border-border focus:border-primary focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <LoadingButton 
                type="submit" 
                className="h-11 w-full bg-primary text-base font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                loading={signUpMutation.isPending}
              >
                Sign Up
              </LoadingButton>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <RouterLink to="/login" className="font-semibold text-primary hover:underline underline-offset-4">
              Sign In
            </RouterLink>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
