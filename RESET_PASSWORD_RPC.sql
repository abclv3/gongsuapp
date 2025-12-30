-- =============================================
-- 비밀번호 재설정 RPC 함수
-- 이메일 + 휴대폰으로 본인 확인 후 비밀번호 변경
-- =============================================

-- 본인 확인 함수 (이메일 + 휴대폰 일치 확인)
CREATE OR REPLACE FUNCTION verify_user_identity(
    input_email TEXT,
    input_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_auth_id UUID;
BEGIN
    SELECT auth_id INTO found_auth_id
    FROM public.users
    WHERE email = input_email 
      AND phone = input_phone
    LIMIT 1;
    
    RETURN found_auth_id;
END;
$$;

-- 비밀번호 변경 함수 (인증된 사용자용)
CREATE OR REPLACE FUNCTION reset_user_password(
    user_auth_id UUID,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- auth.users 테이블의 비밀번호 업데이트
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = user_auth_id;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION verify_user_identity(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_user_password(UUID, TEXT) TO anon, authenticated;
