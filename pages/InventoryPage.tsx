
import React, { useState, useMemo, useEffect } from 'react';
import { Screen, SoldScreen, ScreenQuality } from '../types';
import ScreenForm from '../components/ScreenForm';
import Modal from '../components/Modal';

interface InventoryPageProps {
  inventory: Screen[];
  setInventory: React.Dispatch<React.SetStateAction<Screen[]>>;
  addSale: (sale: SoldScreen) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ inventory, setInventory, addSale }) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  
  const [sellingScreen, setSellingScreen] = useState<Screen | null>(null);
  const [salePricePerUnit, setSalePricePerUnit] = useState<number>(0); // Price per unit
  const [quantityToSell, setQuantityToSell] = useState<number>(1);
  const [customerInfo, setCustomerInfo] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuality, setFilterQuality] = useState<ScreenQuality | ''>('');

  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [itemToDeleteDetails, setItemToDeleteDetails] = useState<string>('');

  const [isClearAllStage1ModalOpen, setIsClearAllStage1ModalOpen] = useState(false); // New state for first-stage modal
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false); // Existing state for second-stage (typed) modal
  const [clearAllConfirmationText, setClearAllConfirmationText] = useState('');
  const CLEAR_ALL_INVENTORY_CONFIRMATION_PHRASE = "BORRAR TODO EL INVENTARIO";


  useEffect(() => {
    // console.log("InventoryPage: inventory prop updated. Current value:", JSON.parse(JSON.stringify(inventory)));
  }, [inventory]);

  const handleAddScreen = () => {
    setEditingScreen(null);
    setIsFormModalOpen(true);
  };

  const handleEditScreen = (screen: Screen) => {
    setEditingScreen(screen);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (screenData: Screen) => {
    if (editingScreen) {
      setInventory(prevInv => prevInv.map(s => s.id === screenData.id ? screenData : s));
    } else {
      setInventory(prevInv => [...prevInv, screenData]);
    }
    setIsFormModalOpen(false);
    setEditingScreen(null);
  };

  const handleOpenSellModal = (screen: Screen) => {
    if (screen.quantity <= 0) {
      alert("No hay stock disponible para vender esta pantalla.");
      return;
    }
    setSellingScreen(screen);
    setSalePricePerUnit(screen.purchasePrice * 1.5); // Default unit sale price
    setQuantityToSell(1); // Default to selling 1 unit
    setCustomerInfo('');
  };

  const handleConfirmSell = () => {
    if (!sellingScreen) {
      alert("Error: No se ha seleccionado ninguna pantalla para vender.");
      return;
    }
    if (quantityToSell <= 0) {
      alert("Por favor, ingrese una cantidad válida para vender (mayor que 0).");
      return;
    }
    if (quantityToSell > sellingScreen.quantity) {
      alert(`No hay suficiente stock. Solo quedan ${sellingScreen.quantity} unidades de ${sellingScreen.brand} ${sellingScreen.model}.`);
      return;
    }
    if (salePricePerUnit <= 0) {
      alert("Por favor, ingrese un precio de venta por unidad válido.");
      return;
    }

    const totalSalePrice = salePricePerUnit * quantityToSell;
    const unitPurchasePrice = sellingScreen.purchasePrice;
    const totalProfit = (salePricePerUnit - unitPurchasePrice) * quantityToSell;

    const newSale: SoldScreen = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      originalScreenId: sellingScreen.id,
      brand: sellingScreen.brand,
      model: sellingScreen.model,
      quality: sellingScreen.quality,
      purchasePrice: unitPurchasePrice, // Store per-unit purchase price
      salePrice: totalSalePrice,       // Store total transaction sale price
      saleDate: new Date().toISOString(),
      profit: totalProfit,             // Store total transaction profit
      customerInfo: customerInfo,
      quantitySold: quantityToSell
    };
    addSale(newSale);

    setInventory(prevInventory => 
      prevInventory.map(item => 
        item.id === sellingScreen!.id 
          ? { ...item, quantity: Math.max(0, item.quantity - quantityToSell) }
          : item
      )
    );
    
    setSellingScreen(null);
    setSalePricePerUnit(0);
    setQuantityToSell(1);
    setCustomerInfo('');
  };
  
  const openDeleteConfirmationModal = (screen: Screen) => {
    setItemToDeleteId(screen.id);
    setItemToDeleteDetails(`${screen.brand} ${screen.model} (ID: ${screen.id})`);
    setIsDeleteConfirmModalOpen(true);
  };

  const confirmDeleteItem = () => {
    if (!itemToDeleteId) return;
    setInventory(prevInventory => prevInventory.filter(s => s.id !== itemToDeleteId));
    setIsDeleteConfirmModalOpen(false);
    setItemToDeleteId(null);
    setItemToDeleteDetails('');
  };

  const cancelDeleteItem = () => {
    setIsDeleteConfirmModalOpen(false);
    setItemToDeleteId(null);
    setItemToDeleteDetails('');
  };

  const handleClearAllInventoryStage1 = () => {
    console.log("InventoryPage: Clear All Inventory - Stage 1 button clicked. Opening first custom modal.");
    setIsClearAllStage1ModalOpen(true); // Open the first custom modal
  };

  const proceedToClearAllInventoryStage2 = () => {
    setIsClearAllStage1ModalOpen(false); // Close first modal
    console.log("InventoryPage: Clear All Inventory - User confirmed first custom modal. Opening second (typed) confirmation modal.");
    setClearAllConfirmationText(''); 
    setIsClearAllModalOpen(true); // Open the second (typed confirmation) modal
  };


  const handleConfirmClearAllInventory = () => {
    if (clearAllConfirmationText === CLEAR_ALL_INVENTORY_CONFIRMATION_PHRASE) {
      setInventory([]);
      setIsClearAllModalOpen(false);
      setClearAllConfirmationText('');
      alert("Todo el inventario ha sido eliminado.");
    } else {
      alert(`Confirmación incorrecta. Por favor, escriba "${CLEAR_ALL_INVENTORY_CONFIRMATION_PHRASE}" para confirmar.`);
    }
  };


  const filteredInventory = useMemo(() => {
    return inventory
      .filter(screen => 
        (screen.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
         screen.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (screen.supplier && screen.supplier.toLowerCase().includes(searchTerm.toLowerCase())) || 
         screen.id.toLowerCase().includes(searchTerm.toLowerCase()) 
        ) &&
        (filterQuality === '' || screen.quality === filterQuality)
      )
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [inventory, searchTerm, filterQuality]);

  const totalInventoryValue = useMemo(() => {
    return filteredInventory.reduce((total, screen) => total + (screen.quantity * screen.purchasePrice), 0);
  }, [filteredInventory]);

  const totalInventoryUnits = useMemo(() => {
    return filteredInventory.reduce((total, screen) => total + screen.quantity, 0);
  }, [filteredInventory]);


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-blue-400">Inventario de Pantallas</h1>
        <div className="flex gap-2">
            <button
                onClick={handleAddScreen}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-colors"
            >
                Añadir Nueva Pantalla
            </button>
            {inventory.length > 0 && (
                <button
                    onClick={handleClearAllInventoryStage1}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-600 transition-colors"
                    title="Eliminar todos los productos del inventario"
                >
                    Limpiar Todo el Inventario
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-slate-800 rounded-lg shadow">
        <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-slate-300 mb-1">Buscar</label>
            <input
            type="text"
            id="searchTerm"
            placeholder="ID, Marca, modelo, proveedor..."
            className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div>
            <label htmlFor="filterQuality" className="block text-sm font-medium text-slate-300 mb-1">Filtrar por Calidad</label>
            <select
            id="filterQuality"
            className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filterQuality}
            onChange={(e) => setFilterQuality(e.target.value as ScreenQuality | '')}
            >
            <option value="">Todas las Calidades</option>
            {Object.values(ScreenQuality).map(q => <option key={q} value={q}>{q}</option>)}
            </select>
        </div>
        <div className="md:text-right mt-2 md:mt-0 self-end">
            <p className="text-slate-300">Unidades en Inventario (Filtrado):</p>
            <p className="text-xl font-semibold text-sky-400">{totalInventoryUnits} uds.</p>
        </div>
        <div className="md:text-right mt-2 md:mt-0 self-end">
            <p className="text-slate-300">Valor Total (Filtrado):</p>
            <p className="text-xl font-semibold text-green-400">€{totalInventoryValue.toFixed(2)}</p>
        </div>
      </div>

      {inventory.length === 0 ? (
         <p className="text-center text-slate-400 py-10 text-lg">El inventario está actualmente vacío. Comience añadiendo nuevas pantallas.</p>
      ): filteredInventory.length === 0 ? (
        <p className="text-center text-slate-400 py-10">No hay pantallas en el inventario que coincidan con su búsqueda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInventory.map(screen => {
            const isLowStock = screen.minStockThreshold != null && screen.quantity <= screen.minStockThreshold;
            const isOutOfStock = screen.quantity <= 0;
            return (
            <div key={screen.id} className={`bg-slate-800 rounded-lg shadow-lg p-5 border-l-4 ${isOutOfStock ? 'border-gray-500 opacity-70' : isLowStock ? 'border-red-500' : 'border-blue-500'}`}>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold text-sky-400">{screen.brand} {screen.model}</h2>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    screen.quality === ScreenQuality.ORIGINAL ? 'bg-green-600 text-green-100' :
                    screen.quality === ScreenQuality.OEM ? 'bg-yellow-600 text-yellow-100' :
                    'bg-purple-600 text-purple-100'
                }`}>{screen.quality}</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">ID: {screen.id}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p><strong className="text-slate-300">Cantidad:</strong> <span className={`font-bold ${isOutOfStock ? 'text-gray-400' : isLowStock ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>{screen.quantity}</span> 
                  {isOutOfStock && <span className="text-xs text-gray-400">(Agotado)</span>}
                  {!isOutOfStock && isLowStock && <span className="text-xs text-red-400">(Stock Bajo!)</span>}
                </p>
                <p><strong className="text-slate-300">Precio Compra:</strong> €{screen.purchasePrice.toFixed(2)}</p>
                <p><strong className="text-slate-300">Proveedor:</strong> {screen.supplier || 'N/A'}</p>
                <p><strong className="text-slate-300">Fecha Ingreso:</strong> {new Date(screen.entryDate).toLocaleDateString()}</p>
                {screen.minStockThreshold != null && <p><strong className="text-slate-300">Stock Mínimo:</strong> {screen.minStockThreshold}</p>}
                {screen.notes && <p className="text-xs italic text-slate-500 pt-1">Nota: {screen.notes}</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700 flex flex-wrap gap-2 justify-end">
                <button onClick={() => handleOpenSellModal(screen)} disabled={isOutOfStock} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:bg-slate-500 disabled:cursor-not-allowed">Vender</button>
                <button onClick={() => handleEditScreen(screen)} className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md">Editar</button>
                <button onClick={() => openDeleteConfirmationModal(screen)} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">Eliminar</button>
              </div>
            </div>
          )})}
        </div>
      )}

      <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setEditingScreen(null); }} title={editingScreen ? 'Editar Pantalla' : 'Añadir Nueva Pantalla'}>
        <ScreenForm onSubmit={handleSubmitForm} onCancel={() => { setIsFormModalOpen(false); setEditingScreen(null); }} initialData={editingScreen} />
      </Modal>

      {sellingScreen && (
        <Modal isOpen={!!sellingScreen} onClose={() => setSellingScreen(null)} title={`Vender ${sellingScreen.brand} ${sellingScreen.model}`}>
          <div className="space-y-4">
            <p>Stock Actual: {sellingScreen.quantity}</p>
            <p>Precio de Compra (unidad): €{sellingScreen.purchasePrice.toFixed(2)}</p>
            <div>
              <label htmlFor="quantityToSell" className="block text-sm font-medium text-slate-300">Cantidad a Vender</label>
              <input
                type="number"
                id="quantityToSell"
                value={quantityToSell}
                onChange={(e) => setQuantityToSell(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={sellingScreen.quantity}
                required
                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="salePricePerUnit" className="block text-sm font-medium text-slate-300">Precio de Venta (por unidad)</label>
              <input
                type="number"
                id="salePricePerUnit"
                value={salePricePerUnit}
                onChange={(e) => setSalePricePerUnit(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                required
                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="customerInfo" className="block text-sm font-medium text-slate-300">Cliente/Factura (Opcional)</label>
              <input
                type="text"
                id="customerInfo"
                value={customerInfo}
                onChange={(e) => setCustomerInfo(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="mt-2 text-sm">
                <p>Total Venta: €{(salePricePerUnit * quantityToSell).toFixed(2)}</p>
                <p>Beneficio Estimado: €{((salePricePerUnit - sellingScreen.purchasePrice) * quantityToSell).toFixed(2)}</p>
            </div>
            <div className="flex justify-end space-x-3 pt-3">
              <button onClick={() => setSellingScreen(null)} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Cancelar</button>
              <button onClick={handleConfirmSell} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Confirmar Venta</button>
            </div>
          </div>
        </Modal>
      )}

      <Modal 
        isOpen={isDeleteConfirmModalOpen} 
        onClose={cancelDeleteItem} 
        title="Confirmar Eliminación Individual"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Está seguro de que desea eliminar la pantalla <strong className="text-sky-400">{itemToDeleteDetails}</strong> del inventario?
          </p>
          <p className="text-sm text-yellow-400">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end space-x-3 pt-3">
            <button 
              onClick={cancelDeleteItem} 
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmDeleteItem} 
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              Confirmar Eliminación
            </button>
          </div>
        </div>
      </Modal>

      {/* First Stage - Clear All Inventory Confirmation Modal */}
      <Modal
        isOpen={isClearAllStage1ModalOpen}
        onClose={() => setIsClearAllStage1ModalOpen(false)}
        title="Confirmar Limpieza de Inventario (Paso 1 de 2)"
      >
        <div className="space-y-4">
          <p className="text-lg text-yellow-300 font-semibold">
            ¿Está <strong className="text-red-400">ABSOLUTAMENTE SEGURO</strong> de que desea eliminar <strong className="text-red-400">TODO</strong> el inventario?
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
              onClick={proceedToClearAllInventoryStage2}
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
        title="CONFIRMAR LIMPIEZA TOTAL DE INVENTARIO (Paso 2 de 2)"
      >
        <div className="space-y-4">
          <p className="text-lg text-yellow-300 font-semibold">¡ADVERTENCIA FINAL! Esta acción es irreversible.</p>
          <p className="text-slate-300">
            Para confirmar que desea eliminar <strong className="text-red-400">ABSOLUTAMENTE TODO</strong> el inventario,
            por favor escriba la frase exacta: <strong className="text-sky-300">{CLEAR_ALL_INVENTORY_CONFIRMATION_PHRASE}</strong>
          </p>
          <input
            type="text"
            value={clearAllConfirmationText}
            onChange={(e) => setClearAllConfirmationText(e.target.value)}
            className="mt-1 block w-full bg-slate-700 border-slate-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder={CLEAR_ALL_INVENTORY_CONFIRMATION_PHRASE}
          />
          <div className="flex justify-end space-x-3 pt-3">
            <button
              onClick={() => {setIsClearAllModalOpen(false); setClearAllConfirmationText('');}}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmClearAllInventory}
              disabled={clearAllConfirmationText !== CLEAR_ALL_INVENTORY_CONFIRMATION_PHRASE}
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

export default InventoryPage;
