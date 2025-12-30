import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { signIn, supabase, isSupabaseEnabled } from '../lib/supabase';

const Login = ({ onSuccess, onSignUp }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);

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
            // 1. 먼저 username으로 이메일 조회
            let userEmail = username; // 기본값 (이메일 직접 입력한 경우)
            let userData = null;

            if (supabase && !username.includes('@')) {
                // 아이디로 입력한 경우 - DB에서 이메일 조회
                const { data: userRecord, error: lookupError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', username)
                    .single();

                if (lookupError || !userRecord) {
                    setError('존재하지 않는 아이디입니다.');
                    triggerShake();
                    setLoading(false);
                    return;
                }

                // 이메일은 username@safety-pay.com 형태로 저장됨
                userEmail = `${username}@safety-pay.com`;
                userData = userRecord;
            }

            // 2. Supabase 인증
            const { data, error: authError } = await signIn(userEmail, password);

            if (authError) {
                setError('아이디 또는 비밀번호가 올바르지 않습니다.');
                triggerShake();
                setLoading(false);
                return;
            }

            // 3. 사용자 정보가 없으면 다시 조회
            if (!userData && supabase) {
                const { data: userDataResult, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('auth_id', data.user.id)
                    .single();
                if (!userError) {
                    userData = userDataResult;
                }
            }

            if (!userData) {
                // 사용자 정보가 없으면 기본 정보로 생성
                const user = {
                    id: data.user.id,
                    username: email.split('@')[0], // 이메일 앞부분을 username으로
                    name: email.split('@')[0],
                    workSite: '현장 미설정',
                    email: data.user.email,
                };
                sessionStorage.setItem('authenticated', 'true');
                sessionStorage.setItem('current-user', JSON.stringify(user));
                onSuccess(user);
            } else {
                // 사용자 정보가 있으면 사용
                const user = {
                    id: userData.id,
                    username: userData.username,
                    name: userData.name,
                    workSite: userData.work_site,
                    phone: userData.phone,
                    hireDate: userData.hire_date,
                    authId: userData.auth_id,
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

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
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
