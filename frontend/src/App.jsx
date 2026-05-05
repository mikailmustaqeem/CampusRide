import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './pages/welcome';
import Signup from './pages/signup';
import Login from './pages/Login';
import Dashboard from './pages/dashboard';
import ProtectedRoute from './components/ProtectedRoutes';
import Profile from './pages/profile';
import MyBookings from './pages/MyBookings';
import Payment from './pages/Payment';
import Wallet from './pages/Wallet';
import Reviews from './pages/Reviews';
import Notifications from './pages/Notifications';
import { ReviewPromptHost } from './components/ReviewPromptHost';

// Aliza's pages
import CreateRide from './pages/CreateRide';
import MyRides from './pages/MyRides';
import EditRide from './pages/EditRide';

// Zunaira's pages
import RideSearch from './pages/RideSearch';
import RideDetails from './pages/RideDetails';

function App() {
  return (
    <BrowserRouter>
      <ReviewPromptHost />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/my-bookings" element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        } />

        {/* Payment route */}
        <Route path="/payment" element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        } />

        {/* Wallet route */}
        <Route path="/wallet" element={
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        } />

        {/* Reviews route */}
        <Route path="/reviews" element={
          <ProtectedRoute>
            <Reviews />
          </ProtectedRoute>
        } />

        {/* Notifications route */}
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />

        {/* Aliza - Ride Management */}
        <Route path="/create-ride" element={
          <ProtectedRoute>
            <CreateRide />
          </ProtectedRoute>
        } />

        <Route path="/my-rides" element={
          <ProtectedRoute>
            <MyRides />
          </ProtectedRoute>
        } />

        <Route path="/edit-ride/:id" element={
          <ProtectedRoute>
            <EditRide />
          </ProtectedRoute>
        } />

        {/* Zunaira - Ride Search */}
        <Route path="/rides" element={
          <ProtectedRoute>
            <RideSearch />
          </ProtectedRoute>
        } />

        <Route path="/rides/:id" element={
          <ProtectedRoute>
            <RideDetails />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;