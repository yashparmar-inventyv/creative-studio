"use client"

import { Layer } from "@/lib/layer-store"
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider"
import { useState } from "react"

export default function ImageComparison({ layers }: { layers: Layer[] }) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  if (layers.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No layers selected for comparison</div>
  }

  if (layers.length === 1) {
    const layer = layers[0]
    const hasError = imageErrors.has(0)
    
    return (
      <div className="h-full w-full flex items-center justify-center">
        {hasError ? (
          <img
            src={layer.url || ""}
            alt={layer.name || "Single image"}
            className="rounded-lg object-contain max-w-full max-h-full"
            onError={() => setImageErrors(prev => new Set(prev).add(0))}
          />
        ) : (
          <ReactCompareSliderImage
            src={layer.url || ""}
            srcSet={layer.url || ""}
            alt={layer.name || "Single image"}
            className="rounded-lg object-contain"
            onError={() => setImageErrors(prev => new Set(prev).add(0))}
          />
        )}
      </div>
    )
  }

  const layer1 = layers[0]
  const layer2 = layers[1]
  const hasError1 = imageErrors.has(0)
  const hasError2 = imageErrors.has(1)

  return (
    <div className="w-full h-full">
      <ReactCompareSlider
        className="w-full h-full"
        itemOne={
          hasError1 ? (
            <img
              src={layer1.url || ""}
              alt={layer1.name || "Image one"}
              className="w-full h-full object-contain"
              onError={() => setImageErrors(prev => new Set(prev).add(0))}
            />
          ) : (
            <ReactCompareSliderImage
              src={layer1.url || ""}
              srcSet={layer1.url || ""}
              alt={layer1.name || "Image one"}
              onError={() => setImageErrors(prev => new Set(prev).add(0))}
            />
          )
        }
        itemTwo={
          hasError2 ? (
            <img
              src={layer2.url || ""}
              alt={layer2.name || "Image two"}
              className="w-full h-full object-contain"
              onError={() => setImageErrors(prev => new Set(prev).add(1))}
            />
          ) : (
            <ReactCompareSliderImage
              src={layer2.url || ""}
              srcSet={layer2.url || ""}
              alt={layer2.name || "Image two"}
              onError={() => setImageErrors(prev => new Set(prev).add(1))}
            />
          )
        }
      />
    </div>
  )
}