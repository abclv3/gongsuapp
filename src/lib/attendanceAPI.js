import { supabase } from './supabase';

// 출근 기록
export const checkIn = async (userId, workSite, checkInTime) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
        .from('attendance_records')
        .upsert([
            {
                user_id: userId,
                date: today,
                work_site: workSite,
                check_in_time: checkInTime,
                is_on_time: isOnTime(checkInTime),
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
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('attendance_records')
        .update({
            check_out_time: checkOutTime,
            is_valid_out: isValidOut(checkOutTime),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('date', today)
        .select();

    return { data, error };
};

// 월별 출퇴근 기록 조회
export const getAttendanceRecords = async (userId, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    return { data, error };
};

// 공휴일 근무 기록
export const recordHolidayWork = async (userId, workSite, date) => {
    const { data, error } = await supabase
        .from('holiday_work_records')
        .insert([
            {
                user_id: userId,
                work_site: workSite,
                date: date,
                created_at: new Date().toISOString(),
            }
        ])
        .select();

    return { data, error };
};

// 월차 기록
export const addVacationDay = async (userId, reason) => {
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

// 월차 사용 기록
export const useVacationDay = async (userId, date) => {
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

// 출근 시간 검증 (07:00 이전)
const isOnTime = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour < 7 || (hour === 7 && minute === 0);
};

// 퇴근 시간 검증 (17:00~24:00)
const isValidOut = (time) => {
    const [hour] = time.split(':').map(Number);
    return hour >= 17 && hour < 24;
};

// 공수 계산 (출근 + 퇴근 모두 정상)
export const calculateWorkDays = (records) => {
    return records.filter(r =>
        r.check_in_time &&
        r.check_out_time &&
        r.is_on_time &&
        r.is_valid_out
    ).length;
};
