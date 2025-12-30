import { useState, useEffect } from 'react';
import Login from './components/Login';
import SignUp from './components/SignUp';
import SalaryCalculator from './components/SalaryCalculator';
import ResetPassword from './components/ResetPassword';
import { signOut, supabase } from './lib/supabase';

function App() {
    const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'main', 'reset-password'
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // URL 해시에서 비밀번호 재설정 토큰 확인
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        // 비밀번호 재설정 링크로 들어온 경우
        if (accessToken && type === 'recovery') {
            // Supabase 세션 설정
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: hashParams.get('refresh_token') || '',
            }).then(() => {
                setCurrentView('reset-password');
                // URL 해시 정리
                window.history.replaceState(null, '', window.location.pathname);
            });
            return;
        }

        // SessionStorage에서 인증 상태 확인
        const authStatus = sessionStorage.getItem('authenticated');
        const userStr = sessionStorage.getItem('current-user');

        if (authStatus === 'true' && userStr) {
            setCurrentUser(JSON.parse(userStr));
            setCurrentView('main');
        }
    }, []);

    const handleLoginSuccess = (user) => {
        setCurrentUser(user);
        setCurrentView('main');
    };

    const handleSignUpSuccess = (user) => {
        // 회원가입 후 자동 로그인
        sessionStorage.setItem('authenticated', 'true');
        sessionStorage.setItem('current-user', JSON.stringify(user));
        setCurrentUser(user);
        setCurrentView('main');
    };

    const handleLogout = async () => {
        await signOut(); // Supabase 로그아웃
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('current-user');
        setCurrentUser(null);
        setCurrentView('login');
    };

    const handleResetComplete = async () => {
        // 비밀번호 변경 후 로그아웃하고 로그인 페이지로
        await signOut();
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('current-user');
        setCurrentUser(null);
        setCurrentView('login');
    };

    return (
        <>
            {currentView === 'login' && (
                <Login
                    onSuccess={handleLoginSuccess}
                    onSignUp={() => setCurrentView('signup')}
                />
            )}

            {currentView === 'signup' && (
                <SignUp
                    onSuccess={handleSignUpSuccess}
                    onBackToLogin={() => setCurrentView('login')}
                />
            )}

            {currentView === 'main' && currentUser && (
                <SalaryCalculator
                    key={currentUser.id}
                    user={currentUser}
                    onLogout={handleLogout}
                />
            )}

            {currentView === 'reset-password' && (
                <ResetPassword onComplete={handleResetComplete} />
            )}
        </>
    );
}

export default App;
