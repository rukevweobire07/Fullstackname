import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import AuthModal from './AuthModal';

const socket = io('http://localhost:5000');

function CustomerMenu() {
    const { tableNum } = useParams();
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeOrder, setActiveOrder] = useState(null);
    const [tables, setTables] = useState([]);
    const [bookingName, setBookingName] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [user, setUser] = useState(() => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch {
        localStorage.removeItem('user');
        return null;
    }
});
    
    // Category Filter State
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/inventory');
                setMenuItems(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching inventory:', error);
                setLoading(false);
            }
        };

        const fetchTables = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/tables');
                setTables(response.data);
            } catch (error) {
                console.error('Error fetching table availability:', error);
            }
        };

        fetchInventory();
        fetchTables();

        socket.on('inventoryUpdated', (updatedInventory) => {
            setMenuItems(updatedInventory);
        });

        socket.on('orderStatusUpdated', (updatedOrder) => {
            if (updatedOrder.tableNumber === Number(tableNum)) {
                setActiveOrder(updatedOrder);
            }
        });

        socket.on('tablesUpdated', (updatedTables) => {
            setTables(updatedTables);
        });

        return () => {
            socket.off('inventoryUpdated');
            socket.off('orderStatusUpdated');
            socket.off('tablesUpdated');
        };
    }, [tableNum]);

    // Live status of the table this customer is currently sitting at
    const currentTable = tables.find((t) => t.tableNumber === Number(tableNum));
    const isTableBooked = currentTable?.status === 'reserved';

    const addToCart = (item) => {
        if (item.stockQuantity <= 0 || !item.isAvailable) return;

        setCart((prevCart) => {
            const existing = prevCart.find((i) => i._id === item._id);
            if (existing) {
                if (existing.quantity >= item.stockQuantity) return prevCart;
                return prevCart.map((i) =>
                    i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart((prevCart) =>
            prevCart
                .map((item) => (item._id === id ? { ...item, quantity: item.quantity - 1 } : item))
                .filter((item) => item.quantity > 0)
        );
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;

        try {
            const orderPayload = {
                tableNumber: Number(tableNum),
                items: cart.map((item) => ({
                    inventoryItem: item._id,
                    quantity: item.quantity
                }))
            };

            const response = await axios.post('http://localhost:5000/api/orders', orderPayload);
            setActiveOrder(response.data);
            setCart([]);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to place order.');
        }
    };

    const handleBookTable = async (e) => {
        e.preventDefault();
        if (!bookingName.trim()) return;
        setBookingError('');

        try {
            const response = await axios.post(
                `http://localhost:5000/api/tables/${tableNum}/reserve`,
                { name: bookingName.trim() }
            );
            setTables((prev) =>
                prev.map((t) => (t.tableNumber === Number(tableNum) ? response.data.table : t))
            );
        } catch (error) {
            setBookingError(error.response?.data?.message || 'Failed to reserve table.');
        }
    };

    const getStatusStep = (status) => {
        const steps = ['Pending', 'Preparing', 'Ready', 'Served'];
        return steps.indexOf(status);
    };

    // Helper to normalize and filter categories
    const categories = ['All', 'Mains', 'Proteins', 'Sides', 'Drinks', 'Snacks'];
    
    const filteredMenuItems = menuItems.filter((item) => {
        if (selectedCategory === 'All') return true;
        const cat = (item.category || '').trim().toLowerCase();
        if (selectedCategory === 'Mains') return cat === 'mains' || cat === 'main course';
        return cat === selectedCategory.toLowerCase();
    });

    // Theme values
    const theme = {
        bg: isDarkMode ? '#1a202c' : '#ffffff',
        text: isDarkMode ? '#f7fafc' : '#2c3e50',
        subText: isDarkMode ? '#a0aec0' : '#7f8c8d',
        cardBg: isDarkMode ? '#2d3748' : '#ffffff',
        border: isDarkMode ? '#4a5568' : '#e2e8f0',
        sidebarBg: isDarkMode ? '#2d3748' : '#fafafa',
        
        // Item specific theme variables
        itemBg: isDarkMode ? '#3e4c5f' : '#000000', 
        itemText: '#ffffff', 
        itemSubText: '#cbd5e0'
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: theme.text }}>Loading menu...</div>;

    return (
        <div style={{ background: theme.bg, minHeight: '100vh', transition: 'all 0.3s ease', color: theme.text }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
                
                {/* Header Section */}
                <header style={{ borderBottom: `2px solid ${theme.border}`, paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, color: theme.text }}>SmartDine Menu</h1>
                        <p style={{ margin: '0.5rem 0 0', color: theme.subText }}>
                            Table <strong>#{tableNum}</strong> {isTableBooked && <span style={{ color: '#27ae60', fontWeight: 'bold' }}>• Reserved for {currentTable?.reservedBy || bookingName}</span>}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Light / Dark Mode Toggle */}
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            style={{
                                padding: '0.5rem 0.8rem',
                                background: theme.cardBg,
                                color: theme.text,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                        </button>

                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: isDarkMode ? '#4a5568' : '#f7fafc', padding: '0.5rem 0.75rem', borderRadius: '20px', border: `1px solid ${theme.border}` }}>
                                <span style={{ fontSize: '1.2rem' }}>👤</span>
                                <span style={{ fontWeight: '600', color: theme.text }}>{user.name || 'Customer'}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#fefcbf', padding: '0.25rem 0.5rem', borderRadius: '12px', border: '1px solid #faf089' }}>
                                    <span>🏆</span>
                                    <span style={{ fontWeight: 'bold', color: '#744210', fontSize: '0.85rem' }}>{user.loyaltyPoints || 0} pts</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: isDarkMode ? '#4a5568' : '#edf2f7',
                                    color: theme.text,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                <span>👤</span> Sign In / Register
                            </button>
                        )}
                    </div>
                </header>

                {/* Table Availability Panel */}
                {tables.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            Table Availability
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {tables.map((t) => {
                                const isCurrent = t.tableNumber === Number(tableNum);
                                const reserved = t.status === 'reserved';
                                return (
                                    <div
                                        key={t.tableNumber}
                                        title={reserved ? `Reserved for ${t.reservedBy}` : 'Available'}
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            background: reserved ? '#fed7d7' : '#c6f6d5',
                                            color: reserved ? '#9b2c2c' : '#22543d',
                                            border: isCurrent ? '2px solid #3182ce' : '2px solid transparent'
                                        }}
                                    >
                                        #{t.tableNumber} {reserved ? '🔒' : '✅'}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Real-time Order Tracker Section */}
                {activeOrder && (
                    <div style={{ background: isDarkMode ? '#2c5282' : '#ebf8ff', border: `1px solid ${isDarkMode ? '#4299e1' : '#90cdf4'}`, borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.75rem', color: isDarkMode ? '#ebf8ff' : '#2b6cb0' }}>📍 Order Tracker (Table #{tableNum})</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            {['Pending', 'Preparing', 'Ready', 'Served'].map((step, idx) => {
                                const currentStepIdx = getStatusStep(activeOrder.status);
                                const isActive = idx <= currentStepIdx;
                                return (
                                    <div key={step} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                                        <div
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                background: isActive ? '#3182ce' : '#cbd5e0',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 0.5rem',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {idx + 1}
                                        </div>
                                        <small style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? (isDarkMode ? '#63b3ed' : '#2b6cb0') : theme.subText }}>{step}</small>
                                    </div>
                                );
                            })}
                        </div>

                        {!isTableBooked && activeOrder.status !== 'Served' && (
                            <form onSubmit={handleBookTable} style={{ marginTop: '1rem', borderTop: `1px dashed ${theme.border}`, paddingTop: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter your name to reserve table..."
                                        value={bookingName}
                                        onChange={(e) => setBookingName(e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text }}
                                    />
                                    <button type="submit" style={{ padding: '0.5rem 1rem', background: '#319795', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        Reserve Table
                                    </button>
                                </div>
                                {bookingError && <p style={{ color: '#fc8181', fontSize: '0.85rem', marginTop: '0.5rem' }}>{bookingError}</p>}
                            </form>
                        )}
                    </div>
                )}

                {/* Category Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: `1px solid ${theme.border}`,
                                background: selectedCategory === cat ? '#3182ce' : theme.cardBg,
                                color: selectedCategory === cat ? '#fff' : theme.text,
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Main Menu & Cart Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div>
                        <h2 style={{ marginTop: 0 }}>Available Items</h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {filteredMenuItems.length === 0 ? (
                                <p style={{ color: theme.subText }}>No items available in this category.</p>
                            ) : (
                                filteredMenuItems.map((item) => (
                                    <div
                                        key={item._id}
                                        style={{
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: theme.itemBg,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            opacity: item.stockQuantity === 0 || !item.isAvailable ? 0.6 : 1
                                        }}
                                    >
                                        {item.imageUrl && (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.itemName}
                                                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                        )}

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: theme.itemText }}>{item.itemName}</h3>
                                                    <span
                                                        style={{
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 'bold',
                                                            background: item.stockQuantity === 0 || !item.isAvailable ? '#fed7d7' : item.stockQuantity <= 5 ? '#feebc8' : '#c6f6d5',
                                                            color: item.stockQuantity === 0 || !item.isAvailable ? '#9b2c2c' : item.stockQuantity <= 5 ? '#9c4221' : '#22543d'
                                                        }}
                                                    >
                                                        {item.stockQuantity > 0 && item.isAvailable ? `${item.stockQuantity} Left` : 'Sold Out'}
                                                    </span>
                                                </div>
                                                <p style={{ margin: '0.25rem 0 0.5rem', color: theme.itemSubText, fontSize: '0.85rem' }}>{item.description}</p>
                                                <small style={{ color: '#fc8181', fontWeight: '500' }}>⏱ Prep Time: ~{item.prepTime || 15} mins</small>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                <strong style={{ color: '#63b3ed', fontSize: '1rem' }}>₦{item.price.toLocaleString()}</strong>
                                                <button
                                                    disabled={item.stockQuantity <= 0 || !item.isAvailable}
                                                    onClick={() => addToCart(item)}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        background: item.stockQuantity > 0 && item.isAvailable ? '#3182ce' : '#4a5568',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: 'bold',
                                                        cursor: item.stockQuantity > 0 && item.isAvailable ? 'pointer' : 'not-allowed'
                                                    }}
                                                >
                                                    {item.stockQuantity > 0 && item.isAvailable ? 'Add' : 'Unavailable'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1rem', height: 'fit-content', background: theme.sidebarBg }}>
                        <h2 style={{ marginTop: 0, color: theme.text }}>Your Order</h2>
                        {cart.length === 0 ? (
                            <p style={{ color: theme.subText }}>Cart is empty.</p>
                        ) : (
                            <>
                                {cart.map((item) => (
                                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ color: theme.text }}>{item.itemName}</div>
                                            <small style={{ color: theme.subText }}>₦{item.price} x {item.quantity}</small>
                                        </div>
                                        <div>
                                            <button onClick={() => removeFromCart(item._id)} style={{ marginRight: '0.25rem', padding: '0.2rem 0.5rem' }}>-</button>
                                            <button onClick={() => addToCart(item)} style={{ padding: '0.2rem 0.5rem' }}>+</button>
                                        </div>
                                    </div>
                                ))}
                                <hr style={{ borderColor: theme.border }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', color: theme.text }}>
                                    <span>Total:</span>
                                    <span>₦{cartTotal.toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={handlePlaceOrder}
                                    style={{
                                        width: '100%',
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        background: '#2ecc71',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Confirm & Place Order
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Auth Modal Component */}
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onUserAuthenticated={(userData) => {
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                        setShowAuthModal(false);
                    }}
                />

            </div>
        </div>
    );
}

export default CustomerMenu;