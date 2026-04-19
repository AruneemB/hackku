"use client"

import { Camera, ImagePlus, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import styles from "./DemoReceiptCapture.module.css"

export interface DemoReceiptCapturePayload {
  imageBase64: string
  mimeType: string
  previewDataUrl: string
}

interface DemoReceiptCaptureProps {
  onCapture: (payload: DemoReceiptCapturePayload) => void
  onClose: () => void
}

export function DemoReceiptCapture({ onCapture, onClose }: DemoReceiptCaptureProps) {
  const [webcamReady, setWebcamReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopWebcam = useCallback(() => {
    console.info("[demo-receipt] stopping webcam stream")
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startWebcam = useCallback(async () => {
    console.info("[demo-receipt] requesting camera access")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setWebcamReady(true)
      console.info("[demo-receipt] camera ready")
    } catch (err) {
      console.warn("[demo-receipt] camera unavailable, falling back to file input", err)
      setWebcamReady(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void startWebcam()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      stopWebcam()
    }
  }, [startWebcam, stopWebcam])

  function submitDataUrl(dataUrl: string, mimeType: string) {
    const imageBase64 = dataUrl.split(",")[1] ?? ""
    onCapture({ imageBase64, mimeType, previewDataUrl: dataUrl })
  }

  function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    console.info("[demo-receipt] capturing frame from webcam")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    stopWebcam()
    submitDataUrl(dataUrl, "image/jpeg")
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    console.info("[demo-receipt] file selected", { name: file.name, type: file.type, size: file.size })
    const reader = new FileReader()
    reader.onload = (ev) => {
      stopWebcam()
      submitDataUrl(ev.target?.result as string, file.type || "image/jpeg")
    }
    reader.readAsDataURL(file)
  }

  function handleClose() {
    stopWebcam()
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button className={styles.utilityButton} onClick={handleClose} type="button">
          <X size={16} />
        </button>
        <div className={styles.headerCopy}>
          <div className={styles.title}>Scan receipt</div>
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.cameraWrap}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={[styles.video, webcamReady ? "" : styles.hiddenVideo].join(" ")}
          />
          {!webcamReady ? (
            <div className={styles.fallback}>
              <Camera size={28} />
              <div className={styles.fallbackTitle}>Camera unavailable</div>
              <div className={styles.fallbackBody}>Upload a receipt photo instead.</div>
            </div>
          ) : null}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className={styles.footer}>
        <div className={styles.actions}>
          <label className={styles.secondaryAction}>
            <ImagePlus size={16} />
            Upload
            <input accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} type="file" />
          </label>
          <button className={styles.captureButton} disabled={!webcamReady} onClick={handleCapture} type="button">
            <Camera size={17} />
            Capture
          </button>
        </div>
      </div>
    </div>
  )
}
