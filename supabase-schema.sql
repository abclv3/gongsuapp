-- Safety-Pay 출퇴근 데이터베이스 스키마 (업데이트)
-- =============================================
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 기존 테이블이 있으면 삭제하고 다시 생성 (주의: 데이터 손실!)
-- 또는 ALTER TABLE로 수정

-- 1. 사용자 테이블 (이미 있으면 스킵)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    hire_date DATE,
    work_site VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 출퇴근 기록 테이블
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    work_site VARCHAR(200), -- 출근 시 현장명 저장
    check_in_time TIME,
    check_out_time TIME,
    is_on_time BOOLEAN DEFAULT FALSE, -- 07:00 이전 출근 여부
    is_valid_out BOOLEAN DEFAULT FALSE, -- 17:00 이후 퇴근 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date) -- 하루에 한 번만 출근 가능
);

-- 3. 공휴일 근무 기록 테이블
CREATE TABLE IF NOT EXISTS holiday_work_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    work_site VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 4. 월차 발생 기록 테이블
CREATE TABLE IF NOT EXISTS vacation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL, -- 'perfect_month' or 'holiday_work'
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 월차 사용 기록 테이블
CREATE TABLE IF NOT EXISTS vacation_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_holiday_work_user_date ON holiday_work_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_vacation_user ON vacation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_usage_user ON vacation_usage(user_id);

-- =============================================
-- Row Level Security (RLS) 완전 비활성화
-- 개발/테스트 목적으로 모든 접근 허용
-- =============================================

-- RLS 비활성화 (간단한 방법)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_work_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_usage DISABLE ROW LEVEL SECURITY;

-- 또는 RLS를 활성화하되 모든 접근을 허용하는 정책 생성
-- (이미 RLS가 활성화된 경우)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can view own holiday work" ON holiday_work_records;
DROP POLICY IF EXISTS "Users can view own vacation" ON vacation_records;
DROP POLICY IF EXISTS "Users can view own vacation usage" ON vacation_usage;
DROP POLICY IF EXISTS "Allow all for users" ON users;
DROP POLICY IF EXISTS "Allow all for attendance" ON attendance_records;
DROP POLICY IF EXISTS "Allow all for holiday_work" ON holiday_work_records;
DROP POLICY IF EXISTS "Allow all for vacation" ON vacation_records;
DROP POLICY IF EXISTS "Allow all for vacation_usage" ON vacation_usage;

-- =============================================
-- 개발용: 모든 접근 허용 정책 (RLS 활성화 시)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_usage ENABLE ROW LEVEL SECURITY;

-- users 테이블: 모든 인증된 사용자가 접근 가능
CREATE POLICY "Allow authenticated users to select" ON users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert" ON users
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update" ON users
    FOR UPDATE TO authenticated USING (true);

-- attendance_records 테이블: 인증된 사용자가 자신의 데이터만 접근
CREATE POLICY "Users can select own attendance" ON attendance_records
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own attendance" ON attendance_records
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own attendance" ON attendance_records
    FOR UPDATE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own attendance" ON attendance_records
    FOR DELETE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- holiday_work_records 테이블
CREATE POLICY "Users can select own holiday work" ON holiday_work_records
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own holiday work" ON holiday_work_records
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own holiday work" ON holiday_work_records
    FOR UPDATE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own holiday work" ON holiday_work_records
    FOR DELETE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- vacation_records 테이블
CREATE POLICY "Users can select own vacation" ON vacation_records
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own vacation" ON vacation_records
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- vacation_usage 테이블
CREATE POLICY "Users can select own vacation usage" ON vacation_usage
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own vacation usage" ON vacation_usage
    FOR INSERT TO authenticated
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own vacation usage" ON vacation_usage
    FOR DELETE TO authenticated
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =============================================
-- 함수: 자동으로 updated_at 업데이트
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정 (이미 있으면 무시)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance_records;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 완료!
-- =============================================
-- 이제 Supabase 대시보드에서 테이블을 확인할 수 있습니다.
-- attendance_records 테이블:
--   - id: UUID (PK)
--   - user_id: UUID (FK -> users.id)
--   - date: DATE (날짜)
--   - work_site: 현장명
--   - check_in_time: 출근 시각
--   - check_out_time: 퇴근 시각
--   - is_on_time: 정상 출근 여부 (07:00 이전)
--   - is_valid_out: 정상 퇴근 여부 (17:00~24:00)
-- =============================================
