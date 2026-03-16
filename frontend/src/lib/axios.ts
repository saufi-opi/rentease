import { OpenAPI } from "../client"

const TOKEN_KEY = "access_token"

export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY)

OpenAPI.BASE = import.meta.env.VITE_API_URL ?? ""
OpenAPI.WITH_CREDENTIALS = true
OpenAPI.TOKEN = async () => {
  return getAccessToken() || ""
}
