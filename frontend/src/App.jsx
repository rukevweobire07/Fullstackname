import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerMenu from './pages/CustomerMenu';
import KitchenDashboard from './pages/KitchenDashboard';
import TableQRPage from './pages/TableQRpage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/table/:tableNum" element={<CustomerMenu />} />
        <Route path="/kitchen" element={<KitchenDashboard />} />
        <Route path="/qr-codes" element={<TableQRPage />} />
      </Routes>
    </Router>
  );
}

export default App;