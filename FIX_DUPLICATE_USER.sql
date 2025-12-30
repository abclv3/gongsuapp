-- =============================================
-- 중복 계정 해결 및 ID 강제 탈취 스크립트
-- =============================================

DO $$
DECLARE
    v_target_username TEXT := 'abclv3'; -- 살려야 하는 진짜 유저 ID
    v_target_email TEXT;
    v_real_auth_id UUID;
BEGIN
    -- 1. 살려야 할 유저의 이메일 확인
    SELECT email INTO v_target_email 
    FROM public.users 
    WHERE username = v_target_username
    LIMIT 1; -- 혹시 중복되면 하나만 잡기

    RAISE NOTICE '타겟 유저: %, 이메일: %', v_target_username, v_target_email;

    -- 2. 그 이메일의 진짜 신분증 번호(Auth ID) 찾기
    SELECT id INTO v_real_auth_id
    FROM auth.users
    WHERE email = v_target_email;

    IF v_real_auth_id IS NULL THEN
        RAISE EXCEPTION 'Auth 시스템에서 해당 이메일을 찾을 수 없습니다.';
    END IF;

    -- 3. [핵심] 이 신분증을 쓰고 있는 "엉뚱한 놈" 찾아서 뺏기
    -- (내 아이디가 아닌데 내 신분증을 들고 있는 경우 -> NULL로 만듦)
    UPDATE public.users
    SET auth_id = NULL
    WHERE auth_id = v_real_auth_id
      AND username != v_target_username;
      
    -- 4. 진짜 주인에게 신분증 장착
    UPDATE public.users
    SET auth_id = v_real_auth_id
    WHERE username = v_target_username;

    RAISE NOTICE '✅ 복구 완료! % 계정이 정상화되었습니다.', v_target_username;
END $$;
