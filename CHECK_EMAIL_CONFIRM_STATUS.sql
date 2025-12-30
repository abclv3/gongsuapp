-- =============================================
-- 모든 계정의 이메일 인증 상태 확인
-- =============================================

SELECT 
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ 인증됨'
        ELSE '❌ 미인증'
    END AS "인증상태",
    created_at AS "가입일시"
FROM auth.users
ORDER BY created_at DESC;
