import { supabase } from './supabase';

// ========================================
// 출퇴근 기록 API (Supabase 연동)
// ========================================

// 출근 기록
export const checkIn = async (userId, workSite, checkInTime) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 07:00 이전인지 체크
    const [hour, minute] = checkInTime.split(':').map(Number);
    const isOnTime = hour < 7 || (hour === 7 && minute === 0);

    const { data, error } = await supabase
        .from('attendance_records')
        .upsert([
            {
                user_id: userId,
                date: today,
                work_site: workSite,
                check_in_time: checkInTime,
                is_on_time: isOnTime,
                updated_at: new Date().toISOString(),
            }
        ], {
            onConflict: 'user_id,date', // 중복 방지 (하루에 한 번만)
        })
        .select();

    return { data, error };
};

// 퇴근 기록
export const checkOut = async (userId, checkOutTime) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    const today = new Date().toISOString().split('T')[0];

    // 17:00~24:00 사이인지 체크
    const [hour] = checkOutTime.split(':').map(Number);
    const isValidOut = hour >= 17 && hour < 24;

    const { data, error } = await supabase
        .from('attendance_records')
        .update({
            check_out_time: checkOutTime,
            is_valid_out: isValidOut,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('date', today)
        .select();

    return { data, error };
};

// 월별 출퇴근 기록 조회
export const getAttendanceRecords = async (userId, year, month) => {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } };

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    return { data: data || [], error };
};

// 오늘 출퇴근 기록 조회
export const getTodayAttendance = async (userId) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    return { data, error };
};

// ========================================
// 공휴일 근무 기록 API
// ========================================

// 공휴일 근무 기록 추가/토글
export const toggleHolidayWork = async (userId, workSite, date, isWorked) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

    if (isWorked) {
        // 추가
        const { data, error } = await supabase
            .from('holiday_work_records')
            .upsert([
                {
                    user_id: userId,
                    work_site: workSite,
                    date: date,
                    created_at: new Date().toISOString(),
                }
            ], {
                onConflict: 'user_id,date',
            })
            .select();
        return { data, error };
    } else {
        // 삭제
        const { data, error } = await supabase
            .from('holiday_work_records')
            .delete()
            .eq('user_id', userId)
            .eq('date', date);
        return { data, error };
    }
};

// 월별 공휴일 근무 기록 조회
export const getHolidayWorkRecords = async (userId, year, month) => {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } };

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
        .from('holiday_work_records')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

    return { data: data || [], error };
};

// ========================================
// 월차 관련 API
// ========================================

// 월차 발생
export const addVacationDay = async (userId, reason) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase
        .from('vacation_records')
        .insert([
            {
                user_id: userId,
                reason: reason, // 'perfect_month' or 'holiday_work'
                earned_at: new Date().toISOString(),
            }
        ])
        .select();

    return { data, error };
};

// 월차 조회
export const getVacationRecords = async (userId) => {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } };

    const { data, error } = await supabase
        .from('vacation_records')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: true });

    return { data: data || [], error };
};

// 월차 사용 기록
export const useVacationDay = async (userId, date) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase
        .from('vacation_usage')
        .insert([
            {
                user_id: userId,
                date: date,
                used_at: new Date().toISOString(),
            }
        ])
        .select();

    return { data, error };
};

// 월차 사용 기록 조회
export const getVacationUsage = async (userId) => {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } };

    const { data, error } = await supabase
        .from('vacation_usage')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

    return { data: data || [], error };
};

// 월차 사용 취소
export const cancelVacationUsage = async (usageId) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

    const { data, error } = await supabase
        .from('vacation_usage')
        .delete()
        .eq('id', usageId);

    return { data, error };
};

// ========================================
// 유틸리티 함수
// ========================================

// 유효한 출퇴근 체크 (07:00 이전 출근 + 17:00 이후 퇴근)
export const isValidWorkDay = (record) => {
    if (!record || !record.check_in_time || !record.check_out_time) return false;
    return record.is_on_time && record.is_valid_out;
};

// 공수 계산 (출근 + 퇴근 모두 정상)
export const calculateWorkDays = (records) => {
    return records.filter(r => isValidWorkDay(r)).length;
};
