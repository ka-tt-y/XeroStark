import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home/index';
import CircuitsHub from './pages/CircomCircuit/CircuitsHub';
import CircuitList from './pages/CircomCircuit/CircuitList';
import CircuitUpload from './pages/CircomCircuit/CircuitUpload';
import CircuitDetail from './pages/CircomCircuit/CircuitDetail';
import AvailableCircuits from './pages/CircomCircuit/AvailableCircuits';
import CircuitDetailPage from './pages/CircomCircuit/CircuitDetailPage';
import Prove from './pages/CircomCircuit/Prove';
import Dashboard from './pages/Dashboard/Dashboard';
import ProofViewer from './pages/ProofViewer/index';
import ProofResult from './pages/ProofResult';
import ProofVerify from './pages/ProofVerify/index';
import Docs from './pages/Docs/index';
import './styles/index.css';
import { StarknetProvider } from './contexts/StarknetProvider';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <ThemeProvider>
        <StarknetProvider>
      <div className="min-h-screen transition-colors duration-200">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<CircuitsHub />} />
          <Route path="/templates/browse" element={<CircuitList />} />
          <Route path="/templates/upload" element={<CircuitUpload />} />
          <Route path="/circuits" element={<AvailableCircuits />} />
          <Route path="/circuits/:circuitHash" element={<CircuitDetailPage />} />
          <Route path="/prove/:circuitHash" element={<Prove />} />
          <Route path="/templates/*" element={<CircuitDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/proof/result/:circuitHash" element={<ProofResult />} />
          <Route path="/proof/verify/:circuitHash" element={<ProofVerify />} />
          <Route path="/proof/:token" element={<ProofViewer />} />
          <Route path="/docs" element={<Docs />} />
        </Routes>
        <Footer />
      </div>
      </StarknetProvider>
    </ThemeProvider>
  );
}

export default App;
