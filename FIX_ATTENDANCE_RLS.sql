-- =============================================
-- 출퇴근 기록(Attendance) 권한 긴급 수정
-- =============================================

-- 기존의 복잡하거나 꼬인 정책 삭제
DROP POLICY IF EXISTS "attendance_insert_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_select_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_update_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_delete_own" ON attendance_records;

-- 1. 조회(SELECT): 내 public_id(user_id)로 된 기록은 다 볼 수 있게 함
-- 서브쿼리를 사용하여 현재 로그인한 auth.uid()와 연결된 users 테이블의 id를 찾음
CREATE POLICY "attendance_select_own" ON attendance_records
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_id = auth.uid()
        )
    );

-- 2. 쓰기(INSERT): 내 user_id로 기록을 넣는 건 무조건 허용
CREATE POLICY "attendance_insert_own" ON attendance_records
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_id = auth.uid()
        )
    );

-- 3. 수정(UPDATE): 내 기록은 수정 가능
CREATE POLICY "attendance_update_own" ON attendance_records
    FOR UPDATE TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_id = auth.uid()
        )
    );

-- 4. 삭제(DELETE): 내 기록은 삭제 가능
CREATE POLICY "attendance_delete_own" ON attendance_records
    FOR DELETE TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_id = auth.uid()
        )
    );
