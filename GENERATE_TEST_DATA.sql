-- =============================================
-- 데이터 격리 테스트용 더미 데이터 생성기
-- =============================================

DO $$
DECLARE
    target_username TEXT := 'abclv3'; -- 여기에 테스트할 아이디 입력
    target_user_id UUID;
BEGIN
    -- 1. 유저의 Public ID 찾기
    SELECT id INTO target_user_id FROM public.users WHERE username = target_username;

    IF target_user_id IS NULL THEN
        RAISE NOTICE '사용자를 찾을 수 없습니다: %', target_username;
    ELSE
        -- 2. 출근 기록 강제 삽입
        INSERT INTO public.attendance_records (
            user_id, date, work_site, check_in_time, check_out_time, is_on_time, is_valid_out
        ) VALUES (
            target_user_id,
            CURRENT_DATE,
            '시스템이 생성한 테스트 데이터입니다 (격리 확인용)',
            '06:50:00',
            '17:10:00',
            TRUE,
            TRUE
        )
        ON CONFLICT (user_id, date) DO UPDATE SET
            work_site = EXCLUDED.work_site,
            check_in_time = EXCLUDED.check_in_time,
            check_out_time = EXCLUDED.check_out_time;
            
        RAISE NOTICE '데이터 생성 완료! % 사용자의 오늘 출근 기록이 만들어졌습니다.', target_username;
    END IF;
END $$;
