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
export const signIn = async (email, password) => {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } };
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

// 회원가입 (Trigger 방식 - 클라이언트 INSERT 없음)
export const signUp = async (email, password, userData) => {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } };
    }

    try {
        console.log('🚀 회원가입 시작 (Trigger 방식)');

        // 1. Auth 회원가입 (메타데이터 포함)
        // DB 트리거가 자동으로 public.users 테이블에 데이터를 생성함
        // 절대 여기에 supabase.from('users').insert 코드가 있으면 안됨!!
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: userData.username,
                    name: userData.name,
                    phone: userData.phone,
                    hireDate: userData.hireDate,
                    workSite: userData.workSite,
                }
            }
        });

        if (authError) {
            console.error('❌ Supabase Auth 회원가입 실패:', authError);
            return { data: null, error: authError };
        }

        console.log('✅ Supabase Auth 회원가입 성공:', authData);
        return { data: authData, error: null };
    } catch (error) {
        console.error('❌ 회원가입 예외 발생:', error);
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
