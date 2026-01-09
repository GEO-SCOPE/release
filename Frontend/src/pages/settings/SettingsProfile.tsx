/**
 * Settings Profile - 账户信息
 * 头像、公司名、联系人、邮箱、密码、退出登录
 * 数据来源：userApi + useProjectStore.currentUser
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Save, Loader2, LogOut } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { useProjectStore } from "@/store/project-store"
import { useAuthStore } from "@/store/auth-store"
import { userApi, normalizeAvatarUrl } from "@/api"
import { AvatarUploadDialog } from "@/components/avatar-upload-dialog"

export default function SettingsProfile() {
  const { t } = useI18n()
  const { currentUser, updateUserProfile, setCurrentUser } = useProjectStore()
  const { logout } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)

  // Local state for form editing
  const [profile, setProfile] = useState({
    avatar: currentUser?.avatar || "",
    companyName: currentUser?.company_name || "",
    contactName: currentUser?.name || "",
    email: currentUser?.email || "",
  })

  const [isLoading, setIsLoading] = useState(false)

  // 初始加载时从 API 获取最新用户数据
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await userApi.getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    fetchUser()
  }, [setCurrentUser])

  // Sync with store when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfile({
        avatar: currentUser.avatar || "",
        companyName: currentUser.company_name,
        contactName: currentUser.name,
        email: currentUser.email,
      })
    }
  }, [currentUser])

  const [isEditing, setIsEditing] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // 调用 API 更新用户信息
      const updatedUser = await userApi.updateProfile({
        name: profile.contactName,
        email: profile.email,
        avatar: profile.avatar,
      })
      // 更新 store
      updateUserProfile(updatedUser)
      toast.success(t("settings.profile.saveSuccess"))
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error(t("settings.profile.saveFailed") || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File): Promise<string> => {
    // 1. 上传文件
    const result = await userApi.uploadAvatar(file, currentUser?.id)

    // 2. 确保数据库更新（存相对路径）
    await userApi.updateAvatar(result.url)

    // 3. 更新本地状态（存相对路径，显示时会被 normalizeAvatarUrl 处理）
    setProfile((prev) => ({ ...prev, avatar: result.url }))

    // 4. 更新 store（存相对路径）
    if (currentUser) {
      updateUserProfile({ ...currentUser, avatar: result.url })
    }

    // 5. 重新获取用户数据确保同步
    try {
      const user = await userApi.getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }

    toast.success(t("settings.profile.uploadSuccess"))
    // 返回完整 URL 给 dialog 用于显示预览
    return normalizeAvatarUrl(result.url)
  }

  return (
    <div className="space-y-6">
      {/* Avatar Upload Dialog */}
      <AvatarUploadDialog
        open={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        currentAvatar={normalizeAvatarUrl(profile.avatar)}
        fallbackText={profile.companyName.charAt(0) || "U"}
        onUpload={handleAvatarUpload}
      />

      {/* Profile - 头像和退出登录 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.profile")}</CardTitle>
          <CardDescription>{t("settings.profile.profileDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 头像上传和退出登录 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className="relative cursor-pointer group"
                onClick={() => setIsAvatarDialogOpen(true)}
              >
                <Avatar className="h-20 w-20 transition-opacity group-hover:opacity-80">
                  {profile.avatar && <AvatarImage src={normalizeAvatarUrl(profile.avatar)} />}
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile.companyName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                  <Camera className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{t("settings.profile.avatarHint")}</p>
                <p className="mt-1">PNG, JPG, GIF, WebP · max 2MB</p>
              </div>
            </div>

            {/* 退出登录 */}
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={async () => {
                setIsLoggingOut(true)
                try {
                  await logout()
                } catch (error) {
                  console.error("Logout failed:", error)
                  toast.error(t("settings.profile.logoutFailed"))
                } finally {
                  setIsLoggingOut(false)
                }
              }}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {t("settings.profile.logout")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.basicInfo")}</CardTitle>
          <CardDescription>{t("settings.profile.basicInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("settings.profile.companyName")}</Label>
              <Input
                id="companyName"
                value={profile.companyName}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.profile.companyNameHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">{t("settings.profile.contactName")}</Label>
              <Input
                id="contactName"
                value={profile.contactName}
                onChange={(e) => setProfile({ ...profile, contactName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("settings.profile.email")}</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              disabled={!isEditing}
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.profile.emailHint")}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {t("common.save")}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                {t("common.edit")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.changePassword")}</CardTitle>
          <CardDescription>{t("settings.profile.changePasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => toast.info(t("settings.profile.passwordResetSent"))}>
            {t("settings.profile.changePasswordBtn")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
