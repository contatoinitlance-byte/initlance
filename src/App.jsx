
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { Toaster } from "@/Components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/Components/UserNotRegisteredError';
import ProtectedRoute from '@/Components/ProtectedRoute';
import AppErrorBoundary from '@/lib/AppErrorBoundary';


// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AuthCallback from '@/pages/AuthCallback';
import RoleSelection from '@/pages/RoleSelection';
import Admin from '@/pages/Admin';

// Public pages
import Landing from '@/pages/Landing';
import Marketplace from '@/pages/Marketplace';
import Profile from '@/pages/Profile';

// Dashboard layout
import DashboardLayout from '@/Components/dashboard/DashboardLayout';
import RoleGuard from '@/Components/dashboard/RoleGuard';

// Freelancer pages
import FreelancerDashboard from '@/pages/FreelancerDashboard';
import Portfolio from '@/pages/Portfolio';
import Jobs from '@/pages/Jobs';
import Analytics from '@/pages/Analytics';
import Challenges from '@/pages/Challenges';
import Messages from '@/pages/Messages';
import DashboardSettings from '@/pages/DashboardSettings';

// Client pages
import ClientDashboard from '@/pages/ClientDashboard';
import ClientCreateJob from '@/pages/ClientCreateJob';
import ClientCandidates from '@/pages/ClientCandidates';
import ClientJobs from '@/pages/ClientJobs';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'banned') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 max-w-md text-center">
            <h1 className="font-heading font-bold text-xl text-foreground mb-2">Acesso bloqueado</h1>
            <p className="text-sm text-muted-foreground">{authError.message}</p>
          </div>
        </div>
      );
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/profile/:id" element={<Profile />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes — require login */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route element={<RoleGuard allowedRoles={['admin']} fallback="/" />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* Freelancer-only dashboard */}
        <Route element={<RoleGuard allowedRoles={['freelancer']} fallback="/client" />}>
          <Route element={<DashboardLayout mode="freelancer" />}>
            <Route path="/dashboard" element={<FreelancerDashboard />} />
            <Route path="/dashboard/portfolio" element={<Portfolio />} />
            <Route path="/dashboard/jobs" element={<Jobs />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/challenges" element={<Challenges />} />
            <Route path="/dashboard/messages" element={<Messages />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
          </Route>
        </Route>

        {/* Client-only dashboard */}
{/* Client-only dashboard */}
<Route element={<RoleGuard allowedRoles={['client']} fallback="/dashboard" />}>
  <Route element={<DashboardLayout mode="client" />}>
    
    {/* Dashboard principal */}
    <Route path="/client" element={<ClientDashboard />} />

    {/* Criar vaga */}
    <Route path="/client/create-job" element={<ClientCreateJob />} />

    {/* Candidatos */}
    <Route path="/client/candidates" element={<ClientCandidates />} />
    <Route path="/client/candidatos" element={<ClientCandidates />} />

    {/* Vagas da empresa */}
    <Route path="/client/jobs" element={<ClientJobs />} />

    {/* Mensagens */}
    <Route path="/client/messages" element={<Messages />} />

    {/* Configurações */}
    <Route path="/client/settings" element={<DashboardSettings />} />

  </Route>
</Route>

      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppErrorBoundary>
            <AuthenticatedApp />
          </AppErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
