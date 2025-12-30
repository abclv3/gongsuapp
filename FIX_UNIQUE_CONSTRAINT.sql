-- =============================================
-- auth_id에 유니크 제약조건 추가
-- (RPC 함수의 ON CONFLICT 구문이 작동하려면 필수)
-- =============================================

-- 기존 데이터 정리를 위해 중복 제거 (혹시 있다면)
DELETE FROM public.users
WHERE id IN (
    SELECT id
    FROM (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY auth_id ORDER BY created_at DESC) as row_num
        FROM public.users
    ) t
    WHERE t.row_num > 1
);

-- 유니크 제약조건 추가
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
