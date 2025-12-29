import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const PIN_CODE = '0000'; // 기본 PIN 코드

const PinLogin = ({ onSuccess }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    const handleNumberClick = (num) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 4) {
                // 4자리 입력 완료 시 자동 확인
                setTimeout(() => {
                    if (newPin === PIN_CODE) {
                        sessionStorage.setItem('authenticated', 'true');
                        onSuccess();
                    } else {
                        setError(true);
                        setShake(true);
                        setTimeout(() => {
                            setPin('');
                            setError(false);
                            setShake(false);
                        }, 500);
                    }
                }, 100);
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const handleClear = () => {
        setPin('');
        setError(false);
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* 헤더 */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-safety-orange to-orange-600 mb-6 shadow-lg shadow-safety-orange/30">
                        <Lock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Safety-Pay</h1>
                    <p className="text-gray-400 text-sm">안전감시단 급여 매니저</p>
                </div>

                {/* PIN 입력 표시 */}
                <div className={`mb-8 transition-all duration-200 ${shake ? 'animate-shake' : ''}`}>
                    <p className="text-center text-gray-400 text-sm mb-4">
                        {error ? '잘못된 PIN 코드입니다' : 'PIN 코드를 입력하세요'}
                    </p>
                    <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${pin.length > i
                                        ? error
                                            ? 'border-red-500 bg-red-500/20'
                                            : 'border-safety-orange bg-safety-orange/20'
                                        : 'border-dark-border bg-dark-card'
                                    }`}
                            >
                                {pin.length > i && (
                                    <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-safety-orange'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 숫자 패드 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-16 bg-dark-card hover:bg-dark-border border border-dark-border rounded-xl text-white text-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            {num}
                        </button>
                    ))}

                    <button
                        onClick={handleClear}
                        className="h-16 bg-dark-card hover:bg-dark-border border border-dark-border rounded-xl text-gray-400 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        전체삭제
                    </button>

                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-16 bg-dark-card hover:bg-dark-border border border-dark-border rounded-xl text-white text-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        0
                    </button>

                    <button
                        onClick={handleDelete}
                        className="h-16 bg-dark-card hover:bg-dark-border border border-dark-border rounded-xl text-gray-400 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        삭제
                    </button>
                </div>

                {/* 힌트 */}
                <p className="text-center text-gray-500 text-xs mt-6">
                    기본 PIN: 0000
                </p>
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

export default PinLogin;
