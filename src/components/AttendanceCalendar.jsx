import React, { useState, useEffect } from 'react';
import { format, getDaysInMonth, startOfMonth, addDays, isToday } from 'date-fns';
import { Calendar as CalendarIcon, Check, X, Star, Clock, LogIn, LogOut, AlertCircle, MapPin } from 'lucide-react';
import { isHoliday, getHolidayName } from '../utils/holidays';

// 출퇴근 조건 상수
const CHECK_IN_DEADLINE = 7; // 07:00 이전
const CHECK_OUT_START = 17; // 17:00 이후
const CHECK_OUT_END = 24; // 자정 이전

const AttendanceCalendar = ({
    selectedMonth,
    attendanceRecords,
    holidayWorkRecords,
    timeRecords,
    onToggleAttendance,
    onToggleHolidayWork,
    onCheckIn,
    onCheckOut,
    onClose,
    onUpdateWorkDays,
    user
}) => {
    const monthKey = format(selectedMonth, 'yyyy-MM');
    const monthRecords = attendanceRecords[monthKey] || {};
    const holidayWorks = holidayWorkRecords[monthKey] || {};
    const monthTimeRecords = timeRecords[monthKey] || {};

    // 선택된 날짜
    const [selectedDate, setSelectedDate] = useState(null);

    // 현재 날짜 및 시간
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 해당 월의 일수
    const daysInMonth = getDaysInMonth(selectedMonth);
    const firstDay = startOfMonth(selectedMonth);

    // 요일 계산 (0 = 일요일)
    const startDayOfWeek = firstDay.getDay();

    // 달력 날짜 배열 생성  
    const calendarDays = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.push(null);
    }

    // 현재 달의 날짜
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    // 유효한 근무일 체크 (출근 07:00 이전 + 퇴근 17:00~24:00)
    const isValidWorkDay = (record) => {
        if (!record || !record.checkIn || !record.checkOut) return false;

        const [inHour, inMin] = record.checkIn.split(':').map(Number);
        const [outHour, outMin] = record.checkOut.split(':').map(Number);

        const checkInValid = inHour < CHECK_IN_DEADLINE || (inHour === CHECK_IN_DEADLINE && inMin === 0);
        const checkOutValid = outHour >= CHECK_OUT_START && outHour < CHECK_OUT_END;

        return checkInValid && checkOutValid;
    };

    // 공수 계산 (출근 + 퇴근 조건 모두 충족한 날)
    const calculateWorkDays = () => {
        let count = 0;
        Object.entries(monthTimeRecords).forEach(([date, record]) => {
            if (isValidWorkDay(record)) {
                count++;
            }
        });
        return count;
    };

    // 출근 처리
    const handleCheckIn = () => {
        const timeStr = format(now, 'HH:mm');
        const isOnTime = currentHour < CHECK_IN_DEADLINE || (currentHour === CHECK_IN_DEADLINE && currentMinute === 0);

        onCheckIn(monthKey, todayStr, timeStr, isOnTime);

        if (!isOnTime) {
            alert(`지각 출근 처리되었습니다. (${timeStr})\n07:00 이전에 출근해야 정상 출근입니다.`);
        } else {
            alert(`정상 출근 처리되었습니다. (${timeStr})`);
        }
    };

    // 퇴근 처리
    const handleCheckOut = () => {
        const timeStr = format(now, 'HH:mm');
        const isValidTime = currentHour >= CHECK_OUT_START && currentHour < CHECK_OUT_END;

        onCheckOut(monthKey, todayStr, timeStr, isValidTime);

        if (!isValidTime) {
            alert(`조기 퇴근 처리되었습니다. (${timeStr})\n17:00 이후에 퇴근해야 정상 퇴근입니다.`);
        } else {
            alert(`정상 퇴근 처리되었습니다. (${timeStr})`);
        }
    };

    // 출근일 수 및 공휴일 근무 수 계산
    const workedDays = calculateWorkDays();
    const holidayWorkDays = Object.values(holidayWorks).filter(v => v).length;
    const totalWorkDays = workedDays + holidayWorkDays;

    // 공수 변경 시 부모에게 알림
    useEffect(() => {
        if (onUpdateWorkDays) {
            onUpdateWorkDays(totalWorkDays, holidayWorkDays);
        }
    }, [totalWorkDays, holidayWorkDays, onUpdateWorkDays]);

    // 오늘 출퇴근 기록
    const todayRecord = monthTimeRecords[todayStr] || {};
    const hasCheckedIn = !!todayRecord.checkIn;
    const hasCheckedOut = !!todayRecord.checkOut;

    // 날짜 클릭 핸들러
    const handleDateClick = (day) => {
        const dateStr = format(addDays(firstDay, day - 1), 'yyyy-MM-dd');
        setSelectedDate(selectedDate === dateStr ? null : dateStr);
    };

    // 선택된 날짜 정보
    const getSelectedDateInfo = () => {
        if (!selectedDate) return null;
        const dayRecord = monthTimeRecords[selectedDate] || {};
        const holidayInfo = isHoliday(selectedDate);
        const holidayName = getHolidayName(selectedDate);
        const isWorkedDay = isValidWorkDay(dayRecord);
        const isHolidayWorkDay = holidayWorks[selectedDate] === true;

        return {
            date: selectedDate,
            record: dayRecord,
            isHoliday: holidayInfo,
            holidayName,
            isWorkedDay,
            isHolidayWork: isHolidayWorkDay
        };
    };

    const selectedInfo = getSelectedDateInfo();

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-safety-orange" />
                            {format(selectedMonth, 'yyyy년 MM월')}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {user?.name}님의 출퇴근 기록
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 현장명 표시 */}
                <div className="mb-4 p-3 bg-gradient-to-r from-safety-orange/10 to-orange-500/10 border border-safety-orange/30 rounded-xl">
                    <div className="flex items-center gap-2 text-safety-orange">
                        <MapPin className="w-5 h-5" />
                        <span className="font-semibold text-lg">{user?.workSite || '현장 미설정'}</span>
                    </div>
                </div>

                {/* 선택된 날짜 정보 */}
                {selectedInfo && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
                        <div className="text-sm text-purple-400 font-semibold mb-2">
                            {format(new Date(selectedInfo.date), 'M월 d일')} 상세 정보
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">현장:</span>
                                <span className="text-safety-orange font-semibold">{user?.workSite || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">출근:</span>
                                <span className={selectedInfo.record.checkIn
                                    ? (selectedInfo.record.isOnTime !== false ? 'text-green-400' : 'text-red-400')
                                    : 'text-gray-500'}>
                                    {selectedInfo.record.checkIn || '-'}
                                    {selectedInfo.record.isOnTime === false && ' (지각)'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">퇴근:</span>
                                <span className={selectedInfo.record.checkOut
                                    ? (selectedInfo.record.isValidOut !== false ? 'text-blue-400' : 'text-red-400')
                                    : 'text-gray-500'}>
                                    {selectedInfo.record.checkOut || '-'}
                                    {selectedInfo.record.isValidOut === false && ' (조퇴)'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">공수 인정:</span>
                                <span className={selectedInfo.isWorkedDay ? 'text-green-400 font-bold' : 'text-red-400'}>
                                    {selectedInfo.isWorkedDay ? '1공수 ✓' : '미인정'}
                                </span>
                            </div>
                            {selectedInfo.isHoliday && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">공휴일:</span>
                                    <span className="text-red-400">{selectedInfo.holidayName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 오늘 출퇴근 버튼 (당일만 표시) */}
                {format(selectedMonth, 'yyyy-MM') === format(now, 'yyyy-MM') && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
                        <div className="text-sm text-blue-400 font-semibold mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            오늘 ({format(now, 'M월 d일')}) 출퇴근
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {/* 출근 버튼 */}
                            <button
                                onClick={handleCheckIn}
                                disabled={hasCheckedIn}
                                className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${hasCheckedIn
                                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                    : 'bg-safety-orange text-white hover:bg-orange-600'
                                    }`}
                            >
                                <LogIn className="w-5 h-5" />
                                {hasCheckedIn ? `출근 ${todayRecord.checkIn}` : '출근'}
                            </button>

                            {/* 퇴근 버튼 */}
                            <button
                                onClick={handleCheckOut}
                                disabled={!hasCheckedIn || hasCheckedOut}
                                className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${hasCheckedOut
                                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                                    : hasCheckedIn
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-dark-bg border border-dark-border text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <LogOut className="w-5 h-5" />
                                {hasCheckedOut ? `퇴근 ${todayRecord.checkOut}` : '퇴근'}
                            </button>
                        </div>

                        {/* 출퇴근 규칙 안내 */}
                        <div className="mt-3 text-xs text-gray-400">
                            <p>• 출근: 07:00 이전 체크</p>
                            <p>• 퇴근: 17:00~24:00 사이 체크</p>
                            <p>• 출근+퇴근 모두 완료 → 1공수</p>
                        </div>
                    </div>
                )}

                {/* 통계 */}
                <div className="mb-4 p-3 bg-dark-bg rounded-xl">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                            <div className="text-2xl font-bold text-green-400">{workedDays}</div>
                            <div className="text-gray-400 text-xs">평일 공수</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">{holidayWorkDays}</div>
                            <div className="text-gray-400 text-xs">공휴일 근무</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-safety-orange">{totalWorkDays}</div>
                            <div className="text-gray-400 text-xs">총 공수</div>
                        </div>
                    </div>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                        <div
                            key={day}
                            className={`text-center text-xs font-semibold py-1 ${index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-400'
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* 달력 그리드 */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const dateStr = format(addDays(firstDay, day - 1), 'yyyy-MM-dd');
                        const dayRecord = monthTimeRecords[dateStr] || {};
                        const isWorkedDay = isValidWorkDay(dayRecord);
                        const isHolidayWork = holidayWorks[dateStr] === true;
                        const holidayInfo = isHoliday(dateStr);
                        const holidayName = getHolidayName(dateStr);
                        const dayOfWeek = (startDayOfWeek + day - 1) % 7;
                        const isTodayDate = dateStr === todayStr;
                        const isSelected = dateStr === selectedDate;

                        return (
                            <div
                                key={day}
                                onClick={() => handleDateClick(day)}
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] relative cursor-pointer transition-all hover:scale-105 ${isSelected
                                    ? 'ring-2 ring-purple-400 bg-purple-500/20'
                                    : isTodayDate
                                        ? 'ring-2 ring-safety-orange'
                                        : ''
                                    } ${isHolidayWork
                                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                                        : isWorkedDay
                                            ? 'bg-green-500/20 border border-green-500/50'
                                            : holidayInfo
                                                ? 'bg-red-500/10 border border-red-500/30'
                                                : 'bg-dark-bg border border-dark-border hover:border-gray-500'
                                    }`}
                            >
                                <span className={`text-sm font-semibold ${holidayInfo ? 'text-red-400' :
                                    dayOfWeek === 0 ? 'text-red-400' :
                                        dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-300'
                                    }`}>
                                    {day}
                                </span>

                                {/* 출퇴근 시간 표시 */}
                                {dayRecord.checkIn && (
                                    <span className={`text-[8px] ${dayRecord.isOnTime !== false ? 'text-green-400' : 'text-red-400'}`}>
                                        {dayRecord.checkIn}
                                    </span>
                                )}
                                {dayRecord.checkOut && (
                                    <span className={`text-[8px] ${dayRecord.isValidOut !== false ? 'text-blue-400' : 'text-red-400'}`}>
                                        {dayRecord.checkOut}
                                    </span>
                                )}

                                {/* 완료 표시 */}
                                {isWorkedDay && (
                                    <Check className="absolute -top-1 -right-1 w-3 h-3 text-green-400 bg-dark-card rounded-full" />
                                )}
                                {isHolidayWork && (
                                    <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 fill-yellow-400" />
                                )}

                                {/* 공휴일 배지 */}
                                {holidayInfo && !isHolidayWork && (
                                    <div className="absolute -top-1 -left-1 bg-red-500 w-2 h-2 rounded-full" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 범례 */}
                <div className="mt-4 p-3 bg-dark-bg rounded-xl text-xs text-gray-400">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500/20 border border-green-500/50 rounded" />
                            <span>정상 출퇴근 (1공수)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/50 rounded" />
                            <span>공휴일 근무 (+월차)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500/10 border border-red-500/30 rounded" />
                            <span>공휴일</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 ring-2 ring-safety-orange rounded" />
                            <span>오늘</span>
                        </div>
                    </div>
                </div>

                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 bg-dark-bg border border-dark-border text-white font-semibold py-3 rounded-xl hover:bg-dark-border transition-all"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};

export default AttendanceCalendar;
