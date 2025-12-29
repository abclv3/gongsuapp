import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Calculator,
    Wallet,
    TrendingDown,
    AlertCircle,
    Award,
    DollarSign,
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

// Ï£ºÏöî ?ÑÏû• Î™©Î°ù (GPS Ï¢åÌëú)
const WORK_SITES = [
    { name: 'Ï≤?ùº?§Ì??ÑÎìú', lat: 37.5397, lng: 126.6430, address: '?∏Ï≤úÍ¥ëÏó≠???úÍµ¨ Ï≤?ùº?? },
    { name: '?ºÏÑ±Î∞îÏù¥???°ÎèÑÍ≥µÏû•', lat: 37.3850, lng: 126.6400, address: '?∏Ï≤úÍ¥ëÏó≠???∞ÏàòÍµ? },
    { name: 'Î°?ç∞ÏºÄÎØ∏Ïª¨ ?¨ÏàòÍ≥µÏû•', lat: 34.7604, lng: 127.6622, address: '?ÑÎùº?®ÎèÑ ?¨Ïàò?? },
    { name: '?ÑÎ??úÏ≤† ?πÏßÑÍ≥µÏû•', lat: 36.8945, lng: 126.6444, address: 'Ï∂©Ï≤≠?®ÎèÑ ?πÏßÑ?? },
    { name: '?¨Ïä§ÏΩ??¨Ìï≠?úÏ≤†??, lat: 36.0190, lng: 129.3435, address: 'Í≤ΩÏÉÅÎ∂ÅÎèÑ ?¨Ìï≠?? },
    { name: 'SK?òÏù¥?âÏä§ ?¥Ï≤úÏ∫†Ìçº??, lat: 37.2720, lng: 127.4350, address: 'Í≤ΩÍ∏∞???¥Ï≤ú?? },
    { name: '?ºÏÑ±?ÑÏûê ?âÌÉùÏ∫†Ìçº??, lat: 36.9910, lng: 127.1120, address: 'Í≤ΩÍ∏∞???âÌÉù?? },
];

const SalaryCalculator = ({ user, onLogout }) => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(startOfMonth(today)); // ?§Îäò ?†Ïßú????
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

    // Ï∂úÍ∑º Í∏∞Î°ù Í¥Ä??state
    const [attendanceRecords, setAttendanceRecords] = useState({}); // { '2025-01': { '2025-01-15': true, ... } }
    const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);

    // ?îÏ∞® ?∞Ïù¥??Î°úÎìú (localStorage)
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

        // Ï∂úÍ∑º Í∏∞Î°ù Î°úÎìú
        const savedAttendance = localStorage.getItem('safety-pay-attendance');
        if (savedAttendance) {
            setAttendanceRecords(JSON.parse(savedAttendance));
        }
    }, []);

    // ÎßåÍ∑º ?¨ÏÑ± ???îÏ∞® ?Ä??
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

    // ?ÅÏàò
    const BASE_SALARY = 3000000; // Í∏∞Î≥∏Í∏?
    const BASE_WORK_DAYS = 26; // Í∏∞Ï? ÎßåÍ∑º Í≥µÏàò
    const PER_DAY_AMOUNT = 100000; // 1Í≥µÏàò??Í∏àÏï°

    // ?îÏ∞® Í≥ÑÏÇ∞
    const remainingVacationDays = vacationDays - usedVacations.length;

    // ?îÏ∞® ?¨Ïö© Ï≤òÎ¶¨
    const handleUseVacation = () => {
        if (remainingVacationDays <= 0) {
            alert('?¨Ïö© Í∞Ä?•Ìïú ?îÏ∞®Í∞Ä ?ÜÏäµ?àÎã§.');
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
        alert(`${format(new Date(vacationDate), 'yyyy??M??d??)} ?îÏ∞®Í∞Ä ?¨Ïö© Ï≤òÎ¶¨?òÏóà?µÎãà??`);
    };

    // ?îÏ∞® ?¨Ïö© ?¥Ïó≠ ??†ú
    const handleDeleteVacation = (index) => {
        if (confirm('???îÏ∞® ?¨Ïö© ?¥Ïó≠????†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) {
            const updatedUsedVacations = usedVacations.filter((_, i) => i !== index);
            setUsedVacations(updatedUsedVacations);
            localStorage.setItem('safety-pay-used-vacations', JSON.stringify(updatedUsedVacations));
        }
    };

    // ?ÖÏÇ¨?ºÏûê Î≥ÄÍ≤?Ï≤òÎ¶¨
    const handleHireDateChange = (date) => {
        setHireDate(date);
        localStorage.setItem('safety-pay-hire-date', date);
    };

    // ?ÑÏû• Î≥ÄÍ≤?Ï≤òÎ¶¨
    const handleWorksiteChange = () => {
        if (!editedWorksite.trim()) {
            alert('?ÑÏû•Î™ÖÏùÑ ?ÖÎ†•?òÏÑ∏??');
            return;
        }

        // ?¨Ïö©???ïÎ≥¥ ?ÖÎç∞?¥Ìä∏
        const users = JSON.parse(localStorage.getItem('safety-pay-users') || '[]');
        const updatedUsers = users.map(u =>
            u.id === user.id ? { ...u, workSite: editedWorksite.trim() } : u
        );
        localStorage.setItem('safety-pay-users', JSON.stringify(updatedUsers));

        // ?ÑÏû¨ ?¨Ïö©???∏ÏÖò ?ÖÎç∞?¥Ìä∏
        const updatedUser = { ...user, workSite: editedWorksite.trim() };
        sessionStorage.setItem('current-user', JSON.stringify(updatedUser));

        setIsEditingWorksite(false);
        alert('?ÑÏû• ?ïÎ≥¥Í∞Ä ?ÖÎç∞?¥Ìä∏?òÏóà?µÎãà??');
        // ?òÏù¥ÏßÄ ?àÎ°úÍ≥†Ïπ®?òÏó¨ ?§Îçî?êÎèÑ Î∞òÏòÅ
        window.location.reload();
    };

    // ?ÑÏû• Í≤Ä??Ï≤òÎ¶¨
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

    // ?ÑÏû• ?†ÌÉù Ï≤òÎ¶¨
    const handleWorksiteSelect = (siteName) => {
        setEditedWorksite(siteName);
        setShowWorksiteSuggestions(false);
    };

    // Í∑ºÏÜç ?ÑÏàò Í≥ÑÏÇ∞
    const calculateTenure = () => {
        if (!hireDate) return null;

        const hire = new Date(hireDate);
        const years = differenceInYears(today, hire);
        const totalMonths = differenceInMonths(today, hire);
        const months = totalMonths % 12;

        return { years, months, totalMonths };
    };

    const tenure = calculateTenure();

    // Ï∂úÍ∑º Í∏∞Î°ù ?†Í? ?®Ïàò
    const handleToggleAttendance = (monthKey, dateStr) => {
        const newRecords = { ...attendanceRecords };
        if (!newRecords[monthKey]) {
            newRecords[monthKey] = {};
        }
        newRecords[monthKey][dateStr] = !newRecords[monthKey][dateStr];

        setAttendanceRecords(newRecords);
        localStorage.setItem('safety-pay-attendance', JSON.stringify(newRecords));

        // Ï∂úÍ∑º?????êÎèô Í≥ÑÏÇ∞ Î∞??ÖÎç∞?¥Ìä∏
        const workedDays = Object.values(newRecords[monthKey] || {}).filter(v => v).length;
        setMyWorkDays(workedDays.toString());
    };

    // ?†Ïßú Í≥ÑÏÇ∞
    const calcPeriodStart = subDays(startOfMonth(selectedMonth), 5); // ?ÑÏõî 25??(26??
    const calcPeriodStartDisplay = format(subDays(calcPeriodStart, 1), 'M/d'); // ?ÑÏõî 25??
    const calcPeriodEnd = format(addDays(startOfMonth(selectedMonth), 25), 'M/d'); // ?πÏõî 26??
    const paymentDate = format(addMonths(startOfMonth(selectedMonth), 1).setDate(10), 'M/d'); // ?µÏõî 10??

    // Í∏âÏó¨ Í≥ÑÏÇ∞
    const workDays = parseInt(myWorkDays) || 0;
    const dayDifference = BASE_WORK_DAYS - workDays;
    const isShortage = dayDifference > 0;
    const isOvertime = workDays > BASE_WORK_DAYS;

    // ?êÏã§/Ï∂îÍ? Í∏àÏï°
    const lossAmount = isShortage ? dayDifference * PER_DAY_AMOUNT : 0;
    const bonusAmount = isOvertime ? (workDays - BASE_WORK_DAYS) * PER_DAY_AMOUNT : 0;

    // ?∏Ï†Ñ Í∏âÏó¨
    const grossSalary = BASE_SALARY - lossAmount + bonusAmount;

    // Í≥µÏ†ú??Í≥ÑÏÇ∞
    const deductionRate = deductionType === 'tax' ? 0.033 : 0.094;
    const deductionAmount = Math.floor(grossSalary * deductionRate);

    // ?§Ïàò?πÏï°
    const netSalary = grossSalary - deductionAmount;

    // ÎßåÍ∑º ?¨Î?
    const isPerfectAttendance = workDays >= BASE_WORK_DAYS;

    return (
        <div className="min-h-screen bg-dark-bg p-4 pb-8">
            {/* ?§Îçî */}
            <div className="max-w-2xl mx-auto mb-6 pt-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Wallet className="w-7 h-7 text-safety-orange" />
                        Safety-Pay
                    </h1>
                    <div className="flex items-center gap-3">
                        {/* ?îÏ∞® Î∞∞Ï? (?¥Î¶≠ Í∞Ä?? */}
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
                            <span className="text-safety-orange text-sm font-semibold">?îÏ∞®?¨Ïö©</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Î°úÍ∑∏?ÑÏõÉ
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-400 text-sm">?àÏ†ÑÍ∞êÏãú??Í∏âÏó¨ Îß§Îãà?Ä</p>
                    <div className="text-right">
                        <p className="text-white text-sm font-semibold">{user?.name}??/p>
                        <p className="text-gray-500 text-xs">{user?.workSite}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {/* Í∏âÏó¨ Í∑Ä?çÏõî ?†ÌÉù */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-safety-orange" />
                        <h2 className="text-lg font-semibold text-white">Í∏âÏó¨ Í∑Ä?çÏõî</h2>
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

                            {/* ?????†ÌÉù ?úÎ°≠?§Ïö¥ */}
                            {showMonthPicker && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-xl p-4 shadow-2xl z-10">
                                    <div className="mb-3">
                                        <label className="text-xs text-gray-400 mb-1 block">?ÑÎèÑ</label>
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

                    {/* ?†Ïßú ?ïÎ≥¥ Í∞ïÏ°∞ */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="bg-dark-bg/50 rounded-xl p-4 border border-dark-border">
                            <div className="text-xs text-gray-400 mb-1">?∞Ï†ï Í∏∞Í∞Ñ</div>
                            <div className="text-lg font-semibold text-white">
                                {calcPeriodStartDisplay} ~ {calcPeriodEnd}
                            </div>
                        </div>
                        <div className="bg-dark-bg/50 rounded-xl p-4 border border-safety-orange/30">
                            <div className="text-xs text-gray-400 mb-1">Í∏âÏó¨ ÏßÄÍ∏âÏùº</div>
                            <div className="text-lg font-semibold text-safety-orange">
                                {paymentDate}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Í≥µÏàò ?ÖÎ†• */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-safety-orange" />
                        <h2 className="text-lg font-semibold text-white">??Í≥µÏàò (?ºÏàò)</h2>
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
                        <span className="text-gray-400">Í∏∞Ï? ÎßåÍ∑º Í≥µÏàò</span>
                        <span className="text-white font-semibold">{BASE_WORK_DAYS}??/span>
                    </div>
                </div>

                {/* Í∑ºÎ¨¥ ?ïÎ≥¥ (?ÖÏÇ¨?ºÏûê & ?ÑÏû•) */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-5 h-5 text-safety-orange" />
                        <h2 className="text-lg font-semibold text-white">Í∑ºÎ¨¥ ?ïÎ≥¥</h2>
                    </div>

                    {/* ?ÑÏû• ?ïÎ≥¥ */}
                    <div className="mb-4 bg-gradient-to-br from-safety-orange/10 to-orange-600/10 border border-safety-orange/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-safety-orange" />
                                <span className="text-gray-400 text-sm">?ÑÏû¨ ?ÑÏû•</span>
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
                                    ?òÏ†ï
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
                                    placeholder="?ÑÏû•Î™ÖÏùÑ ?ÖÎ†•?òÏÑ∏??(?? Ï≤?ùº)"
                                    className="w-full bg-dark-bg border-2 border-safety-orange rounded-xl px-4 py-2 text-white text-lg font-semibold outline-none mb-2"
                                    autoFocus
                                />

                                {/* Í≤Ä??Í≤∞Í≥º ?úÎ°≠?§Ïö¥ */}
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
                                        ?Ä??
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingWorksite(false);
                                            setEditedWorksite(user?.workSite || '');
                                        }}
                                        className="flex-1 bg-dark-bg border border-dark-border text-gray-400 font-semibold py-2 rounded-lg hover:bg-dark-border transition-all"
                                    >
                                        Ï∑®ÏÜå
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-safety-orange font-bold text-lg">
                                {user?.workSite || 'ÎØ∏Îì±Î°?}
                            </div>
                        )}
                    </div>

                    {/* ?ÖÏÇ¨?ºÏûê */}
                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">?ÖÏÇ¨?ºÏûê</label>
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
                                <span className="text-blue-400 font-medium">Í∑ºÏÜç Í∏∞Í∞Ñ</span>
                                <div className="flex items-center gap-2">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-400">{tenure.years}</div>
                                        <div className="text-xs text-blue-400/70">??/div>
                                    </div>
                                    <div className="text-blue-400/50 text-2xl">+</div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-400">{tenure.months}</div>
                                        <div className="text-xs text-purple-400/70">Í∞úÏõî</div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 text-center pt-3 border-t border-blue-500/20">
                                Ï¥?{tenure.totalMonths}Í∞úÏõî Í∑ºÎ¨¥ Ï§?
                            </div>
                        </div>
                    )}
                </div>

                {/* Í≥µÏ†ú ?†ÌÉù */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="w-5 h-5 text-safety-orange" />
                        <h2 className="text-lg font-semibold text-white">Í≥µÏ†ú ?†Ìòï</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setDeductionType('tax')}
                            className={`p-4 rounded-xl border-2 transition-all ${deductionType === 'tax'
                                ? 'border-safety-orange bg-safety-orange/10'
                                : 'border-dark-border bg-dark-bg hover:border-gray-600'
                                }`}
                        >
                            <div className="text-sm text-gray-400 mb-1">?¨ÏóÖ?åÎìù??/div>
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
                            <div className="text-sm text-gray-400 mb-1">4?ÄÎ≥¥Ìóò</div>
                            <div className={`text-xl font-bold ${deductionType === 'insurance' ? 'text-safety-orange' : 'text-white'}`}>
                                9.4%
                            </div>
                        </button>
                    </div>
                </div>

                {/* Í≤∞Í≥º Ïπ¥Îìú */}
                <div className="bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6 shadow-xl">
                    {/* ÎßåÍ∑º Î∞∞Ï? */}
                    {isPerfectAttendance && (
                        <div className="mb-4">
                            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-safety-orange to-orange-600 rounded-xl py-3 px-4 animate-pulse-slow">
                                <Award className="w-5 h-5 text-white" />
                                <span className="text-white font-bold">?éâ ÎßåÍ∑º ?¨ÏÑ±! ?îÏ∞® Î∞úÏÉù</span>
                            </div>
                            <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-green-400" />
                                        <span className="text-green-400 font-medium">?ÑÏ†Å ?îÏ∞®</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-4xl font-bold text-green-400">{vacationDays}</span>
                                        <span className="text-green-400 text-lg">??/span>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-green-400/70">
                                    ÎßåÍ∑º???¨Ïùò Í∞úÏàòÎßåÌÅº ?îÏ∞®Í∞Ä ?ÑÏ†Å?©Îãà??
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ?êÏã§Í∏àÏï° Í∞ïÏ°∞ */}
                    {isShortage && lossAmount > 0 && (
                        <div className="mb-4 bg-red-500/10 border-2 border-red-500 rounded-xl p-4 animate-pulse-slow">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                <span className="text-red-500 font-semibold text-sm">?ÑÍπå???êÏã§Í∏àÏï°</span>
                            </div>
                            <div className="text-3xl font-bold text-red-500 flex items-center gap-2">
                                ?í∏ -{lossAmount.toLocaleString()}??
                            </div>
                            <div className="text-xs text-red-400 mt-2">
                                {dayDifference}??Î∂ÄÏ°?= {dayDifference} √ó 100,000??
                            </div>
                        </div>
                    )}

                    {/* Ï∂îÍ? Í∏âÏó¨ (Ï¥àÍ≥º Í∑ºÎ¨¥) */}
                    {isOvertime && bonusAmount > 0 && (
                        <div className="mb-4 bg-green-500/10 border-2 border-green-500 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-5 h-5 text-green-500" />
                                <span className="text-green-500 font-semibold text-sm">Ï∂îÍ? Í∏âÏó¨</span>
                            </div>
                            <div className="text-3xl font-bold text-green-500 flex items-center gap-2">
                                +{bonusAmount.toLocaleString()}??
                            </div>
                            <div className="text-xs text-green-400 mt-2">
                                {workDays - BASE_WORK_DAYS}??Ï∂îÍ? Í∑ºÎ¨¥
                            </div>
                        </div>
                    )}

                    {/* Í∏âÏó¨ ?ÅÏÑ∏ */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-dark-border">
                            <span className="text-gray-400">Í∏∞Î≥∏Í∏?(ÎßåÍ∑º Í∏∞Ï?)</span>
                            <span className="text-white font-semibold">{BASE_SALARY.toLocaleString()}??/span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-dark-border">
                            <span className="text-gray-400">?∏Ï†Ñ Í∏âÏó¨</span>
                            <span className="text-white font-bold text-xl">{grossSalary.toLocaleString()}??/span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-dark-border">
                            <span className="text-gray-400">
                                Í≥µÏ†ú??({deductionType === 'tax' ? '3.3%' : '9.4%'})
                            </span>
                            <span className="text-red-400">-{deductionAmount.toLocaleString()}??/span>
                        </div>

                        {/* ?§Ïàò?πÏï° (ÏµúÏ¢Ö) */}
                        <div className="mt-6 bg-gradient-to-r from-safety-orange to-orange-600 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-6 h-6 text-white" />
                                <span className="text-white/90 text-sm font-medium">ÏµúÏ¢Ö ?§Ïàò?πÏï°</span>
                            </div>
                            <div className="text-4xl font-bold text-white">
                                {netSalary.toLocaleString()}??
                            </div>
                        </div>
                    </div>

                    {/* Í≤ΩÍ≥† Î©îÏãúÏßÄ */}
                    {isShortage && (
                        <div className="mt-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-200">
                                <strong className="text-amber-400">Ï∂úÍ∑º Í¥ÄÎ¶??ÑÏöî:</strong> ÎßåÍ∑º ???îÏ∞®Í∞Ä Î∞úÏÉù?©Îãà??
                                ?ÑÏû¨ {dayDifference}??Î∂ÄÏ°±Ìïò??<strong className="text-amber-400">{lossAmount.toLocaleString()}??/strong>???êÏã§??Î∞úÏÉù?àÏäµ?àÎã§.
                            </div>
                        </div>
                    )}
                </div>

                {/* ?îÏ∞® ?¨Ïö© ?¥Ïó≠ */}
                {showVacationHistory && usedVacations.length > 0 && (
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-400" />
                                <h2 className="text-lg font-semibold text-white">?îÏ∞® ?¨Ïö© ?¥Ïó≠</h2>
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
                                                    ?¨Ïö©?? {format(new Date(vacation.usedAt), 'yyyy-MM-dd HH:mm')}
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
                            <span className="text-gray-400">Ï¥??¨Ïö© ?ºÏàò</span>
                            <span className="text-red-400 font-semibold">{usedVacations.length}??/span>
                        </div>
                    </div>
                )}

                {/* ?àÎÇ¥ ?¨Ìï≠ */}
                <div className="bg-dark-card/50 border border-dark-border rounded-xl p-4">
                    <div className="text-xs text-gray-400 space-y-1">
                        <div>??Í∏∞Î≥∏Í∏? 3,000,000??(26Í≥µÏàò ÎßåÍ∑º Í∏∞Ï?)</div>
                        <div>??1Í≥µÏàò Î∂ÄÏ°???100,000??Ï∞®Í∞ê</div>
                        <div>??ÎßåÍ∑º ?¨ÏÑ± ???îÏ∞® 1??Î∞úÏÉù</div>
                        <div>???§Ï†ú Í∏âÏó¨???ÑÏû• ?ÅÌô©???∞Îùº ?§Î? ???àÏäµ?àÎã§</div>
                    </div>
                </div>
            </div>

            {/* ?îÏ∞® ?¨Ïö© Î™®Îã¨ */}
            {showVacationModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowVacationModal(false)}>
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-safety-orange" />
                                ?îÏ∞® ?¨Ïö©
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
                                    <span className="text-gray-400 text-sm">?ÑÏ†Å ?îÏ∞®</span>
                                    <span className="text-green-400 font-bold text-lg">{vacationDays}??/span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400 text-sm">?¨Ïö© ?îÏ∞®</span>
                                    <span className="text-red-400 font-bold text-lg">{usedVacations.length}??/span>
                                </div>
                                <div className="pt-2 border-t border-dark-border flex items-center justify-between">
                                    <span className="text-white font-semibold">?®Ï? ?îÏ∞®</span>
                                    <span className="text-safety-orange font-bold text-2xl">{remainingVacationDays}??/span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    ?îÏ∞® ?¨Ïö© ?†Ïßú
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
                                Ï∑®ÏÜå
                            </button>
                            <button
                                onClick={handleUseVacation}
                                disabled={remainingVacationDays <= 0}
                                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${remainingVacationDays <= 0
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-safety-orange to-orange-600 text-white hover:shadow-lg hover:shadow-safety-orange/30'
                                    }`}
                            >
                                ?¨Ïö© ?ïÏ†ï
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryCalculator;

