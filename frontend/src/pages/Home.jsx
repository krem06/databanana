import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Database, Zap, CheckCircle, Images, Tags, Download } from 'lucide-react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Hero Section */}
      <div className="relative px-6 py-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <Badge className="text-sm px-4 py-2" variant="secondary">
              <Database className="h-4 w-4 mr-2" />
              Production-Ready ML Datasets
            </Badge>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Generate{' '}
            <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Diverse
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Datasets
            </span>{' '}
            at Scale
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Create 100+ annotated images from a single concept. Auto-labeled with bounding boxes, 
            validated by humans, ready for ML training.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
              <Link to="/generate" className="flex items-center gap-3">
                <Zap className="h-5 w-5" />
                Start Generating
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto" asChild>
              <Link to="/gallery" className="flex items-center gap-3">
                <Images className="h-5 w-5" />
                Browse Gallery
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 py-20 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Data Banana?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Compare with traditional image generation tools
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-b from-blue-50 to-blue-100">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">ML-Ready Datasets</CardTitle>
                <CardDescription className="text-base">Not just pretty pictures</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Auto-generated bounding boxes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Consistent labeling schema</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Export-ready formats</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-b from-orange-50 to-orange-100">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">Enterprise Scale</CardTitle>
                <CardDescription className="text-base">100 diverse variations per job</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Batch generation (10-100 images)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Systematic diversity</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Human validation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-b from-green-50 to-green-100">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Tags className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">Cost Effective</CardTitle>
                <CardDescription className="text-base">10-50x cheaper than manual annotation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>$0.05 per generated image</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>$0.10 per export (vs $1-5 manual)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Instant availability</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="px-6 py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From concept to ML-ready dataset in minutes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Describe Concept", desc: "Enter your image concept and exclusions", icon: Database, color: "blue" },
              { step: 2, title: "AI Generation", desc: "Claude creates diverse prompts, Gemini generates 100 images", icon: Zap, color: "orange" },
              { step: 3, title: "Auto-Label", desc: "AWS Rekognition adds bounding boxes and tags", icon: Tags, color: "green" },
              { step: 4, title: "Export Dataset", desc: "Download in YOLO, COCO, or custom formats", icon: Download, color: "purple" }
            ].map(({ step, title, desc, icon: Icon, color }) => (
              <Card key={step} className="text-center hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  color === 'blue' ? 'from-blue-500 to-blue-600' :
                  color === 'orange' ? 'from-orange-500 to-orange-600' :
                  color === 'green' ? 'from-green-500 to-green-600' :
                  'from-purple-500 to-purple-600'
                }`}></div>
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                    color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                    color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold mb-3 w-fit mx-auto">
                    STEP {step}
                  </Badge>
                  <CardTitle className="text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="px-6 py-20 bg-background">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
            Pay per generation, export what you need
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-4">Generation</CardTitle>
                <div className="text-5xl font-bold text-primary mb-2">$5</div>
                <CardDescription className="text-base">Per 100 diverse images</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>100 AI-generated images</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Auto-labeling included</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Human validation tools</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Images go to public gallery</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-primary hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center py-2 text-sm font-semibold">
                MOST POPULAR
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="text-2xl mb-4">Export</CardTitle>
                <div className="text-5xl font-bold text-primary mb-2">$0.10</div>
                <CardDescription className="text-base">Per validated image</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>YOLO, COCO, Pascal VOC formats</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Bounding box coordinates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Structured metadata</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Commercial license</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-4">Gallery</CardTitle>
                <div className="text-5xl font-bold text-green-600 mb-2">Free</div>
                <CardDescription className="text-base">Public dataset access</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Browse all validated images</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Download individual images</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Basic search and filters</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Community contributions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home