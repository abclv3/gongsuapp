-- =============================================
-- 신분증 번호(auth_id) 강제 동기화
-- =============================================

-- 1. 이메일이 같은데 ID가 서로 다른 유저 찾아서 고치기
-- (회원 탈퇴 후 재가입 시 자주 발생하는 문제 해결)
UPDATE public.users pu
SET auth_id = au.id
FROM auth.users au
WHERE pu.email = au.email
  AND (pu.auth_id IS DISTINCT FROM au.id);

-- 2. 잘 고쳐졌는지 확인 (결과가 나오면 성공)
SELECT 
    pu.username, 
    pu.email, 
    pu.auth_id AS "공개User테이블_ID",
    au.id AS "인증시스템_ID",
    CASE 
        WHEN pu.auth_id = au.id THEN '✅ 일치 (정상)' 
        ELSE '❌ 불일치 (문제 있음)' 
    END AS "상태"
FROM public.users pu
JOIN auth.users au ON pu.email = au.email
WHERE pu.username = 'abclv3';
