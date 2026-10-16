import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { ContentProvider } from './context/ContentContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ToursPage } from './pages/ToursPage.tsx';
import { TourDetailPage } from './pages/TourDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage.tsx';
import { MyBookingsPage } from './pages/MyBookingsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { PolicyPage } from './pages/PolicyPages.tsx';
import type { Tour } from './types/index.ts';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [activeBookingData, setActiveBookingData] = useState<any | null>(() => {
    try {
      const saved = sessionStorage.getItem('mnt_pending_booking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [confirmationReference, setConfirmationReference] = useState<string | null>(null);

  // Sync with browser URL changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTour = (tour: Tour) => {
    setSelectedTour(tour);
    navigate(`/tour/${tour.slug}`);
  };

  const handleStartCheckout = (data: any) => {
    setActiveBookingData(data);
    sessionStorage.setItem('mnt_pending_booking', JSON.stringify(data));
    navigate('/checkout');
  };

  const handleBookingConfirmed = (reference: string) => {
    setConfirmationReference(reference);
    setActiveBookingData(null);
    sessionStorage.removeItem('mnt_pending_booking');
    navigate(`/confirmation/${reference}`);
  };

  // Render current view based on currentPath
  const renderView = () => {
    if (currentPath === '/') {
      return <HomePage onNavigate={navigate} onSelectTour={handleSelectTour} />;
    }

    if (currentPath === '/tours') {
      return <ToursPage onSelectTour={handleSelectTour} />;
    }

    if (currentPath.startsWith('/tour/')) {
      const slug = currentPath.replace('/tour/', '');
      return (
        <TourDetailPage
          slug={slug}
          onNavigate={navigate}
          onStartCheckout={handleStartCheckout}
        />
      );
    }

    if (currentPath === '/checkout') {
      if (!activeBookingData) {
        return (
          <div className="bg-[#0b1d3a] min-h-[60vh] py-24 text-center text-slate-200 px-4">
            <h2 className="text-2xl font-bold text-white">No Active Booking in Progress</h2>
            <p className="text-slate-400 mt-2">Please select an itinerary and departure date first.</p>
            <button
              onClick={() => navigate('/tours')}
              className="mt-6 px-6 py-3 rounded-xl bg-red-600 text-white font-bold"
            >
              Browse Tours & Treks
            </button>
          </div>
        );
      }
      return (
        <CheckoutPage
          bookingData={activeBookingData}
          onNavigate={navigate}
          onBookingConfirmed={handleBookingConfirmed}
        />
      );
    }

    if (currentPath.startsWith('/confirmation/')) {
      const ref = currentPath.replace('/confirmation/', '') || confirmationReference || '';
      return (
        <BookingConfirmationPage
          referenceCode={ref}
          onNavigate={navigate}
        />
      );
    }

    if (currentPath === '/my-bookings') {
      return (
        <MyBookingsPage
          onNavigate={navigate}
          onViewReceipt={(ref) => navigate(`/confirmation/${ref}`)}
        />
      );
    }

    if (currentPath === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    if (currentPath === '/contact') {
      return <ContactPage />;
    }

    if (currentPath === '/auth') {
      return (
        <AuthPage
          onNavigate={navigate}
          onSuccessRedirect={() => {
            if (activeBookingData) {
              navigate('/checkout');
            } else {
              navigate('/my-bookings');
            }
          }}
        />
      );
    }

    if (currentPath === '/admin') {
      return <AdminDashboardPage onNavigate={navigate} />;
    }

    if (currentPath === '/terms') {
      return <PolicyPage type="terms" onNavigate={navigate} />;
    }

    if (currentPath === '/cancellation') {
      return <PolicyPage type="cancellation" onNavigate={navigate} />;
    }

    if (currentPath === '/privacy') {
      return <PolicyPage type="privacy" onNavigate={navigate} />;
    }

    // Default 404
    return (
      <div className="bg-[#0b1d3a] min-h-[60vh] py-24 text-center text-slate-200 px-4">
        <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
        <p className="text-slate-400 mt-2">The requested page does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 rounded-xl bg-red-600 text-white font-bold"
        >
          Return to Home
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-red-600 selection:text-white bg-[#0b1d3a]">
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <main className="flex-1">{renderView()}</main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ContentProvider>
          <AppContent />
        </ContentProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
