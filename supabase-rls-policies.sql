-- =============================================
-- Safety-Pay RLS 정책 설정 (Production Ready)
-- =============================================
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- =============================================
-- STEP 1: 기존 정책 모두 삭제
-- =============================================

-- users 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to select" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON users;
DROP POLICY IF EXISTS "Allow public read" ON users;

-- attendance_records 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can select own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can delete own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Allow all for attendance" ON attendance_records;

-- holiday_work_records 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can select own holiday work" ON holiday_work_records;
DROP POLICY IF EXISTS "Users can insert own holiday work" ON holiday_work_records;
DROP POLICY IF EXISTS "Users can update own holiday work" ON holiday_work_records;
DROP POLICY IF EXISTS "Users can delete own holiday work" ON holiday_work_records;
DROP POLICY IF EXISTS "Users can view own holiday work" ON holiday_work_records;

-- vacation_records 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can select own vacation" ON vacation_records;
DROP POLICY IF EXISTS "Users can insert own vacation" ON vacation_records;
DROP POLICY IF EXISTS "Users can view own vacation" ON vacation_records;

-- vacation_usage 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can select own vacation usage" ON vacation_usage;
DROP POLICY IF EXISTS "Users can insert own vacation usage" ON vacation_usage;
DROP POLICY IF EXISTS "Users can delete own vacation usage" ON vacation_usage;
DROP POLICY IF EXISTS "Users can view own vacation usage" ON vacation_usage;

-- =============================================
-- STEP 2: RLS 활성화
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_usage ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 3: users 테이블 정책
-- =============================================

-- 인증된 사용자가 자신의 데이터만 조회 가능
CREATE POLICY "users_select_own" ON users
    FOR SELECT TO authenticated
    USING (auth_id = auth.uid());

-- 인증된 사용자만 INSERT 가능 (회원가입)
CREATE POLICY "users_insert_authenticated" ON users
    FOR INSERT TO authenticated
    WITH CHECK (auth_id = auth.uid());

-- 인증된 사용자가 자신의 데이터만 UPDATE 가능
CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated
    USING (auth_id = auth.uid());

-- =============================================
-- STEP 4: attendance_records 테이블 정책
-- =============================================

-- 인증된 사용자가 자신의 출퇴근 기록만 조회
CREATE POLICY "attendance_select_own" ON attendance_records
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 인증된 사용자가 자신의 출퇴근 기록만 INSERT
CREATE POLICY "attendance_insert_own" ON attendance_records
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 인증된 사용자가 자신의 출퇴근 기록만 UPDATE
CREATE POLICY "attendance_update_own" ON attendance_records
    FOR UPDATE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 인증된 사용자가 자신의 출퇴근 기록만 DELETE
CREATE POLICY "attendance_delete_own" ON attendance_records
    FOR DELETE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =============================================
-- STEP 5: holiday_work_records 테이블 정책
-- =============================================

CREATE POLICY "holiday_select_own" ON holiday_work_records
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "holiday_insert_own" ON holiday_work_records
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "holiday_update_own" ON holiday_work_records
    FOR UPDATE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "holiday_delete_own" ON holiday_work_records
    FOR DELETE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =============================================
-- STEP 6: vacation_records 테이블 정책
-- =============================================

CREATE POLICY "vacation_select_own" ON vacation_records
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "vacation_insert_own" ON vacation_records
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =============================================
-- STEP 7: vacation_usage 테이블 정책
-- =============================================

CREATE POLICY "vacation_usage_select_own" ON vacation_usage
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "vacation_usage_insert_own" ON vacation_usage
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "vacation_usage_delete_own" ON vacation_usage
    FOR DELETE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =============================================
-- 완료!
-- =============================================
-- RLS가 활성화되어 있으며, 각 사용자는 자신의 데이터만 접근 가능합니다.
-- 
-- 로그인 흐름:
-- 1. username 입력 -> username@gongsu.app 가상 이메일로 변환
-- 2. Supabase Auth로 인증
-- 3. 인증 성공 후 auth.uid()로 현재 사용자 확인
-- 4. users 테이블에서 auth_id = auth.uid() 인 데이터 조회
-- 5. 출퇴근 기록은 user_id로 필터링
-- =============================================
