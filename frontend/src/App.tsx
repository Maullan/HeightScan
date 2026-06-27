import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { WebSocketProvider } from './context/WebSocketContext';
import LandingPage from './pages/LandingPage';
import MeasurementPage from './pages/MeasurementPage';
import ResultPage from './pages/ResultPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/measure" element={<MeasurementPage />} />
      <Route path="/result"  element={<ResultPage />} />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <WebSocketProvider>
          <AppRoutes />
        </WebSocketProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
