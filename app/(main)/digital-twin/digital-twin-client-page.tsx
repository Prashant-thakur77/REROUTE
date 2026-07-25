'use client';

import { useState, useEffect } from 'react';
import { useQueryState, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs';
import { decompressArchData } from '@/lib/utils/url-compression';
import DigitalTwinDashboard from '@/components/digital-twin/display/dashboard';
import CreationForm from '@/components/digital-twin/forms/creation-form';
import DigitalTwinCanvas from '@/components/digital-twin/canvas/digital-twin-canvas';
import { selectTemplate, getTemplateInfo } from '@/lib/template-selector';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import DigitalTwinEditSkeleton from '@/components/digital-twin/display/DigitalTwinEditSkeleton';
import { supabaseClient } from '@/lib/supabase/client';
import dynamic from "next/dynamic";
const SupplyChainView = dynamic(() => import("@/components/supply-chain"), { ssr: false });

export default function DigitalTwinClientPage() {
  const [twinId, setTwinId] = useQueryState('twinId', parseAsString);
  const [view, setView] = useQueryState('view', parseAsString);
  const [archParam] = useQueryState('arch', parseAsString);
  const [formParam] = useQueryState('form', parseAsString);
  const [activeTwinData, setActiveTwinData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  // True only after a load attempt for the current twinId completes with no data.
  const [notFound, setNotFound] = useState(false);
  type ViewMode = "graph" | "map";
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  // URL state for form data - to recreate twin from URL parameters
  const [industryParam] = useQueryState('industry', parseAsString);
  const [customIndustryParam] = useQueryState('customIndustry', parseAsString);
  const [productCharacteristicsParam] = useQueryState('productCharacteristics', parseAsArrayOf(parseAsString));
  const [supplierTiersParam] = useQueryState('supplierTiers', parseAsString);
  const [operationsLocationParam] = useQueryState('operationsLocation', parseAsArrayOf(parseAsString));
  const [countryParam] = useQueryState('country', parseAsString);
  const [currencyParam] = useQueryState('currency', parseAsString);
  const [shippingMethodsParam] = useQueryState('shippingMethods', parseAsArrayOf(parseAsString));
  const [annualVolumeTypeParam] = useQueryState('annualVolumeType', parseAsString);
  const [annualVolumeValueParam] = useQueryState('annualVolumeValue', parseAsInteger);
  const [risksParam] = useQueryState('risks', parseAsArrayOf(parseAsString));


  // Helper to check compressed form data or legacy individual params
  const hasFormDataInUrl = () => {
    return (
      !!formParam || (
        industryParam && 
        productCharacteristicsParam && 
        supplierTiersParam && 
        operationsLocationParam && 
        currencyParam && 
        shippingMethodsParam && 
        annualVolumeTypeParam && 
        annualVolumeValueParam && 
        risksParam
      )
    );
  };

  // Load twin data when twinId changes
  useEffect(() => {
    if (twinId) {
      // Clear any stale "not found" from a previous twinId before we start loading.
      setNotFound(false);
      // Only set loading state if we don't already have some twin data (prevents unmounting canvass during save)
      if (!activeTwinData) {
        setIsLoading(true);
      }
      
      // If there's an arch parameter, we'll let the canvas handle the state
      // Only load from localStorage if there's no arch parameter
      if (!archParam) {
        // First, try to recreate twin from URL parameters if available
        if (formParam) {
          try {
            const formDataFromUrl = decompressArchData(formParam);

            console.log('Recreating twin from COMPRESSED URL parameters...');

            // Select template based on decompressed form data
            const { nodes, edges } = selectTemplate(formDataFromUrl);
            const templateInfo = getTemplateInfo(formDataFromUrl);

            const twinData = {
              ...formDataFromUrl,
              nodes,
              edges,
              templateInfo,
              createdAt: new Date().toISOString(),
            };

            console.log('Twin recreated from COMPRESSED URL:', twinData);
            setActiveTwinData(twinData);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error recreating twin from compressed form param:', error);
          }
        } else if (hasFormDataInUrl()) {
          console.log('Recreating twin from URL parameters...');
          
          const formDataFromUrl = {
            industry: industryParam!,
            customIndustry: customIndustryParam || "",
            productCharacteristics: productCharacteristicsParam!,
            supplierTiers: supplierTiersParam!,
            operationsLocation: operationsLocationParam!,
            country: countryParam || "",
            currency: currencyParam!,
            shippingMethods: shippingMethodsParam!,
            annualVolumeType: annualVolumeTypeParam as "units" | "currency",
            annualVolumeValue: annualVolumeValueParam!,
            risks: risksParam!
          };

          try {
            // Select the appropriate template based on form data
            const { nodes, edges } = selectTemplate(formDataFromUrl);
            const templateInfo = getTemplateInfo(formDataFromUrl);

            const twinData = {
              ...formDataFromUrl,
              nodes,
              edges,
              templateInfo,
              createdAt: new Date().toISOString()
            };

            console.log('Twin recreated from URL parameters:', twinData);
            setActiveTwinData(twinData);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error recreating twin from URL parameters:', error);
          }
        }

        // Fallback 1: localStorage (for locally-created twins)
        const localData = localStorage.getItem(`supplyChain-${twinId}`);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            setActiveTwinData(parsedData);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing localStorage twin data:', error);
          }
        }

        // Fallback 2: Fetch directly from Supabase DB (for DB-persisted twins)
        const fetchFromDb = async () => {
          console.log('💾 No localStorage found — fetching supply chain from Supabase:', twinId);
          try {
            const [{ data: scData, error: scErr }, { data: nodes }, { data: edges }] = await Promise.all([
              supabaseClient.from('supply_chains').select('*').eq('supply_chain_id', twinId).single(),
              supabaseClient.from('nodes').select('*').eq('supply_chain_id', twinId),
              supabaseClient.from('edges').select('*').eq('supply_chain_id', twinId),
            ]);

            if (scErr || !scData) {
              console.error('Supply chain not found in DB:', scErr?.message);
              setActiveTwinData(null);
              setNotFound(true);
              setIsLoading(false);
              return;
            }

            const formData = scData.form_data as any || {};
            const org = scData.organisation as any || {};

            // Build canvas-compatible node/edge format from DB rows
            const canvasNodes = (nodes || []).map((n: any, idx: number) => ({
              id: n.node_id,
              type: 'supply-chain-node',
              position: n.data?.position || { x: 100 + (idx % 4) * 280, y: 100 + Math.floor(idx / 4) * 200 },
              data: {
                label: n.name,
                nodeType: n.type,
                description: n.description,
                location: n.address,
                lat: n.location_lat,
                lng: n.location_lng,
                capacity: n.capacity,
                riskLevel: n.risk_level,
                ...n.data,
              },
            }));

            const canvasEdges = (edges || []).map((e: any) => ({
              id: e.edge_id,
              source: e.from_node_id,
              target: e.to_node_id,
              type: e.type || 'smoothstep',
              label: e.data?.label || '',
              data: e.data || {},
            }));

            const twinData = {
              // Form-compatible fields
              industry: formData.industry || org.industry || 'General',
              customIndustry: formData.customIndustry || '',
              productCharacteristics: formData.productCharacteristics || [],
              supplierTiers: formData.supplierTiers || '1',
              operationsLocation: formData.operationsLocation || [org.location || 'Global'],
              country: formData.country || 'India',
              currency: formData.currency || 'USD',
              shippingMethods: formData.shippingMethods || [],
              annualVolumeType: formData.annualVolumeType || 'units',
              annualVolumeValue: formData.annualVolumeValue || 0,
              risks: formData.risks || [],
              // Supply chain metadata
              name: scData.name,
              description: scData.description,
              supply_chain_id: scData.supply_chain_id,
              // Canvas data
              nodes: canvasNodes,
              edges: canvasEdges,
              // DB source flag
              fromDatabase: true,
              createdAt: scData.timestamp || new Date().toISOString(),
            };

            console.log(`✅ Loaded supply chain "${scData.name}" from DB: ${canvasNodes.length} nodes, ${canvasEdges.length} edges`);
            setActiveTwinData(twinData);
            setIsLoading(false);
          } catch (dbErr: any) {
            console.error('Error fetching supply chain from DB:', dbErr.message);
            setActiveTwinData(null);
            setNotFound(true);
            setIsLoading(false);
          }
        };

        fetchFromDb();
      } else {
        // When arch param exists, set minimal twin data to indicate we have a twin
        // but let the canvas handle the actual node/edge state from the URL
        setActiveTwinData({ hasArchData: true });
        setIsLoading(false);
      }
    } else {
      setActiveTwinData(null);
      setNotFound(false);
      setIsLoading(false);
    }
  }, [twinId, archParam, formParam, industryParam, productCharacteristicsParam, supplierTiersParam, operationsLocationParam, currencyParam, shippingMethodsParam, annualVolumeTypeParam, annualVolumeValueParam, risksParam]);

  const handleCreationCancel = () => {
    setView(null, { scroll: false });
  };

  const handleCreationSuccess = (data: any) => {
    console.log('Supply chain created with form data:', data);
    console.log(' Form Data Details:', {
      industry: data.industry,
      customIndustry: data.customIndustry,
      productCharacteristics: data.productCharacteristics,
      supplierTiers: data.supplierTiers,
      operationsLocation: data.operationsLocation,
      country: data.country,
      currency: data.currency,
      shippingMethods: data.shippingMethods,
      annualVolumeType: data.annualVolumeType,
      annualVolumeValue: data.annualVolumeValue,
      risks: data.risks
    });

    // Select the appropriate template based on form data
    const { nodes, edges } = selectTemplate(data);
    const templateInfo = getTemplateInfo(data);

    console.log(`Selected template: ${templateInfo.templateName} - ${templateInfo.reason}`);

    // Create dummy twin ID with a strict UUID so Supabase doesn't reject it
    const twinId = crypto.randomUUID();
    
    // Store the template data temporarily for the canvas to use
    const twinData = {
      ...data,
      nodes,
      edges,
      templateInfo,
      createdAt: new Date().toISOString()
    };
    
    
    console.log(' Digital twin created with dummy ID:', twinId);
    console.log(' Template data stored temporarily:', twinData);
    
    // Store the data in localStorage so it can be retrieved when loading the canvas
    localStorage.setItem(`supplyChain-${twinId}`, JSON.stringify(twinData));
    console.log('Template data stored in localStorage with key:', `supplyChain-${twinId}`);
    
    // Close the dialog
    setView(null, { scroll: false });
    
    // Set the twin ID to show the canvas
    setTwinId(twinId);
  };

  // If a twinId is present, we would show the canvas/details view.
  if (twinId) {
    // Show the real "not found" state only after a load attempt has confirmed it.
    // Any other state while a twin is selected (loading, or the transient frame
    // right after twinId changes) shows the skeleton — never the empty/not-found flash.
    if (!activeTwinData) {
      if (notFound) {
        return (
          <div className="flex items-center justify-center h-full flex-1 p-4 sm:p-6">
            <div className="text-center w-full max-w-md">
              <p className="text-base sm:text-lg text-muted-foreground">Digital twin not found.</p>
              <button
                onClick={() => setTwinId(null)}
                className="mt-4 inline-flex items-center justify-center min-h-[40px] px-4 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        );
      }
      return <DigitalTwinEditSkeleton />;
    }

    if (activeTwinData) {
      return (
        <div className="relative w-full h-full flex flex-col flex-1">
          {/* View toggle */}
          <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 rounded-full border border-white/10 bg-black/70 p-1.5 shadow-2xl backdrop-blur-xl max-w-[calc(100vw-1.5rem)]">
            <button
              onClick={() => setViewMode("graph")}
              className={`rounded-full px-3.5 sm:px-4 py-2 min-h-[40px] text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                viewMode === "graph"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.5)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Graph View
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`rounded-full px-3.5 sm:px-4 py-2 min-h-[40px] text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                viewMode === "map"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.5)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              🗺️ Map
            </button>
          </div>

          {viewMode === "graph" && (
            activeTwinData.hasArchData ? (
              <DigitalTwinCanvas />
            ) : (
              <DigitalTwinCanvas
                initialNodes={activeTwinData.nodes}
                initialEdges={activeTwinData.edges}
              />
            )
          )}
          
          {viewMode === "map" && (
            <div className="absolute inset-0 z-0 bg-[color:var(--map-bg)] rounded-xl overflow-hidden"
              style={{ top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column" }}
            >
              <SupplyChainView twinId={twinId} mode={viewMode} />
            </div>
          )}
        </div>
      );
    }
  }

  // The dashboard is always rendered, and the dialog is overlaid on top.
  return (
    <>
      <main className="flex-1 overflow-auto">
        <DigitalTwinDashboard />
      </main>
      <Dialog
        open={view === 'create'}
        onOpenChange={(isOpen) => !isOpen && setView(null, { scroll: false })}
      >
        <DialogContent className="sm:max-w-2xl p-0" hideCloseIcon={true}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Create a New Digital Twin
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Fill out the steps below to build your supply chain model.
            </DialogDescription>
          </DialogHeader>
          <CreationForm
            onSuccess={handleCreationSuccess}
            onCancel={handleCreationCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 