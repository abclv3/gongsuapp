import { createClient } from '@supabase/supabase-js';

// 환경 변수 디버그 (빌드 시 값 확인)
console.log('🔍 Environment Check:');
console.log('- VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('- VITE_SUPABASE_URL value (first 30 chars):', (import.meta.env.VITE_SUPABASE_URL || '').substring(0, 30));
console.log('- VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('- VITE_SUPABASE_ANON_KEY value (first 30 chars):', (import.meta.env.VITE_SUPABASE_ANON_KEY || '').substring(0, 30));

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 환경 변수 유효성 검사
const isValidUrl = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const isValidKey = (key) => key && key.length > 20;

// Supabase 클라이언트 생성 (안전하게)
let supabase = null;
try {
    if (isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey)) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase connected');
    } else {
        console.warn('⚠️ Supabase credentials not configured - running in offline mode');
    }
} catch (error) {
    console.error('❌ Supabase initialization error:', error);
    supabase = null;
}

export { supabase };

// Supabase 사용 가능 여부
export const isSupabaseEnabled = () => !!supabase;

// 사용자 인증 상태 체크
export const getCurrentUser = async () => {
    if (!supabase) return null;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('getCurrentUser error:', error);
        return null;
    }
};

// 로그인
export const signIn = async (username, password) => {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } };
    }

    try {
        const email = `${username}@safety-pay.com`; // .local → .com
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

// 회원가입
export const signUp = async (username, password, userData) => {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } };
    }

    try {
        const email = `${username}@safety-pay.com`; // .local → .com

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
    } catch (error) {
        return { data: null, error };
    }
};

// 로그아웃
export const signOut = async () => {
    if (!supabase) return { error: null };
    try {
        const { error } = await supabase.auth.signOut();
        return { error };
    } catch (error) {
        return { error };
    }
};
