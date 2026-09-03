import { useState } from 'react';
import axios from 'axios';

function AuthModal({ isOpen, onClose, onUserAuthenticated }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await axios.post(`http://localhost:5000${endpoint}`, formData);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            onUserAuthenticated(res.data.user);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#1a202c', color: '#fff', padding: '2rem', borderRadius: '10px', width: '350px', border: '1px solid #4a5568' }}>
                <h2 style={{ marginTop: 0 }}>{isLogin ? 'Login to Smart Dine' : 'Create Account'}</h2>
                {error && <p style={{ color: '#fc8181', fontSize: '0.9rem' }}>{error}</p>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }}
                    />
                    <button type="submit" style={{ padding: '0.75rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {isLogin ? 'Login' : 'Register (+50 Points)'}
                    </button>
                </form>

                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
                    <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#63b3ed', cursor: 'pointer' }}>
                        {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                    </span>
                    <br /><br />
                    <button onClick={onClose} style={{ background: 'transparent', color: '#a0aec0', border: 'none', cursor: 'pointer' }}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;