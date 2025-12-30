-- =============================================
-- 데이터 구조 검증 및 연결 수선
-- =============================================

-- 1. 사용자(users)와 인증(auth) 연결 복구
-- 이 단계가 없으면 RLS 정책 때문에 내 출근 기록을 내가 볼 수 없습니다.
UPDATE public.users pu
SET auth_id = au.id
FROM auth.users au
WHERE pu.email = au.email
  AND pu.username = 'abclv3';

-- 2. 실제 데이터 조회 (조인 쿼리)
-- users 테이블에는 시간이 없지만, attendance_records 테이블에는 있습니다.
-- 두 테이블을 합쳐서 보여드립니다.
SELECT 
    '데이터 있음' as "상태",
    u.username AS "사용자명", 
    u.phone AS "전화번호",
    ar.date AS "출근일자", 
    ar.check_in_time AS "출근시간", 
    ar.check_out_time AS "퇴근시간",
    ar.work_site AS "작업현장"
FROM public.users u
JOIN public.attendance_records ar ON u.id = ar.user_id
WHERE u.username = 'abclv3';
