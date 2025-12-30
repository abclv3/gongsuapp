-- =============================================
-- 아이디 찾기 RPC 함수
-- 이메일 또는 휴대폰 번호로 username 조회
-- =============================================

-- 이메일로 아이디 찾기
CREATE OR REPLACE FUNCTION find_username_by_email(input_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_username TEXT;
BEGIN
    SELECT username INTO found_username
    FROM public.users
    WHERE email = input_email
    LIMIT 1;
    
    RETURN found_username;
END;
$$;

-- 휴대폰으로 아이디 찾기
CREATE OR REPLACE FUNCTION find_username_by_phone(input_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_username TEXT;
BEGIN
    SELECT username INTO found_username
    FROM public.users
    WHERE phone = input_phone
    LIMIT 1;
    
    RETURN found_username;
END;
$$;

-- 권한 부여 (익명 및 인증된 사용자 모두 사용 가능)
GRANT EXECUTE ON FUNCTION find_username_by_email(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION find_username_by_phone(TEXT) TO anon, authenticated;
