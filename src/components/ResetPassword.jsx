import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ResetPassword = ({ onComplete }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 유효성 검사
        if (!newPassword.trim()) {
            setError('새 비밀번호를 입력하세요.');
            return;
        }

        if (newPassword.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setError('비밀번호 변경에 실패했습니다: ' + updateError.message);
                return;
            }

            setSuccess(true);

            // 3초 후 로그인 페이지로 이동
            setTimeout(() => {
                onComplete();
            }, 3000);
        } catch (err) {
            setError('서버 연결 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-safety-orange to-orange-600 mb-6 shadow-lg shadow-safety-orange/30">
                        <KeyRound className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">비밀번호 재설정</h1>
                    <p className="text-gray-400 text-sm">새로운 비밀번호를 설정하세요</p>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                                <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">비밀번호 변경 완료!</h2>
                            <p className="text-gray-400 text-sm mb-4">
                                새 비밀번호로 로그인하세요.
                            </p>
                            <p className="text-safety-orange text-sm">
                                3초 후 로그인 페이지로 이동합니다...
                            </p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-center">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {/* 새 비밀번호 */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    새 비밀번호
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all pr-12"
                                        placeholder="6자 이상 입력"
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

                            {/* 비밀번호 확인 */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    비밀번호 확인
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-dark-bg border-2 border-dark-border focus:border-safety-orange rounded-xl px-4 py-3 text-white outline-none transition-all"
                                    placeholder="비밀번호 재입력"
                                    disabled={loading}
                                />
                            </div>

                            {/* 변경 버튼 */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-safety-orange to-orange-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-safety-orange/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        변경 중...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        비밀번호 변경
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
