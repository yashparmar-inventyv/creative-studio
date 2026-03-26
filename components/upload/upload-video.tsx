"use client"

import { useImageStore } from "@/lib/store"
import { useDropzone } from "react-dropzone"
import Lottie from "lottie-react"
import { Card, CardContent } from "../ui/card"
import { cn } from "@/lib/utils"
import { useLayerStore } from "@/lib/layer-store"
import videoAnimation from "@/public/animations/video-upload.json"
import { toast } from "sonner"
import { useState } from "react"

const MAX_VIDEO_SIZE = 10485760 // 10 MB in bytes

export default function UploadVideo() {
  const setTags = useImageStore((state) => state.setTags)
  const setGenerating = useImageStore((state) => state.setGenerating)
  const activeLayer = useLayerStore((state) => state.activeLayer)
  const updateLayer = useLayerStore((state) => state.updateLayer)
  const setActiveLayer = useLayerStore((state) => state.setActiveLayer)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadWithProgress = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("video", file)

      const xhr = new XMLHttpRequest()
      let simulatedProgress = 0
      let progressInterval: NodeJS.Timeout | null = null
      
      // Start with initial progress
      toast.loading("Uploading video... 0%", {
        id: "upload-video-progress",
      })

      // Simulate gradual progress for better UX
      progressInterval = setInterval(() => {
        if (simulatedProgress < 90) {
          simulatedProgress += Math.random() * 5 // Increment by 0-5%
          if (simulatedProgress > 90) simulatedProgress = 90
          toast.loading(`Uploading video... ${Math.round(simulatedProgress)}%`, {
            id: "upload-video-progress",
          })
        }
      }, 200) // Update every 200ms

      // Track actual upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const actualPercent = Math.round((e.loaded / e.total) * 100)
          // Use actual progress when it's higher than simulated
          if (actualPercent > simulatedProgress) {
            simulatedProgress = actualPercent
            setUploadProgress(actualPercent)
            toast.loading(`Uploading video... ${actualPercent}%`, {
              id: "upload-video-progress",
            })
          }
        }
      })

      // Handle completion
      xhr.addEventListener("load", () => {
        if (progressInterval) {
          clearInterval(progressInterval)
        }
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.success) {
              // Show 100% before success
              toast.loading("Uploading video... 100%", {
                id: "upload-video-progress",
              })
              setTimeout(() => {
                toast.success("Video uploaded successfully!", {
                  id: "upload-video-progress",
                })
              }, 300)
              resolve(response)
            } else {
              toast.error(response.error || "Upload failed. Please try again.", {
                id: "upload-video-progress",
              })
              reject(new Error(response.error || "Upload failed"))
            }
          } catch (error) {
            toast.error("Failed to parse server response. Please try again.", {
              id: "upload-video-progress",
            })
            reject(error)
          }
        } else {
          toast.error(`Upload failed: ${xhr.statusText}. Please try again.`, {
            id: "upload-video-progress",
          })
          reject(new Error(`Upload failed: ${xhr.statusText}`))
        }
        setUploadProgress(0)
      })

      // Handle errors
      xhr.addEventListener("error", () => {
        if (progressInterval) {
          clearInterval(progressInterval)
        }
        toast.error("Network error during upload. Please check your connection and try again.", {
          id: "upload-video-progress",
        })
        setUploadProgress(0)
        reject(new Error("Network error"))
      })

      xhr.addEventListener("abort", () => {
        if (progressInterval) {
          clearInterval(progressInterval)
        }
        toast.error("Upload cancelled", {
          id: "upload-video-progress",
        })
        setUploadProgress(0)
        reject(new Error("Upload cancelled"))
      })

      xhr.open("POST", "/api/upload-video")
      xhr.send(formData)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    accept: {
      "video/mp4": [".mp4", ".MP4"],
    },
    onDrop: async (acceptedFiles, fileRejections) => {
      // Handle file rejections
      if (fileRejections.length) {
        const rejection = fileRejections[0]
        if (rejection.errors.some((e) => e.code === "file-too-large")) {
          toast.error(`Video size exceeds ${MAX_VIDEO_SIZE / 1024 / 1024} MB limit`)
        } else if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
          toast.error("Invalid file type. Supported: MP4")
        } else {
          toast.error(rejection.errors[0].message)
        }
        return
      }

      if (acceptedFiles.length) {
        const file = acceptedFiles[0]

        // Check file size
        if (file.size > MAX_VIDEO_SIZE) {
          toast.error(`Video size should not exceed ${MAX_VIDEO_SIZE / 1024 / 1024} MB`)
          return
        }

        setGenerating(true)

        try {
          const res = await uploadWithProgress(file)

          if (res?.success) {
            const cloudinaryResult = res.success
            const videoUrl = cloudinaryResult.url
            const thumbnailUrl = videoUrl.replace(/\.[^/.]+$/, ".jpg")

            updateLayer({
              id: activeLayer.id,
              url: cloudinaryResult.url,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              name: cloudinaryResult.original_filename || file.name,
              publicId: cloudinaryResult.public_id,
              format: cloudinaryResult.format,
              poster: thumbnailUrl,
              resourceType: cloudinaryResult.resource_type || "video",
            })

            if (cloudinaryResult.tags) {
              setTags(cloudinaryResult.tags)
            }

            setActiveLayer(activeLayer.id)
            console.log("Upload successful:", cloudinaryResult)
          } else {
            // Handle case where upload completes but returns error
            toast.error("Video upload failed. Please try again.", {
              id: "upload-video-progress",
            })
            setGenerating(false)
            setUploadProgress(0)
          }
        } catch (error) {
          console.error("Upload error:", error)
          // Error toast is already shown in uploadWithProgress
          setGenerating(false)
          setUploadProgress(0)
        } finally {
          // Only reset if not already done
          if (uploadProgress > 0) {
            setGenerating(false)
            setUploadProgress(0)
          }
        }
      }
    },
  })

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "hover:cursor-pointer hover:bg-secondary hover:border-primary transition-all ease-in-out",
        `${isDragActive ? "animate-pulse border-primary bg-secondary" : ""}`
      )}
    >
      <CardContent className="flex flex-col h-full items-center justify-center px-2 py-24 text-xs">
        <input {...getInputProps()} />
        <div className="flex items-center flex-col justify-center gap-4">
          <Lottie className="h-48" animationData={videoAnimation} />
          <p className="text-muted-foreground text-2xl">
            {isDragActive
              ? "Drop your video here!"
              : "Start by uploading a video"}
          </p>
          <p className="text-muted-foreground">Supported Format: .mp4</p>
        </div>
      </CardContent>
    </Card>
  )
}