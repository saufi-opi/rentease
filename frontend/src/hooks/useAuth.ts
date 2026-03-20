import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import {
  AuthControllerService,
  UserControllerService,
  type UserResponse,
  type UserRegistrationRequest,
  type LoginRequest,
} from "@/client"
import { setAccessToken } from "@/lib/axios"
import { handleError } from "@/utils"
import useCustomToast from "./useCustomToast"

const isLoggedIn = () => {
  return !!localStorage.getItem("access_token")
}

const useAuth = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const logout = () => {
    setAccessToken(null)
    queryClient.clear()
    navigate({ to: "/login" })
  }

  const { data: user } = useQuery<UserResponse | null, Error>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await UserControllerService.getCurrentUser()
      } catch (error) {
        logout()
        return null
      }
    },
    enabled: isLoggedIn(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  const isAdmin = user?.role === "ADMIN"
  const isManagement = user?.role === "MANAGEMENT"
  const isUser = user?.role === "CUSTOMER"

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegistrationRequest) =>
      UserControllerService.register({ requestBody: data }),
    onSuccess: () => {
      navigate({ to: "/login" })
    },
    onError: handleError.bind(showErrorToast),
  })

  const login = async (data: LoginRequest) => {
    const response = await AuthControllerService.login({
      requestBody: data,
    })
    if (response.accessToken) {
      setAccessToken(response.accessToken)
    }
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
    onError: handleError.bind(showErrorToast),
  })

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
    isAdmin,
    isManagement,
    isUser,
  }
}

export { isLoggedIn }
export default useAuth
