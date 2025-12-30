-- =============================================
-- 긴급 복구: 사용자 연결고리 수선 및 데이터 확인
-- =============================================

-- 1. (핵심) username 'abclv3'의 auth_id를 강제로 동기화
-- 이 작업이 되어야 RLS(보안정책)를 통과해서 내 데이터를 볼 수 있음
UPDATE public.users pu
SET auth_id = au.id
FROM auth.users au
WHERE pu.email = au.email
  AND pu.username = 'abclv3';

-- 2. 잘 고쳐졌는지, 데이터는 진짜 있는지 확인
SELECT 
    u.username AS "사용자",
    u.email AS "이메일",
    a.date AS "출근날짜",
    a.check_in_time AS "출근시간",
    a.work_site AS "현장",
    CASE 
        WHEN u.auth_id IS NOT NULL THEN '연결 성공 (정상)'
        ELSE '연결 실패 (문제 있음)'
    END AS "상태"
FROM public.attendance_records a
JOIN public.users u ON a.user_id = u.id
WHERE u.username = 'abclv3';
