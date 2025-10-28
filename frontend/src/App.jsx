import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import QrReader from "react-qr-reader-es6";
import { Captions } from "lucide-react";


// -------------------------------------------
// Manufacturer Dashboard
// -------------------------------------------
function ManufacturerDashboard() {
  const [formData, setFormData] = useState({
    mf_id: "",
    prod_id: "",
    medicine_data: {
      medicine_id: "",
      batch_number: "",
      expiry_date: "",
      manufacturer_info: {
        manufacturer_name: "",
        manufacturer_id: "",
      },
      serial_number: "",
      composition: {
        active_ingredients: [{ name: "", amount: "" }],
        dosage: { amount: "", frequency: "" },
        storage_instructions: "",
        side_effects: [""],
      },
      regulatory_info: {
        approval_number: "",
        license_holder: "",
        country_of_origin: "",
      },
      additional_info: {
        manufacturing_date: "",
      },
    },
  });

  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [generatingIds, setGeneratingIds] = useState(false);

  const generateIds = async () => {
    try {
      setGeneratingIds(true);
      setMessage("Generating unique IDs...");

      const [mfRes, prodRes] = await Promise.all([
        axios.get("http://localhost:3000/generate_mf_id"),
        axios.get("http://localhost:3000/generate_prod_id"),
      ]);

      setFormData((prev) => ({
        ...prev,
        mf_id: mfRes.data,
        prod_id: prodRes.data,
      }));

      setMessage("IDs generated successfully!");
    } catch (err) {
      setMessage("Failed to generate IDs: " + err.message);
    } finally {
      setGeneratingIds(false);
    }
  };

  const updateMedicineData = (path, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split(".");
      let current = newData.medicine_data;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const updateIngredient = (index, field, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      newData.medicine_data.composition.active_ingredients[index][field] = value;
      return newData;
    });
  };

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      medicine_data: {
        ...prev.medicine_data,
        composition: {
          ...prev.medicine_data.composition,
          active_ingredients: [
            ...prev.medicine_data.composition.active_ingredients,
            { name: "", amount: "" },
          ],
        },
      },
    }));
  };

  const updateSideEffect = (index, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      newData.medicine_data.composition.side_effects[index] = value;
      return newData;
    });
  };

  const addSideEffect = () => {
    setFormData((prev) => ({
      ...prev,
      medicine_data: {
        ...prev.medicine_data,
        composition: {
          ...prev.medicine_data.composition,
          side_effects: [...prev.medicine_data.composition.side_effects, ""],
        },
      },
    }));
  };

  const generateQR = async () => {
    if (!formData.mf_id || !formData.prod_id) {
      setMessage("Please generate IDs first!");
      return;
    }

    if (!formData.medicine_data.medicine_id) {
      setMessage("Please fill in at least the Medicine ID!");
      return;
    }

    try {
      setLoading(true);
      setMessage("Generating QR code...");
      setQrUrl("");

      const payload = {
        mf_id: formData.mf_id,
        prod_id: formData.prod_id,
        medicine_data: formData.medicine_data,
      };

      const res = await axios.post("http://localhost:3000/gen_qr", payload);

      if (res.data.qrCodeUrl) {
        setQrUrl(res.data.qrCodeUrl);
        setMessage("QR code generated successfully!");
      } else {
        setMessage("QR code generation failed - no URL returned");
      }
    } catch (err) {
      console.error("QR Generation Error:", err);
      setMessage("Error generating QR: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto glass-effect rounded-3xl shadow-2xl space-y-6 border border-green-500/30 glow-green">
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-400 tracking-tight text-glow">
          Manufacturer Dashboard
        </h1>
        <p className="text-gray-400 text-base md:text-lg font-medium">
          Register your medicine and generate a secure QR code
        </p>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-green-500 to-transparent mx-auto rounded-full"></div>
      </div>

      <button
        onClick={generateIds}
        disabled={generatingIds}
        className="relative group bg-gradient-to-r from-green-600 to-green-500 text-black font-bold px-6 py-4 rounded-xl hover:from-green-500 hover:to-green-400 w-full disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {generatingIds && (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {generatingIds ? "Generating IDs..." : "Step 1: Generate Unique IDs"}
        </span>
        {!generatingIds && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        )}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-xs uppercase tracking-wider font-bold text-green-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Manufacturer ID
          </label>
          <input
            value={formData.mf_id}
            readOnly
            className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-200 placeholder-gray-600 font-mono text-sm transition-all duration-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:glow-green"
            placeholder="Click 'Generate IDs' above"
          />
        </div>
        <div className="relative">
          <label className="block text-xs uppercase tracking-wider font-bold text-green-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Product ID
          </label>
          <input
            value={formData.prod_id}
            readOnly
            className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-200 placeholder-gray-600 font-mono text-sm transition-all duration-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:glow-green"
            placeholder="Click 'Generate IDs' above"
          />
        </div>
      </div>

      <div className="border-t border-green-500/30 pt-8 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
          <h2 className="text-2xl md:text-3xl font-bold text-green-400">Medicine Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="group">
            <label className="block text-xs uppercase tracking-wider font-bold text-green-400 mb-2">
              Medicine ID <span className="text-red-400">*</span>
            </label>
            <input
              value={formData.medicine_data.medicine_id}
              onChange={(e) => updateMedicineData("medicine_id", e.target.value)}
              className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300 hover:border-green-500/60 focus:glow-green"
              placeholder="e.g. MED67890"
            />
          </div>
          <div className="group">
            <label className="block text-xs uppercase tracking-wider font-bold text-green-400 mb-2">Batch Number</label>
            <input
              value={formData.medicine_data.batch_number}
              onChange={(e) => updateMedicineData("batch_number", e.target.value)}
              className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300 hover:border-green-500/60 focus:glow-green"
              placeholder="e.g. BATCH2345"
            />
          </div>
          <div className="group">
            <label className="block text-xs uppercase tracking-wider font-bold text-green-400 mb-2">Expiry Date</label>
            <input
              type="date"
              value={formData.medicine_data.expiry_date}
              onChange={(e) => updateMedicineData("expiry_date", e.target.value)}
              className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300 hover:border-green-500/60 focus:glow-green"
            />
          </div>
          <div className="group">
            <label className="block text-xs uppercase tracking-wider font-bold text-green-400 mb-2">Serial Number</label>
            <input
              value={formData.medicine_data.serial_number}
              onChange={(e) => updateMedicineData("serial_number", e.target.value)}
              className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300 hover:border-green-500/60 focus:glow-green"
              placeholder="e.g. SER09876"
            />
          </div>
        </div>

        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-900/30 border border-green-500/20">
          <h3 className="text-lg font-bold text-green-300 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Manufacturer Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Manufacturer Name</label>
              <input
                value={formData.medicine_data.manufacturer_info.manufacturer_name}
                onChange={(e) => updateMedicineData("manufacturer_info.manufacturer_name", e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300 hover:border-green-500/60"
                placeholder="e.g. XYZ Pharma Inc."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Manufacturer ID</label>
              <input
                value={formData.medicine_data.manufacturer_info.manufacturer_id}
                onChange={(e) => updateMedicineData("manufacturer_info.manufacturer_id", e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300 hover:border-green-500/60"
                placeholder="e.g. XYZ12345"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-900/30 border border-green-500/20">
          <h3 className="text-lg font-bold text-green-300 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Composition
          </h3>

          <label className="block text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Active Ingredients</label>
          {formData.medicine_data.composition.active_ingredients.map((ing, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                value={ing.name}
                onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                className="border border-green-500/40 p-3 rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Ingredient name"
              />
              <input
                value={ing.amount}
                onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                className="border border-green-500/40 p-3 rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Amount (e.g. 200mg)"
              />
            </div>
          ))}
          <button
            onClick={addIngredient}
            className="text-green-400 text-sm hover:text-green-300 transition-all duration-300 font-semibold flex items-center gap-2 hover:gap-3 group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">+</span>
            Add Ingredient
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Dosage Amount</label>
              <input
                value={formData.medicine_data.composition.dosage.amount}
                onChange={(e) => updateMedicineData("composition.dosage.amount", e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="e.g. 200mg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Frequency</label>
              <input
                value={formData.medicine_data.composition.dosage.frequency}
                onChange={(e) => updateMedicineData("composition.dosage.frequency", e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="e.g. 3 times per day"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-gray-400 mb-2 font-medium">Storage Instructions</label>
            <textarea
              value={formData.medicine_data.composition.storage_instructions}
              onChange={(e) => updateMedicineData("composition.storage_instructions", e.target.value)}
              className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300 resize-none"
              placeholder="e.g. Keep below 30°C, away from direct sunlight"
              rows="2"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Side Effects</label>
            {formData.medicine_data.composition.side_effects.map((effect, idx) => (
              <input
                key={idx}
                value={effect}
                onChange={(e) => updateSideEffect(idx, e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl mb-3 bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Side effect"
              />
            ))}
            <button
              onClick={addSideEffect}
              className="text-green-400 text-sm hover:text-green-300 transition-all duration-300 font-semibold flex items-center gap-2 hover:gap-3 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">+</span>
              Add Side Effect
            </button>
          </div>
        </div>

        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-900/30 border border-green-500/20">
          <h3 className="text-lg font-bold text-green-300 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Regulatory Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Approval Number</label>
              <input
                value={formData.medicine_data.regulatory_info.approval_number}
                onChange={(e) => updateMedicineData("regulatory_info.approval_number", e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="e.g. FDA987654"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">License Holder</label>
              <input
                value={formData.medicine_data.regulatory_info.license_holder}
                onChange={(e) => updateMedicineData("regulatory_info.license_holder", e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="License info"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Country of Origin</label>
              <input
                value={formData.medicine_data.regulatory_info.country_of_origin}
                onChange={(e) => updateMedicineData("regulatory_info.country_of_origin", e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="e.g. India"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Manufacturing Date</label>
              <input
                type="date"
                value={formData.medicine_data.additional_info.manufacturing_date}
                onChange={(e) => updateMedicineData("additional_info.manufacturing_date", e.target.value)}
                className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-100 placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={generateQR}
        disabled={loading || !formData.mf_id || !formData.prod_id}
        className="relative group bg-gradient-to-r from-green-600 to-green-500 text-black px-6 py-5 rounded-xl hover:from-green-500 hover:to-green-400 w-full text-lg font-extrabold disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading && (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? "Generating QR..." : "Step 2: Generate QR Code"}
        </span>
        {!loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        )}
      </button>

      {message && (
        <div className={`p-4 rounded-xl text-center font-bold border-2 transition-all duration-500 ${
          message.includes("successfully") ? "bg-green-900/40 text-green-300 border-green-500 glow-green" :
          message.includes("Failed") || message.includes("failed") || message.includes("Error") ? "bg-red-900/40 text-red-300 border-red-500 shadow-lg shadow-red-500/20" :
          "bg-gray-800/60 text-gray-300 border-green-500/30"
        }`}>
          {message}
        </div>
      )}

      {qrUrl && (
        <div className="mt-8 text-center border-t border-green-500/30 pt-8">
          <h2 className="font-extrabold text-3xl mb-6 text-green-400 text-glow flex items-center justify-center gap-3">
            <span className="text-2xl">✓</span>
            Your Medicine QR Code
          </h2>
          <div className="inline-block p-6 rounded-2xl bg-white glow-green-strong animate-pulse-glow">
            <img
              src={qrUrl}
              alt="QR Code"
              className="mx-auto w-64 h-64 rounded-xl"
            />
          </div>
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-gray-900/60 to-gray-900/30 border border-green-500/30 max-w-md mx-auto">
            <p className="text-gray-300 text-sm font-medium mb-2">
              Scan this QR code on the <span className="text-green-400 font-bold">Customer Verification</span> page
            </p>
            <p className="text-gray-500 text-xs font-mono mt-2">
              Product ID: <span className="text-green-400">{formData.prod_id}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------
// Customer Verification
// -------------------------------------------
function CustomerVerifier() {
  const [result, setResult] = useState("");
  const [scannedData, setScannedData] = useState("");
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraAllowed(true);
        stream.getTracks().forEach(track => track.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);

        const rearCamera = videoDevices.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear")
        );
        setSelectedDeviceId(rearCamera?.deviceId || videoDevices[0]?.deviceId);
      } catch (err) {
        console.error("Camera permission denied:", err);
        setError("Camera access denied. Please allow camera permission and reload the page.");
      }
    }

    initCamera();

    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.("JSON") || args[0]?.includes?.("undefined")) return;
      originalError.apply(console, args);
    };
    return () => (console.error = originalError);
  }, []);

  const handleScan = async (data) => {
    try {
      if (!data || verifying) return;

      let scannedText;
      if (typeof data === "string") scannedText = data;
      else if (data?.text) scannedText = data.text;
      else if (data?.data) scannedText = data.data;
      else return;

      if (
        !scannedText ||
        scannedText.trim() === "" ||
        scannedText === scannedData
      ) return;

      setScannedData(scannedText);
      setVerifying(true);
      setResult("Verifying product authenticity...");

      try {
        console.log("Scanned Text:", scannedText);
        console.log("type of scannedText:", typeof(scannedText));
        const res = await axios.post("http://localhost:3000/verify_qr", {
          qr_data: scannedText,
        });
        if (res.data.isVerified)
          setResult("Verified: " + (res.data.message || "Authentic Medicine Verified"));
        else setResult("Failed: " + (res.data.message || "Product verification failed"));
      } catch (err) {
        console.error("Verification error:", err);
        setResult(
          "Failed: " +
            (err.response?.data?.message ||
              "Product not genuine or verification failed")
        );
      } finally {
        setVerifying(false);
      }
    } catch (err) {
      console.warn("Scan handling error:", err);
    }
  };

  const handleError = (err) => {
    if (err?.name === "NotAllowedError") {
      setError("Camera access denied. Please allow camera permission and reload.");
    } else if (err?.name === "NotFoundError") {
      setError("No camera found on this device.");
    }
  };

  const resetScanner = () => {
    setResult("");
    setScannedData("");
    setError("");
    setVerifying(false);
    setScannerKey((prev) => prev + 1);
  };

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto glass-effect rounded-3xl shadow-2xl space-y-6 border border-green-500/30 glow-green">
      <div className="text-center space-y-3 mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-400 tracking-tight text-glow">
          Customer Verification
        </h1>
        <p className="text-gray-400 text-sm md:text-base font-medium max-w-md mx-auto">
          Hold the medicine QR code 6-8 inches from your camera. Keep it steady and ensure good lighting.
        </p>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-green-500 to-transparent mx-auto rounded-full"></div>
      </div>

      {!cameraAllowed && !error && (
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-900/30 border border-green-500/30">
          <div className="inline-flex items-center justify-center gap-3 text-green-400 font-bold">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Requesting camera access...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 text-red-300 p-5 rounded-xl text-center border-2 border-red-500 font-bold shadow-lg shadow-red-500/20">
          {error}
        </div>
      )}

      {devices.length > 1 && (
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-wider font-bold text-green-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Select Camera
          </label>
          <select
            value={selectedDeviceId || ""}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="border border-green-500/40 p-3 w-full rounded-xl bg-gray-900/80 text-gray-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300 hover:border-green-500/60 cursor-pointer"
          >
            {devices.map((device, idx) => (
              <option key={idx} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {cameraAllowed && selectedDeviceId && (
        <div className="relative mx-auto" style={{ maxWidth: "400px" }}>
          <div className="rounded-2xl overflow-hidden border-4 border-green-500 shadow-2xl shadow-green-500/30 glow-green animate-pulse-glow">
            <QrReader
              key={scannerKey}
              delay={300}
              onScan={handleScan}
              onError={handleError}
              constraints={{
                video: {
                  deviceId: { exact: selectedDeviceId },
                  facingMode: "environment"
                },
              }}
              style={{ width: "100%" }}
            />
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-48 h-48 border-2 border-green-400 rounded-2xl opacity-50"></div>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-2xl"></div>
          </div>
        </div>
      )}

      {scannedData && (
        <div className="bg-gray-900/60 p-4 rounded-xl border border-green-500/40">
          <div className="text-xs font-bold text-green-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            QR Data Received
          </div>
          <div className="text-xs break-all text-gray-300 font-mono bg-black/40 p-3 rounded-lg">
            {scannedData.substring(0, 100)}...
          </div>
        </div>
      )}

      {result && (
        <div
          className={`p-6 rounded-xl text-center text-lg font-extrabold border-2 transition-all duration-500 ${
            result.includes("Verified:") || result.includes("Authentic")
              ? "bg-green-900/40 text-green-300 border-green-500 glow-green-strong"
              : result.includes("Verifying")
              ? "bg-gray-800/60 text-gray-300 border-green-500/30 animate-pulse"
              : "bg-red-900/40 text-red-300 border-red-500 shadow-lg shadow-red-500/30"
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            {result.includes("Verifying") && (
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{result}</span>
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={resetScanner}
          className="relative group bg-gradient-to-r from-green-600 to-green-500 text-black font-bold px-6 py-4 rounded-xl hover:from-green-500 hover:to-green-400 w-full transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          <span className="relative z-10">Scan Another QR Code</span>
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
      )}
    </div>
  );
}

// -------------------------------------------
// App Router
// -------------------------------------------
export default function App() {
  const [activeTab, setActiveTab] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const unlisten = () => {
      setActiveTab(window.location.pathname);
    };
    window.addEventListener('popstate', unlisten);
    return () => window.removeEventListener('popstate', unlisten);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-black">
        <nav className="sticky top-0 z-50 glass-effect border-b-2 border-green-500/50 shadow-2xl backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center glow-green">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-green-400 tracking-tight">MediVerify</h1>
                  <p className="text-xs text-gray-500 font-medium">Medicine Genuinity Validator</p>
                </div>
              </div>

              <div className="flex gap-2 p-1.5 bg-black/40 rounded-xl border border-green-500/30">
                <Link
                  to="/"
                  onClick={() => setActiveTab('/')}
                  className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                    activeTab === '/'
                      ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                      : 'text-green-400 hover:text-green-300 hover:bg-gray-900/50'
                  }`}
                >
                  Manufacturer
                </Link>
                <Link
                  to="/verify"
                  onClick={() => setActiveTab('/verify')}
                  className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                    activeTab === '/verify'
                      ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                      : 'text-green-400 hover:text-green-300 hover:bg-gray-900/50'
                  }`}
                >
                  Customer
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-10 px-4">
          <Routes>
            <Route path="/" element={<ManufacturerDashboard />} />
            <Route path="/verify" element={<CustomerVerifier />} />
          </Routes>
        </div>

        <footer className="border-t border-green-500/30 py-6 mt-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-gray-500 text-sm font-medium">
              Secured by blockchain technology and verified authenticity
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
