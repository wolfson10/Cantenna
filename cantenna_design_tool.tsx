import React, { useState, useEffect } from 'react';
import { Calculator, RotateCcw, Moon, Sun } from 'lucide-react';

const CantennaDesignTool = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [D, setD] = useState(0);
  const [r, setR] = useState(0);
  const [L, setL] = useState(0);
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState(null);

  const handleDChange = (value) => {
    setD(value);
    setR(value / 2);
  };

  const handleRChange = (value) => {
    setR(value);
    setD(value * 2);
  };

  // Constants
  const c = 299792458; // Speed of light in m/s
  const f = 2.4e9; // Fixed frequency: 2.4 GHz
  
  // Calculate minimum diameter for cutoff frequency
  // fc = (1.8412 * c) / (π * D)
  // To ensure fc < f: D > (1.8412 * c) / (π * f)
  const minDiameter = ((1.8412 * c) / (Math.PI * f)) * 100; // Convert to cm
  const minRadius = minDiameter / 2;
  
  // Calculate minimum length based on current diameter
  const getMinLength = () => {
    if (D === 0) return 0;
    const Dm = D / 100;
    const fc = (1.8412 * c) / (Math.PI * Dm);
    if (fc >= f) return 0;
    const lambda = c / f;
    const lambda_g = lambda / Math.sqrt(1 - Math.pow(fc / f, 2));
    const D_back = lambda_g / 4;
    return (D_back * 100); // Convert to cm
  };

  useEffect(() => {
    const saved = localStorage.getItem('cantenna-dark-mode');
    if (saved) setDarkMode(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('cantenna-dark-mode', darkMode);
  }, [darkMode]);

  const validate = () => {
    const newErrors = {};
    
    // Convert to meters for physics calculations
    const Dm = D / 100;
    const Lm = L / 100;

    // Check 1: Cutoff frequency validation
    const fc = (1.8412 * c) / (Math.PI * Dm);
    if (fc >= f) {
      newErrors.diameter = "Error: Can diameter is too small. The cutoff frequency (fc) exceeds 2.4 GHz. Please increase the diameter.";
      setErrors(newErrors);
      return false;
    }

    // Calculate probe position
    const lambda = c / f;
    const lambda_g = lambda / Math.sqrt(1 - Math.pow(fc / f, 2));
    const D_back = lambda_g / 4;

    // Check 2: Length validation
    if (Lm < D_back) {
      newErrors.length = "Error: Can length is too short. The calculated probe position (D_back) is outside the can. Please increase the length.";
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const calculate = () => {
    if (!validate()) {
      setResults(null);
      return;
    }

    // Convert to meters
    const Dm = D / 100;
    const Lm = L / 100;

    // Calculate all parameters
    const lambda = c / f;
    const fc = (1.8412 * c) / (Math.PI * Dm);
    const lambda_g = lambda / Math.sqrt(1 - Math.pow(fc / f, 2));
    const Lp = lambda / 4;
    const D_back = lambda_g / 4;
    const D_rim = Lm - D_back;

    setResults({
      lambda,
      fc,
      lambda_g,
      Lp,
      D_back,
      D_rim,
      Dm,
      Lm
    });
  };

  const reset = () => {
    setD(0);
    setR(0);
    setL(0);
    setErrors({});
    setResults(null);
  };

  const VisualSimulation = () => {
    if (!results) {
      return (
        <div className={`flex items-center justify-center h-96 border-2 border-dashed rounded-lg ${
          darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            Enter parameters and click Calculate to see visualization
          </p>
        </div>
      );
    }

    const scale = 200 / Math.max(L, D);
    const canWidth = D * scale;
    const canHeight = L * scale;
    const probeLength = results.Lp * 100 * scale;
    const probeOffset = results.D_back * 100 * scale;

    return (
      <div className={`p-6 rounded-lg border-2 ${
        darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Can Cross-Section View
        </h3>
        <svg width="100%" height="500" viewBox="0 0 800 500">
          {/* Can body */}
          <rect
            x={300}
            y={(250 - canWidth / 2)}
            width={canHeight}
            height={canWidth}
            fill={darkMode ? '#374151' : '#e5e7eb'}
            stroke={darkMode ? '#6b7280' : '#9ca3af'}
            strokeWidth="2"
          />
          
          {/* Back wall */}
          <line
            x1={300}
            y1={(250 - canWidth / 2)}
            x2={300}
            y2={(250 + canWidth / 2)}
            stroke={darkMode ? '#9ca3af' : '#4b5563'}
            strokeWidth="3"
          />
          
          {/* Open end */}
          <line
            x1={300 + canHeight}
            y1={(250 - canWidth / 2)}
            x2={300 + canHeight}
            y2={(250 + canWidth / 2)}
            stroke={darkMode ? '#60a5fa' : '#3b82f6'}
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Probe */}
          <circle
            cx={300 + probeOffset}
            cy={250}
            r="4"
            fill={darkMode ? '#fbbf24' : '#f59e0b'}
          />
          <line
            x1={300 + probeOffset}
            y1={250}
            x2={300 + probeOffset}
            y2={250 - probeLength}
            stroke={darkMode ? '#fbbf24' : '#f59e0b'}
            strokeWidth="3"
          />

          {/* Dimensions */}
          {/* D_back annotation */}
          <line
            x1={300}
            y1={250 + canWidth / 2 + 30}
            x2={300 + probeOffset}
            y2={250 + canWidth / 2 + 30}
            stroke={darkMode ? '#ef4444' : '#dc2626'}
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <line
            x1={300}
            y1={250 + canWidth / 2 + 25}
            x2={300}
            y2={250 + canWidth / 2 + 35}
            stroke={darkMode ? '#ef4444' : '#dc2626'}
            strokeWidth="2"
          />
          <line
            x1={300 + probeOffset}
            y1={250 + canWidth / 2 + 25}
            x2={300 + probeOffset}
            y2={250 + canWidth / 2 + 35}
            stroke={darkMode ? '#ef4444' : '#dc2626'}
            strokeWidth="2"
          />
          <text
            x={300 + probeOffset / 2}
            y={250 + canWidth / 2 + 50}
            textAnchor="middle"
            fill={darkMode ? '#ef4444' : '#dc2626'}
            fontSize="14"
            fontWeight="bold"
          >
            D_back = {(results.D_back * 100).toFixed(2)} cm
          </text>

          {/* Lp annotation */}
          <line
            x1={300 + probeOffset + 20}
            y1={250}
            x2={300 + probeOffset + 20}
            y2={250 - probeLength}
            stroke={darkMode ? '#10b981' : '#059669'}
            strokeWidth="2"
          />
          <text
            x={300 + probeOffset + 35}
            y={250 - probeLength / 2}
            fill={darkMode ? '#10b981' : '#059669'}
            fontSize="14"
            fontWeight="bold"
          >
            Lp = {(results.Lp * 100).toFixed(2)} cm
          </text>

          {/* Can length annotation */}
          <line
            x1={300}
            y1={250 - canWidth / 2 - 30}
            x2={300 + canHeight}
            y2={250 - canWidth / 2 - 30}
            stroke={darkMode ? '#8b5cf6' : '#7c3aed'}
            strokeWidth="2"
          />
          <text
            x={300 + canHeight / 2}
            y={250 - canWidth / 2 - 40}
            textAnchor="middle"
            fill={darkMode ? '#8b5cf6' : '#7c3aed'}
            fontSize="14"
            fontWeight="bold"
          >
            L = {L.toFixed(2)} cm
          </text>

          {/* Can diameter annotation */}
          <line
            x1={280}
            y1={250 - canWidth / 2}
            x2={280}
            y2={250 + canWidth / 2}
            stroke={darkMode ? '#ec4899' : '#db2777'}
            strokeWidth="2"
          />
          <text
            x={260}
            y={250}
            textAnchor="end"
            fill={darkMode ? '#ec4899' : '#db2777'}
            fontSize="14"
            fontWeight="bold"
          >
            D = {D.toFixed(2)} cm
          </text>

          {/* Labels */}
          <text x={300} y={235} textAnchor="middle" fill={darkMode ? '#9ca3af' : '#4b5563'} fontSize="12">
            Back Wall
          </text>
          <text x={300 + canHeight} y={235} textAnchor="middle" fill={darkMode ? '#60a5fa' : '#3b82f6'} fontSize="12">
            Open End
          </text>
          <text x={300 + probeOffset} y={265} textAnchor="middle" fill={darkMode ? '#fbbf24' : '#f59e0b'} fontSize="12" fontWeight="bold">
            Probe
          </text>

          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={darkMode ? '#ef4444' : '#dc2626'} />
            </marker>
          </defs>
        </svg>

        {/* Key parameters display */}
        <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Key Parameters:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              <strong>Frequency (f):</strong> {(f / 1e9).toFixed(1)} GHz
            </div>
            <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              <strong>Cutoff Freq (fc):</strong> {(results.fc / 1e9).toFixed(3)} GHz
            </div>
            <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              <strong>Wavelength (λ):</strong> {(results.lambda * 100).toFixed(2)} cm
            </div>
            <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              <strong>Guide Wavelength (λg):</strong> {(results.lambda_g * 100).toFixed(2)} cm
            </div>
            <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              <strong>Rim Distance (D_rim):</strong> {(results.D_rim * 100).toFixed(2)} cm
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">2.4 GHz Wi-Fi Cantenna Design Tool</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Calculate optimal dimensions for your DIY directional antenna
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-lg ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
            } transition-colors`}
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* Input Section */}
        <div className={`p-6 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-2xl font-semibold mb-4">Input Parameters (cm)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block mb-2 font-medium">Can Diameter (D)</label>
              <input
                type="number"
                value={D}
                onChange={(e) => handleDChange(parseFloat(e.target.value) || 0)}
                className={`w-full p-3 rounded-lg border-2 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                step="0.1"
              />
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Min: {minDiameter.toFixed(2)} cm | Max: No limit
              </p>
              {errors.diameter && (
                <p className="text-red-500 text-sm mt-1">{errors.diameter}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">Can Radius (r)</label>
              <input
                type="number"
                value={r}
                onChange={(e) => handleRChange(parseFloat(e.target.value) || 0)}
                className={`w-full p-3 rounded-lg border-2 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                step="0.1"
              />
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Min: {minRadius.toFixed(2)} cm | Max: No limit
              </p>
            </div>

            <div>
              <label className="block mb-2 font-medium">Can Length (L)</label>
              <input
                type="number"
                value={L}
                onChange={(e) => setL(parseFloat(e.target.value) || 0)}
                className={`w-full p-3 rounded-lg border-2 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                step="0.1"
              />
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Min: {getMinLength().toFixed(2)} cm | Max: No limit
              </p>
              {errors.length && (
                <p className="text-red-500 text-sm mt-1">{errors.length}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={calculate}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Calculator className="w-5 h-5" />
              Calculate
            </button>
            <button
              onClick={reset}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className={`p-6 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className="text-2xl font-semibold mb-4">Calculated Results</h2>
            
            <div className="space-y-6">
              {/* Wavelength */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-lg mb-2">Wavelength (λ)</h3>
                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <p><strong>Formula:</strong> λ = c / f</p>
                  <p><strong>Substitution:</strong> λ = 299,792,458 m/s / 2,400,000,000 Hz</p>
                  <p><strong>Result:</strong> λ = {(results.lambda * 100).toFixed(4)} cm</p>
                </div>
              </div>

              {/* Cutoff Frequency */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-lg mb-2">Cutoff Frequency (fc)</h3>
                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <p><strong>Formula:</strong> fc = (1.8412 × c) / (π × D)</p>
                  <p><strong>Unit Conversion:</strong> D = {D} cm = {results.Dm.toFixed(4)} m</p>
                  <p><strong>Substitution:</strong> fc = (1.8412 × 299,792,458) / (π × {results.Dm.toFixed(4)})</p>
                  <p><strong>Result:</strong> fc = {(results.fc / 1e9).toFixed(4)} GHz</p>
                </div>
              </div>

              {/* Guide Wavelength */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-lg mb-2">Guide Wavelength (λg)</h3>
                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <p><strong>Formula:</strong> λg = λ / √(1 - (fc/f)²)</p>
                  <p><strong>Substitution:</strong> λg = {(results.lambda * 100).toFixed(4)} cm / √(1 - ({(results.fc / 1e9).toFixed(4)}/{(f / 1e9).toFixed(1)})²)</p>
                  <p><strong>Calculation:</strong> λg = {(results.lambda * 100).toFixed(4)} / {Math.sqrt(1 - Math.pow(results.fc / f, 2)).toFixed(4)}</p>
                  <p><strong>Result:</strong> λg = {(results.lambda_g * 100).toFixed(4)} cm</p>
                </div>
              </div>

              {/* Probe Length */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-lg mb-2">Probe Length (Lp)</h3>
                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <p><strong>Formula:</strong> Lp = λ / 4</p>
                  <p><strong>Substitution:</strong> Lp = {(results.lambda * 100).toFixed(4)} cm / 4</p>
                  <p><strong>Result:</strong> Lp = {(results.Lp * 100).toFixed(4)} cm</p>
                </div>
              </div>

              {/* Probe Offset */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-lg mb-2">Probe Offset from Back Wall (D_back)</h3>
                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <p><strong>Formula:</strong> D_back = λg / 4</p>
                  <p><strong>Substitution:</strong> D_back = {(results.lambda_g * 100).toFixed(4)} cm / 4</p>
                  <p><strong>Result:</strong> D_back = {(results.D_back * 100).toFixed(4)} cm</p>
                </div>
              </div>

              {/* Rim Distance */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-lg mb-2">Distance from Probe to Open End (D_rim)</h3>
                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <p><strong>Formula:</strong> D_rim = L - D_back</p>
                  <p><strong>Unit Conversion:</strong> L = {L} cm = {results.Lm.toFixed(4)} m</p>
                  <p><strong>Substitution:</strong> D_rim = {results.Lm.toFixed(4)} m - {results.D_back.toFixed(4)} m</p>
                  <p><strong>Result:</strong> D_rim = {(results.D_rim * 100).toFixed(4)} cm</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Simulation */}
        <div className="mb-6">
          <VisualSimulation />
        </div>

        {/* Formula Reference */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-2xl font-semibold mb-4">Formula Reference</h2>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2">Wavelength (λ = c / f)</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                The wavelength is the distance between successive peaks of an electromagnetic wave. At 2.4 GHz, 
                it equals approximately 12.49 cm in free space.
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2">Cutoff Frequency (fc = 1.8412 × c / (π × D))</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                The cutoff frequency is the minimum frequency that can propagate through the cylindrical waveguide. 
                For TE₁₁ mode (dominant mode in circular waveguides), the constant 1.8412 represents the first root 
                of the Bessel function derivative. The diameter must be large enough so fc is below 2.4 GHz.
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2">Guide Wavelength (λg = λ / √(1 - (fc/f)²))</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                The guide wavelength is the wavelength of the electromagnetic wave as it propagates inside the 
                cylindrical waveguide. It's always longer than the free-space wavelength because the wave travels 
                in a zigzag pattern, reflecting off the walls.
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2">Probe Length (Lp = λ / 4)</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                The probe is a quarter-wave monopole antenna that extends into the can from the N-type connector. 
                This length provides optimal impedance matching for exciting the TE₁₁ mode. Use copper wire of 
                approximately 2-3mm diameter.
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2">Probe Offset (D_back = λg / 4)</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                The probe must be positioned one quarter guide wavelength from the back wall. This placement 
                creates a standing wave pattern with maximum E-field at the probe location, ensuring efficient 
                energy transfer from the 50Ω coaxial feed.
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2">Rim Distance (D_rim = L - D_back)</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                This is the distance from the probe to the open end of the can. A longer D_rim increases 
                directivity (antenna gain) by allowing more waves to build up before radiating. Optimal length 
                is typically 0.75λg to several λg, balancing gain against physical size.
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2">System Assumptions</h3>
              <ul className={`text-sm space-y-1 list-disc list-inside ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>N-type female connector mounted on the back wall</li>
                <li>Copper wire probe (2-3mm diameter recommended)</li>
                <li>50Ω impedance system (standard for Wi-Fi equipment)</li>
                <li>TE₁₁ mode propagation (dominant circular waveguide mode)</li>
                <li>Coaxial cable losses not modeled (external to antenna)</li>
                <li>Ideal conductor assumption (negligible wall losses)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CantennaDesignTool;