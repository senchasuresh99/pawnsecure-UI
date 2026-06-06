import { Routes, Route } from "react-router-dom";

import AuthView from "./views/AuthView";
import Register from "./views/Register";
import ResetPassword from "./views/ResetPassword";

import AdminDashboard from "./admin/AdminDashboard";

import DealerDashboard from "./dealer/DealerDashboard";
import CustomerReviews from "./views/CustomerReviews";

/* ✅ GIRVI FLOW IMPORTS */
import CustomerDetails from "./girvi/CustomerDetails";
import GirviDetails from "./girvi/GirviDetails";
import ItemDetails from "./girvi/ItemDetails";
import LockerReview from "./girvi/LockerReview";
import GirviSuccess from "./girvi/GirviSuccess";
import AddCustomer from "./girvi/AddCustomer";

/* ✅ IMPORTANT */
import { GirviProvider } from "./girvi/GirviContext";
import CustomerRegister from "./views/CustomerRegister";
import GirviList from "./girvi/GirviList";

export default function App() {
  return (
    <GirviProvider>  {/* ✅ THIS FIXES YOUR BLANK SCREEN */}
      <Routes>
        {/* ✅ AUTH */}
        <Route path="/" element={<AuthView />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ✅ ADMIN */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* ✅ DEALER */}
        <Route path="/dealer/dashboard" element={<DealerDashboard />} />
        <Route path="/dealer/customer-search" element={<CustomerReviews />} />

        {/* ✅ ✅ GIRVI FLOW */}
        <Route path="/dealer/customer" element={<GirviList />} />
        <Route path="/dealer/customer-details" element={<CustomerDetails />} />
        <Route path="/dealer/details" element={<GirviDetails />} />
        <Route path="/dealer/items" element={<ItemDetails />} />
        <Route path="/dealer/review" element={<LockerReview />} />
        <Route path="/dealer/success" element={<GirviSuccess />} />
        <Route path="/dealer/add-customer" element={<AddCustomer />} />
        <Route path="/dealer/customer-register" element={<CustomerRegister />} />
      </Routes>
    </GirviProvider>
  );
}
