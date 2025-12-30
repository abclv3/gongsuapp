-- =============================================
-- RLS 정책 완전 초기화 및 재구성
-- =============================================

-- 1. 기존 정책 전부 삭제 (스크린샷에 보이는 모든 정책)
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "attendance_delete_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_delete_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_insert_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_insert_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_select_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_select_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_update_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_update_policy" ON attendance_records;

-- 2. RLS 활성화 확인
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 3. authenticated 사용자만을 위한 정책 생성
-- (public role은 절대 사용하지 않음)

CREATE POLICY "authenticated_can_select_own" ON attendance_records
    FOR SELECT
    TO authenticated
    USING (
        user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    );

CREATE POLICY "authenticated_can_insert_own" ON attendance_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    );

CREATE POLICY "authenticated_can_update_own" ON attendance_records
    FOR UPDATE
    TO authenticated
    USING (
        user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    );

CREATE POLICY "authenticated_can_delete_own" ON attendance_records
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    );

-- 4. 최종 확인 (이제 4개만 나와야 정상)
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'attendance_records';
