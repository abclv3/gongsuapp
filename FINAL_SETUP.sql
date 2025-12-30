-- =============================================
-- FINAL_SETUP.sql: 최후의 통합 설정 (이거 하나면 끝)
-- =============================================

-- 1. 로그인용 RPC 함수 (아이디로 이메일 찾기)
-- 사용자가 아이디 입력 시, 서버 내부적으로 이메일을 찾아 로그인 시도하게 함
CREATE OR REPLACE FUNCTION get_email_by_username(input_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- RLS 무시하고 관리자 권한으로 실행
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

-- 2. 회원가입용 RPC 함수 (RLS 우회 저장)
-- 클라이언트가 INSERT 권한이 없어도, 이 함수를 통해 안전하게 가입 가능
CREATE OR REPLACE FUNCTION public.register_new_user(
  p_auth_id uuid,
  p_email text,
  p_username text,
  p_name text,
  p_phone text,
  p_hire_date date,
  p_work_site text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO public.users (auth_id, email, username, name, phone, hire_date, work_site)
  VALUES (p_auth_id, p_email, p_username, p_name, p_phone, p_hire_date, p_work_site)
  ON CONFLICT (auth_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    hire_date = EXCLUDED.hire_date,
    work_site = EXCLUDED.work_site;

  SELECT json_build_object('status', 'success') INTO v_result;
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  SELECT json_build_object('status', 'error', 'message', SQLERRM) INTO v_result;
  RETURN v_result;
END;
$$;

-- 3. 함수 실행 권한 부여 (필수)
GRANT EXECUTE ON FUNCTION get_email_by_username TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_new_user TO anon, authenticated, service_role;

-- 4. 유니크 제약조건 안전하게 추가 (이미 있으면 패스)
DO $$ 
BEGIN
    -- users_auth_id_key가 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_id_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;
