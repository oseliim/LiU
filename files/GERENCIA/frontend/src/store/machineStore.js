import { create } from 'zustand'

export const useMachineStore = create((set) => ({
  machines: [],
  selectedMachines: [],
  loading: false,
  error: null,
  
  setMachines: (machines) => set({ machines }),
  
  addMachine: (machine) => set((state) => ({
    machines: [...state.machines, machine]
  })),
  
  updateMachine: (ip, updates) => set((state) => ({
    machines: state.machines.map(m => 
      m.ip === ip ? { ...m, ...updates } : m
    )
  })),
  
  setSelectedMachines: (ips) => set({ selectedMachines: ips }),
  
  toggleMachineSelection: (ip) => set((state) => ({
    selectedMachines: state.selectedMachines.includes(ip)
      ? state.selectedMachines.filter(i => i !== ip)
      : [...state.selectedMachines, ip]
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null })
}))

