import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import { Screen, SoldScreen } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { INITIAL_INVENTORY, INITIAL_SALES, LOCAL_STORAGE_KEYS, APP_NAME } from './constants';
import GeminiConnect from './components/GeminiConnect';
import { isGeminiApiKeyAvailable } from './services/geminiService';


const App: React.FC = () => {
  const [inventory, setInventory] = useLocalStorage<Screen[]>(LOCAL_STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY);
  const [sales, setSales] = useLocalStorage<SoldScreen[]>(LOCAL_STORAGE_KEYS.SALES, INITIAL_SALES);
  const [isGeminiConnected, setIsGeminiConnected] = useLocalStorage<boolean>(LOCAL_STORAGE_KEYS.GEMINI_CONNECTION, false);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(false);

  useEffect(() => {
    setApiKeyAvailable(isGeminiApiKeyAvailable());
    if (!isGeminiApiKeyAvailable()) {
        setIsGeminiConnected(false); // Ensure disconnected if API key is not available
    }
  }, [setIsGeminiConnected]);

  const addSaleItem = (sale: SoldScreen) => {
    setSales(prevSales => [...prevSales, sale]);
  };

  const toggleGeminiConnection = () => {
    if (!apiKeyAvailable) {
        alert("La API Key de Gemini no está configurada en el entorno. No se puede conectar.");
        setIsGeminiConnected(false);
        return;
    }
    setIsGeminiConnected(prev => !prev);
  };
  
  const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-700 ${
          isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );

  const IconInventory = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3M12 15V3.75m0 11.25A2.25 2.25 0 0014.25 13.5h4.5A2.25 2.25 0 0021 11.25V7.5A2.25 2.25 0 0018.75 5.25h-13.5A2.25 2.25 0 003 7.5v3.75c0 1.24 1.01 2.25 2.25 2.25H10.5m0-11.25h.008v.008H10.5v-.008zM10.5 7.5h.008v.008H10.5V7.5zm4.5 0h.008v.008h-.008V7.5z" /></svg>;
  const IconSales = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
  const IconReports = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-1.5m-6-9L9 3m3 3l3-3m-3 7.5V3m3 7.5V3m3 7.5V3M9 13.5h6M9 16.5h6" /></svg>;


  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <header className="bg-slate-800 shadow-lg sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-20 py-3 sm:py-0">
              <div className="flex items-center mb-3 sm:mb-0">
                 <span className="text-3xl mr-2">📱</span>
                <h1 className="text-2xl font-bold text-sky-400">{APP_NAME}</h1>
              </div>
              <nav className="flex flex-wrap justify-center space-x-1 sm:space-x-3 mb-3 sm:mb-0">
                <NavItem to="/"><span className="flex items-center"><IconInventory />Inventario</span></NavItem>
                <NavItem to="/sales"><span className="flex items-center"><IconSales />Ventas</span></NavItem>
                <NavItem to="/reports"><span className="flex items-center"><IconReports />Reportes</span></NavItem>
              </nav>
              <div className="w-full sm:w-auto">
                <GeminiConnect 
                    isConnected={isGeminiConnected} 
                    onToggleConnection={toggleGeminiConnection}
                    isApiKeyAvailable={apiKeyAvailable} 
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-2 sm:px-4 lg:px-6 py-6">
          <Routes>
            <Route path="/" element={<InventoryPage inventory={inventory} setInventory={setInventory} addSale={addSaleItem} />} />
            <Route path="/sales" element={<SalesPage sales={sales} setSales={setSales} />} /> {/* Added setSales prop */}
            <Route path="/reports" element={
                <ReportsPage 
                    inventory={inventory} 
                    sales={sales} 
                    isGeminiConnected={isGeminiConnected}
                    isGeminiApiKeyAvailable={apiKeyAvailable}
                    setInventory={setInventory}
                />} 
            />
          </Routes>
        </main>
        <footer className="bg-slate-800 text-center py-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;