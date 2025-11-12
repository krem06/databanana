import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Sparkles, ImagePlus } from 'lucide-react'

function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Data Banana
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-4">
            Generate up to 100 images at a time easily.
          </p>
          <p className="text-primary text-sm mb-8">CSS Variable Test - This should be yellow</p>
        </div>
        
        {/* Quick Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <Database className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Add Context</h3>
              <p className="text-sm text-muted-foreground">Define your concept with a prompt</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Template Based</h3>
              <p className="text-sm text-muted-foreground">Generate diverse variations using templates</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <ImagePlus className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Add Visuals</h3>
              <p className="text-sm text-muted-foreground">Upload images for better context</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild className="w-full sm:w-auto sm:px-16 sm:py-6 text-lg">
            <Link to="/generate" className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" />
              Start Generating
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

export default Home