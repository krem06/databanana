function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <img src="/src/assets/databanana.jpg" alt="Data Banana" className="h-44 mx-auto mb-8" />
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">1</div>
            <span className="text-gray-600">Generate 10 VLM dataset images from your context</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">2</div>
            <span className="text-gray-600">Validate images for quality and relevance (5-10 mins)</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">3</div>
            <span className="text-gray-600">Export in standard formats (COCO, YOLO, etc.)</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">✓</div>
            <span className="text-gray-600">Valid images added to public gallery for community use</span>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">How it works</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">1</div>
              <span className="text-gray-600">Add context + excluded tags</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">2</div>
              <span className="text-gray-600">Generate 100 AI variations</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">3</div>
              <span className="text-gray-600">Select realistic images</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">4</div>
              <span className="text-gray-600">Export as dataset format</span>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Pricing</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold text-gray-900">$5</div>
              <div className="text-sm text-gray-600">100 images generation</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold text-gray-900">$0.10</div>
              <div className="text-sm text-gray-600">per image for dataset export</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-semibold text-gray-900">Free</div>
              <div className="text-sm text-gray-600">gallery downloads (no metadata)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home