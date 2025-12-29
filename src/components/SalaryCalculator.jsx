import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Calculator,
    Wallet,
    TrendingDown,
    AlertCircle,
    Award,
    Users,
    ChevronDown,
    X,
    Plus,
    Briefcase,
    MapPin,
    Edit2,
    Check
} from 'lucide-react';
import {
    addMonths,
    subMonths,
    startOfMonth,
    format,
    addDays,
    subDays,
    differenceInYears,
    differenceInMonths
} from 'date-fns';
import AttendanceCalendar from './AttendanceCalendar';
import { WORK_SITES } from '../data/worksites';

const SalaryCalculator = ({ user, onLogout }) => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(startOfMonth(today));
    const [myWorkDays, setMyWorkDays] = useState('0');
    const [holidayWorkCount, setHolidayWorkCount] = useState(0);
    const [deductionType, setDeductionType] = useState('tax');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [vacationDays, setVacationDays] = useState(0);
    const [usedVacations, setUsedVacations] = useState([]);
    const [showVacationModal, setShowVacationModal] = useState(false);
    const [vacationDate, setVacationDate] = useState(format(today, 'yyyy-MM-dd'));
    const [showVacationHistory, setShowVacationHistory] = useState(false);
    const [hireDate, setHireDate] = useState(user?.hireDate || '');
    const [isEditingWorksite, setIsEditingWorksite] = useState(false);
    const [editedWorksite, setEditedWorksite] = useState(user?.workSite || '');
    const [showWorksiteSuggestions, setShowWorksiteSuggestions] = useState(false);
    const [filteredWorksites, setFilteredWorksites] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [holidayWorkRecords, setHolidayWorkRecords] = useState({});
    const [timeRecords, setTimeRecords] = useState({});
    const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);

    useEffect(() => {
        const savedVacationDays = localStorage.getItem('safety-pay-vacation-days');
        if (savedVacationDays) setVacationDays(parseInt(savedVacationDays));

        const savedUsedVacations = localStorage.getItem('safety-pay-used-vacations');
        if (savedUsedVacations) setUsedVacations(JSON.parse(savedUsedVacations));

        const savedHireDate = localStorage.getItem('safety-pay-hire-date');
        if (savedHireDate) setHireDate(savedHireDate);

        const savedAttendance = localStorage.getItem('safety-pay-attendance');
        if (savedAttendance) setAttendanceRecords(JSON.parse(savedAttendance));

        const savedHolidayWork = localStorage.getItem('safety-pay-holiday-work');
        if (savedHolidayWork) setHolidayWorkRecords(JSON.parse(savedHolidayWork));

        const savedTimeRecords = localStorage.getItem('safety-pay-time-records');
        if (savedTimeRecords) setTimeRecords(JSON.parse(savedTimeRecords));
    }, []);

    // 급여 상수
    const DAILY_WAGE = 100000; // 일당 10만원
    const WEEKLY_BONUS = 100000; // 주휴수당 (주당 10만원, 6일 만근 시)
    const WEEKS_PER_MONTH = 4; // 4주
    const DAYS_PER_WEEK = 6; // 주당 6일 근무 (+ 1일 주휴)
    const BASE_WORK_DAYS = WEEKS_PER_MONTH * DAYS_PER_WEEK; // 24일 실 근무
    const FULL_MONTH_DAYS = 26; // 만근 기준 (24일 + 주휴환산 2일 또는 UI 표시용)
    const BASE_WAGE = DAILY_WAGE * BASE_WORK_DAYS; // 240만원 (실 근무)
    const MAX_WEEKLY_BONUS = WEEKLY_BONUS * WEEKS_PER_MONTH; // 40만원 (주휴수당)
    const BASE_SALARY = BASE_WAGE + MAX_WEEKLY_BONUS; // 280만원... 아니 300만원 맞추려면 조정 필요

    // 실제 계산을 위한 상수 (26일 만근 = 300만원 기준)
    const PER_DAY_AMOUNT = 100000; // 일당
    const PER_WEEK_BONUS = 100000; // 주휴수당 (주당)

    const remainingVacationDays = vacationDays - usedVacations.length;

    const handleUseVacation = () => {
        if (remainingVacationDays <= 0) {
            alert('사용 가능한 월차가 없습니다.');
            return;
        }
        const newUsedVacation = { date: vacationDate, usedAt: new Date().toISOString() };
        const updatedUsedVacations = [...usedVacations, newUsedVacation];
        setUsedVacations(updatedUsedVacations);
        localStorage.setItem('safety-pay-used-vacations', JSON.stringify(updatedUsedVacations));
        setShowVacationModal(false);
        alert('월차가 사용되었습니다.');
    };

    const handleDeleteVacation = (index) => {
        if (confirm('이 월차 기록을 삭제하시겠습니까?')) {
            const updatedUsedVacations = usedVacations.filter((_, i) => i !== index);
            setUsedVacations(updatedUsedVacations);
            localStorage.setItem('safety-pay-used-vacations', JSON.stringify(updatedUsedVacations));
        }
    };

    const handleHireDateChange = (date) => {
        setHireDate(date);
        localStorage.setItem('safety-pay-hire-date', date);
    };

    const handleWorksiteChange = () => {
        if (!editedWorksite.trim()) {
            alert('현장명을 입력해주세요.');
            return;
        }
        const users = JSON.parse(localStorage.getItem('safety-pay-users') || '[]');
        const updatedUsers = users.map(u => u.id === user.id ? { ...u, workSite: editedWorksite.trim() } : u);
        localStorage.setItem('safety-pay-users', JSON.stringify(updatedUsers));
        const updatedUser = { ...user, workSite: editedWorksite.trim() };
        sessionStorage.setItem('current-user', JSON.stringify(updatedUser));
        setIsEditingWorksite(false);
        alert('현장이 변경되었습니다.');
        window.location.reload();
    };

    const handleWorksiteSearch = (value) => {
        setEditedWorksite(value);
        if (value.trim()) {
            const filtered = WORK_SITES.filter(site =>
                site.name.toLowerCase().includes(value.toLowerCase()) ||
                site.address.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredWorksites(filtered);
            setShowWorksiteSuggestions(filtered.length > 0);
        } else {
            setFilteredWorksites([]);
            setShowWorksiteSuggestions(false);
        }
    };

    const handleWorksiteSelect = (siteName) => {
        setEditedWorksite(siteName);
        setShowWorksiteSuggestions(false);
    };

    const calculateTenure = () => {
        if (!hireDate) return null;
        const hire = new Date(hireDate);
        const years = differenceInYears(today, hire);
        const totalMonths = differenceInMonths(today, hire);
        const months = totalMonths % 12;
        return { years, months, totalMonths };
    };

    const tenure = calculateTenure();

    const handleToggleAttendance = (monthKey, dateStr) => {
        const newRecords = { ...attendanceRecords };
        if (!newRecords[monthKey]) newRecords[monthKey] = {};
        newRecords[monthKey][dateStr] = !newRecords[monthKey][dateStr];
        setAttendanceRecords(newRecords);
        localStorage.setItem('safety-pay-attendance', JSON.stringify(newRecords));
        const workedDays = Object.values(newRecords[monthKey] || {}).filter(v => v).length;
        setMyWorkDays(workedDays.toString());
    };

    const handleToggleHolidayWork = (monthKey, dateStr) => {
        const newRecords = { ...holidayWorkRecords };
        if (!newRecords[monthKey]) newRecords[monthKey] = {};
        newRecords[monthKey][dateStr] = !newRecords[monthKey][dateStr];
        setHolidayWorkRecords(newRecords);
        localStorage.setItem('safety-pay-holiday-work', JSON.stringify(newRecords));
    };

    const handleCheckIn = (monthKey, dateStr, timeStr, isOnTime) => {
        const newRecords = { ...timeRecords };
        if (!newRecords[monthKey]) newRecords[monthKey] = {};
        newRecords[monthKey][dateStr] = { ...newRecords[monthKey][dateStr], checkIn: timeStr, isOnTime };
        setTimeRecords(newRecords);
        localStorage.setItem('safety-pay-time-records', JSON.stringify(newRecords));
    };

    const handleCheckOut = (monthKey, dateStr, timeStr, isValidOut) => {
        const newRecords = { ...timeRecords };
        if (!newRecords[monthKey]) newRecords[monthKey] = {};
        newRecords[monthKey][dateStr] = { ...newRecords[monthKey][dateStr], checkOut: timeStr, isValidOut };
        setTimeRecords(newRecords);
        localStorage.setItem('safety-pay-time-records', JSON.stringify(newRecords));
    };

    // 공수 자동 업데이트 핸들러
    const handleUpdateWorkDays = (totalDays, holidayDays) => {
        setMyWorkDays(totalDays.toString());
        setHolidayWorkCount(holidayDays);
    };

    const paymentDate = format(addMonths(startOfMonth(selectedMonth), 1).setDate(10), 'M/d');
    const workDays = parseInt(myWorkDays) || 0;

    // 주휴수당 계산
    // 만근 기준: 26일 (4주 x 6일 + 2일) = 24일 실근무 + 4주 주휴수당
    // 실제 로직: 각 주별로 6일 근무 시 주휴수당 지급
    const calculateWeeklyBonus = () => {
        // 간단 계산: 6일당 1주휴수당
        const fullWeeks = Math.floor(workDays / DAYS_PER_WEEK);
        const remainingDays = workDays % DAYS_PER_WEEK;

        // 마지막 주 6일 이상이면 주휴수당 추가
        let weeklyBonusCount = fullWeeks;
        if (remainingDays >= DAYS_PER_WEEK) {
            weeklyBonusCount++;
        }

        // 최대 4주
        return Math.min(weeklyBonusCount, WEEKS_PER_MONTH);
    };

    const earnedWeeklyBonus = calculateWeeklyBonus();
    const dailyWageTotal = workDays * DAILY_WAGE; // 실 근무일 x 일당
    const weeklyBonusTotal = earnedWeeklyBonus * WEEKLY_BONUS; // 주휴수당
    const totalGrossSalary = dailyWageTotal + weeklyBonusTotal;

    // 만근 기준과 비교
    const fullMonthGross = (FULL_MONTH_DAYS * DAILY_WAGE); // 260만원 + 40만원 = 300만원
    const maxWeeklyBonus = WEEKS_PER_MONTH * WEEKLY_BONUS; // 40만원
    const baseSalaryForDisplay = 3000000; // 표시용 만근 급여

    const taxRate = deductionType === 'tax' ? 0.033 : 0.094;
    const deduction = Math.round(totalGrossSalary * taxRate);
    const netSalary = totalGrossSalary - deduction;
    const isPerfectAttendance = workDays >= FULL_MONTH_DAYS;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR').format(amount);
    };

    return (
        <div className="min-h-screen bg-dark-bg text-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-safety-orange to-orange-600 p-4 shadow-lg">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Safety-Pay</h1>
                        <p className="text-sm opacity-90">{user?.name}님 / {user?.workSite}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAttendanceCalendar(true)}
                            className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-all"
                        >
                            <Calendar className="w-4 h-4 inline mr-1" />
                            출퇴근
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-all"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-4">
                {/* Month Selector */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                            className="p-2 hover:bg-dark-border rounded-lg transition-all"
                        >
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                        <div className="text-center">
                            <div className="text-lg font-bold">{format(selectedMonth, 'yyyy년 MM월')}</div>
                            <div className="text-xs text-gray-400">지급일: {paymentDate}</div>
                        </div>
                        <button
                            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                            className="p-2 hover:bg-dark-border rounded-lg transition-all"
                        >
                            <ChevronDown className="w-5 h-5 -rotate-90" />
                        </button>
                    </div>
                </div>

                {/* Work Days Input */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
                    <label className="block text-sm text-gray-400 mb-2">
                        <Briefcase className="w-4 h-4 inline mr-1" />
                        내 공수 (일수)
                    </label>
                    <div className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-center">
                        <span className="text-4xl font-bold text-safety-orange">{myWorkDays}</span>
                        <span className="text-lg text-gray-400 ml-2">공수</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">출퇴근 기록 기반 자동 계산</p>
                    {isPerfectAttendance && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-green-400">
                            <Award className="w-4 h-4" />
                            <span className="text-sm">만근 달성! 월차 +1일</span>
                        </div>
                    )}
                </div>

                {/* Deduction Type */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
                    <label className="block text-sm text-gray-400 mb-2">
                        <TrendingDown className="w-4 h-4 inline mr-1" />
                        공제 유형
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setDeductionType('tax')}
                            className={`py-3 rounded-xl font-semibold transition-all ${deductionType === 'tax'
                                ? 'bg-safety-orange text-white'
                                : 'bg-dark-bg border border-dark-border text-gray-400 hover:border-safety-orange'
                                }`}
                        >
                            세금 (3.3%)
                        </button>
                        <button
                            onClick={() => setDeductionType('insurance')}
                            className={`py-3 rounded-xl font-semibold transition-all ${deductionType === 'insurance'
                                ? 'bg-safety-orange text-white'
                                : 'bg-dark-bg border border-dark-border text-gray-400 hover:border-safety-orange'
                                }`}
                        >
                            4대보험 (9.4%)
                        </button>
                    </div>
                </div>

                {/* Vacation Days */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-400" />
                            <span className="text-gray-400">월차</span>
                        </div>
                        <div className="text-2xl font-bold text-green-400">{remainingVacationDays}일</div>
                    </div>
                    <div className="text-xs text-gray-500">
                        총: {vacationDays}일 / 사용: {usedVacations.length}일
                    </div>
                    <button
                        onClick={() => setShowVacationModal(true)}
                        className="w-full mt-3 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        월차 사용
                    </button>
                </div>

                {/* Salary Breakdown */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
                    {/* 일급 */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">일급 ({workDays}일 x 10만원)</span>
                        <span className="font-semibold">{formatCurrency(dailyWageTotal)}원</span>
                    </div>

                    {/* 주휴수당 */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">주휴수당 ({earnedWeeklyBonus}주 x 10만원)</span>
                        <span className={`font-semibold ${earnedWeeklyBonus < WEEKS_PER_MONTH ? 'text-yellow-400' : 'text-green-400'}`}>
                            {formatCurrency(weeklyBonusTotal)}원
                        </span>
                    </div>

                    {/* 주휴수당 차감 안내 */}
                    {earnedWeeklyBonus < WEEKS_PER_MONTH && (
                        <div className="text-xs text-yellow-400 bg-yellow-500/10 rounded-lg p-2">
                            주휴수당 {WEEKS_PER_MONTH - earnedWeeklyBonus}주분 차감 (6일 미만 근무 주)
                        </div>
                    )}

                    <div className="border-t border-dark-border my-2"></div>

                    {/* 총 급여 */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">총 급여</span>
                        <span className="font-bold text-lg text-white">{formatCurrency(totalGrossSalary)}원</span>
                    </div>

                    {/* 만근 대비 */}
                    {workDays < FULL_MONTH_DAYS && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">만근 대비</span>
                            <span className="text-red-400">
                                -{formatCurrency(baseSalaryForDisplay - totalGrossSalary)}원
                            </span>
                        </div>
                    )}

                    <div className="border-t border-dark-border my-2"></div>

                    {/* 공제 */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">
                            공제 ({(taxRate * 100).toFixed(1)}%)
                        </span>
                        <span className="text-red-400">-{formatCurrency(deduction)}원</span>
                    </div>
                </div>

                {/* Net Salary */}
                <div className="bg-gradient-to-r from-safety-orange to-orange-600 rounded-2xl p-6 text-center shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Wallet className="w-6 h-6" />
                        <span className="text-lg">실수령액</span>
                    </div>
                    <div className="text-4xl font-bold">{formatCurrency(netSalary)}원</div>
                </div>

                {/* Employee Info */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
                    <h3 className="font-semibold text-gray-300 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        근무 정보
                    </h3>

                    {/* Hire Date */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">입사일</span>
                        <input
                            type="date"
                            value={hireDate}
                            onChange={(e) => handleHireDateChange(e.target.value)}
                            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1 text-sm text-white focus:border-safety-orange outline-none"
                        />
                    </div>

                    {/* Tenure */}
                    {tenure && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">근속 기간</span>
                            <span className="text-safety-orange font-semibold">
                                {tenure.years}년 {tenure.months}개월
                            </span>
                        </div>
                    )}

                    {/* Worksite */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">근무 현장</span>
                        {isEditingWorksite ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editedWorksite}
                                    onChange={(e) => handleWorksiteSearch(e.target.value)}
                                    className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1 text-sm text-white focus:border-safety-orange outline-none w-40"
                                    placeholder="현장명 입력"
                                />
                                <button onClick={handleWorksiteChange} className="text-green-400 hover:text-green-300">
                                    <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsEditingWorksite(false)} className="text-red-400 hover:text-red-300">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-safety-orange font-semibold">{user?.workSite || '미설정'}</span>
                                <button onClick={() => setIsEditingWorksite(true)} className="text-gray-400 hover:text-white">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Worksite Suggestions */}
                    {showWorksiteSuggestions && (
                        <div className="bg-dark-bg border border-dark-border rounded-lg max-h-40 overflow-y-auto">
                            {filteredWorksites.map((site) => (
                                <button
                                    key={site.name}
                                    onClick={() => handleWorksiteSelect(site.name)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-dark-border transition-all"
                                >
                                    <div className="font-semibold">{site.name}</div>
                                    <div className="text-xs text-gray-400">{site.address}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Vacation Modal */}
            {showVacationModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-sm w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">월차 사용</h2>
                            <button onClick={() => setShowVacationModal(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">사용일</label>
                            <input
                                type="date"
                                value={vacationDate}
                                onChange={(e) => setVacationDate(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:border-safety-orange outline-none"
                            />
                        </div>
                        <div className="text-sm text-gray-400 mb-4">
                            잔여 월차: <span className="text-green-400 font-semibold">{remainingVacationDays}일</span>
                        </div>
                        <button
                            onClick={handleUseVacation}
                            disabled={remainingVacationDays <= 0}
                            className="w-full py-3 bg-safety-orange text-white font-semibold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

            {/* Attendance Calendar Modal */}
            {showAttendanceCalendar && (
                <AttendanceCalendar
                    selectedMonth={selectedMonth}
                    attendanceRecords={attendanceRecords}
                    holidayWorkRecords={holidayWorkRecords}
                    timeRecords={timeRecords}
                    onToggleAttendance={handleToggleAttendance}
                    onToggleHolidayWork={handleToggleHolidayWork}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    onClose={() => setShowAttendanceCalendar(false)}
                    onUpdateWorkDays={handleUpdateWorkDays}
                    user={user}
                />
            )}
        </div>
    );
};

export default SalaryCalculator;
