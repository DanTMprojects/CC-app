import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '@/lib/utils'

const initialState = {
  // Settings
  settings: {
    companyCamApiKey: '',
    companyName: 'My Construction Co.',
    darkMode: false,
  },

  // Projects
  projects: [],

  // Tasks
  tasks: [],

  // Contacts
  contacts: [],

  // Invoices
  invoices: [],

  // Expenses
  expenses: [],

  // Daily Logs
  dailyLogs: [],

  // Time Entries
  timeEntries: [],

  // Trades (subcontractors)
  trades: [],

  // Messages/Threads
  threads: [],
  messages: [],

  // CompanyCam sync state
  companyCamProjects: [],
  companyCamPhotos: {},
  lastSync: null,
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Settings
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // Projects CRUD
      addProject: (project) => set((state) => ({
        projects: [...state.projects, { ...project, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
      })),

      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        tasks: state.tasks.filter(t => t.projectId !== id),
        expenses: state.expenses.filter(e => e.projectId !== id),
        dailyLogs: state.dailyLogs.filter(d => d.projectId !== id),
      })),

      // Tasks CRUD
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { ...task, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),

      // Contacts CRUD
      addContact: (contact) => set((state) => ({
        contacts: [...state.contacts, { ...contact, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      updateContact: (id, updates) => set((state) => ({
        contacts: state.contacts.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      deleteContact: (id) => set((state) => ({
        contacts: state.contacts.filter(c => c.id !== id)
      })),

      // Invoices CRUD
      addInvoice: (invoice) => set((state) => ({
        invoices: [...state.invoices, {
          ...invoice,
          id: generateId(),
          invoiceNumber: `INV-${String(state.invoices.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString()
        }]
      })),

      updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map(i => i.id === id ? { ...i, ...updates } : i)
      })),

      deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(i => i.id !== id)
      })),

      // Expenses CRUD
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, { ...expense, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
      })),

      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter(e => e.id !== id)
      })),

      // Daily Logs CRUD
      addDailyLog: (log) => set((state) => ({
        dailyLogs: [...state.dailyLogs, { ...log, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      updateDailyLog: (id, updates) => set((state) => ({
        dailyLogs: state.dailyLogs.map(d => d.id === id ? { ...d, ...updates } : d)
      })),

      deleteDailyLog: (id) => set((state) => ({
        dailyLogs: state.dailyLogs.filter(d => d.id !== id)
      })),

      // Time Entries CRUD
      addTimeEntry: (entry) => set((state) => ({
        timeEntries: [...state.timeEntries, { ...entry, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      updateTimeEntry: (id, updates) => set((state) => ({
        timeEntries: state.timeEntries.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      deleteTimeEntry: (id) => set((state) => ({
        timeEntries: state.timeEntries.filter(t => t.id !== id)
      })),

      // Trades CRUD
      addTrade: (trade) => set((state) => ({
        trades: [...state.trades, { ...trade, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      updateTrade: (id, updates) => set((state) => ({
        trades: state.trades.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      deleteTrade: (id) => set((state) => ({
        trades: state.trades.filter(t => t.id !== id)
      })),

      // Messages/Threads
      addThread: (thread) => set((state) => ({
        threads: [...state.threads, { ...thread, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, { ...message, id: generateId(), createdAt: new Date().toISOString() }]
      })),

      // CompanyCam sync
      setCompanyCamProjects: (projects) => set({ companyCamProjects: projects }),

      setCompanyCamPhotos: (projectId, photos) => set((state) => ({
        companyCamPhotos: { ...state.companyCamPhotos, [projectId]: photos }
      })),

      updateLastSync: () => set({ lastSync: new Date().toISOString() }),

      // Link project to CompanyCam
      linkProjectToCompanyCam: (projectId, companyCamProjectId) => set((state) => ({
        projects: state.projects.map(p =>
          p.id === projectId ? { ...p, companyCamProjectId } : p
        )
      })),

      // Add photos to project
      addProjectPhotos: (projectId, photos) => set((state) => ({
        projects: state.projects.map(p =>
          p.id === projectId ? {
            ...p,
            photos: [...(p.photos || []), ...photos]
          } : p
        )
      })),

      removeProjectPhoto: (projectId, photoIndex) => set((state) => ({
        projects: state.projects.map(p =>
          p.id === projectId ? {
            ...p,
            photos: p.photos.filter((_, i) => i !== photoIndex)
          } : p
        )
      })),

      // Reset store
      resetStore: () => set(initialState),
    }),
    {
      name: 'tradetalk-storage',
    }
  )
)

// Selectors
export const selectProjectById = (id) => (state) => state.projects.find(p => p.id === id)
export const selectTasksByProject = (projectId) => (state) => state.tasks.filter(t => t.projectId === projectId)
export const selectExpensesByProject = (projectId) => (state) => state.expenses.filter(e => e.projectId === projectId)
export const selectDailyLogsByProject = (projectId) => (state) => state.dailyLogs.filter(d => d.projectId === projectId)
