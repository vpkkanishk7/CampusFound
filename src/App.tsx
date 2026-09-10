import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreateLost from './pages/CreateLost';
import CreateFound from './pages/CreateFound';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import ItemDetails from './pages/ItemDetails';
import MyReports from './pages/MyReports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppContext();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="lost" element={<ProtectedRoute><LostItems /></ProtectedRoute>} />
        <Route path="found" element={<ProtectedRoute><FoundItems /></ProtectedRoute>} />
        <Route path="create-lost" element={<ProtectedRoute><CreateLost /></ProtectedRoute>} />
        <Route path="create-found" element={<ProtectedRoute><CreateFound /></ProtectedRoute>} />
        <Route path="item/:id" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />
        <Route path="my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="messages" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
