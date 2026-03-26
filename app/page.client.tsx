"use client"

import Editor from "@/components/Editor"
import { LayerStore } from "@/lib/layer-store"
import { ImageStore } from "@/lib/store"
import { generateUUID } from "@/lib/utils"

export default function HomeClient() {
  return (
    <ImageStore.Provider
      initialValue={{
        activeTag: "all",
        activeColor: "green",
        activeImage: "",
      }}>
      <LayerStore.Provider
        initialValue={{
          layerComparisonMode: false,
          layers: [
            {
              id: generateUUID(),
              url: "",
              height: 0,
              width: 0,
              publicId: "",
            },
          ],
        }}
      >
        <Editor />
      </LayerStore.Provider>
    </ImageStore.Provider>
  )
}
