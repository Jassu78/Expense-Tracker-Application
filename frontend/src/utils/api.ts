const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api'

export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`
}

export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return ''
  
  // If the image path already starts with http, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // Remove the leading slash if it exists
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  
  // For development, use the backend server URL
  if ((import.meta as any).env.DEV) {
    return `http://localhost:5001/${cleanPath}`
  }
  
  // For production, use relative path
  return `/${cleanPath}`
} 