import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, Loader2, Mail, Phone, X, Search, KeyRound } from 'lucide-react';
import { signIn, supabase } from '../lib/supabase';

const Login = ({ onSuccess, onSignUp }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);

    // 아이디 찾기 상태
    const [showFindId, setShowFindId] = useState(false);
    const [findIdMethod, setFindIdMethod] = useState('email'); // 'email' or 'phone'
    const [findIdInput, setFindIdInput] = useState('');
    const [foundUsername, setFoundUsername] = useState('');
    const [findIdLoading, setFindIdLoading] = useState(false);
    const [findIdError, setFindIdError] = useState('');

    // 비밀번호 찾기 상태
    const [showFindPw, setShowFindPw] = useState(false);
    const [findPwEmail, setFindPwEmail] = useState('');
    const [findPwLoading, setFindPwLoading] = useState(false);
    const [findPwMessage, setFindPwMessage] = useState('');
    const [findPwError, setFindPwError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('아이디와 비밀번호를 입력하세요');
            triggerShake();
            return;
        }

        setLoading(true);

        try {
            let userEmail = username;
            let userData = null;

            // 아이디로 입력한 경우 - RPC 함수로 이메일 조회
            if (supabase && !username.includes('@')) {
                const { data: emailData, error: rpcError } = await supabase
                    .rpc('get_email_by_username', { input_username: username });

                if (rpcError || !emailData) {
                    setError('존재하지 않는 아이디입니다.');
                    triggerShake();
                    setLoading(false);
                    return;
                }
                userEmail = emailData;
            }

            // Supabase 인증
            const { data, error: authError } = await signIn(userEmail, password);

            if (authError) {
                console.error('로그인 오류:', authError);
                setError('아이디 또는 비밀번호가 올바르지 않습니다.');
                triggerShake();
                setLoading(false);
                return;
            }

            // 로그인 성공 - 사용자 정보 조회
            if (supabase && data?.user) {
                const { data: userDataResult, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('auth_id', data.user.id)
                    .single();

                if (!userError && userDataResult) {
                    userData = userDataResult;
                }
            }

            if (userData) {
                const user = {
                    id: userData.id,
                    username: userData.username,
                    name: userData.name,
                    workSite: userData.work_site,
                    phone: userData.phone,
                    hireDate: userData.hire_date,
                    authId: userData.auth_id,
                    email: userData.email,
                };
                sessionStorage.setItem('authenticated', 'true');
                sessionStorage.setItem('current-user', JSON.stringify(user));
                onSuccess(user);
            } else {
                // 사용자 정보가 없으면 기본 정보로 생성
                const user = {
                    id: data.user.id,
                    username: username,
                    name: username,
                    workSite: '현장 미설정',
                    email: userEmail,
                    authId: data.user.id,
                };
                sessionStorage.setItem('authenticated', 'true');
                sessionStorage.setItem('current-user', JSON.stringify(user));
                onSuccess(user);
            }
        } catch (err) {
            console.error('로그인 에러:', err);
            setError('서버 연결 실패. 네트워크를 확인해주세요.');
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    // 아이디 찾기
    const handleFindId = async () => {
        if (!findIdInput.trim()) {
            setFindIdError(findIdMethod === 'email' ? '이메일을 입력하세요.' : '휴대폰 번호를 입력하세요.');
            return;
        }

        setFindIdLoading(true);
        setFindIdError('');
        setFoundUsername('');

        try {
            const rpcName = findIdMethod === 'email' ? 'find_username_by_email' : 'find_username_by_phone';
            const paramName = findIdMethod === 'email' ? 'input_email' : 'input_phone';

            const { data, error } = await supabase.rpc(rpcName, { [paramName]: findIdInput });

            if (error) {
                setFindIdError('조회 중 오류가 발생했습니다.');
                return;
            }

            if (data) {
                setFoundUsername(data);
            } else {
                setFindIdError(findIdMethod === 'email'
                    ? '해당 이메일로 가입된 계정이 없습니다.'
                    : '해당 휴대폰 번호로 가입된 계정이 없습니다.');
            }
        } catch (err) {
            setFindIdError('서버 연결 실패');
        } finally {
            setFindIdLoading(false);
        }
    };

    // 비밀번호 찾기 (재설정 링크 발송)
    const handleFindPw = async () => {
        if (!findPwEmail.trim()) {
            setFindPwError('이메일을 입력하세요.');
            return;
        }

        setFindPwLoading(true);
        setFindPwError('');
        setFindPwMessage('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(findPwEmail, {
                redirectTo: window.location.origin,
            });

            if (error) {
                setFindPwError('이메일 발송에 실패했습니다. 이메일 주소를 확인하세요.');
                return;
            }

            setFindPwMessage('비밀번호 재설정 링크가 이메일로 발송되었습니다. 메일함을 확인하세요.');
        } catch (err) {
            setFindPwError('서버 연결 실패');
        } finally {
            setFindPwLoading(false);
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    // 모달 닫기 시 상태 초기화
    const closeFindIdModal = () => {
        setShowFindId(false);
        setFindIdInput('');
        setFoundUsername('');
        setFindIdError('');
    };

    const closeFindPwModal = () => {
        setShowFindPw(false);
        setFindPwEmail('');
        setFindPwMessage('');
        setFindPwError('');
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* 헤더 */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-safety-orange to-orange-600 mb-6 shadow-lg shadow-safety-orange/30 animate-pulse-slow">
                        <Lock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Safety-Pay</h1>
                    <p className="text-gray-400 text-sm">안전감시단 급여 매니저</p>
                </div>

                {/* 로그인 폼 */}
                <form onSubmit={handleLogin} className={`bg-dark-card border border-dark-border rounded-2xl p-6 transition-all duration-200 ${shake ? 'animate-shake' : ''}`}>
                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-center">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* 아이디 입력 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            아이디
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setError('');
                            }}
                            className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all"
                            placeholder="아이디를 입력하세요"
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    {/* 비밀번호 입력 */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            <Lock className="w-4 h-4 inline mr-1" />
                            비밀번호
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all pr-12"
                                placeholder="비밀번호를 입력하세요"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* 아이디/비밀번호 찾기 링크 */}
                    <div className="flex justify-center gap-4 mb-4 text-sm">
                        <button
                            type="button"
                            onClick={() => setShowFindId(true)}
                            className="text-gray-400 hover:text-safety-orange transition-colors"
                        >
                            아이디 찾기
                        </button>
                        <span className="text-gray-600">|</span>
                        <button
                            type="button"
                            onClick={() => setShowFindPw(true)}
                            className="text-gray-400 hover:text-safety-orange transition-colors"
                        >
                            비밀번호 찾기
                        </button>
                    </div>

                    {/* 로그인 버튼 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-safety-orange to-orange-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-safety-orange/30 transition-all mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                로그인 중...
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                로그인
                            </>
                        )}
                    </button>

                    {/* 회원가입 버튼 */}
                    <button
                        type="button"
                        onClick={onSignUp}
                        disabled={loading}
                        className="w-full bg-dark-bg border border-dark-border text-gray-400 font-semibold py-3 rounded-xl hover:bg-dark-border transition-all disabled:opacity-50"
                    >
                        계정이 없으신가요? 회원가입
                    </button>
                </form>

                {/* 푸터 정보 */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        건설 현장 안전관리 전용 시스템
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                        ✓ 클라우드 동기화 지원
                    </p>
                </div>
            </div>

            {/* 아이디 찾기 모달 */}
            {showFindId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Search className="w-5 h-5 text-safety-orange" />
                                아이디 찾기
                            </h2>
                            <button onClick={closeFindIdModal} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* 검색 방법 선택 */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => { setFindIdMethod('email'); setFindIdInput(''); setFoundUsername(''); setFindIdError(''); }}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${findIdMethod === 'email' ? 'bg-safety-orange text-white' : 'bg-dark-bg text-gray-400 border border-dark-border'}`}
                            >
                                <Mail className="w-4 h-4 inline mr-1" />
                                이메일
                            </button>
                            <button
                                onClick={() => { setFindIdMethod('phone'); setFindIdInput(''); setFoundUsername(''); setFindIdError(''); }}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${findIdMethod === 'phone' ? 'bg-safety-orange text-white' : 'bg-dark-bg text-gray-400 border border-dark-border'}`}
                            >
                                <Phone className="w-4 h-4 inline mr-1" />
                                휴대폰
                            </button>
                        </div>

                        {/* 입력 필드 */}
                        <input
                            type={findIdMethod === 'email' ? 'email' : 'tel'}
                            value={findIdInput}
                            onChange={(e) => setFindIdInput(e.target.value)}
                            placeholder={findIdMethod === 'email' ? '가입 시 등록한 이메일' : '가입 시 등록한 휴대폰 번호'}
                            className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all mb-4"
                        />

                        {/* 에러 메시지 */}
                        {findIdError && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-center">
                                <p className="text-red-400 text-sm">{findIdError}</p>
                            </div>
                        )}

                        {/* 결과 표시 */}
                        {foundUsername && (
                            <div className="mb-4 bg-green-500/10 border border-green-500/50 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-sm mb-1">찾으시는 아이디는</p>
                                <p className="text-green-400 text-2xl font-bold">{foundUsername}</p>
                            </div>
                        )}

                        {/* 찾기 버튼 */}
                        <button
                            onClick={handleFindId}
                            disabled={findIdLoading}
                            className="w-full bg-safety-orange text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {findIdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {findIdLoading ? '조회 중...' : '아이디 찾기'}
                        </button>
                    </div>
                </div>
            )}

            {/* 비밀번호 찾기 모달 */}
            {showFindPw && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-safety-orange" />
                                비밀번호 찾기
                            </h2>
                            <button onClick={closeFindPwModal} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <p className="text-gray-400 text-sm mb-4">
                            가입 시 등록한 이메일로 비밀번호 재설정 링크가 발송됩니다.
                        </p>

                        {/* 이메일 입력 */}
                        <input
                            type="email"
                            value={findPwEmail}
                            onChange={(e) => setFindPwEmail(e.target.value)}
                            placeholder="가입 시 등록한 이메일"
                            className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all mb-4"
                        />

                        {/* 에러 메시지 */}
                        {findPwError && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-center">
                                <p className="text-red-400 text-sm">{findPwError}</p>
                            </div>
                        )}

                        {/* 성공 메시지 */}
                        {findPwMessage && (
                            <div className="mb-4 bg-green-500/10 border border-green-500/50 rounded-xl p-3 text-center">
                                <p className="text-green-400 text-sm">{findPwMessage}</p>
                            </div>
                        )}

                        {/* 발송 버튼 */}
                        <button
                            onClick={handleFindPw}
                            disabled={findPwLoading}
                            className="w-full bg-safety-orange text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {findPwLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                            {findPwLoading ? '발송 중...' : '재설정 링크 발송'}
                        </button>
                    </div>
                </div>
            )}

            {/* Shake Animation */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Login;
