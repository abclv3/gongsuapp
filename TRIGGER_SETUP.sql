-- =============================================
-- Safety-Pay 자동 회원가입 시스템 (Trigger 기반)
-- =============================================
-- 이 스스크립트는 클라이언트 직접 INSERT 대신
-- DB 트리거가 자동으로 사용자 정보를 생성하도록 합니다.
-- =============================================

-- 1. 기존 Trigger 삭제 (충돌 방지)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Trigger 함수 정의
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        auth_id,
        username,
        email,
        name,
        phone,
        hire_date,
        work_site
    )
    VALUES (
        new.id,
        new.raw_user_meta_data->>'username',
        new.email,
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'phone',
        (new.raw_user_meta_data->>'hireDate')::date,
        new.raw_user_meta_data->>'workSite'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger 생성 (auth.users에 insert 발생 시 실행)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS 정책 강화 (INSERT 권한 제거)
-- 이제 클라이언트는 users 테이블에 직접 INSERT 할 필요가 없습니다.

DROP POLICY IF EXISTS "users_insert_authenticated" ON users;
DROP POLICY IF EXISTS "users_insert_anon" ON users;
DROP POLICY IF EXISTS "users_insert_any_authenticated" ON users;

-- 보안 강화: users 테이블 INSERT는 아무도 못함 (트리거만 가능)
-- (정책을 아예 없애면 기본적으로 Deny 됨)

-- =============================================
-- 완료!
-- 이제 프론트엔드에서는 auth.signUp() 시 메타데이터만 넘기면 됩니다.
-- =============================================
