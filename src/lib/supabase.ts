import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types for TypeScript
export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  isProspect: boolean
  createdAt: string
  updatedAt: string
}

export interface Offer {
  id: string
  offerNumber: string
  customerId: string
  jobDescription: string | null
  measurements: string | null
  materialsCost: number
  laborCost: number
  totalCost: number
  status: string
  createdAt: string
  updatedAt: string
  customer?: {
    firstName: string
    lastName: string
    email: string | null
  }
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  offerId: string
  totalAmount: number
  status: string
  createdAt: string
  updatedAt: string
}