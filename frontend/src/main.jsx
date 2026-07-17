import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewQuotation from './pages/NewQuotation.jsx'
import QuotationHistory from './pages/QuotationHistory.jsx'
import Clients from './pages/Clients.jsx'
import Products from './pages/Products.jsx'
import RateMaster from './pages/RateMaster.jsx'
import RateCalculatorList from './pages/RateCalculatorList.jsx'
import RateCalculatorForm from './pages/RateCalculatorForm.jsx'
import RateCalculatorView from './pages/RateCalculatorView.jsx'
import CompanyProfile from './pages/CompanyProfile.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import { AuthProvider } from './lib/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="new-quotation" element={<NewQuotation />} />
            <Route path="new-quotation/:id" element={<NewQuotation />} />
            <Route path="quotation-history" element={<QuotationHistory />} />
            <Route path="clients" element={<Clients />} />
            <Route path="products" element={<Products />} />
            <Route path="rate-master" element={<RateMaster />} />
            <Route path="rate-calculator" element={<RateCalculatorList />} />
            <Route path="rate-calculator/new" element={<RateCalculatorForm />} />
            <Route path="rate-calculator/:id" element={<RateCalculatorForm />} />
            <Route path="rate-calculator/:id/view" element={<RateCalculatorView />} />
            <Route path="company-profile" element={<CompanyProfile />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
