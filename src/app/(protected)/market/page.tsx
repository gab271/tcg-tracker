export default function MarketPage() {
  return (
    <div className="container mx-auto px-6 lg:px-12 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2 uppercase">Market</h1>
        <p className="text-gray-400">Track real-time card prices and market trends.</p>
      </div>

      <div className="h-64 border border-dashed border-gray-800 rounded-xl flex items-center justify-center">
        <p className="text-gray-500 uppercase tracking-widest text-sm">Market data loading...</p>
      </div>
    </div>
  );
}
