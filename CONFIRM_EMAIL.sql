-- =============================================
-- 이메일 인증 강제 완료 (테스트 계정용)
-- =============================================

-- abclv2 계정 강제 인증
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'abclv2@gmail.com';  -- 실제 abclv2의 이메일로 교체하세요

-- 확인
SELECT email, email_confirmed_at
FROM auth.users
WHERE email LIKE '%abclv%';
