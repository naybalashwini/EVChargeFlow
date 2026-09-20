import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Planner from './pages/Planner';
import Saved from './pages/Saved';
import History from './pages/History';
import Account from './pages/Account';

function AppRoutes() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  if (isHome) {
    return <Home />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/explore" element={<Explore />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/history" element={<History />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
