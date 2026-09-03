function TableQRPage() {
    const tables = [1, 2, 3, 4, 5, 6, 7, 8]; // Adjust based on your table count
    const baseUrl = 'https://tough-heads-know.loca.lt';

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', background: '#f7fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 19, color: '#1a202c' }}>Table QR Codes</h1>
                    <p style={{ margin: 0, color: '#4a5568' }}>Scan them</p>
                </div>
                <button 
                    onClick={() => window.print()} 
                    style={{ padding: '0.75rem 1.5rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    🖨️ Print QR Codes
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {tables.map((tableNum) => (
                    <div key={tableNum} style={{ background: '#fff', padding: '1.5rem', borderRadius: '10px', border: '1px solid #cbd5e0', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#1a202c', fontSize: '1.25rem' }}>Table #{tableNum}</h3>
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${baseUrl}/table/${tableNum}`)}`} 
                            alt={`Table ${tableNum} QR`} 
                            style={{ margin: '0 auto', display: 'block' }}
                        />
                        <p style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#718096', fontWeight: 'bold' }}>Scan to Order</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TableQRPage;