-- =============================================
-- 실제 DB 데이터 확인 (양쪽 계정 모두) - 수정본
-- =============================================

SELECT 
    u.username AS "계정",
    COUNT(ar.id) AS "출근기록수",
    STRING_AGG(
        ar.date::TEXT || ' (' || COALESCE(ar.check_in_time::TEXT, 'null') || ')', 
        ', ' 
        ORDER BY ar.date
    ) AS "기록상세"
FROM public.users u
LEFT JOIN public.attendance_records ar ON u.id = ar.user_id
WHERE u.username IN ('abclv2', 'abclv3')
GROUP BY u.username
ORDER BY u.username;
