/**
 * Avatar Upload Dialog
 * 头像上传弹窗组件
 */

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2, X, ImageIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface AvatarUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAvatar?: string
  fallbackText?: string
  onUpload: (file: File) => Promise<string>
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export function AvatarUploadDialog({
  open,
  onOpenChange,
  currentAvatar,
  fallbackText = "U",
  onUpload,
}: AvatarUploadDialogProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = useCallback((file: File) => {
    setError(null)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("settings.profile.invalidFileType"))
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t("settings.profile.fileTooLarge"))
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }, [t])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      await onUpload(selectedFile)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.profile.uploadFailed"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setIsDragging(false)
    onOpenChange(false)
  }

  const handleRemoveSelected = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.profile.uploadAvatarTitle")}</DialogTitle>
          <DialogDescription>
            {t("settings.profile.uploadAvatarDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview area */}
          <div className="flex items-center justify-center gap-6">
            {/* Current avatar */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">{t("settings.profile.current")}</p>
              <Avatar className="h-20 w-20">
                {currentAvatar && <AvatarImage src={currentAvatar} />}
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {fallbackText}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Arrow */}
            {previewUrl && (
              <>
                <div className="text-muted-foreground">→</div>
                {/* New preview */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">{t("settings.profile.new")}</p>
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={previewUrl} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {fallbackText}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveSelected}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drop zone */}
          {!previewUrl && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                {t("settings.profile.dropOrClick")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF, WebP · {t("settings.profile.maxSize")} 2MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("settings.profile.uploading")}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t("settings.profile.upload")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
