import { useState } from 'react';
import { Save, FileText, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';

export default function FeeConfig() {
  const [fees, setFees] = useState({
    amc: 300,
    amcEnabled: true,
    dataFeed: 150,
    dataFeedEnabled: false,
    inactivity: 0,
    inactivityEnabled: false,
    stampDuty: 0.003,
    gst: 18,
    sebi: 0.0001
  });

  const toggle = (key) => setFees(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee & Charges Config</h1>
          <p className="text-sm text-gray-500 mt-1">Configure global account fees, data charges, and statutory taxes.</p>
        </div>
        <button onClick={() => console.log('Action triggered')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow-sm">
          <Save className="h-4 w-4 mr-2" />
          Save Global Config
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Account & Service Fees
          </h2>
          
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Account Maintenance Charge (AMC)</h3>
                  <p className="text-xs text-gray-500">Yearly charge deducted automatically.</p>
                </div>
                <button onClick={() => toggle('amcEnabled')}>
                  {fees.amcEnabled ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-bold">₹</span>
                <input type="number" value={fees.amc} disabled={!fees.amcEnabled} className="w-32 px-3 py-1.5 border border-gray-300 rounded font-medium focus:ring-blue-500" />
                <span className="text-sm text-gray-500">/ year</span>
              </div>
            </div>

            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Live Data Feed Fee</h3>
                  <p className="text-xs text-gray-500">Monthly charge for real-time market depth.</p>
                </div>
                <button onClick={() => toggle('dataFeedEnabled')}>
                  {fees.dataFeedEnabled ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-bold">₹</span>
                <input type="number" value={fees.dataFeed} disabled={!fees.dataFeedEnabled} className="w-32 px-3 py-1.5 border border-gray-300 rounded font-medium focus:ring-blue-500" />
                <span className="text-sm text-gray-500">/ month</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Inactivity Fee</h3>
                  <p className="text-xs text-gray-500">Charged if no trades in 6 months.</p>
                </div>
                <button onClick={() => toggle('inactivityEnabled')}>
                  {fees.inactivityEnabled ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-bold">₹</span>
                <input type="number" value={fees.inactivity} disabled={!fees.inactivityEnabled} className="w-32 px-3 py-1.5 border border-gray-300 rounded font-medium focus:ring-blue-500" />
                <span className="text-sm text-gray-500">/ month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Statutory & Tax Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">GST (%)</label>
              <input type="number" defaultValue={fees.gst} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 font-medium bg-gray-50" />
              <p className="text-[10px] text-gray-500 mt-1">Applied on Brokerage and Transaction Charges.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Stamp Duty (%)</label>
              <input type="number" defaultValue={fees.stampDuty} step="0.001" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 font-medium" />
              <p className="text-[10px] text-gray-500 mt-1">State stamp duty applied on buy side turnover.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">SEBI Turnover Fee (%)</label>
              <input type="number" defaultValue={fees.sebi} step="0.0001" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 font-medium" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
