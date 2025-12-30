-- =============================================
-- RLS 정책 완전 재설정 (데이터 격리 보장)
-- =============================================

-- 1. 기존 정책 전부 삭제
DROP POLICY IF EXISTS "attendance_select_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_insert_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_update_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_delete_policy" ON attendance_records;

-- 2. RLS 활성화 (혹시 꺼져있을 수 있으니)
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 3. 올바른 정책 생성 (auth.uid()와 users.auth_id를 매칭)
CREATE POLICY "attendance_select_policy" ON attendance_records
    FOR SELECT
    USING (
        user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    );

CREATE POLICY "attendance_insert_policy" ON attendance_records
    FOR INSERT
    WITH CHECK (
        user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    );

CREATE POLICY "attendance_update_policy" ON attendance_records
    FOR UPDATE
    USING (
        user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    );

CREATE POLICY "attendance_delete_policy" ON attendance_records
    FOR DELETE
    USING (
        user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    );

-- 4. 정책 잘 만들어졌는지 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'attendance_records';
