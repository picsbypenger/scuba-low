import { supabase } from './supabase';

// --- AUTH ---
export const signIn = (email: string) => supabase.auth.signInWithOtp({ email });
export const signOut = () => supabase.auth.signOut();
export const getUser = () => supabase.auth.getUser();

// --- PROFILES (replacing Golfers) ---
export const getProfiles = () => supabase.from('profiles').select('*');
export const updateProfile = (name: string) => 
  supabase.from('profiles').upsert({ id: (supabase.auth.getUser() as any).data?.user?.id, name });

// --- COURSES & TEES ---
export const getCourses = () => supabase.from('courses').select('*, tees(*)');
export const createCourse = (name: string, location: string) => 
  supabase.from('courses').insert({ name, location }).select().single();

export const createTee = (courseId: number, color: string, rating: number, slope: number, par: number) => 
  supabase.from('tees').insert({ course_id: courseId, color, rating, slope, par }).select().single();

// --- ROUNDS ---
export const getRounds = (golferId?: string) => {
  let query = supabase.from('rounds').select('*, tee:tees(*, course:courses(*)), profile:profiles(*)');
  if (golferId) {
    query = query.eq('golfer_id', golferId);
  }
  return query.order('date', { ascending: false });
};

export const createRound = async (roundData: {
  tee: number;
  date: string;
  gross_score: number;
  adjusted_gross_score: number;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");
  
  return supabase.from('rounds').insert({
    ...roundData,
    tee_id: roundData.tee,
    golfer_id: user.id
  }).select().single();
};

// --- HANDICAPS ---
export const getHandicaps = () => supabase.from('handicap_indices').select('*, profile:profiles(*)');
