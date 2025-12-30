-- =============================================
-- 1. 에러를 유발하는 트리거 삭제
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- =============================================
-- 2. 회원가입 전용 '쓰기 권한' 열기
-- =============================================
-- 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;
DROP POLICY IF EXISTS "users_insert_anon" ON users;
DROP POLICY IF EXISTS "users_insert_any_authenticated" ON users;
DROP POLICY IF EXISTS "users_insert_public" ON users;

-- 새 정책: 누구나 '가입 신청서(Row)'는 제출할 수 있음
-- (하지만 조회나 수정은 여전히 엄격하게 본인만 가능)
CREATE POLICY "users_insert_public" ON users
    FOR INSERT TO public
    WITH CHECK (true);

-- =============================================
-- 3. 안전장치: 데이터 조회/수정은 여전히 철저 격리
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
    FOR SELECT TO authenticated
    USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated
    USING (auth_id = auth.uid());
