-- =============================================
-- RLS 우회 회원가입 함수 (최후의 수단)
-- =============================================

-- 1. 함수 생성 (SECURITY DEFINER = 관리자 권한으로 실행됨)
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
SECURITY DEFINER -- <--- 핵심: RLS 정책을 무시하고 실행됨
AS $$
DECLARE
  v_result json;
BEGIN
  -- 중복 체크 (이미 가입된 auth_id가 있으면 업데이트, 없으면 삽입)
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

  SELECT json_build_object('status', 'success', 'message', 'User registered successfully') INTO v_result;
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  SELECT json_build_object('status', 'error', 'message', SQLERRM) INTO v_result;
  RETURN v_result;
END;
$$;

-- 2. 권한 부여 (로그인 안 한 사람도 이 함수는 실행 가능하게)
GRANT EXECUTE ON FUNCTION public.register_new_user TO anon;
GRANT EXECUTE ON FUNCTION public.register_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_new_user TO service_role;

-- 3. 기존의 골칫덩어리 트리거 삭제 (확실하게)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
