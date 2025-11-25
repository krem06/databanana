"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, X } from "lucide-react"

interface GeneratedImage {
    id: string
    url: string
    prompt: string
}

interface ImageBatch {
    id: string
    date: string
    context: string
    template: string
    images: GeneratedImage[]
}

interface ImageGalleryProps {
    batches: ImageBatch[]
    onDeleteBatch: (batchId: string) => void
}

export function ImageGallery({ batches, onDeleteBatch }: ImageGalleryProps) {
    const [zoomedImage, setZoomedImage] = useState<string | null>(null)
    const [zoomLevel, setZoomLevel] = useState(1)

    if (batches.length === 0) return null

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Generated Batches</h2>
            {batches.map((batch) => (
                <Card key={batch.id} className="overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-medium mb-1">{batch.context}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{batch.date}</span>
                                    <span>•</span>
                                    <span>{batch.template}</span>
                                    <span>•</span>
                                    <span>{batch.images.length} images</span>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onDeleteBatch(batch.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {batch.images.map((image) => (
                                <div
                                    key={image.id}
                                    className="relative group cursor-pointer"
                                    onClick={() => {
                                        setZoomedImage(image.url)
                                        setZoomLevel(1)
                                    }}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.prompt}
                                        className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setZoomedImage(null)}
                >
                    <div
                        className="relative w-full h-full flex items-center justify-center overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => {
                            e.preventDefault()
                            const delta = e.deltaY > 0 ? -0.1 : 0.1
                            setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)))
                        }}
                    >
                        <img
                            src={zoomedImage}
                            alt="Zoomed image"
                            className="transition-transform duration-200 cursor-grab active:cursor-grabbing rounded-lg"
                            style={{
                                transform: `scale(${zoomLevel})`,
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                objectFit: 'contain'
                            }}
                            draggable={false}
                        />

                        <div className="absolute top-4 right-4 flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                            >
                                -
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => setZoomLevel(1)}
                            >
                                1:1
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.2))}
                            >
                                +
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => setZoomedImage(null)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-2 py-1 rounded">
                            {Math.round(zoomLevel * 100)}%
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
