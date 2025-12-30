-- =============================================
-- 데이터 생존 확인 쿼리
-- =============================================

SELECT 
    u.username AS "사용자명", 
    u.auth_id AS "인증ID (Auth)",
    u.id AS "공개ID (Public)",
    a.date AS "출근일자", 
    a.work_site AS "현장명", 
    a.check_in_time AS "출근시간"
FROM public.users u
LEFT JOIN public.attendance_records a ON u.id = a.user_id
WHERE u.username = 'abclv3'; -- 아이디를 확인하세요
