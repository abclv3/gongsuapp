import { useState, useEffect } from 'react';
import Login from './components/Login';
import SignUp from './components/SignUp';
import SalaryCalculator from './components/SalaryCalculator';
import { signOut } from './lib/supabase';

function App() {
    const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'main'
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
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
                    user={currentUser}
                    onLogout={handleLogout}
                />
            )}
        </>
    );
}

export default App;
