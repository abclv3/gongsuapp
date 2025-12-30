-- =============================================
-- 임시 출퇴근 기록 생성기 (데이터 격리 테스트용)
-- =============================================

DO $$
DECLARE
    -- 테스트할 아이디 입력 (여기를 본인 아이디로 바꾸셔도 됩니다)
    v_target_username TEXT := 'abclv3'; 
    v_user_id UUID;
BEGIN
    -- 1. 해당 유저의 고유 ID(UUID) 찾기
    SELECT id INTO v_user_id 
    FROM public.users 
    WHERE username = v_target_username;

    -- 2. 유저가 존재하면 기록 생성
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.attendance_records (
            user_id, 
            date, 
            work_site, 
            check_in_time, 
            check_out_time, 
            is_on_time, 
            is_valid_out
        ) VALUES (
            v_user_id,
            CURRENT_DATE, -- 오늘 날짜
            '데이터 격리 테스트 현장', -- 현장명
            '06:55:00',   -- 출근 시간
            '17:05:00',   -- 퇴근 시간
            TRUE,         -- 지각 아님
            TRUE          -- 조퇴 아님
        )
        ON CONFLICT (user_id, date) 
        DO UPDATE SET 
            work_site = EXCLUDED.work_site,
            check_in_time = EXCLUDED.check_in_time,
            check_out_time = EXCLUDED.check_out_time;
            
        RAISE NOTICE '✅ [%] 계정에 오늘자 출근 기록이 생성되었습니다.', v_target_username;
    ELSE
        RAISE NOTICE '❌ [%] 아이디를 가진 유저가 없습니다. 아이디를 확인해주세요.', v_target_username;
    END IF;
END $$;
