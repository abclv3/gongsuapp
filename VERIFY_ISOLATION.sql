-- =============================================
-- 데이터 격리 상태 검증 (A/B 테스트)
-- =============================================

SELECT 
    u.username AS "사용자ID",
    u.name AS "이름",
    u.auth_id AS "인증ID (확인용)",
    CASE WHEN a.id IS NOT NULL THEN '⭕ 데이터 있음' ELSE '❌ 데이터 없음' END AS "기록여부",
    a.date AS "날짜", 
    a.check_in_time AS "출근시간",
    a.work_site AS "현장명"
FROM public.users u
LEFT JOIN public.attendance_records a ON u.id = a.user_id AND a.date = CURRENT_DATE
WHERE u.username IN ('abclv3', 'abclv2');
