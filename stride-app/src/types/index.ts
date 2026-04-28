import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type PlanTemplate = Database['public']['Tables']['plan_templates']['Row']
export type TrainingPlan = Database['public']['Tables']['training_plans']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type WorkoutLog = Database['public']['Tables']['workout_logs']['Row']

export interface PrescribedWorkout {
    structure?: string
    pace?: string
    hrZone: string
    notes?: string
}

export interface SessionWithWorkout extends Session {
    prescribed_workout: PrescribedWorkout
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type DistanceType = '5k' | '10k' | 'half' | 'marathon' | '50k'
export type SessionType = 'easy' | 'tempo' | 'intervals' | 'long-run' | 'recovery' | 'race'
export type SessionStatus = 'pending' | 'completed' | 'skipped'
export type PlanStatus = 'active' | 'paused' | 'completed'
