import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 사용자 인증 상태 체크
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// 로그인
export const signIn = async (username, password) => {
    const email = `${username}@safety-pay.local`; // 임시 이메일 변환
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

// 회원가입
export const signUp = async (username, password, userData) => {
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
    const { error } = await supabase.auth.signOut();
    return { error };
};
