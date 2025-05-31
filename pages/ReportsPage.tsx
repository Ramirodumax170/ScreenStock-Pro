
import React, { useState, useMemo, useCallback } from 'react';
import { Screen, SoldScreen, GeminiAnalysisType, PdfExtractedScreen, ScreenQuality } from '../types';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ScreenForm from '../components/ScreenForm';

interface ReportsPageProps {
  inventory: Screen[];
  sales: SoldScreen[];
  isGeminiConnected: boolean;
  isGeminiApiKeyAvailable: boolean;
  setInventory: React.Dispatch<React.SetStateAction<Screen[]>>;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ inventory, sales, isGeminiConnected, isGeminiApiKeyAvailable, setInventory }) => {
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nlQuery, setNlQuery] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfAnalysisResult, setPdfAnalysisResult] = useState<PdfExtractedScreen[] | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  const [editingPdfItemForForm, setEditingPdfItemForForm] = useState<Screen | null>(null);
  const [editingPdfItemOriginalIndex, setEditingPdfItemOriginalIndex] = useState<number | null>(null);
  const [addedPdfItemIndices, setAddedPdfItemIndices] = useState<Set<number>>(new Set());
  const [isScreenFormModalOpen, setIsScreenFormModalOpen] = useState(false);

  const resetPdfAdditionStates = () => {
    setAddedPdfItemIndices(new Set());
    setEditingPdfItemOriginalIndex(null);
    setEditingPdfItemForForm(null);
  };

  const handleAnalysis = async (type: GeminiAnalysisType) => {
    if (!isGeminiConnected) {
      alert("Por favor, conecte a Gemini IA primero.");
      return;
    }
    setIsLoading(true);
    setCurrentAnalysis(null);
    setPdfAnalysisResult(null);
    if (type === GeminiAnalysisType.PDF_CATALOG_ANALYSIS) {
        resetPdfAdditionStates();
    }


    let result = '';
    try {
      switch (type) {
        case GeminiAnalysisType.PROFITABILITY:
          result = await geminiService.analyzeProfitability(sales);
          break;
        case GeminiAnalysisType.INVENTORY_OPTIMIZATION:
          result = await geminiService.suggestInventoryOptimization(inventory, sales);
          break;
        case GeminiAnalysisType.TREND_IDENTIFICATION:
          result = await geminiService.identifyTrends(sales);
          break;
        case GeminiAnalysisType.NATURAL_LANGUAGE_QUERY:
          if (!nlQuery.trim()) {
            alert("Por favor, ingrese una consulta.");
            result = "Consulta vacía.";
            break;
          }
          result = await geminiService.queryNaturalLanguage(nlQuery, inventory, sales);
          break;
        case GeminiAnalysisType.PROACTIVE_SUGGESTIONS:
            result = await geminiService.getProactiveSuggestions(inventory, sales);
            break;
        case GeminiAnalysisType.PDF_CATALOG_ANALYSIS:
          if (!pdfFile) {
            alert("Por favor, seleccione un archivo PDF.");
            result = "Archivo PDF no seleccionado.";
            break;
          }
          const pdfResult = await geminiService.analyzeProductCatalogPdf(pdfFile);
          if (typeof pdfResult === 'string') {
            result = pdfResult;
          } else {
            setPdfAnalysisResult(pdfResult);
            result = `Análisis de PDF completado. ${pdfResult.length} productos encontrados.`;
            if (pdfResult.length > 0) setIsPdfModalOpen(true);
          }
          break;
        default:
          result = "Tipo de análisis no reconocido.";
      }
    } catch (error) {
        console.error("Error during analysis:", error);
        result = error instanceof Error ? error.message : "Ocurrió un error desconocido durante el análisis.";
    }
    
    setCurrentAnalysis(result);
    setIsLoading(false);
  };

  const stockValuation = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);
  }, [inventory]);

  const topSoldItems = useMemo(() => {
    const counts: { [key: string]: { name: string, count: number } } = {};
    sales.forEach(sale => {
      const key = `${sale.brand} ${sale.model} (${sale.quality})`;
      counts[key] = counts[key] || { name: key, count: 0 };
      counts[key].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [sales]);

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPdfFile(event.target.files[0]);
      setCurrentAnalysis(null); 
      setPdfAnalysisResult(null); 
      resetPdfAdditionStates();
    }
  };
  
  const convertPdfExtractedItemToScreen = useCallback((pdfItem: PdfExtractedScreen, generateNewId: boolean = true): Screen => {
    let qualityValue: ScreenQuality = ScreenQuality.OTHER;
    let originalQualityString = "";

    if (pdfItem.quality) {
      const isAlreadyEnum = Object.values(ScreenQuality).includes(pdfItem.quality as ScreenQuality);
      if (isAlreadyEnum) {
        qualityValue = pdfItem.quality as ScreenQuality;
      } else if (typeof pdfItem.quality === 'string') {
        originalQualityString = pdfItem.quality as string;
        const foundQuality = Object.values(ScreenQuality).find(
          (sqEnumValue) => sqEnumValue.toLowerCase() === originalQualityString.toLowerCase()
        );
        if (foundQuality) {
          qualityValue = foundQuality;
        }
      }
    }

    const combinedNotes: string[] = [];
    if (pdfItem.productDescription) combinedNotes.push(`Desc. Catálogo: ${pdfItem.productDescription}`);
    if (pdfItem.color) combinedNotes.push(`Color Catálogo: ${pdfItem.color}`);
    if (originalQualityString && qualityValue === ScreenQuality.OTHER) {
      combinedNotes.push(`Calidad Catálogo: "${originalQualityString}" (mapeado a Otro)`);
    }
    if (pdfItem.notes) combinedNotes.push(`Notas Catálogo: ${pdfItem.notes}`);

    const notes = combinedNotes.join('. ').trim() || undefined;
    
    const quantity = pdfItem.quantity != null && pdfItem.quantity > 0 ? pdfItem.quantity : 1;
    const purchasePrice = pdfItem.purchasePrice ?? 0;

    return {
      id: generateNewId ? `scr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` : '',
      brand: pdfItem.brand ?? 'N/A',
      model: pdfItem.model ?? 'N/A',
      quality: qualityValue,
      quantity: quantity,
      purchasePrice: purchasePrice,
      supplier: 'Importado PDF', 
      entryDate: new Date().toISOString(),
      notes: notes,
      minStockThreshold: 1
    };
  }, []);


  const handleOpenScreenFormForPdfItem = (item: PdfExtractedScreen, index: number) => {
    const screenForForm = convertPdfExtractedItemToScreen(item, false); 
    setEditingPdfItemForForm(screenForForm);
    setEditingPdfItemOriginalIndex(index);
    setIsScreenFormModalOpen(true);
  };
  
  const handleScreenFormSubmit = (screenData: Screen) => {
    setInventory(prev => [...prev, screenData]);
    if (editingPdfItemOriginalIndex !== null) {
      setAddedPdfItemIndices(prev => new Set(prev).add(editingPdfItemOriginalIndex));
    }
    setIsScreenFormModalOpen(false);
    setEditingPdfItemForForm(null);
    setEditingPdfItemOriginalIndex(null);
  };

  const handleAddAllUnaddedPdfItemsToInventory = () => {
    if (!pdfAnalysisResult) return;

    const itemsToAdd: Screen[] = [];
    const newIndicesAdded = new Set<number>();

    pdfAnalysisResult.forEach((item, index) => {
      if (!addedPdfItemIndices.has(index)) {
        itemsToAdd.push(convertPdfExtractedItemToScreen(item, true));
        newIndicesAdded.add(index);
      }
    });

    if (itemsToAdd.length > 0) {
      setInventory(prevInventory => [...prevInventory, ...itemsToAdd]);
      setAddedPdfItemIndices(prev => new Set([...prev, ...newIndicesAdded]));
      setCurrentAnalysis(prev => `${prev}\n${itemsToAdd.length} producto(s) pendiente(s) añadido(s) al inventario.`);
      alert(`${itemsToAdd.length} producto(s) añadido(s) al inventario.`);
    } else {
      alert("No hay productos pendientes para añadir.");
    }
  };


  const AnalysisButton: React.FC<{ type: GeminiAnalysisType, label: string, requiresOnline?: boolean, specialHandling?: boolean }> = ({ type, label, requiresOnline = true, specialHandling=false }) => (
    <button
      onClick={() => handleAnalysis(type)}
      disabled={(requiresOnline && (!isGeminiConnected || !isGeminiApiKeyAvailable)) || isLoading}
      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-4 rounded-lg shadow-md disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors text-sm"
    >
      {label} {(requiresOnline && !isGeminiApiKeyAvailable) ? "(API Key Requerida)" : (requiresOnline && !isGeminiConnected) ? "(IA Desconectada)" : ""}
    </button>
  );

  const unaddedPdfItemsCount = useMemo(() => {
    if (!pdfAnalysisResult) return 0;
    return pdfAnalysisResult.filter((_, index) => !addedPdfItemIndices.has(index)).length;
  }, [pdfAnalysisResult, addedPdfItemIndices]);


  return (
    <div className="p-4 md:p-6 space-y-8">
      <h1 className="text-3xl font-bold text-cyan-400">Reportes y Análisis</h1>

      <section className="bg-slate-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-slate-300 mb-4">Reportes Básicos (Offline)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-700 p-4 rounded-md">
            <h3 className="text-lg font-medium text-sky-300">Valoración del Inventario</h3>
            <p className="text-2xl font-bold text-green-400 mt-1">€{stockValuation.toFixed(2)}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded-md">
            <h3 className="text-lg font-medium text-sky-300">Top 5 Más Vendidos (por cantidad)</h3>
            {topSoldItems.length > 0 ? (
              <ul className="list-disc list-inside mt-1 text-sm text-slate-200">
                {topSoldItems.map(item => <li key={item.name}>{item.name}: {item.count} uds.</li>)}
              </ul>
            ) : <p className="text-sm text-slate-400 mt-1">No hay suficientes datos de ventas.</p>}
          </div>
        </div>
      </section>

      <section className="bg-slate-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-slate-300 mb-1">Análisis con Inteligencia Artificial (Gemini)</h2>
        <p className="text-xs text-slate-400 mb-5">Requiere conexión a Gemini IA y API Key configurada.</p>
        
        {!isGeminiApiKeyAvailable && (
            <p className="text-center text-yellow-400 bg-yellow-900 border border-yellow-700 p-3 rounded-md">
                La API Key de Gemini no está configurada. Las funciones de análisis avanzado están desactivadas.
            </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <AnalysisButton type={GeminiAnalysisType.PROFITABILITY} label="Análisis de Rentabilidad" />
          <AnalysisButton type={GeminiAnalysisType.INVENTORY_OPTIMIZATION} label="Optimización de Inventario" />
          <AnalysisButton type={GeminiAnalysisType.TREND_IDENTIFICATION} label="Identificar Tendencias de Venta" />
          <AnalysisButton type={GeminiAnalysisType.PROACTIVE_SUGGESTIONS} label="Sugerencia Rápida de IA" />
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-lg font-medium text-sky-300 mb-2">Consulta en Lenguaje Natural</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={nlQuery} 
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="Ej: ¿Cuántas pantallas Samsung vendí el mes pasado?"
                className="flex-grow bg-slate-700 border-slate-600 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={!isGeminiConnected || !isGeminiApiKeyAvailable || isLoading}
              />
              <AnalysisButton type={GeminiAnalysisType.NATURAL_LANGUAGE_QUERY} label="Preguntar a IA" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-sky-300 mb-2">Analizar Catálogo de Productos (PDF)</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handlePdfFileChange}
                className="flex-grow text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                disabled={!isGeminiConnected || !isGeminiApiKeyAvailable || isLoading}
              />
              <AnalysisButton type={GeminiAnalysisType.PDF_CATALOG_ANALYSIS} label="Analizar PDF" specialHandling={true}/>
            </div>
             {pdfFile && <p className="text-xs text-slate-400 mt-1">Archivo seleccionado: {pdfFile.name}</p>}
          </div>
        </div>

        {isLoading && (
          <div className="my-6 flex flex-col items-center">
            <LoadingSpinner />
            <p className="mt-2 text-slate-300">Analizando con Gemini...</p>
          </div>
        )}

        {currentAnalysis && !pdfAnalysisResult && ( 
          <div className="mt-6 bg-slate-700 p-4 rounded-md shadow">
            <h3 className="text-xl font-semibold text-blue-300 mb-2">Resultado del Análisis:</h3>
            <pre className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">{currentAnalysis}</pre>
          </div>
        )}
      </section>

      <Modal isOpen={isPdfModalOpen && !!pdfAnalysisResult} onClose={() => setIsPdfModalOpen(false)} title="Productos Extraídos del PDF">
        {pdfAnalysisResult && pdfAnalysisResult.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300 mb-3">{currentAnalysis || `${pdfAnalysisResult.length} productos encontrados.`}</p>
            {unaddedPdfItemsCount > 0 && (
                <button
                    onClick={handleAddAllUnaddedPdfItemsToInventory}
                    className="w-full mb-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md shadow-md disabled:bg-slate-500"
                    disabled={isLoading}
                >
                    Añadir los {unaddedPdfItemsCount} Productos Pendientes al Inventario
                </button>
            )}
            <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2">
                {pdfAnalysisResult.map((item, index) => {
                const isAdded = addedPdfItemIndices.has(index);
                return (
                    <div key={index} className={`bg-slate-700 p-3 rounded shadow-sm ${isAdded ? 'opacity-60' : ''}`}>
                        <p className="font-semibold text-sky-400">{item.brand || 'N/A'} - {item.model || 'N/A'}</p>
                        <p className="text-xs text-slate-300">Desc: {item.productDescription || 'N/A'}</p>
                        <p className="text-xs text-slate-300">
                            Calidad: {typeof item.quality === 'string' ? item.quality : item.quality || 'N/A'} | 
                            Color: {item.color || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-300">
                            Precio Compra: €{item.purchasePrice != null ? item.purchasePrice.toFixed(2) : 'N/A'} | 
                            Cantidad: {item.quantity != null ? item.quantity : 'N/A'}
                        </p>
                        {item.notes && <p className="text-xs italic text-slate-400">Notas Catálogo: {item.notes}</p>}
                        
                        {isAdded ? (
                        <p className="mt-2 text-xs text-green-400 font-semibold">✔ Añadido al Inventario</p>
                        ) : (
                        <button 
                            onClick={() => handleOpenScreenFormForPdfItem(item, index)}
                            className="mt-2 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                            Revisar y Añadir
                        </button>
                        )}
                    </div>
                );
                })}
            </div>
          </div>
        ) : (
          <p className="text-slate-300">{currentAnalysis || "No se encontraron productos en el PDF o el formato no fue reconocido."}</p>
        )}
      </Modal>
      
      <Modal isOpen={isScreenFormModalOpen} onClose={() => {setIsScreenFormModalOpen(false); setEditingPdfItemForForm(null); setEditingPdfItemOriginalIndex(null);}} title="Añadir Producto desde PDF">
        <ScreenForm 
            onSubmit={handleScreenFormSubmit} 
            onCancel={() => {setIsScreenFormModalOpen(false); setEditingPdfItemForForm(null); setEditingPdfItemOriginalIndex(null);}} 
            initialData={editingPdfItemForForm}
        />
      </Modal>

    </div>
  );
};

export default ReportsPage;