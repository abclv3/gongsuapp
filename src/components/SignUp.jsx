import React, { useState, useEffect } from 'react';
import { UserPlus, MapPin, Phone, Calendar, User, Lock, Eye, EyeOff, Loader, Search, Loader2 } from 'lucide-react';
import { signUp } from '../lib/supabase';

// 주요 현장 목록 (GPS 좌표)
const WORK_SITES = [
    { name: '청라스타필드', lat: 37.5397, lng: 126.6430, address: '인천광역시 서구 청라동' },
    { name: '삼성바이오 송도공장', lat: 37.3850, lng: 126.6400, address: '인천광역시 연수구' },
    { name: '롯데케미칼 여수공장', lat: 34.7604, lng: 127.6622, address: '전라남도 여수시' },
    { name: '현대제철 당진공장', lat: 36.8945, lng: 126.6444, address: '충청남도 당진시' },
    { name: '포스코 포항제철소', lat: 36.0190, lng: 129.3435, address: '경상북도 포항시' },
    { name: 'SK하이닉스 이천캠퍼스', lat: 37.2720, lng: 127.4350, address: '경기도 이천시' },
    { name: '삼성전자 평택캠퍼스', lat: 36.9910, lng: 127.1120, address: '경기도 평택시' },
];

const GPS_SEARCH_RADIUS_KM = 10; // GPS 검색 반경 10km

const SignUp = ({ onSuccess, onBackToLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        name: '',
        phone: '',
        hireDate: '',
        workSite: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [nearestSite, setNearestSite] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSites, setFilteredSites] = useState(WORK_SITES);
    const [gpsDistance, setGpsDistance] = useState(null);
    const [isCustomSite, setIsCustomSite] = useState(false);
    const [customSiteName, setCustomSiteName] = useState('');

    // 주소 검색 필터링
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = WORK_SITES.filter(site =>
                site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                site.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredSites(filtered);
        } else {
            setFilteredSites(WORK_SITES);
        }
    }, [searchQuery]);

    // GPS로 가장 가까운 현장 찾기 (10km 이내만)
    const detectNearestSite = () => {
        setIsLoadingLocation(true);
        setNearestSite(null);
        setGpsDistance(null);

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // 가장 가까운 현장 계산 (10km 이내만)
                    let minDistance = Infinity;
                    let nearest = null;

                    WORK_SITES.forEach(site => {
                        const distance = calculateDistance(latitude, longitude, site.lat, site.lng);
                        if (distance < minDistance && distance <= GPS_SEARCH_RADIUS_KM) {
                            minDistance = distance;
                            nearest = site;
                        }
                    });

                    if (nearest) {
                        setNearestSite(nearest);
                        setGpsDistance(minDistance.toFixed(1));
                        setFormData(prev => ({ ...prev, workSite: nearest.name }));
                        setSearchQuery(''); // 검색어 초기화
                        setIsCustomSite(false); // 드롭다운 모드로 전환
                    } else {
                        alert(`반경 ${GPS_SEARCH_RADIUS_KM}km 이내에 등록된 현장이 없습니다.\n현장을 직접 선택하거나 주소로 검색해주세요.`);
                    }

                    setIsLoadingLocation(false);
                },
                (error) => {
                    console.error('GPS 오류:', error);
                    alert('위치 정보를 가져올 수 없습니다. 현장을 직접 선택하거나 주소로 검색해주세요.');
                    setIsLoadingLocation(false);
                }
            );
        } else {
            alert('이 브라우저는 GPS를 지원하지 않습니다.');
            setIsLoadingLocation(false);
        }
    };

    // 두 지점 간 거리 계산 (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // 에러 제거
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) newErrors.username = '아이디를 입력하세요';
        else if (formData.username.length < 4) newErrors.username = '아이디는 4자 이상이어야 합니다';

        if (!formData.email.trim()) newErrors.email = '이메일을 입력하세요';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다';
        }

        if (!formData.password.trim()) newErrors.password = '비밀번호를 입력하세요';
        else if (formData.password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다';

        if (!formData.name.trim()) newErrors.name = '이름을 입력하세요';

        if (!formData.phone.trim()) newErrors.phone = '휴대폰번호를 입력하세요';
        else if (!/^010-?\d{4}-?\d{4}$/.test(formData.phone.replace(/-/g, ''))) {
            newErrors.phone = '올바른 휴대폰번호 형식이 아닙니다';
        }

        if (!formData.hireDate) newErrors.hireDate = '입사년월을 선택하세요';

        // 현장 검증 (커스텀 입력 포함)
        if (isCustomSite) {
            if (!customSiteName.trim()) newErrors.workSite = '현장명을 입력하세요';
        } else {
            if (!formData.workSite) newErrors.workSite = '현장을 선택하세요';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignUp = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        const finalWorkSite = isCustomSite ? customSiteName.trim() : formData.workSite;

        try {
            // 이메일을 username@safety-pay.com 형태로 생성 (아이디 기반 로그인용)
            const authEmail = `${formData.username}@safety-pay.com`;

            // Supabase 회원가입 시도
            const { data, error } = await signUp(authEmail, formData.password, {
                username: formData.username,
                email: formData.email, // 실제 이메일도 저장
                name: formData.name,
                phone: formData.phone,
                hireDate: formData.hireDate,
                workSite: finalWorkSite,
            });


            if (error) {
                // Supabase 회원가입 실패
                console.error('Supabase 회원가입 실패:', error.message);
                setErrors({ username: `회원가입 실패: ${error.message}` });
                setIsSubmitting(false);
                return;
            }

            // Supabase 성공
            const newUser = {
                id: data[0]?.id || Date.now().toString(),
                username: formData.username,
                name: formData.name,
                phone: formData.phone,
                hireDate: formData.hireDate,
                workSite: finalWorkSite,
            };

            alert(`${formData.name}님, 회원가입이 완료되었습니다!\n현장: ${finalWorkSite}\n✓ 클라우드 동기화 완료`);
            onSuccess(newUser);
        } catch (err) {
            console.error('회원가입 에러:', err);
            setErrors({ username: '서버 연결 실패. 다시 시도해주세요.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-safety-orange to-orange-600 mb-6 shadow-lg shadow-safety-orange/30">
                        <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">회원가입</h1>
                    <p className="text-gray-400 text-sm">Safety-Pay 안전감시단 급여 매니저</p>
                </div>

                {/* 회원가입 폼 */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
                    {/* 아이디 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            아이디
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className={`w-full bg-dark-bg border-2 ${errors.username ? 'border-red-500' : 'border-dark-border'} focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all`}
                            placeholder="4자 이상"
                        />
                        {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                    </div>

                    {/* 이메일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            이메일
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`w-full bg-dark-bg border-2 ${errors.email ? 'border-red-500' : 'border-dark-border'} focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all`}
                            placeholder="example@gmail.com"
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* 비밀번호 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            <Lock className="w-4 h-4 inline mr-1" />
                            비밀번호 (토큰)
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={`w-full bg-dark-bg border-2 ${errors.password ? 'border-red-500' : 'border-dark-border'} focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all`}
                                placeholder="6자 이상"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* 이름 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            이름
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full bg-dark-bg border-2 ${errors.name ? 'border-red-500' : 'border-dark-border'} focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all`}
                            placeholder="홍길동"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* 휴대폰번호 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            <Phone className="w-4 h-4 inline mr-1" />
                            휴대폰번호
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`w-full bg-dark-bg border-2 ${errors.phone ? 'border-red-500' : 'border-dark-border'} focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all`}
                            placeholder="010-1234-5678"
                        />
                        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    {/* 입사년월일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            입사년월일
                        </label>
                        <input
                            type="date"
                            value={formData.hireDate}
                            onChange={(e) => handleInputChange('hireDate', e.target.value)}
                            className={`w-full bg-dark-bg border-2 ${errors.hireDate ? 'border-red-500' : 'border-dark-border'} focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all`}
                        />
                        {errors.hireDate && <p className="text-red-400 text-xs mt-1">{errors.hireDate}</p>}
                    </div>

                    {/* 현장 선택 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-400">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                현장 및 위치
                            </label>
                            <button
                                type="button"
                                onClick={detectNearestSite}
                                disabled={isLoadingLocation}
                                className="text-xs bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                                {isLoadingLocation ? (
                                    <>
                                        <Loader className="w-3 h-3 animate-spin" />
                                        탐지중...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-3 h-3" />
                                        GPS 자동탐지
                                    </>
                                )}
                            </button>
                        </div>

                        {/* 주소 검색 (드롭다운 모드일 때만) */}
                        {!isCustomSite && (
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="현장명 또는 주소로 검색..."
                                    className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl pl-10 pr-4 py-2 text-white text-sm outline-none transition-all"
                                />
                            </div>
                        )}

                        {/* 드롭다운 또는 직접 입력 */}
                        {isCustomSite ? (
                            <input
                                type="text"
                                value={customSiteName}
                                onChange={(e) => {
                                    setCustomSiteName(e.target.value);
                                    if (errors.workSite) {
                                        setErrors(prev => ({ ...prev, workSite: '' }));
                                    }
                                }}
                                placeholder="현장명을 입력하세요 (예: 청라 SK뷰)"
                                className={`w-full bg-dark-bg border-2 ${errors.workSite ? 'border-red-500' : 'border-dark-border'} focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all`}
                            />
                        ) : (
                            <select
                                value={formData.workSite}
                                onChange={(e) => handleInputChange('workSite', e.target.value)}
                                className={`w-full bg-dark-bg border-2 ${errors.workSite ? 'border-red-500' : 'border-dark-border'} focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all`}
                            >
                                <option value="">현장을 선택하세요</option>
                                {filteredSites.length > 0 ? (
                                    filteredSites.map(site => (
                                        <option key={site.name} value={site.name}>
                                            {site.name} ({site.address})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>검색 결과가 없습니다</option>
                                )}
                            </select>
                        )}

                        {/* 토글 버튼 */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsCustomSite(!isCustomSite);
                                setErrors(prev => ({ ...prev, workSite: '' }));
                                if (isCustomSite) {
                                    setCustomSiteName('');
                                } else {
                                    setFormData(prev => ({ ...prev, workSite: '' }));
                                    setSearchQuery('');
                                }
                            }}
                            className="mt-2 text-xs text-safety-orange hover:text-orange-400 transition-colors flex items-center gap-1"
                        >
                            {isCustomSite ? '← 목록에서 선택하기' : '✏️ 목록에 없는 현장 직접 입력'}
                        </button>

                        {errors.workSite && <p className="text-red-400 text-xs mt-1">{errors.workSite}</p>}
                        {nearestSite && !isCustomSite && (
                            <p className="text-green-400 text-xs mt-1">
                                📍 GPS로 '{nearestSite.name}' 현장이 감지되었습니다 (약 {gpsDistance}km)
                            </p>
                        )}
                        {searchQuery && filteredSites.length > 0 && !isCustomSite && (
                            <p className="text-blue-400 text-xs mt-1">
                                🔍 {filteredSites.length}개 현장 검색됨
                            </p>
                        )}
                    </div>

                    {/* 버튼 */}
                    <div className="pt-4 space-y-3">
                        <button
                            onClick={handleSignUp}
                            className="w-full bg-gradient-to-r from-safety-orange to-orange-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-safety-orange/30 transition-all"
                        >
                            회원가입 완료
                        </button>
                        <button
                            onClick={onBackToLogin}
                            className="w-full bg-dark-bg border border-dark-border text-gray-400 font-semibold py-3 rounded-xl hover:bg-dark-border transition-all"
                        >
                            이미 계정이 있으신가요? 로그인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
