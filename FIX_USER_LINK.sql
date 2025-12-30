-- =============================================
-- 사용자 ID 연결 복구 스크립트
-- 회원가입 과정에서 auth_id가 꼬였을 경우를 대비해
-- 이메일 주소를 기준으로 auth_id를 강제로 동기화합니다.
-- =============================================

UPDATE public.users pu
SET auth_id = au.id
FROM auth.users au
WHERE pu.email = au.email
  AND (pu.auth_id IS DISTINCT FROM au.id);  -- ID가 다르거나 NULL인 경우 수정

-- 결과 확인
SELECT username, email, 'Link Fixed' as status 
FROM public.users 
WHERE email IN (SELECT email FROM auth.users);
