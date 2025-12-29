import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Calculator,
    Wallet,
    TrendingDown,
    AlertCircle,
    Award,
    Wallet,
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

// 주요 ?�장 목록 (GPS 좌표)
const WORK_SITES = [
    { name: '�?��?��??�드', lat: 37.5397, lng: 126.6430, address: '?�천광역???�구 �?��?? },
    { name: '?�성바이???�도공장', lat: 37.3850, lng: 126.6400, address: '?�천광역???�수�? },
    { name: '�?��케미컬 ?�수공장', lat: 34.7604, lng: 127.6622, address: '?�라?�도 ?�수?? },
    { name: '?��??�철 ?�진공장', lat: 36.8945, lng: 126.6444, address: '충청?�도 ?�진?? },
    { name: '?�스�??�항?�철??, lat: 36.0190, lng: 129.3435, address: '경상북도 ?�항?? },
    { name: 'SK?�이?�스 ?�천캠퍼??, lat: 37.2720, lng: 127.4350, address: '경기???�천?? },
    { name: '?�성?�자 ?�택캠퍼??, lat: 36.9910, lng: 127.1120, address: '경기???�택?? },
];

const SalaryCalculator = ({ user, onLogout }) => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(startOfMonth(today)); // ?�늘 ?�짜????
    const [myWorkDays, setMyWorkDays] = useState('26');
    const [deductionType, setDeductionType] = useState('tax'); // 'tax' or 'insurance'
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

    // 출근 기록 관??state
    const [attendanceRecords, setAttendanceRecords] = useState({}); // { '2025-01': { '2025-01-15': true, ... } }
    const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);

    // ?�차 ?�이??로드 (localStorage)
    useEffect(() => {
        const savedVacationDays = localStorage.getItem('safety-pay-vacation-days');
        if (savedVacationDays) {
            setVacationDays(parseInt(savedVacationDays));
        }

        const savedUsedVacations = localStorage.getItem('safety-pay-used-vacations');
        if (savedUsedVacations) {
            setUsedVacations(JSON.parse(savedUsedVacations));
        }

        const savedHireDate = localStorage.getItem('safety-pay-hire-date');
        if (savedHireDate) {
            setHireDate(savedHireDate);
        }

        // 출근 기록 로드
        const savedAttendance = localStorage.getItem('safety-pay-attendance');
        if (savedAttendance) {
            setAttendanceRecords(JSON.parse(savedAttendance));
        }
    }, []);

    // 만근 ?�성 ???�차 ?�??
    useEffect(() => {
        const workDays = parseInt(myWorkDays) || 0;
        if (workDays >= BASE_WORK_DAYS) {
            const monthKey = format(selectedMonth, 'yyyy-MM');
            const savedMonths = JSON.parse(localStorage.getItem('safety-pay-perfect-months') || '[]');

            if (!savedMonths.includes(monthKey)) {
                savedMonths.push(monthKey);
                localStorage.setItem('safety-pay-perfect-months', JSON.stringify(savedMonths));

                const newVacationDays = savedMonths.length;
                setVacationDays(newVacationDays);
                localStorage.setItem('safety-pay-vacation-days', newVacationDays.toString());
            }
        }
    }, [myWorkDays, selectedMonth]);

    // ?�수
    const BASE_SALARY = 3000000; // 기본�?
    const BASE_WORK_DAYS = 26; // 기�? 만근 공수
    const PER_DAY_AMOUNT = 100000; // 1공수??금액

    // ?�차 계산
    const remainingVacationDays = vacationDays - usedVacations.length;

    // ?�차 ?�용 처리
    const handleUseVacation = () => {
        if (remainingVacationDays <= 0) {
            alert('?�용 가?�한 ?�차가 ?�습?�다.');
            return;
        }

        const newUsedVacation = {
            date: vacationDate,
            usedAt: new Date().toISOString()
        };

        const updatedUsedVacations = [...usedVacations, newUsedVacation];
        setUsedVacations(updatedUsedVacations);
        localStorage.setItem('safety-pay-used-vacations', JSON.stringify(updatedUsedVacations));

        setShowVacationModal(false);
        alert(`${format(new Date(vacationDate), 'yyyy??M??d??)} ?�차가 ?�용 처리?�었?�니??`);
    };

    // ?�차 ?�용 ?�역 ??��
    const handleDeleteVacation = (index) => {
        if (confirm('???�차 ?�용 ?�역????��?�시겠습?�까?')) {
            const updatedUsedVacations = usedVacations.filter((_, i) => i !== index);
            setUsedVacations(updatedUsedVacations);
            localStorage.setItem('safety-pay-used-vacations', JSON.stringify(updatedUsedVacations));
        }
    };

    // ?�사?�자 변�?처리
    const handleHireDateChange = (date) => {
        setHireDate(date);
        localStorage.setItem('safety-pay-hire-date', date);
    };

    // ?�장 변�?처리
    const handleWorksiteChange = () => {
        if (!editedWorksite.trim()) {
            alert('?�장명을 ?�력?�세??');
            return;
        }

        // ?�용???�보 ?�데?�트
        const users = JSON.parse(localStorage.getItem('safety-pay-users') || '[]');
        const updatedUsers = users.map(u =>
            u.id === user.id ? { ...u, workSite: editedWorksite.trim() } : u
        );
        localStorage.setItem('safety-pay-users', JSON.stringify(updatedUsers));

        // ?�재 ?�용???�션 ?�데?�트
        const updatedUser = { ...user, workSite: editedWorksite.trim() };
        sessionStorage.setItem('current-user', JSON.stringify(updatedUser));

        setIsEditingWorksite(false);
        alert('?�장 ?�보가 ?�데?�트?�었?�니??');
        // ?�이지 ?�로고침?�여 ?�더?�도 반영
        window.location.reload();
    };

    // ?�장 검??처리
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

    // ?�장 ?�택 처리
    const handleWorksiteSelect = (siteName) => {
        setEditedWorksite(siteName);
        setShowWorksiteSuggestions(false);
    };

    // 근속 ?�수 계산
    const calculateTenure = () => {
        if (!hireDate) return null;

        const hire = new Date(hireDate);
        const years = differenceInYears(today, hire);
        const totalMonths = differenceInMonths(today, hire);
        const months = totalMonths % 12;

        return { years, months, totalMonths };
    };

    const tenure = calculateTenure();

    // 출근 기록 ?��? ?�수
    const handleToggleAttendance = (monthKey, dateStr) => {
        const newRecords = { ...attendanceRecords };
        if (!newRecords[monthKey]) {
            newRecords[monthKey] = {};
        }
        newRecords[monthKey][dateStr] = !newRecords[monthKey][dateStr];

        setAttendanceRecords(newRecords);
        localStorage.setItem('safety-pay-attendance', JSON.stringify(newRecords));

        // 출근?????�동 계산 �??�데?�트
        const workedDays = Object.values(newRecords[monthKey] || {}).filter(v => v).length;
        setMyWorkDays(workedDays.toString());
    };

    // ?�짜 계산
    const calcPeriodStart = subDays(startOfMonth(selectedMonth), 5); // ?�월 25??(26??
    const calcPeriodStartDisplay = format(subDays(calcPeriodStart, 1), 'M/d'); // ?�월 25??
    const calcPeriodEnd = format(addDays(startOfMonth(selectedMonth), 25), 'M/d'); // ?�월 26??
    const paymentDate = format(addMonths(startOfMonth(selectedMonth), 1).setDate(10), 'M/d'); // ?�월 10??

    // 급여 계산
    const workDays = parseInt(myWorkDays) || 0;
    const dayDifference = BASE_WORK_DAYS - workDays;
    const isShortage = dayDifference > 0;
    const isOvertime = workDays > BASE_WORK_DAYS;

    // ?�실/추�? 금액
    const lossAmount = isShortage ? dayDifference * PER_DAY_AMOUNT : 0;
    const bonusAmount = isOvertime ? (workDays - BASE_WORK_DAYS) * PER_DAY_AMOUNT : 0;

    // ?�전 급여
    const grossSalary = BASE_SALARY - lossAmount + bonusAmount;

    // 공제??계산
    const deductionRate = deductionType === 'tax' ? 0.033 : 0.094;
    const deductionAmount = Math.floor(grossSalary * deductionRate);

    // ?�수?�액
    const netSalary = grossSalary - deductionAmount;

    // 만근 ?��?
    const isPerfectAttendance = workDays >= BASE_WORK_DAYS;

    return (
        <div className="min-h-screen bg-dark-bg p-4 pb-8">
            {/* ?�더 */}
            <div className="max-w-2xl mx-auto mb-6 pt-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Wallet className="w-7 h-7 text-safety-orange" />
                        Safety-Pay
                    </h1>
                    <div className="flex items-center gap-3">
                        {/* ?�차 배�? (?�릭 가?? */}
                        <button
                            onClick={() => setShowVacationHistory(!showVacationHistory)}
                            className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5 hover:bg-green-500/30 transition-all cursor-pointer"
                        >
                            <Calendar className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-semibold">{remainingVacationDays}/{vacationDays}??/span>
                        </button>
                        <button
                            onClick={() => setShowVacationModal(true)}
                            className="flex items-center gap-1 bg-safety-orange/20 border border-safety-orange/30 rounded-lg px-3 py-1.5 hover:bg-safety-orange/30 transition-all"
                        >
                            <Plus className="w-4 h-4 text-safety-orange" />
                            <span className="text-safety-orange text-sm font-semibold">?�차?�용</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            로그?�웃
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-400 text-sm">?�전감시??급여 매니?�</p>
                    <div className="text-right">
                        <p className="text-white text-sm font-semibold">{user?.name}??/p>
                        <p className="text-gray-500 text-xs">{user?.workSite}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {/* 급여 귀?�월 ?�택 */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-safety-orange" />
                        <h2 className="text-lg font-semibold text-white">급여 귀?�월</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                            className="px-4 py-2 bg-dark-bg hover:bg-dark-border border border-dark-border rounded-lg text-white transition-all"
                        >
                            ??
                        </button>

                        <div className="flex-1 relative">
                            <button
                                onClick={() => setShowMonthPicker(!showMonthPicker)}
                                className="w-full text-center py-2 px-4 bg-dark-bg hover:bg-dark-border border border-dark-border rounded-xl transition-all group"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-bold text-safety-orange">
                                        {format(selectedMonth, 'yyyy')}??{format(selectedMonth, 'M')}??
                                    </span>
                                    <ChevronDown className={`w-5 h-5 text-safety-orange transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {/* ?????�택 ?�롭?�운 */}
                            {showMonthPicker && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-xl p-4 shadow-2xl z-10">
                                    <div className="mb-3">
                                        <label className="text-xs text-gray-400 mb-1 block">?�도</label>
                                        <select
                                            value={selectedMonth.getFullYear()}
                                            onChange={(e) => {
                                                const newDate = new Date(selectedMonth);
                                                newDate.setFullYear(parseInt(e.target.value));
                                                setSelectedMonth(newDate);
                                            }}
                                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white outline-none focus:border-safety-orange"
                                        >
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                                <option key={year} value={year}>{year}??/option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">??/label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <button
                                                    key={month}
                                                    onClick={() => {
                                                        const newDate = new Date(selectedMonth);
                                                        newDate.setMonth(month - 1);
                                                        setSelectedMonth(newDate);
                                                        setShowMonthPicker(false);
                                                    }}
                                                    className={`py-2 rounded-lg font-semibold transition-all ${selectedMonth.getMonth() === month - 1
                                                        ? 'bg-safety-orange text-white'
                                                        : 'bg-dark-bg text-gray-300 hover:bg-dark-border'
                                                        }`}
                                                >
                                                    {month}??
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                            className="px-4 py-2 bg-dark-bg hover:bg-dark-border border border-dark-border rounded-lg text-white transition-all"
                        >
                            ??
                        </button>
                    </div>

                    {/* ?�짜 ?�보 강조 */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="bg-dark-bg/50 rounded-xl p-4 border border-dark-border">
                            <div className="text-xs text-gray-400 mb-1">?�정 기간</div>
                            <div className="text-lg font-semibold text-white">
                                {calcPeriodStartDisplay} ~ {calcPeriodEnd}
                            </div>
                        </div>
                        <div className="bg-dark-bg/50 rounded-xl p-4 border border-safety-orange/30">
                            <div className="text-xs text-gray-400 mb-1">급여 지급일</div>
                            <div className="text-lg font-semibold text-safety-orange">
                                {paymentDate}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 공수 ?�력 */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-safety-orange" />
                        <h2 className="text-lg font-semibold text-white">??공수 (?�수)</h2>
                    </div>

                    <div className="relative">
                        <input
                            type="number"
                            value={myWorkDays}
                            onChange={(e) => setMyWorkDays(e.target.value)}
                            className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-4 text-white text-2xl font-bold text-center outline-none transition-all"
                            placeholder="26"
                            min="0"
                            max="31"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                            ??
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-400">기�? 만근 공수</span>
                        <span className="text-white font-semibold">{BASE_WORK_DAYS}??/span>
                    </div>
                </div>

                {/* 근무 ?�보 (?�사?�자 & ?�장) */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-5 h-5 text-safety-orange" />
                        <h2 className="text-lg font-semibold text-white">근무 ?�보</h2>
                    </div>

                    {/* ?�장 ?�보 */}
                    <div className="mb-4 bg-gradient-to-br from-safety-orange/10 to-orange-600/10 border border-safety-orange/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-safety-orange" />
                                <span className="text-gray-400 text-sm">?�재 ?�장</span>
                            </div>
                            {!isEditingWorksite && (
                                <button
                                    onClick={() => {
                                        setIsEditingWorksite(true);
                                        setEditedWorksite(user?.workSite || '');
                                    }}
                                    className="text-xs bg-safety-orange/20 border border-safety-orange/30 text-safety-orange px-2 py-1 rounded-lg hover:bg-safety-orange/30 transition-all flex items-center gap-1"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    ?�정
                                </button>
                            )}
                        </div>

                        {isEditingWorksite ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={editedWorksite}
                                    onChange={(e) => handleWorksiteSearch(e.target.value)}
                                    onFocus={() => editedWorksite.trim() && setShowWorksiteSuggestions(filteredWorksites.length > 0)}
                                    placeholder="?�장명을 ?�력?�세??(?? �?��)"
                                    className="w-full bg-dark-bg border-2 border-safety-orange rounded-xl px-4 py-2 text-white text-lg font-semibold outline-none mb-2"
                                    autoFocus
                                />

                                {/* 검??결과 ?�롭?�운 */}
                                {showWorksiteSuggestions && filteredWorksites.length > 0 && (
                                    <div className="absolute z-10 w-full bg-dark-card border-2 border-safety-orange/50 rounded-xl mt-[-8px] mb-2 max-h-48 overflow-y-auto shadow-lg">
                                        {filteredWorksites.map((site, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleWorksiteSelect(site.name)}
                                                className="w-full text-left px-4 py-3 hover:bg-safety-orange/20 transition-all border-b border-dark-border last:border-b-0"
                                            >
                                                <div className="text-white font-semibold">{site.name}</div>
                                                <div className="text-gray-400 text-xs mt-1">{site.address}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleWorksiteChange}
                                        className="flex-1 bg-gradient-to-r from-safety-orange to-orange-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1"
                                    >
                                        <Check className="w-4 h-4" />
                                        ?�??
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingWorksite(false);
                                            setEditedWorksite(user?.workSite || '');
                                        }}
                                        className="flex-1 bg-dark-bg border border-dark-border text-gray-400 font-semibold py-2 rounded-lg hover:bg-dark-border transition-all"
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-safety-orange font-bold text-lg">
                                {user?.workSite || '미등�?}
                            </div>
                        )}
                    </div>

                    {/* ?�사?�자 */}
                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">?�사?�자</label>
                        <input
                            type="date"
                            value={hireDate}
                            onChange={(e) => handleHireDateChange(e.target.value)}
                            className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-4 text-white text-lg font-semibold text-center outline-none transition-all"
                            max={format(today, 'yyyy-MM-dd')}
                        />
                    </div>

                    {tenure && (
                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-blue-400 font-medium">근속 기간</span>
                                <div className="flex items-center gap-2">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-400">{tenure.years}</div>
                                        <div className="text-xs text-blue-400/70">??/div>
                                    </div>
                                    <div className="text-blue-400/50 text-2xl">+</div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-400">{tenure.months}</div>
                                        <div className="text-xs text-purple-400/70">개월</div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 text-center pt-3 border-t border-blue-500/20">
                                �?{tenure.totalMonths}개월 근무 �?
                            </div>
                        </div>
                    )}
                </div>

                {/* 공제 ?�택 */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="w-5 h-5 text-safety-orange" />
                        <h2 className="text-lg font-semibold text-white">공제 ?�형</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setDeductionType('tax')}
                            className={`p-4 rounded-xl border-2 transition-all ${deductionType === 'tax'
                                ? 'border-safety-orange bg-safety-orange/10'
                                : 'border-dark-border bg-dark-bg hover:border-gray-600'
                                }`}
                        >
                            <div className="text-sm text-gray-400 mb-1">?�업?�득??/div>
                            <div className={`text-xl font-bold ${deductionType === 'tax' ? 'text-safety-orange' : 'text-white'}`}>
                                3.3%
                            </div>
                        </button>

                        <button
                            onClick={() => setDeductionType('insurance')}
                            className={`p-4 rounded-xl border-2 transition-all ${deductionType === 'insurance'
                                ? 'border-safety-orange bg-safety-orange/10'
                                : 'border-dark-border bg-dark-bg hover:border-gray-600'
                                }`}
                        >
                            <div className="text-sm text-gray-400 mb-1">4?�보험</div>
                            <div className={`text-xl font-bold ${deductionType === 'insurance' ? 'text-safety-orange' : 'text-white'}`}>
                                9.4%
                            </div>
                        </button>
                    </div>
                </div>

                {/* 결과 카드 */}
                <div className="bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6 shadow-xl">
                    {/* 만근 배�? */}
                    {isPerfectAttendance && (
                        <div className="mb-4">
                            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-safety-orange to-orange-600 rounded-xl py-3 px-4 animate-pulse-slow">
                                <Award className="w-5 h-5 text-white" />
                                <span className="text-white font-bold">?�� 만근 ?�성! ?�차 발생</span>
                            </div>
                            <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-green-400" />
                                        <span className="text-green-400 font-medium">?�적 ?�차</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-4xl font-bold text-green-400">{vacationDays}</span>
                                        <span className="text-green-400 text-lg">??/span>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-green-400/70">
                                    만근???�의 개수만큼 ?�차가 ?�적?�니??
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ?�실금액 강조 */}
                    {isShortage && lossAmount > 0 && (
                        <div className="mb-4 bg-red-500/10 border-2 border-red-500 rounded-xl p-4 animate-pulse-slow">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                <span className="text-red-500 font-semibold text-sm">?�까???�실금액</span>
                            </div>
                            <div className="text-3xl font-bold text-red-500 flex items-center gap-2">
                                ?�� -{lossAmount.toLocaleString()}??
                            </div>
                            <div className="text-xs text-red-400 mt-2">
                                {dayDifference}??부�?= {dayDifference} × 100,000??
                            </div>
                        </div>
                    )}

                    {/* 추�? 급여 (초과 근무) */}
                    {isOvertime && bonusAmount > 0 && (
                        <div className="mb-4 bg-green-500/10 border-2 border-green-500 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-5 h-5 text-green-500" />
                                <span className="text-green-500 font-semibold text-sm">추�? 급여</span>
                            </div>
                            <div className="text-3xl font-bold text-green-500 flex items-center gap-2">
                                +{bonusAmount.toLocaleString()}??
                            </div>
                            <div className="text-xs text-green-400 mt-2">
                                {workDays - BASE_WORK_DAYS}??추�? 근무
                            </div>
                        </div>
                    )}

                    {/* 급여 ?�세 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-dark-border">
                            <span className="text-gray-400">기본�?(만근 기�?)</span>
                            <span className="text-white font-semibold">{BASE_SALARY.toLocaleString()}??/span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-dark-border">
                            <span className="text-gray-400">?�전 급여</span>
                            <span className="text-white font-bold text-xl">{grossSalary.toLocaleString()}??/span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-dark-border">
                            <span className="text-gray-400">
                                공제??({deductionType === 'tax' ? '3.3%' : '9.4%'})
                            </span>
                            <span className="text-red-400">-{deductionAmount.toLocaleString()}??/span>
                        </div>

                        {/* ?�수?�액 (최종) */}
                        <div className="mt-6 bg-gradient-to-r from-safety-orange to-orange-600 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="w-6 h-6 text-white" />
                                <span className="text-white/90 text-sm font-medium">최종 ?�수?�액</span>
                            </div>
                            <div className="text-4xl font-bold text-white">
                                {netSalary.toLocaleString()}??
                            </div>
                        </div>
                    </div>

                    {/* 경고 메시지 */}
                    {isShortage && (
                        <div className="mt-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-200">
                                <strong className="text-amber-400">출근 관�??�요:</strong> 만근 ???�차가 발생?�니??
                                ?�재 {dayDifference}??부족하??<strong className="text-amber-400">{lossAmount.toLocaleString()}??/strong>???�실??발생?�습?�다.
                            </div>
                        </div>
                    )}
                </div>

                {/* ?�차 ?�용 ?�역 */}
                {showVacationHistory && usedVacations.length > 0 && (
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-400" />
                                <h2 className="text-lg font-semibold text-white">?�차 ?�용 ?�역</h2>
                            </div>
                            <button
                                onClick={() => setShowVacationHistory(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {usedVacations.slice().reverse().map((vacation, index) => {
                                const originalIndex = usedVacations.length - 1 - index;
                                return (
                                    <div key={index} className="flex items-center justify-between bg-dark-bg rounded-xl p-4 border border-dark-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="text-white font-semibold">
                                                    {format(new Date(vacation.date), 'yyyy??M??d??)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    ?�용?? {format(new Date(vacation.usedAt), 'yyyy-MM-dd HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteVacation(originalIndex)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-dark-border flex items-center justify-between text-sm">
                            <span className="text-gray-400">�??�용 ?�수</span>
                            <span className="text-red-400 font-semibold">{usedVacations.length}??/span>
                        </div>
                    </div>
                )}

                {/* ?�내 ?�항 */}
                <div className="bg-dark-card/50 border border-dark-border rounded-xl p-4">
                    <div className="text-xs text-gray-400 space-y-1">
                        <div>??기본�? 3,000,000??(26공수 만근 기�?)</div>
                        <div>??1공수 부�???100,000??차감</div>
                        <div>??만근 ?�성 ???�차 1??발생</div>
                        <div>???�제 급여???�장 ?�황???�라 ?��? ???�습?�다</div>
                    </div>
                </div>
            </div>

            {/* ?�차 ?�용 모달 */}
            {showVacationModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowVacationModal(false)}>
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-safety-orange" />
                                ?�차 ?�용
                            </h2>
                            <button
                                onClick={() => setShowVacationModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="bg-dark-bg rounded-xl p-4 border border-dark-border mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400 text-sm">?�적 ?�차</span>
                                    <span className="text-green-400 font-bold text-lg">{vacationDays}??/span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400 text-sm">?�용 ?�차</span>
                                    <span className="text-red-400 font-bold text-lg">{usedVacations.length}??/span>
                                </div>
                                <div className="pt-2 border-t border-dark-border flex items-center justify-between">
                                    <span className="text-white font-semibold">?��? ?�차</span>
                                    <span className="text-safety-orange font-bold text-2xl">{remainingVacationDays}??/span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    ?�차 ?�용 ?�짜
                                </label>
                                <input
                                    type="date"
                                    value={vacationDate}
                                    onChange={(e) => setVacationDate(e.target.value)}
                                    className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowVacationModal(false)}
                                className="flex-1 py-3 bg-dark-bg border border-dark-border rounded-xl text-gray-400 font-semibold hover:bg-dark-border transition-all"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleUseVacation}
                                disabled={remainingVacationDays <= 0}
                                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${remainingVacationDays <= 0
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-safety-orange to-orange-600 text-white hover:shadow-lg hover:shadow-safety-orange/30'
                                    }`}
                            >
                                ?�용 ?�정
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryCalculator;

