-- =============================================
-- 미인증 계정 전부 인증 처리
-- =============================================

-- 1. 미인증 계정 전부 강제 인증
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. 결과 확인 (이제 전부 "✅ 인증됨"으로 나와야 함)
SELECT 
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ 인증됨'
        ELSE '❌ 미인증'
    END AS "인증상태",
    created_at AS "가입일시"
FROM auth.users
ORDER BY created_at DESC;
