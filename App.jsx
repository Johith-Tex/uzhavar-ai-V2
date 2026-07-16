// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import ChatPage from './pages/ChatPage';
import WeatherPage from './pages/WeatherPage';
import SchemesPage from './pages/SchemesPage';
import CropGuidePage from './pages/CropGuidePage';
import DiseaseAnalyzerPage from './pages/DiseaseAnalyzerPage';
import MandiPage from './pages/MandiPage';
import Layout from './components/Layout';
import './index.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a3a1a', color: '#d4f0a0',
              border: '1px solid #38b238', fontFamily: 'DM Sans, sans-serif',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ChatPage />} />
            <Route path="weather" element={<WeatherPage />} />
            <Route path="mandi" element={<MandiPage />} />
            <Route path="schemes" element={<SchemesPage />} />
            <Route path="crops" element={<CropGuidePage />} />
            <Route path="disease" element={<DiseaseAnalyzerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
