import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Package, Building2, Globe, MapPin, ExternalLink, Star } from "lucide-react"
import { CardMasonry } from "@/components/reactbits/Masonry"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { useProjectStore } from "@/store/project-store"
import type { ProductFeature, Competitor, BusinessScope, RegionVersion, ProductVersion } from "@/lib/api"

// 预设语言列表
const REGION_LANGUAGES = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
]

function BusinessScopeTab({ t, locale }: { t: (key: string) => string; locale: string }) {
  const { currentProject, addBusinessScope, updateBusinessScope, removeBusinessScope } = useProjectStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingScope, setEditingScope] = useState<BusinessScope | null>(null)
  const [formData, setFormData] = useState({
    versions: [] as RegionVersion[],
  })
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  // Track selected region for each scope card
  const [selectedRegions, setSelectedRegions] = useState<Record<string, string>>({})

  const businessScopes = currentProject?.assets?.business_scopes || []

  // Backward compatibility: convert old format to new format
  const getVersions = (scope: any): RegionVersion[] => {
    // New format: has versions array
    if (scope.versions && scope.versions.length > 0) {
      return scope.versions
    }
    // Old format: has product_name and regions
    if (scope.product_name && scope.regions && scope.regions.length > 0) {
      return scope.regions.map((region: string) => ({
        region,
        product_name: scope.product_name,
        description: scope.description || "",
        language: scope.languages?.[0] || "zh"
      }))
    }
    // Old format: has product_name but no regions
    if (scope.product_name) {
      return [{
        region: "默认",
        product_name: scope.product_name,
        description: scope.description || "",
        language: scope.languages?.[0] || "zh"
      }]
    }
    return []
  }

  // Get all regions from versions
  const getRegions = (scope: BusinessScope): string[] => {
    return getVersions(scope).map(v => v.region)
  }

  // Get version by region
  const getVersionByRegion = (scope: BusinessScope, region: string): RegionVersion | undefined => {
    return getVersions(scope).find(v => v.region === region)
  }

  // Get default region based on locale
  const getDefaultRegion = (scope: BusinessScope): string => {
    const regions = getRegions(scope)
    if (regions.length === 0) return ""
    if (locale === "zh") {
      return regions.includes("中国大陆") ? "中国大陆" : regions[0]
    } else {
      const nonChina = regions.find(r => r !== "中国大陆")
      return nonChina || regions[0]
    }
  }

  // Get selected region for a scope (with default fallback)
  const getSelectedRegion = (scope: BusinessScope): string => {
    if (selectedRegions[scope.id]) return selectedRegions[scope.id]
    return getDefaultRegion(scope)
  }

  // Get selected version for display
  const getSelectedVersion = (scope: BusinessScope): RegionVersion | undefined => {
    const region = getSelectedRegion(scope)
    return getVersionByRegion(scope, region)
  }

  // Handle region selection
  const handleSelectRegion = (scopeId: string, region: string) => {
    setSelectedRegions(prev => ({ ...prev, [scopeId]: region }))
  }

  // Add new regional version
  const handleAddVersion = () => {
    const newVersions = [
      ...formData.versions,
      { region: "", product_name: "", description: "", language: "zh" }
    ]
    setFormData({ versions: newVersions })
    setActiveTabIndex(newVersions.length - 1)  // Switch to new tab
  }

  // Update a version field
  const handleUpdateVersion = (index: number, field: keyof RegionVersion, value: string) => {
    const newVersions = [...formData.versions]
    newVersions[index] = { ...newVersions[index], [field]: value }
    setFormData({ versions: newVersions })
  }

  // Remove a version
  const handleRemoveVersion = (index: number) => {
    const newVersions = formData.versions.filter((_, i) => i !== index)
    setFormData({ versions: newVersions })
    // Adjust active tab if needed
    if (activeTabIndex >= newVersions.length) {
      setActiveTabIndex(Math.max(0, newVersions.length - 1))
    }
  }

  const handleSave = () => {
    if (formData.versions.length === 0) {
      toast.error(t("assets.atLeastOneVersion"))
      return
    }
    if (formData.versions.some(v => !v.region.trim() || !v.product_name.trim())) {
      toast.error(t("assets.versionFieldsRequired"))
      return
    }

    const scopeData: BusinessScope = {
      id: editingScope?.id || `bs-${Date.now()}`,
      category: "",
      keywords: [],
      versions: formData.versions,
    }

    if (editingScope) {
      updateBusinessScope(editingScope.id, scopeData)
      toast.success(t("assets.businessScopeUpdated"))
    } else {
      addBusinessScope(scopeData)
      toast.success(t("assets.businessScopeAdded"))
    }

    setDialogOpen(false)
    setEditingScope(null)
    setFormData({ versions: [] })
    setActiveTabIndex(0)
  }

  const handleEdit = (scope: BusinessScope) => {
    setEditingScope(scope)
    // Convert old format to new format for editing
    const versions = getVersions(scope)
    setFormData({ versions })
    setActiveTabIndex(0)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    removeBusinessScope(id)
    toast.success(t("assets.businessScopeDeleted"))
  }

  const resetForm = () => {
    setEditingScope(null)
    setFormData({ versions: [] })
    setActiveTabIndex(0)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {t("assets.businessScopeDescription")}
        </p>
        <Button onClick={resetForm}>
          <Plus className="mr-2 h-4 w-4" />
          {t("assets.addBusinessScope")}
        </Button>
      </div>

      {businessScopes.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("assets.noBusinessScopes")}</p>
          </CardContent>
        </Card>
      ) : (
        <CardMasonry columns={{ default: 1, md: 2, lg: 3 }} gap={16}>
          {businessScopes.map((scope) => {
            const selectedVersion = getSelectedVersion(scope)
            const regions = getRegions(scope)
            return (
              <Card key={scope.id} className="group relative">
                <CardContent className="p-4">
                  {/* 头部：产品名 + 操作按钮 */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-base">
                      {selectedVersion?.product_name || t("assets.noVersions")}
                    </h3>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(scope)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(scope.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* 地区标签（可切换选中） */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {regions.length > 0 ? (
                      regions.map((region) => {
                        const isSelected = getSelectedRegion(scope) === region
                        return (
                          <Badge
                            key={region}
                            variant={isSelected ? "default" : "secondary"}
                            className={`text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "hover:bg-secondary/80"
                            }`}
                            onClick={() => handleSelectRegion(scope.id, region)}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {region}
                          </Badge>
                        )
                      })
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground cursor-pointer hover:bg-muted"
                        onClick={() => handleEdit(scope)}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {t("assets.noRegion")}
                      </Badge>
                    )}
                  </div>

                  {/* 描述 */}
                  {selectedVersion?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedVersion.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </CardMasonry>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingScope ? t("assets.editBusinessScope") : t("assets.addBusinessScope")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* 地区选项卡 */}
            <div className="flex items-center gap-1 mb-4 flex-wrap">
              {formData.versions.map((version, index) => (
                <Badge
                  key={index}
                  variant={activeTabIndex === index ? "default" : "secondary"}
                  className={`cursor-pointer transition-colors ${
                    activeTabIndex === index
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary/80"
                  }`}
                  onClick={() => setActiveTabIndex(index)}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {version.region || t("assets.newRegion")}
                </Badge>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2"
                onClick={handleAddVersion}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* 当前选中地区的编辑表单 */}
            {formData.versions.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">{t("assets.noVersionsYet")}</p>
                <Button variant="outline" size="sm" onClick={handleAddVersion}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("assets.addRegionVersion")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.versions[activeTabIndex] && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{t("assets.region")} *</Label>
                        <Input
                          value={formData.versions[activeTabIndex].region}
                          onChange={(e) => handleUpdateVersion(activeTabIndex, "region", e.target.value)}
                          placeholder={t("assets.regionPlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("assets.boundLanguage")}</Label>
                        <Select
                          value={formData.versions[activeTabIndex].language}
                          onValueChange={(value) => handleUpdateVersion(activeTabIndex, "language", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REGION_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("assets.productName")} *</Label>
                      <Input
                        value={formData.versions[activeTabIndex].product_name}
                        onChange={(e) => handleUpdateVersion(activeTabIndex, "product_name", e.target.value)}
                        placeholder={t("assets.productNamePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("assets.scopeDescription")}</Label>
                      <Textarea
                        value={formData.versions[activeTabIndex].description}
                        onChange={(e) => handleUpdateVersion(activeTabIndex, "description", e.target.value)}
                        placeholder={t("assets.scopeDescriptionPlaceholder")}
                        rows={3}
                      />
                    </div>

                    {/* 删除当前地区 */}
                    {formData.versions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive w-full"
                        onClick={() => handleRemoveVersion(activeTabIndex)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t("assets.deleteRegion")}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Products Tab - 产品地区版本管理（选项卡布局，与业务范围一致）
function ProductsTab({ t, locale }: { t: (key: string) => string; locale: string }) {
  const { currentProject, addProduct, updateProduct, removeProduct } = useProjectStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductFeature | null>(null)
  const [formData, setFormData] = useState({
    versions: [] as ProductVersion[],
  })
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  // Track selected region for each product card
  const [selectedRegions, setSelectedRegions] = useState<Record<string, string>>({})

  const products = currentProject?.assets?.products || []

  // Get versions (with fallback for old data)
  const getVersions = (product: ProductFeature): ProductVersion[] => {
    return product.versions || []
  }

  // Get all regions from versions
  const getRegions = (product: ProductFeature): string[] => {
    return getVersions(product).map(v => v.region)
  }

  // Get version by region
  const getVersionByRegion = (product: ProductFeature, region: string): ProductVersion | undefined => {
    return getVersions(product).find(v => v.region === region)
  }

  // Get default region based on locale
  const getDefaultRegion = (product: ProductFeature): string => {
    const regions = getRegions(product)
    if (regions.length === 0) return ""
    if (locale === "zh") {
      return regions.includes("中国大陆") ? "中国大陆" : regions[0]
    } else {
      const nonChina = regions.find(r => r !== "中国大陆")
      return nonChina || regions[0]
    }
  }

  // Get selected region for a product (with default fallback)
  const getSelectedRegion = (product: ProductFeature): string => {
    if (selectedRegions[product.id]) return selectedRegions[product.id]
    return getDefaultRegion(product)
  }

  // Get selected version for display
  const getSelectedVersion = (product: ProductFeature): ProductVersion | undefined => {
    const region = getSelectedRegion(product)
    return getVersionByRegion(product, region)
  }

  // Handle region selection
  const handleSelectRegion = (productId: string, region: string) => {
    setSelectedRegions(prev => ({ ...prev, [productId]: region }))
  }

  // Add new region version
  const handleAddVersion = () => {
    const newVersions = [
      ...formData.versions,
      { region: "", name: "", description: "", language: "zh" }
    ]
    setFormData({ versions: newVersions })
    setActiveTabIndex(newVersions.length - 1)
  }

  // Update a version field
  const handleUpdateVersion = (index: number, field: keyof ProductVersion, value: string) => {
    const newVersions = [...formData.versions]
    newVersions[index] = { ...newVersions[index], [field]: value }
    setFormData({ versions: newVersions })
  }

  // Remove a version
  const handleRemoveVersion = (index: number) => {
    const newVersions = formData.versions.filter((_, i) => i !== index)
    setFormData({ versions: newVersions })
    if (activeTabIndex >= newVersions.length) {
      setActiveTabIndex(Math.max(0, newVersions.length - 1))
    }
  }

  const handleSave = () => {
    if (formData.versions.length === 0) {
      toast.error(t("assets.atLeastOneVersion"))
      return
    }
    if (formData.versions.some(v => !v.region.trim() || !v.name.trim())) {
      toast.error(t("assets.versionFieldsRequired"))
      return
    }

    const productData: ProductFeature = {
      id: editingProduct?.id || `p-${Date.now()}`,
      versions: formData.versions,
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, productData)
      toast.success(t("assets.productUpdateSuccess"))
    } else {
      addProduct(productData)
      toast.success(t("assets.productAddSuccess"))
    }

    setDialogOpen(false)
    setEditingProduct(null)
    setFormData({ versions: [] })
    setActiveTabIndex(0)
  }

  const handleEdit = (product: ProductFeature) => {
    setEditingProduct(product)
    setFormData({ versions: getVersions(product) })
    setActiveTabIndex(0)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    removeProduct(id)
    toast.success(t("assets.productDeleteSuccess"))
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({ versions: [] })
    setActiveTabIndex(0)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {t("assets.productsDescription")}
        </p>
        <Button onClick={resetForm}>
          <Plus className="mr-2 h-4 w-4" />
          {t("assets.addProduct")}
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("assets.noProducts")}</p>
          </CardContent>
        </Card>
      ) : (
        <CardMasonry columns={{ default: 1, md: 2, lg: 3 }} gap={16}>
          {products.map((product) => {
            const selectedVersion = getSelectedVersion(product)
            const regions = getRegions(product)
            return (
              <Card key={product.id} className="group relative">
                <CardContent className="p-4">
                  {/* 头部：产品名 + 操作按钮 */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-base">
                      {selectedVersion?.name || t("assets.noVersions")}
                    </h3>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(product)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* 地区标签（可切换选中） */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {regions.length > 0 ? (
                      regions.map((region) => {
                        const isSelected = getSelectedRegion(product) === region
                        return (
                          <Badge
                            key={region}
                            variant={isSelected ? "default" : "secondary"}
                            className={`text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "hover:bg-secondary/80"
                            }`}
                            onClick={() => handleSelectRegion(product.id, region)}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {region}
                          </Badge>
                        )
                      })
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground cursor-pointer hover:bg-muted"
                        onClick={() => handleEdit(product)}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {t("assets.noRegion")}
                      </Badge>
                    )}
                  </div>

                  {/* 描述 */}
                  {selectedVersion?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedVersion.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </CardMasonry>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? t("assets.editProduct") : t("assets.addProduct")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* 地区选项卡 */}
            <div className="flex items-center gap-1 mb-4 flex-wrap">
              {formData.versions.map((version, index) => (
                <Badge
                  key={index}
                  variant={activeTabIndex === index ? "default" : "secondary"}
                  className={`cursor-pointer transition-colors ${
                    activeTabIndex === index
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary/80"
                  }`}
                  onClick={() => setActiveTabIndex(index)}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {version.region || t("assets.newRegion")}
                </Badge>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2"
                onClick={handleAddVersion}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* 当前选中地区的编辑表单 */}
            {formData.versions.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">{t("assets.noVersionsYet")}</p>
                <Button variant="outline" size="sm" onClick={handleAddVersion}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("assets.addRegionVersion")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.versions[activeTabIndex] && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{t("assets.region")} *</Label>
                        <Input
                          value={formData.versions[activeTabIndex].region}
                          onChange={(e) => handleUpdateVersion(activeTabIndex, "region", e.target.value)}
                          placeholder={t("assets.regionPlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("assets.boundLanguage")}</Label>
                        <Select
                          value={formData.versions[activeTabIndex].language}
                          onValueChange={(value) => handleUpdateVersion(activeTabIndex, "language", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REGION_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("assets.productName")} *</Label>
                      <Input
                        value={formData.versions[activeTabIndex].name}
                        onChange={(e) => handleUpdateVersion(activeTabIndex, "name", e.target.value)}
                        placeholder={t("assets.productNamePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("assets.productDescription")}</Label>
                      <Textarea
                        value={formData.versions[activeTabIndex].description}
                        onChange={(e) => handleUpdateVersion(activeTabIndex, "description", e.target.value)}
                        placeholder={t("assets.productDescriptionPlaceholder")}
                        rows={3}
                      />
                    </div>

                    {/* 删除当前地区 */}
                    {formData.versions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive w-full"
                        onClick={() => handleRemoveVersion(activeTabIndex)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t("assets.deleteRegion")}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Competitors Tab
function CompetitorsTab({ t }: { t: (key: string) => string }) {
  const { currentProject, addCompetitor, updateCompetitor, removeCompetitor } = useProjectStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    is_primary: false,
  })

  const competitors = currentProject?.assets?.competitors || []

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("竞品名称必填")
      return
    }

    const competitorData: Competitor = {
      id: editingCompetitor?.id || `c-${Date.now()}`,
      name: formData.name,
      website: formData.website,
      is_primary: formData.is_primary,
    }

    if (editingCompetitor) {
      updateCompetitor(editingCompetitor.id, competitorData)
      toast.success("竞品更新成功")
    } else {
      addCompetitor(competitorData)
      toast.success("竞品添加成功")
    }

    setDialogOpen(false)
    setEditingCompetitor(null)
    setFormData({ name: "", website: "", is_primary: false })
  }

  const handleEdit = (competitor: Competitor) => {
    setEditingCompetitor(competitor)
    setFormData({
      name: competitor.name,
      website: competitor.website,
      is_primary: competitor.is_primary,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    removeCompetitor(id)
    toast.success("竞品已删除")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {t("assets.competitorsDescription")}
        </p>
        <Button onClick={() => { setEditingCompetitor(null); setFormData({ name: "", website: "", is_primary: false }); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          添加竞品
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>网站</TableHead>
            <TableHead>级别</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                {t("assets.noCompetitors")}
              </TableCell>
            </TableRow>
          ) : (
            competitors.map((comp) => (
              <TableRow key={comp.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {comp.name}
                  </div>
                </TableCell>
                <TableCell>
                  {comp.website && (
                    <a href={comp.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                      {new URL(comp.website).hostname}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {comp.is_primary ? (
                    <Badge variant="solid-destructive"><Star className="h-3 w-3 mr-1" />主要竞品</Badge>
                  ) : (
                    <Badge variant="outline">次要竞品</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(comp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(comp.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompetitor ? "编辑竞品" : "添加竞品"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>竞品名称 *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如：法大大" />
            </div>
            <div className="space-y-2">
              <Label>网站</Label>
              <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://www.example.com" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_primary">标记为主要竞品</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== 主张Tab - 暂时注释 ==============
/*
function ClaimsTab({ }: { t: (key: string) => string }) {
  const { currentProject, addBrandClaim, updateBrandClaim, removeBrandClaim } = useProjectStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClaim, setEditingClaim] = useState<BrandClaim | null>(null)
  const [formData, setFormData] = useState({
    statement: "",
    category: "",
    evidence_urls: "",
    is_verified: false,
  })

  const claims = currentProject?.assets?.brand_claims || []

  const handleSave = () => {
    if (!formData.statement.trim()) {
      toast.error("主张内容必填")
      return
    }

    const claimData: BrandClaim = {
      id: editingClaim?.id || `bc-${Date.now()}`,
      statement: formData.statement,
      category: formData.category,
      evidence_urls: formData.evidence_urls.split("\n").map((u) => u.trim()).filter(Boolean),
      is_verified: formData.is_verified,
    }

    if (editingClaim) {
      updateBrandClaim(editingClaim.id, claimData)
      toast.success("主张更新成功")
    } else {
      addBrandClaim(claimData)
      toast.success("主张添加成功")
    }

    setDialogOpen(false)
    setEditingClaim(null)
    setFormData({ statement: "", category: "", evidence_urls: "", is_verified: false })
  }

  const handleEdit = (claim: BrandClaim) => {
    setEditingClaim(claim)
    setFormData({
      statement: claim.statement,
      category: claim.category,
      evidence_urls: claim.evidence_urls.join("\n"),
      is_verified: claim.is_verified,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    removeBrandClaim(id)
    toast.success("主张已删除")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          管理品牌可核验主张，用于AI回答的真实性核验
        </p>
        <Button onClick={() => { setEditingClaim(null); setFormData({ statement: "", category: "", evidence_urls: "", is_verified: false }); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          添加主张
        </Button>
      </div>

      <div className="grid gap-4">
        {claims.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无品牌主张，点击上方按钮添加</p>
            </CardContent>
          </Card>
        ) : (
          claims.map((claim) => (
            <Card key={claim.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{claim.category}</Badge>
                      {claim.is_verified ? (
                        <Badge variant="solid-success"><ShieldCheck className="h-3 w-3 mr-1" />已核验</Badge>
                      ) : (
                        <Badge variant="secondary">待核验</Badge>
                      )}
                    </div>
                    <p className="font-medium">{claim.statement}</p>
                    {claim.evidence_urls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {claim.evidence_urls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            证据链接 {idx + 1}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(claim)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(claim.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClaim ? "编辑主张" : "添加主张"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>主张内容 *</Label>
              <Textarea value={formData.statement} onChange={(e) => setFormData({ ...formData, statement: e.target.value })} placeholder="如：电子签名具有法律效力" />
            </div>
            <div className="space-y-2">
              <Label>分类</Label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="如：legal, security, tech" />
            </div>
            <div className="space-y-2">
              <Label>证据链接（每行一个URL）</Label>
              <Textarea value={formData.evidence_urls} onChange={(e) => setFormData({ ...formData, evidence_urls: e.target.value })} placeholder="https://www.example.com/evidence" rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_verified"
                checked={formData.is_verified}
                onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_verified">标记为已核验</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
*/
// ============== 主张Tab - 注释结束 ==============

// ============== 来源Tab - 暂时注释 ==============
/*
function SourcesTab({ }: { t: (key: string) => string }) {
  const { trustedSources, addTrustedSource, updateTrustedSource, removeTrustedSource } = useProjectStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<TrustedSource | null>(null)
  const [formData, setFormData] = useState({
    domain: "",
    tier: "media" as SourceTier,
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!formData.domain.trim()) {
      toast.error("域名必填")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingSource) {
        await updateTrustedSource(editingSource.id, formData)
        toast.success("来源更新成功")
      } else {
        await addTrustedSource(formData)
        toast.success("来源添加成功")
      }
      setDialogOpen(false)
      setEditingSource(null)
      setFormData({ domain: "", tier: "media", description: "" })
    } catch {
      toast.error("操作失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (source: TrustedSource) => {
    setEditingSource(source)
    setFormData({
      domain: source.domain,
      tier: source.tier,
      description: source.description,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await removeTrustedSource(id)
      toast.success("来源已删除")
    } catch {
      toast.error("删除失败")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          管理权威来源，用于评估AI引用的可信度
        </p>
        <Button onClick={() => { setEditingSource(null); setFormData({ domain: "", tier: "media", description: "" }); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          添加来源
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>域名</TableHead>
            <TableHead>级别</TableHead>
            <TableHead>描述</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trustedSources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                暂无权威来源数据
              </TableCell>
            </TableRow>
          ) : (
            trustedSources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {source.domain}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={TIER_COLORS[source.tier]}>
                    {source.tier === "official" && "官方"}
                    {source.tier === "authority" && "权威"}
                    {source.tier === "media" && "媒体"}
                    {source.tier === "untrusted" && "不可信"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{source.description}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(source)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(source.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSource ? "编辑来源" : "添加来源"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>域名 *</Label>
              <Input value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} placeholder="如：esign.cn" />
            </div>
            <div className="space-y-2">
              <Label>可信度级别</Label>
              <Select value={formData.tier} onValueChange={(value: SourceTier) => setFormData({ ...formData, tier: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="official">官方 (Official)</SelectItem>
                  <SelectItem value="authority">权威 (Authority)</SelectItem>
                  <SelectItem value="media">媒体 (Media)</SelectItem>
                  <SelectItem value="untrusted">不可信 (Untrusted)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="如：e签宝官网" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <RotateCcw className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
*/
// ============== 来源Tab - 注释结束 ==============

export default function AssetsPage() {
  const { t, locale } = useI18n()
  const { currentProject, loadProject } = useProjectStore()

  useEffect(() => {
    if (currentProject) {
      loadProject(currentProject.id)
    }
  }, [])

  return (
    <>
      <PageHeader
        title={t("assets.title")}
        description={t("assets.description")}
      />

      <div className="p-8">
        {!currentProject ? (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" disableBackdrop>
            <CardContent className="py-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                请先在项目管理中选择或创建一个项目
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="business-scope" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mb-2">
              <TabsTrigger value="business-scope" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t("assets.businessScope")}
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("assets.products")}
              </TabsTrigger>
              <TabsTrigger value="competitors" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("assets.competitors")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="business-scope">
              <BusinessScopeTab t={t} locale={locale} />
            </TabsContent>

            <TabsContent value="products">
              <ProductsTab t={t} locale={locale} />
            </TabsContent>

            <TabsContent value="competitors">
              <CompetitorsTab t={t} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  )
}
