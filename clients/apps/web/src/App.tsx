import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserRole } from '@foodexpress/api-client';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireRole } from './components/RequireRole';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RestaurantListPage } from './pages/RestaurantListPage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyRestaurantsPage } from './pages/owner/MyRestaurantsPage';
import { CreateRestaurantPage } from './pages/owner/CreateRestaurantPage';
import { RestaurantDashboardPage } from './pages/owner/RestaurantDashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<RestaurantListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderTrackingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner"
              element={
                <RequireRole role={UserRole.RESTAURANT_OWNER}>
                  <MyRestaurantsPage />
                </RequireRole>
              }
            />
            <Route
              path="/owner/new"
              element={
                <RequireRole role={UserRole.RESTAURANT_OWNER}>
                  <CreateRestaurantPage />
                </RequireRole>
              }
            />
            <Route
              path="/owner/restaurants/:id"
              element={
                <RequireRole role={UserRole.RESTAURANT_OWNER}>
                  <RestaurantDashboardPage />
                </RequireRole>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
