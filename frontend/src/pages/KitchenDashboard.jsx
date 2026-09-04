import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000';
const socket = io(API_BASE_URL);

function KitchenDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRestocking, setIsRestocking] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [searchTable, setSearchTable] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [tables, setTables] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const loadOrders = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/orders`);
                if (isMounted) {
                    setOrders(response.data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching orders:', err);
                    setError('Failed to load orders. Please check the server connection.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const loadTables = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/tables`);
                if (isMounted) setTables(response.data);
            } catch (err) {
                console.error('Error fetching tables:', err);
            }
        };

        loadOrders();
        loadTables();

        socket.on('orderPlaced', (newOrder) => {
            setOrders((prev) => [newOrder, ...prev]);
        });

        socket.on('orderStatusUpdated', (updatedOrder) => {
            setOrders((prev) =>
                prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order))
            );
        });

        socket.on('tablesUpdated', (updatedTables) => {
            setTables(updatedTables);
        });

        return () => {
            isMounted = false;
            socket.off('orderPlaced');
            socket.off('orderStatusUpdated');
            socket.off('tablesUpdated');
        };
    }, []);

    const releaseTable = async (tableNumber) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/tables/${tableNumber}/release`);
            setTables((prev) =>
                prev.map((t) => (t.tableNumber === tableNumber ? response.data.table : t))
            );
        } catch (err) {
            console.error('Failed to release table:', err);
            alert('Failed to release table.');
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        const previousOrders = [...orders];
        setOrders((prev) =>
            prev.map(order => order._id === orderId ? { ...order, status: newStatus } : order)
        );

        try {
            await axios.patch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                status: newStatus
            });
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update order status. Reverting changes.');
            setOrders(previousOrders);
        }
    };

    const handleRepopulateStock = async () => {
        setIsRestocking(true);
        try {
            await axios.post(`${API_BASE_URL}/api/inventory/repopulate`);
            alert('Stock successfully repopulated!');
        } catch (err) {
            console.error('Restock error:', err);
            alert('Failed to repopulate stock.');
        } finally {
            setIsRestocking(false);
        }
    };

    const theme = {
        bg: isDarkMode ? '#1a202c' : '#f7fafc',
        cardBg: isDarkMode ? '#2d3748' : '#ffffff',
        text: isDarkMode ? '#ffffff' : '#1a202c',
        subText: isDarkMode ? '#a0aec0' : '#4a5568',
        border: isDarkMode ? '#4a5568' : '#cbd5e0',
        headerBg: isDarkMode ? '#2d3748' : '#edf2f7',
        inputBg: isDarkMode ? '#1a202c' : '#ffffff'
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return { bg: '#feebc8', color: '#9c4221' };
            case 'Preparing': return { bg: '#bee3f8', color: '#2b6cb0' };
            case 'Ready': return { bg: '#c6f6d5', color: '#22543d' };
            case 'Served': return { bg: '#e2e8f0', color: '#4a5568' };
            default: return { bg: '#edf2f7', color: '#1a202c' };
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesTab =
                activeTab === 'all'
                    ? true
                    : activeTab === 'active'
                        ? order.status !== 'Served'
                        : order.status === 'Served';

            const matchesTable = searchTable.trim() === ''
                ? true
                : String(order.tableNumber).includes(searchTable.trim());

            return matchesTab && matchesTable;
        });
    }, [orders, activeTab, searchTable]);

    const filterOrderItems = (items) => {
        if (categoryFilter === 'All') return items;
        return items.filter((item) => {
            const cat = (item.inventoryItem?.category || item.category || '').toLowerCase();
            if (categoryFilter === 'Mains') return ['mains', 'main course', 'main dishes'].includes(cat);
            if (categoryFilter === 'Protein') return ['protein', 'meat', 'chicken', 'beef', 'suya'].includes(cat);
            if (categoryFilter === 'Sides') return ['sides', 'side dish', 'plantains'].includes(cat);
            if (categoryFilter === 'Snacks') return ['snacks', 'sides & snacks', 'snack'].includes(cat);
            if (categoryFilter === 'Drinks') return ['drinks', 'beverages'].includes(cat);
            return cat === categoryFilter.toLowerCase();
        });
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: isDarkMode ? '#fff' : '#000' }}>Loading Kitchen Display...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#e53e3e' }}>{error}</div>;

    const renderTicket = (order) => {
        const filteredItems = filterOrderItems(order.items || []);
        if (filteredItems.length === 0 && categoryFilter !== 'All') return null;

        const statusStyle = getStatusColor(order.status);
        return (
            <div
                key={order._id}
                style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    background: theme.cardBg,
                    color: theme.text,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem'
                }}
            >
                <div>
                    <div style={{ padding: '0.85rem 1.2rem', background: theme.headerBg, borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: theme.text }}>
                                Table #{order.tableNumber}
                            </h3>
                            <small style={{ color: theme.subText }}>
                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'Recent'}
                            </small>
                        </div>
                        <span style={{ padding: '0.3rem 0.7rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', background: statusStyle.bg, color: statusStyle.color }}>
                            {order.status}
                        </span>
                    </div>

                    <div style={{ padding: '1.2rem' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {filteredItems.map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', flexDirection: 'column', padding: '0.6rem 0', borderBottom: `1px dashed ${theme.border}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <span style={{ fontWeight: '600', color: theme.text }}>
                                            {item.quantity}x {item.inventoryItem?.itemName || item.inventoryItem?.name || item.itemName || 'Item'}
                                        </span>
                                        <span style={{ color: '#e53e3e', fontSize: '0.85rem' }}>
                                            ⏱ ~{item.inventoryItem?.prepTime || 15}m
                                        </span>
                                    </div>
                                    {(item.protein || item.sides || item.notes) && (
                                        <div style={{ fontSize: '0.8rem', color: theme.subText, marginTop: '0.3rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                            {item.protein && <span>🥩 <strong>Protein:</strong> {item.protein}</span>}
                                            {item.sides && <span>🍟 <strong>Side:</strong> {item.sides}</span>}
                                            {item.notes && <span>📝 <strong>Note:</strong> {item.notes}</span>}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div style={{ padding: '0.85rem 1.2rem', background: theme.headerBg, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '0.5rem' }}>
                    {order.status === 'Pending' && (
                        <button onClick={() => updateStatus(order._id, 'Preparing')} style={{ flex: 1, padding: '0.6rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Start Preparing
                        </button>
                    )}
                    {order.status === 'Preparing' && (
                        <button onClick={() => updateStatus(order._id, 'Ready')} style={{ flex: 1, padding: '0.6rem', background: '#38a169', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Mark Ready
                        </button>
                    )}
                    {order.status === 'Ready' && (
                        <button onClick={() => updateStatus(order._id, 'Served')} style={{ flex: 1, padding: '0.6rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Mark Served & Complete
                        </button>
                    )}
                    {order.status === 'Served' && (
                        (() => {
                            const orderTable = tables.find((t) => t.tableNumber === order.tableNumber);
                            const stillReserved = orderTable?.status === 'reserved';
                            return stillReserved ? (
                                <button
                                    onClick={() => releaseTable(order.tableNumber)}
                                    style={{ flex: 1, padding: '0.6rem', background: '#38a169', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    🔓 Free Table #{order.tableNumber}
                                </button>
                            ) : (
                                <span style={{ color: theme.subText, fontSize: '0.85rem', textAlign: 'center', width: '100%', fontStyle: 'italic' }}>
                                    Order Completed
                                </span>
                            );
                        })()
                    )}

                </div>
            </div>
        );
    };

    const categories = ['All', 'Mains', 'Protein', 'Sides', 'Snacks', 'Drinks'];

    return (
        <div style={{ background: theme.bg, minHeight: '100vh', transition: 'all 0.3s ease' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'sans-serif' }}>
                <header style={{ borderBottom: `2px solid ${theme.border}`, paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h1 style={{ margin: 0, color: theme.text, fontSize: '2.2rem' }}>Kitchen Display System</h1>
                        <p style={{ margin: 0, color: theme.subText }}>Real-time order tickets & multi-table control</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '0.6rem 1rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                        </button>
                        <button onClick={handleRepopulateStock} disabled={isRestocking} style={{ padding: '0.6rem 1.2rem', background: '#319795', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {isRestocking ? 'Restocking...' : '🔄 Repopulate Stock'}
                        </button>
                    </div>
                </header>

                {/* Table Availability Map */}
                {tables.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            Table Map
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {tables.map((t) => {
                                const reserved = t.status === 'reserved';
                                return (
                                    <button
                                        key={t.tableNumber}
                                        onClick={() => reserved && releaseTable(t.tableNumber)}
                                        title={reserved ? `Reserved for ${t.reservedBy} — click to release` : 'Available'}
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            border: 'none',
                                            cursor: reserved ? 'pointer' : 'default',
                                            background: reserved ? '#fed7d7' : '#c6f6d5',
                                            color: reserved ? '#9b2c2c' : '#22543d'
                                        }}
                                    >
                                        #{t.tableNumber} {reserved ? '🔒' : '✅'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search by Table Number..."
                            value={searchTable}
                            onChange={(e) => setSearchTable(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem',
                                borderRadius: '6px',
                                border: `1px solid ${theme.border}`,
                                background: theme.inputBg,
                                color: theme.text,
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {categories.map((cat) => (
                            <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '0.4rem 0.8rem', borderRadius: '15px', border: `1px solid ${theme.border}`, background: categoryFilter === cat ? '#319795' : theme.cardBg, color: categoryFilter === cat ? '#fff' : theme.text, fontSize: '0.85rem', cursor: 'pointer' }}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setActiveTab('all')} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'all' ? '#3182ce' : theme.cardBg, color: activeTab === 'all' ? '#fff' : theme.text }}>
                        All Orders ({orders.length})
                    </button>
                    <button onClick={() => setActiveTab('active')} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'active' ? '#3182ce' : theme.cardBg, color: activeTab === 'active' ? '#fff' : theme.text }}>
                        Active Orders ({orders.filter(o => o.status !== 'Served').length})
                    </button>
                    <button onClick={() => setActiveTab('history')} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'history' ? '#3182ce' : theme.cardBg, color: activeTab === 'history' ? '#fff' : theme.text }}>
                        Completed ({orders.filter(o => o.status === 'Served').length})
                    </button>
                </div>

                {filteredOrders.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: theme.subText, background: theme.cardBg, borderRadius: '8px' }}>
                        No orders match your filter criteria.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                        {filteredOrders.map(renderTicket)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default KitchenDashboard;