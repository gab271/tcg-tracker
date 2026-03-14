export default function CollectionPage() {
  return (
    <div className="container mx-auto px-6 lg:px-12 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 uppercase">Collection</h1>
          <p className="text-gray-400">Manage and view your tracked cards.</p>
        </div>
        <button className="px-5 py-2.5 rounded-sm vault-border bg-vault-800 hover:bg-vault-700 text-gold-400 text-sm font-medium tracking-wider uppercase transition-all vault-glow">
          Add Card
        </button>
      </div>

      <div className="h-64 border border-dashed border-gray-800 rounded-xl flex items-center justify-center">
        <p className="text-gray-500 uppercase tracking-widest text-sm">Your collection is empty</p>
      </div>
    </div>
  );
}
