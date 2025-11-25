"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload"
import { Sparkles, Trash2, X } from "lucide-react"

interface GenerationFormProps {
    onGenerate: (data: {
        context: string
        template: string
        visualCount: number
        exclusiveOwnership: boolean
        uploadedImage: File | null
    }) => Promise<void>
    isGenerating: boolean
}

export function GenerationForm({ onGenerate, isGenerating }: GenerationFormProps) {
    const [context, setContext] = useState("")
    const [template, setTemplate] = useState("")
    const [visualCount, setVisualCount] = useState(4)
    const [exclusiveOwnership, setExclusiveOwnership] = useState(false)
    const [uploadedImage, setUploadedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [showTerms, setShowTerms] = useState(false)

    const handleImageSelect = (file: File) => {
        setUploadedImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleRemoveImage = () => {
        setUploadedImage(null)
        setPreviewUrl(null)
    }

    const handleSubmit = async () => {
        if (!context || !template || !acceptedTerms) return
        await onGenerate({
            context,
            template,
            visualCount,
            exclusiveOwnership,
            uploadedImage
        })
    }

    return (
        <Card className="mb-8">
            <CardContent className="pt-6 space-y-6">
                {/* Context Field */}
                <div className="space-y-2">
                    <Label htmlFor="context">Context</Label>
                    <Input
                        id="context"
                        placeholder="Describe your vision..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="w-full"
                    />
                </div>

                {/* Template and Count */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="template">Template</Label>
                        <Select value={template} onValueChange={setTemplate}>
                            <SelectTrigger id="template">
                                <SelectValue placeholder="Choose a style" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="realistic">Realistic</SelectItem>
                                <SelectItem value="artistic">Artistic</SelectItem>
                                <SelectItem value="abstract">Abstract</SelectItem>
                                <SelectItem value="minimalist">Minimalist</SelectItem>
                                <SelectItem value="vintage">Vintage</SelectItem>
                                <SelectItem value="futuristic">Futuristic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="count">Images</Label>
                        <Input
                            id="count"
                            type="number"
                            min="1"
                            max="100"
                            value={visualCount}
                            onChange={(e) => setVisualCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                        />
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                    <Label>Upload Image</Label>
                    {previewUrl ? (
                        <div className="relative">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={handleRemoveImage}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <ImageUpload onImageSelect={handleImageSelect} />
                    )}
                </div>

                {/* Ownership Options */}
                <div className="space-y-2">
                    <Label>Ownership Options</Label>
                    <div className="space-y-3">
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="ownership"
                                    value="standard"
                                    checked={!exclusiveOwnership}
                                    onChange={() => setExclusiveOwnership(false)}
                                    className="mt-0.5 text-primary focus:ring-primary"
                                />
                                <div>
                                    <span className="text-sm font-medium">Standard License ($0.10 per image)</span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Images are hosted on Data Banana platform and accessible through your gallery.
                                        You're free to use them for any purpose while Data Banana retains platform rights.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="p-4 border rounded-lg bg-muted/30">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="ownership"
                                    value="exclusive"
                                    checked={exclusiveOwnership}
                                    onChange={() => setExclusiveOwnership(true)}
                                    className="mt-0.5 text-primary focus:ring-primary"
                                />
                                <div>
                                    <span className="text-sm font-medium">Exclusive Ownership ($0.20 per image)</span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Images are not hosted in the gallery. Download .zip available for 30 days, then all copies
                                        are permanently removed ensuring complete privacy and exclusive ownership.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Terms Agreement */}
                <div className="space-y-3 pt-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">
                            I agree to the{" "}
                            <button
                                type="button"
                                onClick={() => setShowTerms(true)}
                                className="text-primary underline hover:no-underline"
                            >
                                Terms of Service
                            </button>
                        </span>
                    </label>
                </div>

                {/* Pricing Summary */}
                <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                        <span>Images: {visualCount} × ${exclusiveOwnership ? '0.20' : '0.10'}</span>
                        <span className="font-medium">${(visualCount * (exclusiveOwnership ? 0.20 : 0.10)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1 text-muted-foreground">
                        <span>{exclusiveOwnership ? 'Exclusive ownership' : 'Standard license'}</span>
                        <span>{exclusiveOwnership ? 'No gallery hosting' : 'Gallery hosted'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t mt-2">
                        <span>Total</span>
                        <span>${(visualCount * (exclusiveOwnership ? 0.20 : 0.10)).toFixed(2)}</span>
                    </div>
                </div>

                {/* Processing Info */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        For large batches, processing may take several minutes. An email notification will be sent to your account when ready.
                    </p>
                </div>

                {/* Generate Button */}
                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!context || !template || !acceptedTerms || isGenerating}
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate"}
                </Button>

                {/* Terms Modal */}
                {showTerms && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTerms(false)}>
                        <div className="bg-background rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Terms of Service</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowTerms(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <p>By using our service, you agree to the following terms:</p>
                                <div className="space-y-2">
                                    <p>• You will use generated images responsibly and legally</p>
                                    <p>• You will not generate inappropriate or harmful content</p>
                                    <p>• Generated images are provided as-is without warranty</p>
                                    <p>• You retain rights to your uploaded images</p>
                                    <p>• We may store images temporarily for processing</p>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={() => {
                                            setAcceptedTerms(true)
                                            setShowTerms(false)
                                        }}
                                        className="flex-1"
                                    >
                                        Accept Terms
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowTerms(false)} className="flex-1">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
