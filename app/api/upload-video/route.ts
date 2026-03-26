import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      return NextResponse.json(
        { error: "No video provided" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new Promise<NextResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: "creative_studio",
          resource_type: "video",
          use_filename: true,
          unique_filename: false,
          filename_override: file.name,
        },
        (error, result) => {
          if (error || !result) {
            console.error("Upload failed:", error)
            reject(
              NextResponse.json(
                { error: "Upload failed" },
                { status: 500 }
              )
            )
          } else {
            console.log("Upload successful:", result)
            resolve(NextResponse.json({ success: result }))
          }
        }
      )

      uploadStream.end(buffer)
    })
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json(
      { error: "Error processing file" },
      { status: 500 }
    )
  }
}
