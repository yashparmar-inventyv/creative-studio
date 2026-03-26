"use client"

import { useImageStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { replaceBackground } from "@/server/bg-replace"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageOff } from "lucide-react"
import { useLayerStore } from "@/lib/layer-store"
import { useState } from "react"
import { generateUUID } from "@/lib/utils"
import { toast } from "sonner"

export default function AIBackgroundReplace() {
  const setGenerating = useImageStore((state) => state.setGenerating)
  const activeLayer = useLayerStore((state) => state.activeLayer)
  const addLayer = useLayerStore((state) => state.addLayer)
  const generating = useImageStore((state) => state.generating)
  const setActiveLayer = useLayerStore((state) => state.setActiveLayer)

  const [prompt, setPrompt] = useState("")

  return (
    <Popover>
      <PopoverTrigger disabled={!activeLayer?.url} asChild>
        <Button variant="outline" className="py-8">
          <span className="flex gap-1 items-center justify-center flex-col text-xs font-medium">
            AI BG Replace
            <ImageOff size={18} />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              Generative Background Replace
            </h4>
            <p className="text-sm text-muted-foreground">
              Replace the background of your image with AI-generated content.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="prompt">Prompt (optional)</Label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the new background"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
        <Button
          disabled={!activeLayer?.url || generating}
          className="w-full mt-4"
          onClick={async () => {
            if (!activeLayer?.url) {
              toast.error("Please upload an image first")
              return
            }

            if (!prompt.trim()) {
              toast.info("Enter a prompt for better results")
            }

            const toastId = toast.loading("Generating new background...", {
              id: "bg-replace",
            })
            setGenerating(true)

            try {
              const res = await replaceBackground({
                prompt: prompt,
                activeImage: activeLayer.url!,
              })

              if (res?.data?.success) {
                const newLayerId = generateUUID()
                addLayer({
                  id: newLayerId,
                  name: "bg-replaced-" + activeLayer.name,
                  format: activeLayer.format,
                  height: activeLayer.height,
                  width: activeLayer.width,
                  url: res.data.success,
                  publicId: activeLayer.publicId,
                  resourceType: "image",
                })
                toast.success("Background replaced successfully!", {
                  id: "bg-replace",
                })
                setActiveLayer(newLayerId)
              } else if (res?.data?.error) {
                toast.error(res.data.error || "Failed to replace background", {
                  id: "bg-replace",
                })
              } else if (res?.serverError) {
                toast.error(res.serverError, {
                  id: "bg-replace",
                })
              }
            } catch (error) {
              toast.error("An error occurred while replacing background", {
                id: "bg-replace",
              })
              console.error("Background replace error:", error)
            } finally {
              setGenerating(false)
            }
          }}
        >
          {generating ? "Generating..." : "Replace Background"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}