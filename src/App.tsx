import { Routes, Route } from "react-router-dom";
import AuthView from "./views/AuthView";
import Register from "./views/Register";
import ResetPassword from "./views/ResetPassword";
import AdminDashboard from "./admin/AdminDashboard";
import CustomerReviews from "./views/CustomerReviews";
import DealerDashboard from "./dealer/DealerDashboard";
import RegisterCustomer from "./views/RegisterCustomer";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthView />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* ✅ Dealer routes */}
      <Route path="/dealer/dashboard" element={<DealerDashboard />} />
      <Route path="/dealer/customer-search" element={<CustomerReviews />} />
      <Route path="/dealer/customer" element={<RegisterCustomer />} />
    </Routes>
  );
}