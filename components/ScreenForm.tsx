
import React, { useState, useEffect } from 'react';
import { Screen, ScreenQuality } from '../types';

interface ScreenFormProps {
  onSubmit: (screen: Screen) => void;
  onCancel: () => void;
  initialData?: Screen | null;
}

const ScreenForm: React.FC<ScreenFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [screen, setScreen] = useState<Partial<Screen>>(
    initialData || {
      brand: '',
      model: '',
      quality: ScreenQuality.OEM,
      quantity: 0,
      purchasePrice: 0,
      supplier: '',
      entryDate: new Date().toISOString().split('T')[0], // Default to today
      notes: '',
      minStockThreshold: 1,
    }
  );

  useEffect(() => {
    if (initialData) {
      setScreen({
        ...initialData,
        entryDate: initialData.entryDate ? new Date(initialData.entryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
       setScreen({
        brand: '', model: '', quality: ScreenQuality.OEM, quantity: 0, purchasePrice: 0, supplier: '',
        entryDate: new Date().toISOString().split('T')[0], notes: '', minStockThreshold: 1,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScreen(prev => ({ ...prev, [name]: name === 'quantity' || name === 'purchasePrice' || name === 'minStockThreshold' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screen.brand || !screen.model || screen.quantity == null || screen.purchasePrice == null || !screen.entryDate) {
        alert("Please fill in all required fields: Brand, Model, Quantity, Purchase Price, Entry Date.");
        return;
    }
    onSubmit({
      id: initialData?.id || `scr-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      ...screen,
      entryDate: new Date(screen.entryDate!).toISOString(), // Ensure it's ISO string
    } as Screen);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div>
        <label htmlFor="brand" className="block text-sm font-medium text-slate-300">Marca</label>
        <input type="text" name="brand" id="brand" value={screen.brand} onChange={handleChange} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-slate-300">Modelo</label>
        <input type="text" name="model" id="model" value={screen.model} onChange={handleChange} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="quality" className="block text-sm font-medium text-slate-300">Calidad</label>
        <select name="quality" id="quality" value={screen.quality} onChange={handleChange} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
          {Object.values(ScreenQuality).map(q => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Cantidad</label>
        <input type="number" name="quantity" id="quantity" value={screen.quantity} onChange={handleChange} required min="0" className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="purchasePrice" className="block text-sm font-medium text-slate-300">Precio de Compra (€)</label>
        <input type="number" name="purchasePrice" id="purchasePrice" value={screen.purchasePrice} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="minStockThreshold" className="block text-sm font-medium text-slate-300">Umbral Stock Mínimo</label>
        <input type="number" name="minStockThreshold" id="minStockThreshold" value={screen.minStockThreshold} onChange={handleChange} min="0" className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="supplier" className="block text-sm font-medium text-slate-300">Proveedor</label>
        <input type="text" name="supplier" id="supplier" value={screen.supplier} onChange={handleChange} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="entryDate" className="block text-sm font-medium text-slate-300">Fecha de Ingreso</label>
        <input type="date" name="entryDate" id="entryDate" value={screen.entryDate} onChange={handleChange} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-300">Notas</label>
        <textarea name="notes" id="notes" value={screen.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500">
          {initialData ? 'Actualizar Pantalla' : 'Añadir Pantalla'}
        </button>
      </div>
    </form>
  );
};

export default ScreenForm;
    