import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  darkMode: localStorage.getItem('darkMode') === 'true' || false,
  toggleDarkMode: () => {
    const newMode = !useThemeStore.getState().darkMode
    localStorage.setItem('darkMode', String(newMode))
    set({ darkMode: newMode })
  }
}))

