export type UserRole = 'jefe' | 'empleado'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: UserRole
          created_at?: string
        }
        Update: {
          full_name?: string
          role?: UserRole
        }
      }
      resources: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          status: 'activo' | 'inactivo' | 'mantenimiento'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          status?: 'activo' | 'inactivo' | 'mantenimiento'
          created_by: string
          created_at?: string
        }
        Update: {
          name?: string
          type?: string
          description?: string | null
          status?: 'activo' | 'inactivo' | 'mantenimiento'
        }
      }
      work_hours: {
        Row: {
          id: string
          employee_id: string
          resource_id: string | null
          date: string
          hours: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          resource_id?: string | null
          date: string
          hours: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          resource_id?: string | null
          date?: string
          hours?: number
          notes?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']
export type WorkHour = Database['public']['Tables']['work_hours']['Row']
