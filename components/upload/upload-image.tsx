"use client"

import { useImageStore } from "@/lib/store"
import { useDropzone } from "react-dropzone"
import Lottie from "lottie-react"
import { Card, CardContent } from "../ui/card"
import { cn } from "@/lib/utils"
import { useLayerStore } from "@/lib/layer-store"
import imageAnimation from "@/public/animations/image-upload.json"
import { toast } from "sonner"
import { useState } from "react"

const MAX_FILE_SIZE = 5242880 // 5 MB in bytes

export default function UploadImage() {
  const setTags = useImageStore((state) => state.setTags)
  const setGenerating = useImageStore((state) => state.setGenerating)
  const activeLayer = useLayerStore((state) => state.activeLayer)
  const updateLayer = useLayerStore((state) => state.updateLayer)
  const setActiveLayer = useLayerStore((state) => state.setActiveLayer)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadWithProgress = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("image", file)

      const xhr = new XMLHttpRequest()
      let simulatedProgress = 0
      let progressInterval: NodeJS.Timeout | null = null
      
      // Start with initial progress
      toast.loading("Uploading... 0%", {
        id: "upload-progress",
      })

      // Simulate gradual progress for better UX
      progressInterval = setInterval(() => {
        if (simulatedProgress < 90) {
          simulatedProgress += Math.random() * 5 // Increment by 0-5%
          if (simulatedProgress > 90) simulatedProgress = 90
          toast.loading(`Uploading... ${Math.round(simulatedProgress)}%`, {
            id: "upload-progress",
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
            toast.loading(`Uploading... ${actualPercent}%`, {
              id: "upload-progress",
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
              toast.loading("Uploading... 100%", {
                id: "upload-progress",
              })
              setTimeout(() => {
                toast.success("Image uploaded successfully!", {
                  id: "upload-progress",
                })
              }, 300)
              resolve(response)
            } else {
              toast.error(response.error || "Upload failed. Please try again.", {
                id: "upload-progress",
              })
              reject(new Error(response.error || "Upload failed"))
            }
          } catch (error) {
            toast.error("Failed to parse server response. Please try again.", {
              id: "upload-progress",
            })
            reject(error)
          }
        } else {
          toast.error(`Upload failed: ${xhr.statusText}. Please try again.`, {
            id: "upload-progress",
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
          id: "upload-progress",
        })
        setUploadProgress(0)
        reject(new Error("Network error"))
      })

      xhr.addEventListener("abort", () => {
        if (progressInterval) {
          clearInterval(progressInterval)
        }
        toast.error("Upload cancelled", {
          id: "upload-progress",
        })
        setUploadProgress(0)
        reject(new Error("Upload cancelled"))
      })

      xhr.open("POST", "/api/upload-image")
      xhr.send(formData)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    accept: {
      "image/png": [".png"],
      "image/jpg": [".jpg"],
      "image/webp": [".webp"],
      "image/jpeg": [".jpeg"],
    },
    onDrop: async (acceptedFiles, fileRejections) => {
      // Handle file rejections
      if (fileRejections.length) {
        const rejection = fileRejections[0]
        if (rejection.errors.some((e) => e.code === "file-too-large")) {
          toast.error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`)
        } else if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
          toast.error("Invalid file type. Supported: PNG, JPG, JPEG, WEBP")
        } else {
          toast.error(rejection.errors[0].message)
        }
        return
      }

      if (acceptedFiles.length) {
        const file = acceptedFiles[0]

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Image size should not exceed ${MAX_FILE_SIZE / 1024 / 1024} MB`)
          return
        }

        // Generate object URL for preview
        const objectUrl = URL.createObjectURL(file)
        setGenerating(true)

        // Update layer with preview
        updateLayer({
          id: activeLayer.id,
          url: objectUrl,
          width: 0,
          height: 0,
          name: "uploading",
          publicId: "",
          format: "",
          resourceType: "image",
        })
        setActiveLayer(activeLayer.id)

        try {
          const res = await uploadWithProgress(file)

          if (res?.success) {
            const cloudinaryResult = res.success
            // Ensure format doesn't have leading dot
            const format = cloudinaryResult.format?.startsWith(".")
              ? cloudinaryResult.format.slice(1)
              : cloudinaryResult.format || "jpg"

            // Use original_filename or fallback to public_id or filename
            const filename =
              cloudinaryResult.original_filename ||
              cloudinaryResult.public_id?.split("/").pop() ||
              file.name?.replace(/\.[^/.]+$/, "") ||
              "image"

            updateLayer({
              id: activeLayer.id,
              url: cloudinaryResult.secure_url || cloudinaryResult.url,
              width: cloudinaryResult.width || 0,
              height: cloudinaryResult.height || 0,
              name: filename,
              publicId: cloudinaryResult.public_id,
              format: format,
              resourceType: cloudinaryResult.resource_type || "image",
            })

            if (cloudinaryResult.tags) {
              setTags(cloudinaryResult.tags)
            }

            setActiveLayer(activeLayer.id)
            console.log("Upload successful:", cloudinaryResult)
          } else {
            // Handle case where upload completes but returns error
            toast.error("Image upload failed. Please try again.", {
              id: "upload-progress",
            })
          }
        } catch (error) {
          console.error("Upload error:", error)
          // Error toast is already shown in uploadWithProgress
        } finally {
          setGenerating(false)
          setUploadProgress(0)
          URL.revokeObjectURL(objectUrl)
        }
      }
    },
  })

  if (!activeLayer.url)
    return (
      <Card
        {...getRootProps()}
        className={cn(
          " hover:cursor-pointer hover:bg-secondary hover:border-primary transition-all  ease-in-out ",
          `${isDragActive ? "animate-pulse border-primary bg-secondary" : ""}`
        )}
      >
        <CardContent className="flex flex-col h-full items-center justify-center px-2 py-24  text-xs ">
          <input {...getInputProps()} />
          <div className="flex items-center flex-col justify-center gap-4">
            <Lottie className="h-48" animationData={imageAnimation} />
            <p className="text-muted-foreground text-2xl">
              {isDragActive
                ? "Drop your image here!"
                : "Start by uploading an image"}
            </p>
            <p className="text-muted-foreground">
              Supported Formats .jpeg .jpg .png .webp
            </p>
          </div>
        </CardContent>
      </Card>
    )
}