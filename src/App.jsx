import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import { Services, ServiceDetails } from "./pages/Services";
import { Dashboard, Bookings, BookingDetails } from "./pages/Bookings";
import Homes from "./pages/Homes";
import Account from "./pages/Account";
import { Favorites, Waitlist, Notifications, Reviews } from "./pages/Saved";
import {
  ProviderProfile,
  ProviderServices,
  ProviderAvailability,
  ProviderDetails,
} from "./pages/Provider";
import { Reschedules, RescheduleDetails } from "./pages/Reschedules";
import { AdminUsers, AdminProviders, AdminCategories } from "./pages/Admin";
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="verify" element={<Auth mode="verify" />} />
        <Route path="forgot-password" element={<Auth mode="forgot" />} />
        <Route path="reset-password" element={<Auth mode="reset" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="services" element={<Services />} />
          <Route path="services/:id" element={<ServiceDetails />} />
          <Route path="providers/:id" element={<ProviderDetails />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="account" element={<Account />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reviews" element={<Reviews />} />
          <Route element={<ProtectedRoute roles={["HOMEOWNER", "PROVIDER"]} />}>
            <Route path="reschedules" element={<Reschedules />} />
            <Route path="reschedules/:id" element={<RescheduleDetails />} />
          </Route>
          <Route element={<ProtectedRoute roles={["HOMEOWNER"]} />}>
            <Route path="homes" element={<Homes />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="waitlist" element={<Waitlist />} />
          </Route>
          <Route element={<ProtectedRoute roles={["PROVIDER"]} />}>
            <Route path="provider/profile" element={<ProviderProfile />} />
            <Route path="provider/services" element={<ProviderServices />} />
            <Route
              path="provider/availability"
              element={<ProviderAvailability />}
            />
            <Route path="provider/reschedules" element={<Reschedules />} />
          </Route>
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/providers" element={<AdminProviders />} />
            <Route path="admin/categories" element={<AdminCategories />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <>
              <h1>Page not found</h1>
              <Link to="/">Return home</Link>
            </>
          }
        />
      </Route>
    </Routes>
  );
}
