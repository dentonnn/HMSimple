export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    display_name: string | null
                    gender: string | null
                    age: number | null
                    height_cm: number | null
                    weight_kg: number | null
                    experience_level: string | null
                    running_history_months: number | null
                    current_weekly_km: number | null
                    strava_athlete_id: number | null
                    strava_access_token: string | null
                    strava_refresh_token: string | null
                    strava_token_expires_at: string | null
                    preferences: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    display_name?: string | null
                    gender?: string | null
                    age?: number | null
                    height_cm?: number | null
                    weight_kg?: number | null
                    experience_level?: string | null
                    running_history_months?: number | null
                    current_weekly_km?: number | null
                    strava_athlete_id?: number | null
                    strava_access_token?: string | null
                    strava_refresh_token?: string | null
                    strava_token_expires_at?: string | null
                    preferences?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    display_name?: string | null
                    gender?: string | null
                    age?: number | null
                    height_cm?: number | null
                    weight_kg?: number | null
                    experience_level?: string | null
                    running_history_months?: number | null
                    current_weekly_km?: number | null
                    strava_athlete_id?: number | null
                    strava_access_token?: string | null
                    strava_refresh_token?: string | null
                    strava_token_expires_at?: string | null
                    preferences?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            plan_templates: {
                Row: {
                    id: string
                    name: string
                    distance_type: string
                    duration_weeks: number
                    difficulty: string | null
                    description: string | null
                    weekly_structure: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    distance_type: string
                    duration_weeks: number
                    difficulty?: string | null
                    description?: string | null
                    weekly_structure: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    distance_type?: string
                    duration_weeks?: number
                    difficulty?: string | null
                    description?: string | null
                    weekly_structure?: Json
                    created_at?: string
                }
            }
            training_plans: {
                Row: {
                    id: string
                    user_id: string
                    template_id: string | null
                    name: string
                    goal_time: string | null
                    race_date: string | null
                    start_date: string
                    status: string
                    ai_adjustments: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    template_id?: string | null
                    name: string
                    goal_time?: string | null
                    race_date?: string | null
                    start_date: string
                    status?: string
                    ai_adjustments?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    template_id?: string | null
                    name?: string
                    goal_time?: string | null
                    race_date?: string | null
                    start_date?: string
                    status?: string
                    ai_adjustments?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            sessions: {
                Row: {
                    id: string
                    plan_id: string
                    week_number: number
                    scheduled_date: string
                    day_of_week: string
                    session_type: string
                    prescribed_workout: Json
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    plan_id: string
                    week_number: number
                    scheduled_date: string
                    day_of_week: string
                    session_type: string
                    prescribed_workout: Json
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    plan_id?: string
                    week_number?: number
                    scheduled_date?: string
                    day_of_week?: string
                    session_type?: string
                    prescribed_workout?: Json
                    status?: string
                    created_at?: string
                }
            }
            workout_logs: {
                Row: {
                    id: string
                    session_id: string | null
                    user_id: string
                    strava_activity_id: number | null
                    distance_meters: number | null
                    duration_seconds: number | null
                    avg_pace_seconds_per_km: number | null
                    avg_heart_rate: number | null
                    feel_rating: number | null
                    notes: string | null
                    screenshots: Json
                    ai_feedback: string | null
                    logged_at: string
                }
                Insert: {
                    id?: string
                    session_id?: string | null
                    user_id: string
                    strava_activity_id?: number | null
                    distance_meters?: number | null
                    duration_seconds?: number | null
                    avg_pace_seconds_per_km?: number | null
                    avg_heart_rate?: number | null
                    feel_rating?: number | null
                    notes?: string | null
                    screenshots?: Json
                    ai_feedback?: string | null
                    logged_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string | null
                    user_id?: string
                    strava_activity_id?: number | null
                    distance_meters?: number | null
                    duration_seconds?: number | null
                    avg_pace_seconds_per_km?: number | null
                    avg_heart_rate?: number | null
                    feel_rating?: number | null
                    notes?: string | null
                    screenshots?: Json
                    ai_feedback?: string | null
                    logged_at?: string
                }
            }
        }
    }
}
