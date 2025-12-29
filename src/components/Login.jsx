import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = ({ onSuccess, onSignUp }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('아이디와 비밀번호를 입력하세요');
            triggerShake();
            return;
        }

        // 사용자 확인
        const users = JSON.parse(localStorage.getItem('safety-pay-users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            sessionStorage.setItem('authenticated', 'true');
            sessionStorage.setItem('current-user', JSON.stringify(user));
            onSuccess(user);
        } else {
            setError('아이디 또는 비밀번호가 올바르지 않습니다. 다른 기기에서 가입하셨다면 이 기기에서 새로 가입해주세요.');
            triggerShake();
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
                        className="w-full bg-gradient-to-r from-safety-orange to-orange-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-safety-orange/30 transition-all mb-3 flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-5 h-5" />
                        로그인
                    </button>

                    {/* 회원가입 버튼 */}
                    <button
                        type="button"
                        onClick={onSignUp}
                        className="w-full bg-dark-bg border border-dark-border text-gray-400 font-semibold py-3 rounded-xl hover:bg-dark-border transition-all"
                    >
                        계정이 없으신가요? 회원가입
                    </button>
                </form>

                {/* 푸터 정보 */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        건설 현장 안전관리 전용 시스템
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
