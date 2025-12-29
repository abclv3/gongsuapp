import React, { useState } from 'react';
import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Check, X } from 'lucide-react';

const AttendanceCalendar = ({ selectedMonth, attendanceRecords, onToggleAttendance, onClose }) => {
    const monthKey = format(selectedMonth, 'yyyy-MM');
    const monthRecords = attendanceRecords[monthKey] || {};

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

    // 출근 토글
    const toggleDay = (day) => {
        const dateStr = format(addDays(firstDay, day - 1), 'yyyy-MM-dd');
        onToggleAttendance(monthKey, dateStr);
    };

    // 출근일 수 계산
    const workedDays = Object.values(monthRecords).filter(v => v).length;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-safety-orange" />
                            {format(selectedMonth, 'yyyy년 MM월')} 출근 기록
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            출근: <span className="text-green-400 font-semibold">{workedDays}일</span> /
                            휴무: <span className="text-red-400 font-semibold">{daysInMonth - workedDays}일</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                        <div
                            key={day}
                            className={`text-center text-sm font-semibold py-2 ${index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-400'
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* 달력 그리드 */}
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const dateStr = format(addDays(firstDay, day - 1), 'yyyy-MM-dd');
                        const isWorked = monthRecords[dateStr] === true;
                        const dayOfWeek = (startDayOfWeek + day - 1) % 7;

                        return (
                            <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all border-2 ${isWorked
                                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                        : 'bg-dark-bg border-dark-border text-gray-400 hover:border-safety-orange/50'
                                    }`}
                            >
                                <span className={`text-lg font-semibold ${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : ''
                                    }`}>
                                    {day}
                                </span>
                                {isWorked && (
                                    <Check className="w-4 h-4 text-green-400 mt-1" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 안내 */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-sm text-blue-400">
                        💡 <strong>클릭하여 출근/휴무 표시하세요</strong>
                    </p>
                    <ul className="text-xs text-gray-400 mt-2 space-y-1">
                        <li>• 녹색: 출근한 날</li>
                        <li>• 회색: 휴무한 날</li>
                        <li>• 빨간색 숫자: 일요일</li>
                        <li>• 파란색 숫자: 토요일</li>
                    </ul>
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
