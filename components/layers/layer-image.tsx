"use client"

import { Layer } from "@/lib/layer-store"
import Image from "next/image"

export default function LayerImage({ layer }: { layer: Layer }) {
  if (layer.url)
    return (
      <>
        <div className="w-12 h-12 flex items-center justify-center ">
          <Image
            className="w-full object-contain h-full rounded-sm"
            alt={layer.name || "layer"}
            src={layer.format === "mp4" ? layer.poster || layer.url : layer.url}
            width={50}
            height={50}
            unoptimized={layer.url.startsWith("blob:") || layer.url.startsWith("http://res.cloudinary.com") || layer.url.startsWith("https://res.cloudinary.com")}
            onError={(e) => {
              console.error("Layer image load error:", layer.url, e)
            }}
          />
        </div>
        <div className=" relative">
          <p className="text-xs">
            {layer.name 
              ? `${layer.name.slice(0, 15)}${layer.format ? `.${layer.format}` : ""}`
              : layer.format 
                ? `image.${layer.format}` 
                : "image"}
          </p>
        </div>
      </>
    )
  return null
}