"use client"

import { useImageStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { bgRemoval } from "@/server/bg-remove"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Image } from "lucide-react"
import { useLayerStore } from "@/lib/layer-store"
import { toast } from "sonner"
import { generateUUID } from "@/lib/utils"

export default function BgRemove() {
  const activeTag = useImageStore((state) => state.activeTag)
  const activeColor = useImageStore((state) => state.activeColor)
  const setGenerating = useImageStore((state) => state.setGenerating)
  const activeLayer = useLayerStore((state) => state.activeLayer)
  const addLayer = useLayerStore((state) => state.addLayer)
  const generating = useImageStore((state) => state.generating)
  const setActiveLayer = useLayerStore((state) => state.setActiveLayer)
  return (
    <Popover>
      <PopoverTrigger disabled={!activeLayer?.url} asChild>
        <Button variant="outline" className="py-8">
          <span className="flex gap-1 items-center justify-center flex-col text-xs font-medium">
            BG Removal
            <Image size={18} />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Background Removal</h4>
            <p className="text-sm max-w-xs text-muted-foreground">
              Remove the background of an image with one simple click.
            </p>
          </div>
        </div>

        <Button
          disabled={
            !activeLayer?.url || !activeTag || !activeColor || generating
          }
          className="w-full mt-4"
          onClick={async () => {
            if (!activeLayer?.url) {
              toast.error("Please upload an image first")
              return
            }
            if (!activeTag || !activeColor) {
              toast.info("Please select a tag and color")
              return
            }

            const toastId = toast.loading("Removing background...", {
              id: "bg-remove",
            })
            setGenerating(true)

            try {
              const res = await bgRemoval({
                activeImage: activeLayer.url!,
                format: activeLayer.format!,
              })

              if (res?.data?.success) {
                const newLayerId = generateUUID()
                addLayer({
                  id: newLayerId,
                  name: "bg-removed" + activeLayer.name,
                  format: "png",
                  height: activeLayer.height,
                  width: activeLayer.width,
                  url: res.data.success,
                  publicId: activeLayer.publicId,
                  resourceType: "image",
                })
                toast.success("Background removal applied successfully!", {
                  id: "bg-remove",
                })
                setActiveLayer(newLayerId)
              } else if (res?.data?.error) {
                toast.error(res.data.error || "Failed to remove background", {
                  id: "bg-remove",
                })
              } else if (res?.serverError) {
                toast.error(res.serverError, {
                  id: "bg-remove",
                })
              }
            } catch (error) {
              toast.error("An error occurred while removing background", {
                id: "bg-remove",
              })
              console.error("Background removal error:", error)
            } finally {
              setGenerating(false)
            }
          }}
        >
          {generating ? "Removing..." : "Remove Background"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}