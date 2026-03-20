import { supabase } from './supabase';

// --- AUTH ---
export const signIn = (email: string) => supabase.auth.signInWithOtp({ email });
export const signOut = () => supabase.auth.signOut();
export const getUser = () => supabase.auth.getUser();

// --- PROFILES ---
export const getProfiles = () => supabase.from('profiles').select('*');

export const updateProfile = async (name: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user found");

  // Try updating existing profile first (safer with RLS); if no rows, insert a new profile.
  const updateRes = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', user.id)
    .select()
    .maybeSingle();

  if (updateRes.error) {
    return updateRes;
  }

  if (updateRes.data) {
    return updateRes;
  }

  // No existing row - insert
  return supabase.from('profiles').insert({ id: user.id, name }).select().single();
};

// --- COURSES & TEES ---
export const getCourses = () => supabase.from('courses').select('*, tees(*)');

// Search courses by name or location (server-side, case-insensitive)
export const searchCourses = (q: string) => {
  const qTrim = (q || '').trim();
  if (!qTrim) return supabase.from('courses').select('*, tees(*)').limit(50);
  const pattern = `%${qTrim.replace(/%/g, '\\%')}%`;
  return supabase
    .from('courses')
    .select('*, tees(*)')
    .or(`name.ilike.${pattern},location.ilike.${pattern}`)
    .limit(50)
    .order('name', { ascending: true });
};

export const createCourse = async (name: string, location: string) => {
  const nameTrim = (name || '').trim();
  const locationTrim = (location || '').trim();

  // Prevent obvious duplicates (case-insensitive)
  const { data: existing, error: selectError } = await supabase
    .from('courses')
    .select('id')
    .ilike('name', nameTrim)
    .ilike('location', locationTrim)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) throw new Error('A course with this name and location already exists.');

  return supabase.from('courses').insert({ name: nameTrim, location: locationTrim }).select().single();
};

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

export const updateRound = async (id: number, roundData: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in');

  return supabase
    .from('rounds')
    .update(roundData)
    .eq('id', id)
    .eq('golfer_id', user.id)
    .select()
    .single();
};

export const deleteRound = async (id: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in');

  return supabase.from('rounds').delete().eq('id', id).eq('golfer_id', user.id);
};

// --- HANDICAPS ---
export const getHandicaps = () => supabase.from('handicap_indices').select('*, profile:profiles(*)');
