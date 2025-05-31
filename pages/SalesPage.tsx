
import React, { useMemo, useState } from 'react';
import { SoldScreen } from '../types';
import Modal from '../components/Modal';

interface SalesPageProps {
  sales: SoldScreen[];
  setSales: React.Dispatch<React.SetStateAction<SoldScreen[]>>; 
}

const SalesPage: React.FC<SalesPageProps> = ({ sales, setSales }) => {
  const [isClearAllStage1ModalOpen, setIsClearAllStage1ModalOpen] = useState(false); // New state for first-stage modal
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false); // Existing state for second-stage (typed) modal
  const [clearAllConfirmationText, setClearAllConfirmationText] = useState('');
  const CLEAR_ALL_SALES_CONFIRMATION_PHRASE = "BORRAR TODAS LAS VENTAS";

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [sales]);

  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.salePrice, 0); // salePrice is total for transaction
  }, [sales]);

  const totalProfit = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.profit, 0); // profit is total for transaction
  }, [sales]);

  const totalUnitsSold = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
  }, [sales]);

  const handleClearAllSalesStage1 = () => {
    console.log("SalesPage: Clear All Sales - Stage 1 button clicked. Opening first custom modal.");
    setIsClearAllStage1ModalOpen(true); // Open the first custom modal
  };
  
  const proceedToClearAllSalesStage2 = () => {
    setIsClearAllStage1ModalOpen(false); // Close first modal
    console.log("SalesPage: Clear All Sales - User confirmed first custom modal. Opening second (typed) confirmation modal.");
    setClearAllConfirmationText(''); 
    setIsClearAllModalOpen(true); // Open the second (typed confirmation) modal
  };

  const handleConfirmClearAllSales = () => {
    if (clearAllConfirmationText === CLEAR_ALL_SALES_CONFIRMATION_PHRASE) {
      setSales([]);
      setIsClearAllModalOpen(false);
      setClearAllConfirmationText('');
      alert("Todo el historial de ventas ha sido eliminado.");
    } else {
      alert(`Confirmación incorrecta. Por favor, escriba "${CLEAR_ALL_SALES_CONFIRMATION_PHRASE}" para confirmar.`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-emerald-400">Historial de Ventas</h1>
        {sales.length > 0 && (
            <button
                onClick={handleClearAllSalesStage1}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-600 transition-colors"
                title="Eliminar todos los registros de ventas"
            >
                Limpiar Historial de Ventas
            </button>
        )}
      </div>
      

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Ingresos Totales</h2>
          <p className="text-4xl font-bold text-green-400">€{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Beneficio Total Estimado</h2>
          <p className="text-4xl font-bold text-teal-400">€{totalProfit.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Total Unidades Vendidas</h2>
          <p className="text-4xl font-bold text-sky-400">{totalUnitsSold} uds.</p>
        </div>
      </div>

      {sales.length === 0 ? (
        <p className="text-center text-slate-400 py-10 text-lg">No hay ventas registradas todavía.</p>
      ) : (
        <div className="space-y-4">
          {sortedSales.map(sale => (
            <div key={sale.id} className="bg-slate-800 rounded-lg shadow-md p-5 border-l-4 border-emerald-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                 <h3 className="text-lg font-semibold text-sky-300">{sale.brand} {sale.model} <span className="text-xs px-1.5 py-0.5 bg-slate-700 rounded-full">{sale.quality}</span></h3>
                 <p className="text-sm text-slate-400 mt-1 sm:mt-0">{new Date(sale.saleDate).toLocaleString()}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                <p><strong className="text-slate-300">Cant. Vendida:</strong> {sale.quantitySold} uds.</p>
                <p><strong className="text-slate-300">Precio Venta Total:</strong> <span className="text-green-400 font-medium">€{sale.salePrice.toFixed(2)}</span></p>
                <p><strong className="text-slate-300">Beneficio Total:</strong> <span className="text-teal-400 font-medium">€{sale.profit.toFixed(2)}</span></p>
                {sale.customerInfo && <p className="col-span-2 md:col-span-1"><strong className="text-slate-300">Cliente/Factura:</strong> {sale.customerInfo}</p>}
              </div>
               <p className="text-xs text-slate-500 mt-2">ID Venta: {sale.id} (Original ID: {sale.originalScreenId})</p>
            </div>
          ))}
        </div>
      )}
      
      {/* First Stage - Clear All Sales Confirmation Modal */}
      <Modal
        isOpen={isClearAllStage1ModalOpen}
        onClose={() => setIsClearAllStage1ModalOpen(false)}
        title="Confirmar Limpieza de Ventas (Paso 1 de 2)"
      >
        <div className="space-y-4">
          <p className="text-lg text-yellow-300 font-semibold">
            ¿Está <strong className="text-red-400">ABSOLUTAMENTE SEGURO</strong> de que desea eliminar <strong className="text-red-400">TODO</strong> el historial de ventas?
          </p>
          <p className="text-slate-300">Esta acción es irreversible y no se podrá deshacer.</p>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              onClick={() => setIsClearAllStage1ModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={proceedToClearAllSalesStage2}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md"
            >
              Continuar con Borrado
            </button>
          </div>
        </div>
      </Modal>

      {/* Second Stage - Typed Confirmation Modal (existing) */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => {setIsClearAllModalOpen(false); setClearAllConfirmationText('');}}
        title="CONFIRMAR LIMPIEZA TOTAL DE VENTAS (Paso 2 de 2)"
      >
        <div className="space-y-4">
          <p className="text-lg text-yellow-300 font-semibold">¡ADVERTENCIA FINAL! Esta acción es irreversible.</p>
          <p className="text-slate-300">
            Para confirmar que desea eliminar <strong className="text-red-400">ABSOLUTAMENTE TODO</strong> el historial de ventas,
            por favor escriba la frase exacta: <strong className="text-sky-300">{CLEAR_ALL_SALES_CONFIRMATION_PHRASE}</strong>
          </p>
          <input
            type="text"
            value={clearAllConfirmationText}
            onChange={(e) => setClearAllConfirmationText(e.target.value)}
            className="mt-1 block w-full bg-slate-700 border-slate-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder={CLEAR_ALL_SALES_CONFIRMATION_PHRASE}
          />
          <div className="flex justify-end space-x-3 pt-3">
            <button
              onClick={() => {setIsClearAllModalOpen(false); setClearAllConfirmationText('');}}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmClearAllSales}
              disabled={clearAllConfirmationText !== CLEAR_ALL_SALES_CONFIRMATION_PHRASE}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Confirmar Limpieza Definitiva
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalesPage;
