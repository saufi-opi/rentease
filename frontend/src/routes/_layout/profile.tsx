import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { type UpdateProfileRequest, UserControllerService } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      {
        title: "My Profile - RentEase",
      },
    ],
  }),
})

function ProfilePage() {
  const { user, logout } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || "",
        email: user.email || "",
        phoneNumber: user.phone_number || "",
        address: user.address || "",
      })
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      UserControllerService.updateProfile({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Profile updated successfully")
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
    onError: (error: any) => {
      showErrorToast(error.message || "Failed to update profile")
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: () => UserControllerService.deleteProfile(),
    onSuccess: () => {
      showSuccessToast("Account deleted successfully")
      logout()
    },
    onError: (error: any) => {
      showErrorToast(error.message || "Failed to delete account")
    },
  })

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      deleteUserMutation.mutate()
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate({
      full_name: formData.fullName,
      phone_number: formData.phoneNumber,
      address: formData.address,
    })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 pb-4">
            <CardTitle className="text-xl font-bold text-primary">
              My Account
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form className="space-y-8" onSubmit={onSubmit}>
              {/* Row 1 */}
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="John Patrik Doe"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="h-11 border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="h-11 border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+6012-345-6789"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleChange("phoneNumber", e.target.value)
                    }
                    className="h-11 border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">
                    Address
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="h-11 border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-primary px-10 h-12 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95"
                >
                  {updateProfileMutation.isPending
                    ? "Updating..."
                    : "Update Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border border-destructive/20 shadow-sm mt-8">
          <CardHeader className="border-b border-destructive/10 bg-destructive/5 pb-4">
            <CardTitle className="text-xl font-bold text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="font-bold text-foreground">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteUserMutation.isPending}
                className="h-12 px-8 font-bold shadow-sm transition-all hover:shadow-destructive/20 active:scale-95"
              >
                {deleteUserMutation.isPending
                  ? "Deleting..."
                  : "Delete My Account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
