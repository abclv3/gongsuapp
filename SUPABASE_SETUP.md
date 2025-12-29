# 📘 Supabase 설정 가이드

## 🚀 **1단계: Supabase 프로젝트 생성**

### 1. Supabase 가입
1. [https://supabase.com](https://supabase.com) 접속
2. **"Start your project"** 클릭
3. GitHub 계정으로 로그인

### 2. 새 프로젝트 생성
1. **"New Project"** 클릭
2. 프로젝트 정보 입력:
   - **Name**: `safety-pay`
   - **Database Password**: 안전한 비밀번호 (기억하세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: `Free` 선택
3. **"Create new project"** 클릭
4. ⏳ 약 2분 대기 (프로젝트 생성 중...)

---

## 🔑 **2단계: API 키 확인**

### 1. Settings 메뉴
1. 좌측 사이드바 → ⚙️ **Settings**
2. **API** 클릭

### 2. API 정보 복사
- **Project URL**: `https://xxxx.supabase.co` 복사
- **anon public**: `eyJhbG...` 복사

---

## 💾 **3단계: DB 테이블 생성**

### 1. SQL Editor 열기
1. 좌측 사이드바 → 🗄️ **SQL Editor**
2. **"+ New query"** 클릭

### 2. SQL 스크립트 실행
1. `supabase-schema.sql` 파일 내용 전체 복사
2. SQL Editor에 붙여넣기
3. **"Run"** 버튼 클릭 ▶️
4. ✅ Success 메시지 확인

### 3. 테이블 확인
1. 좌측 사이드바 → 📊 **Table Editor**
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `users` - 사용자 정보
   - ✅ `attendance_records` - 출퇴근 기록
   - ✅ `holiday_work_records` - 공휴일 근무
   - ✅ `vacation_records` - 월차 발생
   - ✅ `vacation_usage` - 월차 사용

---

## ⚙️ **4단계: 환경 변수 설정**

### 1. .env 파일 생성
프로젝트 루트에 `.env` 파일 생성:

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. 실제 값 입력
- `VITE_SUPABASE_URL`: 2단계에서 복사한 Project URL
- `VITE_SUPABASE_ANON_KEY`: 2단계에서 복사한 anon public key

### 3. Vercel 환경 변수 설정
1. [https://vercel.com](https://vercel.com) 로그인
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 변수 추가:
   - **Key**: `VITE_SUPABASE_URL`, **Value**: `https://...`
   - **Key**: `VITE_SUPABASE_ANON_KEY`, **Value**: `eyJhb...`
4. **Save** 클릭

---

## 🔐 **5단계: 보안 설정 (Row Level Security)**

### RLS가 자동으로 활성화됨!
- ✅ 사용자는 자신의 데이터만 조회 가능
- ✅ 다른 사용자의 출퇴근 기록 접근 불가
- ✅ 안전한 멀티테넌트 시스템

---

## 📊 **6단계: 데이터 확인**

### 1. Table Editor에서 확인
1. 좌측 사이드바 → 📊 **Table Editor**
2. 테이블 선택 (예: `attendance_records`)
3. 실시간으로 데이터 확인 가능

### 2. SQL 쿼리로 확인
```sql
-- 오늘 출퇴근 기록 확인
SELECT * FROM attendance_records 
WHERE date = CURRENT_DATE;

-- 월별 공수 통계
SELECT 
    DATE_TRUNC('month', date) as month,
    COUNT(*) as work_days
FROM attendance_records
WHERE is_on_time = TRUE AND is_valid_out = TRUE
GROUP BY month
ORDER BY month DESC;
```

---

## 🚀 **7단계: 테스트**

### 1. 로컬 테스트
```bash
npm run dev
```

### 2. 출퇴근 테스트
1. 회원가입
2. 로그인
3. 출퇴근 기록 버튼 클릭
4. 출근 버튼 클릭
5. Supabase Table Editor에서 데이터 확인!

---

## 🎯 **데이터 구조**

### 출퇴근 기록 예시
```javascript
{
  "id": "uuid",
  "user_id": "user-uuid",
  "date": "2025-01-15",
  "work_site": "청라스타필드", // ← 현장명 저장!
  "check_in_time": "06:45:00",
  "check_out_time": "18:30:00",
  "is_on_time": true,
  "is_valid_out": true
}
```

---

## ⚠️ **문제 해결**

### Q: "Failed to fetch" 에러
**A**: 환경 변수가 올바른지 확인하세요.

### Q: "Permission denied" 에러
**A**: RLS 정책이 올바르게 설정되었는지 SQL Editor에서 확인하세요.

### Q: 데이터가 저장 안 됨
**A**: 
1. Supabase 콘솔 → Logs 확인
2. 브라우저 개발자 도구 → Console 확인

---

## 📞 **다음 단계**

1. ✅ Supabase 프로젝트 생성
2. ✅ 환경 변수 설정
3. ✅ 테이블 생성
4. ✅ 앱 테스트
5. 🚀 배포!

---

**모든 설정이 완료되면 알려주세요!**  
코드 통합을 진행하겠습니다! 🚀
