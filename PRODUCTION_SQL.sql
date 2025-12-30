-- =============================================
-- Safety-Pay 배포용 SQL (Production Ready)
-- =============================================
-- Supabase SQL Editor에서 전체 실행하세요
-- =============================================

-- =============================================
-- STEP 1: 테이블 생성 (없으면 생성)
-- =============================================

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    hire_date DATE,
    work_site VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 출퇴근 기록 테이블 (핵심!)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    work_site VARCHAR(200),
    check_in_time TIME,
    check_out_time TIME,
    is_on_time BOOLEAN DEFAULT FALSE,
    is_valid_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 공휴일 근무 기록 테이블
CREATE TABLE IF NOT EXISTS holiday_work_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    work_site VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 월차 발생 기록 테이블
CREATE TABLE IF NOT EXISTS vacation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 월차 사용 기록 테이블
CREATE TABLE IF NOT EXISTS vacation_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_holiday_work_user_date ON holiday_work_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_vacation_user ON vacation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_usage_user ON vacation_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- =============================================
-- STEP 2: RPC 함수 생성 (로그인용)
-- =============================================
-- 이 함수는 RLS를 우회하여 username으로 email을 조회합니다
-- SECURITY DEFINER를 사용하여 RLS 정책을 무시합니다

CREATE OR REPLACE FUNCTION get_email_by_username(input_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM users
    WHERE username = input_username;
    
    RETURN user_email;
END;
$$;

-- =============================================
-- STEP 3: RLS 정책 설정
-- =============================================

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "attendance_select_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_insert_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_update_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_delete_own" ON attendance_records;
DROP POLICY IF EXISTS "holiday_select_own" ON holiday_work_records;
DROP POLICY IF EXISTS "holiday_insert_own" ON holiday_work_records;
DROP POLICY IF EXISTS "holiday_update_own" ON holiday_work_records;
DROP POLICY IF EXISTS "holiday_delete_own" ON holiday_work_records;
DROP POLICY IF EXISTS "vacation_select_own" ON vacation_records;
DROP POLICY IF EXISTS "vacation_insert_own" ON vacation_records;
DROP POLICY IF EXISTS "vacation_usage_select_own" ON vacation_usage;
DROP POLICY IF EXISTS "vacation_usage_insert_own" ON vacation_usage;
DROP POLICY IF EXISTS "vacation_usage_delete_own" ON vacation_usage;

-- 기존 잘못된 정책들도 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_usage ENABLE ROW LEVEL SECURITY;

-- =============================================
-- users 테이블 정책
-- =============================================

-- 인증된 사용자가 자신의 데이터만 조회 가능
CREATE POLICY "users_select_own" ON users
    FOR SELECT TO authenticated
    USING (auth_id = auth.uid());

-- 인증된 사용자만 INSERT 가능
CREATE POLICY "users_insert_authenticated" ON users
    FOR INSERT TO authenticated
    WITH CHECK (auth_id = auth.uid());

-- 인증된 사용자가 자신의 데이터만 UPDATE 가능
CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated
    USING (auth_id = auth.uid());

-- =============================================
-- attendance_records 테이블 정책
-- =============================================

CREATE POLICY "attendance_select_own" ON attendance_records
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "attendance_insert_own" ON attendance_records
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "attendance_update_own" ON attendance_records
    FOR UPDATE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "attendance_delete_own" ON attendance_records
    FOR DELETE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =============================================
-- holiday_work_records 테이블 정책
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
-- vacation_records 테이블 정책
-- =============================================

CREATE POLICY "vacation_select_own" ON vacation_records
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "vacation_insert_own" ON vacation_records
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =============================================
-- vacation_usage 테이블 정책
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
-- STEP 4: 트리거 함수 (자동 updated_at)
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance_records;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 완료!
-- =============================================
-- 
-- 테이블 구조:
-- 1. users: 사용자 정보 (username, email 별도 저장)
-- 2. attendance_records: 출퇴근 기록 (user_id로 분리)
-- 3. holiday_work_records: 공휴일 근무
-- 4. vacation_records: 월차 발생
-- 5. vacation_usage: 월차 사용
--
-- RPC 함수:
-- - get_email_by_username(username): 아이디로 이메일 조회 (로그인용)
--
-- RLS 정책:
-- - 각 사용자는 자신의 데이터만 접근 가능
-- - 출퇴근 기록은 user_id를 기반으로 완전 분리
-- =============================================
