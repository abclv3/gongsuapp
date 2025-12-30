-- =============================================
-- abclv2와 abclv3의 auth_id 비교 검증
-- =============================================

SELECT 
    username AS "사용자ID",
    name AS "이름", 
    email AS "이메일",
    auth_id AS "신분증번호(auth_id)",
    CASE 
        WHEN auth_id IN (
            SELECT auth_id FROM public.users 
            WHERE username != users.username 
            GROUP BY auth_id HAVING COUNT(*) > 1
        ) THEN '🚨 중복됨 (위험)'
        ELSE '✅ 고유함 (정상)'
    END AS "중복상태"
FROM public.users
WHERE username IN ('abclv2', 'abclv3')
ORDER BY username;
