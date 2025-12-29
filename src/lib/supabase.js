import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 생성 (환경 변수가 없으면 null)
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Supabase 사용 가능 여부
export const isSupabaseEnabled = () => !!supabase;

// 사용자 인증 상태 체크
export const getCurrentUser = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// 로그인
export const signIn = async (username, password) => {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } };
    }

    const email = `${username}@safety-pay.local`; // 임시 이메일 변환
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

// 회원가입
export const signUp = async (username, password, userData) => {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } };
    }

    const email = `${username}@safety-pay.local`; // 임시 이메일 변환

    // 1. Auth 회원가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) return { data: null, error: authError };

    // 2. 사용자 정보 저장
    const { data, error } = await supabase
        .from('users')
        .insert([
            {
                auth_id: authData.user.id,
                username,
                name: userData.name,
                phone: userData.phone,
                hire_date: userData.hireDate,
                work_site: userData.workSite,
            }
        ])
        .select();

    return { data, error };
};

// 로그아웃
export const signOut = async () => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signOut();
    return { error };
};
