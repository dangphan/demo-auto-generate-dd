import { useEffect, useRef, useState } from "react";
import CopilotKitChatProvider from "../CopilotKitChatProvider";
import { useCoAgent, useCopilotChat } from "@copilotkit/react-core";
import { Loader2 } from "lucide-react";
import {
  extractScheduleData,
  isValidJsonString,
  roundToNearestTen,
} from "../../utils/handleData";

function distributeEqually(total, slots) {
  if (slots < 2) return Array(slots).fill(roundToNearestTen(total));
  const step = Math.floor(total / (slots - 1));
  let arr = Array.from({ length: slots }, (_, i) =>
    roundToNearestTen(i * step)
  );
  arr[slots - 1] = roundToNearestTen(total);
  return arr;
}

function calculateSupplierIdeal(original, totalItems) {
  // Supplier Ideal: starts with 20% of Original Slot 1, increases to max items
  const idealValues = [];

  if (original.length > 0) {
    // First slot: 20% of Original Slot 1
    const firstSlotValue = Math.floor(original[0] * 0.2);
    idealValues.push(roundToNearestTen(firstSlotValue));

    // Calculate remaining slots with increasing values
    const remainingSlots = original.length - 1;
    const remainingItems = totalItems - firstSlotValue;

    if (remainingSlots > 0) {
      // Distribute remaining items across remaining slots
      const step = Math.floor(remainingItems / remainingSlots);
      for (let i = 1; i < original.length - 1; i++) {
        idealValues.push(roundToNearestTen(firstSlotValue + i * step));
      }
      // Last slot gets the remaining items to reach total
      idealValues.push(totalItems);
    }
  }

  return idealValues;
}

function calculateBuyerRequested(original, totalItems) {
  // Buyer Requested: first slot = 20% of original slot 2, rest = 20% less than original, last = 20% less than total
  const requestedValues = [];

  if (original.length > 0) {
    // First slot: 20% of original slot 2 (or slot 1 if only 1 slot)
    const firstSlotValue =
      original.length > 1
        ? Math.floor(original[1] * 0.2)
        : Math.floor(original[0] * 0.2);
    requestedValues.push(roundToNearestTen(firstSlotValue));

    // Middle slots: 20% less than corresponding original slots
    for (let i = 1; i < original.length - 1; i++) {
      const buyerValue = Math.floor(original[i] * 0.8);
      requestedValues.push(roundToNearestTen(buyerValue));
    }

    // Last slot: 20% less than total items
    const lastSlotValue = Math.floor(totalItems * 0.8);
    requestedValues.push(roundToNearestTen(lastSlotValue));
  }

  return requestedValues;
}

function calculateFinalAgreement(original, adjustment) {
  // Final Agreement = Original + Adjustment
  return original.map((val, index) => {
    const adjValue = adjustment[index] || 0;
    return val + adjValue;
  });
}

function AutoNegotiationPanel({
  deliverySlots,
  setDeliverySlots,
  items,
  setItems,
  shortfall,
  setShortfall,
  storage,
  setStorage,
  reserved,
  setReserved,
  mpq,
  setMpq,
  // isLoading,
}) {
  const inputClass =
    "w-full rounded px-1 border border-gray-400 focus:border-blue-500 focus:outline-none";
  return (
    <div className="bg-white/30 rounded-xl p-4 mb-6 w-full shadow">
      <h2 className="text-xl font-bold mb-2">Negotiation Settings</h2>

      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
        <div className="mb-2">
          <label className="block font-medium">
            No. of Delivery Slots: {deliverySlots}
          </label>
          <input
            // disabled={isLoading}
            type="range"
            min={3}
            max={8}
            value={deliverySlots}
            onChange={(e) => setDeliverySlots(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="mb-2">
          <label className="block font-medium">No. of Items: {items}</label>
          <input
            // disabled={isLoading}
            type="range"
            min={0}
            max={1500}
            step={10}
            value={items}
            onChange={(e) => setItems(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block font-medium">SHORTFALL</label>
          <input
            // disabled={isLoading}
            type="number"
            value={shortfall}
            onChange={(e) => setShortfall(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block font-medium">STORAGE</label>
          <input
            // disabled={isLoading}
            type="number"
            value={storage}
            onChange={(e) => setStorage(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block font-medium">
            DEFAULT_SELLER_RESERVED_VALUE
          </label>
          <input
            // disabled={isLoading}
            type="number"
            step="0.01"
            value={reserved}
            onChange={(e) => setReserved(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block font-medium">MPQ</label>
          <input
            // disabled={isLoading}
            type="number"
            value={mpq}
            onChange={(e) => setMpq(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

function NegotiatorStrategyPanel({
  ourNegotiator,
  setOurNegotiator,
  partnerNegotiator,
  setPartnerNegotiator,
}: // isLoading,
any) {
  const negotiatorOptions = [
    "ToughNegotiator",
    "AspirationNegotiator",
    "SAONegotiator",
    "RandomNegotiator",
    "LinearTBNegotiator",
    "ConcederTBNegotiator",
    "BoulwareTBNegotiator",
    "TimeBasedNegotiator",
  ];

  const renderNegotiatorSection = (title, value, setValue) => (
    <div className="mb-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-2">
        {negotiatorOptions.map((option) => (
          <label
            key={option}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <input
              // disabled={isLoading}
              type="radio"
              name={title.toLowerCase().replace(" ", "")}
              value={option}
              checked={value === option}
              onChange={(e) => setValue(e.target.value)}
              className="text-blue-600"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white/30 rounded-xl p-4 mb-6 w-full shadow">
      <h2 className="text-xl font-bold mb-2">Negotiator Strategy</h2>
      {renderNegotiatorSection(
        "Our Negotiator",
        ourNegotiator,
        setOurNegotiator
      )}
      {renderNegotiatorSection(
        "Partner Negotiator",
        partnerNegotiator,
        setPartnerNegotiator
      )}
    </div>
  );
}

function NegotiationPanel({
  deliverySlots,
  items,
  original,
  setOriginal,
  ideal,
  setIdeal,
  buyer,
  setBuyer,
  adjustment,
  setAdjustment,
  finalAgreement,
  setFinalAgreement,
}: // isLoading,
any) {
  // Helper to render a row of inputs
  const renderRow = (label, arr, setArr, editable = true) => (
    <tr>
      <th className="p-1 text-right font-semibold bg-gray-100">{label}</th>
      {arr.map((val, i) => (
        <td key={i} className="p-1">
          {editable ? (
            <input
              readOnly={label === "Final Agreement" || label === "Adjustment"}
              style={{ background: label === "Final Agreement" || label === "Adjustment" ? "#f8f9f9" : "none" }}
              type="number"
              value={val ?? ""}
              min={0}
              max={items}
              onChange={(e) => {
                const newArr = [...arr];
                newArr[i] = roundToNearestTen(Number(e.target.value));
                setArr(newArr);
                if (label === "Final Agreement") setFinalAgreement(newArr);
                if (label === "Adjustment") setAdjustment(newArr);
              }}
              className="w-20 rounded px-1 border border-gray-300"
            />
          ) : (
            <span className="font-mono">{val}</span>
          )}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="bg-white/30 rounded-xl p-4 mb-6 w-full shadow overflow-x-auto">
      <h2 className="text-xl font-bold mb-2">Negotiation Panel</h2>
      <table className="w-full text-center border-separatNegotiation Panele border-spacing-0">
        <thead>
          <tr>
            <th className="p-1 bg-gray-100"></th>
            {Array.from({ length: deliverySlots }).map((_, i) => (
              <th key={i} className="p-1 bg-gray-100">
                Slot {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderRow("Original", original, setOriginal)}
          {renderRow("Supplier Ideal", ideal, setIdeal)}
          {renderRow("Buyer Requested", buyer, setBuyer)}
          {renderRow("Adjustment", adjustment, setAdjustment)}
          {renderRow("Final Agreement", finalAgreement, setFinalAgreement)}
        </tbody>
      </table>
    </div>
  );
}

function NegotiationAnalysisPanel({ agentState }: any) {
  const isHaveSourceImages = agentState?.e2b?.sources?.length > 0;
  const isLoading = agentState?.processing?.completed === false;
  return (
    <div className="bg-white/30 rounded-xl p-4 mb-6 w-full shadow">
      <h2 className="text-xl font-bold mb-2 ">Negotiation Analysis</h2>
      {isHaveSourceImages ? (
        <p className="text-center italic">Result from E2B:</p>
      ) : (
        <p className="text-center italic">
          {isLoading ? "" : "No results from E2B yet."}
        </p>
      )}
      <div className="flex items-center justify-center lg:flex-row flex-col">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin m-4" />}
        {isHaveSourceImages &&
          agentState.e2b.sources.map((source: string, sourceIndex: number) => (
            <img
              key={sourceIndex}
              src={source}
              alt={"Source Image" + sourceIndex}
              className="lg:w-[48%] md:w-3/4 h-fit rounded-lg mb-8 m-4"
            />
          ))}
      </div>
    </div>
  );
}

const DEFAULT_ORIGINAL = [0, 200, 450, 700, 950, 950, 1200, 1450];
const DEFAULT_IDEAL = [0, 200, 200, 500, 500, 750, 750, 1000];
const BUYER_REQUESTED = [0, 200, 200, 400, 400, 600, 600, 1100];
const DEFAULT_DELIVERY_SLOTS = 8;
const DEFAULT_ITEMS = 1000;

function YourMainContent() {
  // --- Auto Negotiation State ---
  const [deliverySlots, setDeliverySlots] = useState(DEFAULT_DELIVERY_SLOTS);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [shortfall, setShortfall] = useState(10);
  const [storage, setStorage] = useState(20);
  const [reserved, setReserved] = useState(0.75);
  const [mpq, setMpq] = useState(50);

  // --- Negotiator Strategy State ---
  const [ourNegotiator, setOurNegotiator] = useState("AspirationNegotiator");

  const [partnerNegotiator, setPartnerNegotiator] = useState(
    "AspirationNegotiator"
  );

  // --- Negotiation Schedules ---
  const [original, setOriginal] = useState([
    0, 200, 450, 700, 950, 950, 1200, 1450,
  ]);
  const [ideal, setIdeal] = useState(() =>
    calculateSupplierIdeal(distributeEqually(items, deliverySlots), items)
  );
  const [buyer, setBuyer] = useState(() =>
    calculateBuyerRequested(distributeEqually(items, deliverySlots), items)
  );
  const [adjustment, setAdjustment] = useState(() =>
    Array(deliverySlots).fill("")
  );
  const [finalAgreement, setFinalAgreement] = useState(() =>
    Array(deliverySlots).fill("")
  );

  // Update schedules when slots/items change
  useEffect(() => {
    if (deliverySlots == DEFAULT_DELIVERY_SLOTS) {
      const newOriginal = DEFAULT_ORIGINAL;
      setOriginal(newOriginal);
      setIdeal(DEFAULT_IDEAL);
      setBuyer(BUYER_REQUESTED);
    } else {
      const newOriginal = distributeEqually(items, deliverySlots);
      setOriginal(newOriginal);
      setIdeal(calculateSupplierIdeal(newOriginal, items));
      setBuyer(calculateBuyerRequested(newOriginal, items));
    }
    setAdjustment(Array(deliverySlots).fill(""));
    setFinalAgreement(Array(deliverySlots).fill(""));
  }, [items, deliverySlots]);

  const { runChatCompletion } = useCopilotChat();

  // --- Result Panel (placeholder logic) ---
  // const adjustment = 'N/A';
  // const finalAgreement = original;

  // Example shared state (proverbs)
  const lastedState = useRef({
    e2b_task_data: {
      SHORTFALL: shortfall,
      STORAGE: storage,
      RESERVED: reserved,
      OUR_NEGOTIATOR: ourNegotiator,
      PARTNER_NEGOTIATOR: partnerNegotiator,
      ORIGINAL: original,
      IDEAL: ideal,
      BUYER: buyer,
      MPQ: mpq,
      DELIVERY_SLOTS: deliverySlots,
    },
    status: { phase: "idle", error: null },
    research: {
      query: "",
      stage: "not_started",
      sources_found: 0,
      sources: [],
      completed: false,
    },
    processing: {
      progress: 0,
      report: null,
      completed: null,
      inProgress: false,
    },
    ui: { showSources: false, showProgress: false, activeTab: "chat" },
  });

  const { state, setState, running } = useCoAgent({
    name: "researchAgent",
    initialState: lastedState.current,
  });

  const isLoading = !state?.processing?.completed;
  // ADJUST DELIVERY SLOTS
  const user_delivery_slots = state?.e2b?.user_query_slots;
  useEffect(() => {
    console.log("Check user_delivery_slots", user_delivery_slots);
    if (
      running &&
      user_delivery_slots &&
      user_delivery_slots !== deliverySlots &&
      user_delivery_slots > 0
    ) {
      setDeliverySlots(user_delivery_slots);
      setState({
        ...state,
        e2b_task_data: {
          ...state.e2b_task_data,
          SHORTFALL: shortfall,
          STORAGE: storage,
          RESERVED: reserved,
          OUR_NEGOTIATOR: ourNegotiator,
          PARTNER_NEGOTIATOR: partnerNegotiator,
          ORIGINAL: original,
          IDEAL: ideal,
          BUYER: buyer,
          MPQ: mpq,
          DELIVERY_SLOTS: user_delivery_slots,
        },
      });
      setTimeout(() => {
        console.log("Run chat completion after delivery slots change");
        runChatCompletion();
      }, 1000);
    }
  }, [user_delivery_slots]);

  // Check if the state has changed before updating
  if (JSON.stringify(state) !== JSON.stringify(lastedState.current)) {
    setState(lastedState.current);
  }

  useEffect(() => {
    const updatedState = {
      ...state,
      e2b_task_data: {
        SHORTFALL: shortfall,
        STORAGE: storage,
        RESERVED: reserved,
        OUR_NEGOTIATOR: ourNegotiator,
        PARTNER_NEGOTIATOR: partnerNegotiator,
        ORIGINAL: original,
        IDEAL: ideal,
        BUYER: buyer,
        MPQ: mpq,
        DELIVERY_SLOTS: deliverySlots,
      },
    };
    lastedState.current = updatedState;

    setState(updatedState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shortfall,
    storage,
    reserved,
    ourNegotiator,
    partnerNegotiator,
    original,
    ideal,
    buyer,
    isLoading,
    mpq,
    deliverySlots,
    running,
  ]);

  // Reset panel state call new negotiation
  useEffect(() => {
    if (isLoading) {
      setAdjustment(Array(deliverySlots).fill(""));
      setFinalAgreement(Array(deliverySlots).fill(""));
    }
    // Set Adjustment and Final Agreement based on the latest state
    const isShowReport =
      isValidJsonString(state?.processing?.report) &&
      JSON.parse(state?.processing?.report)?.stdout.length > 0;
    if (isShowReport) {
      let list_report: any = [];
      let extractedData = null;
      // Enable print report
      JSON.parse(state?.processing?.report)?.stdout.forEach((line: string) => {
        const array = line.split("\n");
        if (array.length > 0) {
          list_report.push(...array);
        } else {
          list_report.push(line);
        }
      });

      list_report = list_report.filter((line: string) => line.trim() !== "");
      extractedData = extractScheduleData(list_report);
      const originalScheduleArray = extractedData?.originalSchedule || [];
      const agreementData = extractedData?.agreement || [];
      const requestSchedule = extractedData?.requestSchedule || [];
      setAdjustment(
        agreementData.length > 0 ? agreementData : Array(deliverySlots).fill("")
      );
      setBuyer(requestSchedule ? requestSchedule : buyer);
      const finalAgreementData = calculateFinalAgreement(
        originalScheduleArray,
        agreementData.length > 0 ? agreementData : Array(deliverySlots).fill("")
      );
      setFinalAgreement(
        finalAgreementData.length > 0
          ? finalAgreementData
          : Array(deliverySlots).fill("")
      );
    }
  }, [isLoading]);

  return (
    <div
      style={{
        backgroundColor: "var(--background-color, #fff)",
        minHeight: "100vh",
        width: "100vw",
      }}
      className="flex flex-col items-center transition-colors duration-300 w-full"
    >
      <div className="flex flex-col w-full h-full max-h-full flex-1 ">
        <div
          className="flex flex-row w-full h-full max-h-full flex-1 space-x-4 container mx-auto px-8 pt-16 md:pt-20 pb-4 md:pb-6 overflow-y-auto overflow-x-hidden"
          style={{ minHeight: 0 }}
        >
          {/* Left Column: Negotiation Settings (30%) */}
          <div className=" flex-1 flex-col" style={{ minWidth: 0 }}>
            <AutoNegotiationPanel
              deliverySlots={deliverySlots}
              setDeliverySlots={setDeliverySlots}
              items={items}
              setItems={setItems}
              shortfall={shortfall}
              setShortfall={setShortfall}
              storage={storage}
              setStorage={setStorage}
              reserved={reserved}
              setReserved={setReserved}
              mpq={mpq}
              setMpq={setMpq}
              // isLoading={isLoading}
            />
            <NegotiatorStrategyPanel
              ourNegotiator={ourNegotiator}
              setOurNegotiator={setOurNegotiator}
              partnerNegotiator={partnerNegotiator}
              setPartnerNegotiator={setPartnerNegotiator}
              // isLoading={isLoading}
            />
          </div>
          {/* Right Column: Negotiation Panel and Analysis (70%) */}
          <div className="w-2/3 flex flex-col" style={{ minWidth: 0 }}>
            <NegotiationPanel
              deliverySlots={deliverySlots}
              items={items}
              original={original}
              setOriginal={setOriginal}
              ideal={ideal}
              setIdeal={setIdeal}
              buyer={buyer}
              setBuyer={setBuyer}
              adjustment={adjustment}
              setAdjustment={setAdjustment}
              finalAgreement={finalAgreement}
              setFinalAgreement={setFinalAgreement}
              // isLoading={isLoading}
            />
            <NegotiationAnalysisPanel
              original={original}
              ideal={ideal}
              buyer={buyer}
              adjustment={adjustment}
              finalAgreement={finalAgreement}
              agentState={state}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoagentChatPage() {
  return (
    <div className="w-full overflow-hidden">
      <CopilotKitChatProvider>
        <YourMainContent />
      </CopilotKitChatProvider>
    </div>
  );
}
