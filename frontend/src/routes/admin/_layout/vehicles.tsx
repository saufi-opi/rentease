import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/useDebounce"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Car, Search, Plus, Loader2, Edit, Trash2, Image as ImageIcon, ZoomIn, ZoomOut, Bike, Check, Settings } from "lucide-react"
import Cropper from "react-easy-crop"
import getCroppedImg from "@/utils/cropImage"
import { Slider } from "@/components/ui/slider"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VehicleControllerService, VehicleRequest, VehicleResponse } from "@/client"
import { toast } from "sonner"

export const Route = createFileRoute("/admin/_layout/vehicles")({
  component: AdminVehicles,
  head: () => ({
    meta: [{ title: "Vehicle Management - Admin" }],
  }),
})

function AdminVehicles() {
  const queryClient = useQueryClient()
  
  // Filters and Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const debouncedSearchInput = useDebounce(searchInput, 500)

  useEffect(() => {
    setSearch(debouncedSearchInput)
    setCurrentPage(1)
  }, [debouncedSearchInput])

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null)
  
  // Form State
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Cropper State
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  
  const [formData, setFormData] = useState<VehicleRequest>({
    brand: "",
    model: "",
    type: "Car",
    year: new Date().getFullYear(),
    rentalRate: 0,
    seats: 4,
    fuelType: "Petrol",
    availabilityStatus: "AVAILABLE",
    description: "",
    transmission: "MANUAL",
    features: [],
    discount: 0
  })

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["admin-vehicles", currentPage, search, statusFilter, typeFilter],
    queryFn: () => VehicleControllerService.listVehicles({
      page: currentPage - 1,
      size: 10,
      search: search || undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      type: typeFilter !== "ALL" ? typeFilter : undefined,
      sortBy: "createdAt_desc"
    })
  })

  const { data: suggestions } = useQuery({
    queryKey: ["vehicle-suggestions"],
    queryFn: () => VehicleControllerService.getVehicleSuggestions()
  })

  const suggestionBrands = suggestions ? Object.keys(suggestions) : []
  const suggestionModels = suggestions && formData.brand ? (suggestions[formData.brand] || []) : []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { formData: VehicleRequest }) => VehicleControllerService.createVehicle(data),
    onSuccess: () => {
      toast.success("Success", { description: "Vehicle created successfully." })
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] })
      closeForm()
    },
    onError: () => {
      toast.error("Error", { description: "Failed to create vehicle." })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, formData: VehicleRequest }) => 
      VehicleControllerService.updateVehicle(data),
    onSuccess: () => {
      toast.success("Success", { description: "Vehicle updated successfully." })
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] })
      closeForm()
    },
    onError: () => {
      toast.error("Error", { description: "Failed to update vehicle." })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => VehicleControllerService.deleteVehicle({ id }),
    onSuccess: () => {
      toast.success("Success", { description: "Vehicle deleted successfully." })
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] })
      setIsDeleteOpen(false)
    },
    onError: () => {
      toast.error("Error", { description: "Failed to delete vehicle." })
    }
  })

  const vehicles = data?.content || []
  const totalPages = data?.totalPages || 1
  const totalElements = data?.totalElements || 0




  const openForm = (vehicle?: VehicleResponse) => {
    if (vehicle) {
      setEditingVehicle(vehicle)
      setFormData({
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        type: vehicle.type || "",
        year: vehicle.year || new Date().getFullYear(),
        rentalRate: vehicle.rental_rate || 0,
        seats: vehicle.seats || 4,
        fuelType: vehicle.fuelType || "Petrol",
        availabilityStatus: vehicle.availability_status || "AVAILABLE",
        description: vehicle.description || "",
        transmission: vehicle.transmission || "MANUAL",
        features: vehicle.features || [],
        discount: vehicle.discount || 0
      })
      setImagePreview(vehicle.image_url || null)
    } else {
      setEditingVehicle(null)
      setFormData({
        brand: "",
        model: "",
        type: "Car",
        year: new Date().getFullYear(),
        rentalRate: 0,
        seats: 4,
        fuelType: "Petrol",
        availabilityStatus: "AVAILABLE",
        description: "",
        transmission: "MANUAL",
        features: [],
        discount: 0
      })
      setImagePreview(null)
    }
    setSelectedFile(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingVehicle(null)
    setSelectedFile(null)
    setImagePreview(null)
  }

  const confirmDelete = (vehicle: VehicleResponse) => {
    setEditingVehicle(vehicle)
    setIsDeleteOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData: VehicleRequest = { ...formData }
    if (selectedFile) {
      submitData.image = selectedFile
    }

    if (editingVehicle && editingVehicle.id) {
      updateMutation.mutate({ id: editingVehicle.id, formData: submitData })
    } else {
      createMutation.mutate({ formData: submitData })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener("load", () => {
        setCropImage(reader.result as string)
        setIsCropperOpen(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleSaveCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return
    
    try {
      const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels)
      if (croppedImage) {
        setSelectedFile(croppedImage)
        setImagePreview(URL.createObjectURL(croppedImage))
        setIsCropperOpen(false)
        setCropImage(null)
      }
    } catch (e) {
      console.error(e)
      toast.error("Error", { description: "Failed to crop image." })
    }
  }

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case "AVAILABLE": return <Badge className="bg-emerald-500 hover:bg-emerald-600">Available</Badge>
      case "BOOKED": return <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600">Booked</Badge>
      case "UNDER_MAINTENANCE": return <Badge variant="destructive">Maintenance</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            Vehicle Inventory
          </h1>
          <p className="text-muted-foreground mt-1">Manage fleet, pricing, and availability status.</p>
        </div>
        <Button onClick={() => openForm()} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search brand, model..." 
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type & Year</TableHead>
                <TableHead>Rate (RM/day)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    No vehicles found.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      {v.image_url ? (
                        <div className="w-16 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
                          <img src={v.image_url} alt={v.model} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded bg-muted flex items-center justify-center border border-border">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{v.brand} {v.model}</div>
                      <div className="text-xs text-muted-foreground">ID: {v.id?.split('-')[0]}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{v.type}</div>
                      <div className="text-xs text-muted-foreground">{v.year}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">RM {v.rental_rate}</TableCell>
                    <TableCell>{getStatusBadge(v.availability_status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openForm(v)}>
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(v)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Info */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalElements)} of {totalElements} vehicles
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the vehicle below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input 
                    id="brand" 
                    value={formData.brand} 
                    onChange={e => setFormData({...formData, brand: e.target.value})} 
                    required 
                    list="brand-suggestions"
                  />
                  <datalist id="brand-suggestions">
                    {suggestionBrands.map(b => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input 
                    id="model" 
                    value={formData.model} 
                    onChange={e => setFormData({...formData, model: e.target.value})} 
                    required 
                    list="model-suggestions"
                  />
                  <datalist id="model-suggestions">
                    {suggestionModels.map(m => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Vehicle Type</Label>
                  <Tabs value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <TabsList className="w-full bg-background border border-border">
                      <TabsTrigger 
                        value="Car" 
                        className="flex-1 gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground"
                      >
                        <Car className="h-4 w-4" /> Car
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Bike" 
                        className="flex-1 gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground"
                      >
                        <Bike className="h-4 w-4" /> Bike
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Input 
                    id="year" 
                    type="number"
                    value={formData.year} 
                    onChange={e => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                    required 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Availability Status</Label>
                <Tabs value={formData.availabilityStatus} onValueChange={v => setFormData({...formData, availabilityStatus: v})}>
                  <TabsList className="w-full grid grid-cols-3 bg-background border border-border">
                    <TabsTrigger value="AVAILABLE" className="gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-emerald-900/20">
                      <Check className="h-3.5 w-3.5" /> Available
                    </TabsTrigger>
                    <TabsTrigger value="BOOKED" className="gap-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-900/20">
                      <Loader2 className="h-3.5 w-3.5" /> Booked
                    </TabsTrigger>
                    <TabsTrigger value="UNDER_MAINTENANCE" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-600 dark:data-[state=active]:bg-red-900/20">
                      <Settings className="h-3.5 w-3.5" /> Maintenance
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rate">Rental Rate (RM/day)</Label>
                  <Input 
                    id="rate" 
                    type="number"
                    step="0.01"
                    value={formData.rentalRate} 
                    onChange={e => setFormData({...formData, rentalRate: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input 
                    id="discount" 
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount} 
                    onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="seats">Seats</Label>
                  <Input 
                    id="seats" 
                    type="number"
                    value={formData.seats} 
                    onChange={e => setFormData({...formData, seats: parseInt(e.target.value) || 4})} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Tabs value={formData.transmission} onValueChange={v => setFormData({...formData, transmission: v})}>
                    <TabsList className="w-full bg-background border border-border">
                      <TabsTrigger value="MANUAL" className="flex-1 data-[state=active]:bg-muted data-[state=active]:text-foreground">Manual</TabsTrigger>
                      <TabsTrigger value="AUTOMATIC" className="flex-1 data-[state=active]:bg-muted data-[state=active]:text-foreground">Automatic</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea 
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the vehicle details..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-[120px] overflow-y-auto">
                  {['AC', 'BLUETOOTH', 'GPS', 'SUNROOF', 'REAR_CAMERA', 'LEATHER_SEATS', 'USB_CHARGER', 'AIR_BAG', 'MUSIC_SYSTEM'].map(feature => (
                    <label key={feature} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.features?.includes(feature)}
                        onChange={(e) => {
                          const currentFeatures = formData.features || []
                          if (e.target.checked) {
                            setFormData({...formData, features: [...currentFeatures, feature]})
                          } else {
                            setFormData({...formData, features: currentFeatures.filter(f => f !== feature)})
                          }
                        }}
                      />
                      {feature.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Tabs value={formData.fuelType} onValueChange={v => setFormData({...formData, fuelType: v})}>
                  <TabsList className="w-full grid grid-cols-4 bg-background border border-border">
                    <TabsTrigger value="Petrol" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Petrol</TabsTrigger>
                    <TabsTrigger value="Diesel" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Diesel</TabsTrigger>
                    <TabsTrigger value="Electric" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Electric</TabsTrigger>
                    <TabsTrigger value="Hybrid" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Hybrid</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="image">Vehicle Image</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 bg-muted rounded border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <Input 
                    id="image" 
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingVehicle ? 'Save Changes' : 'Create Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> 
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{editingVehicle?.brand} {editingVehicle?.model}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => editingVehicle?.id && deleteMutation.mutate(editingVehicle.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Dialog */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Crop Vehicle Image</DialogTitle>
            <DialogDescription>
              Adjust the image to fit perfectly. Use the slider to zoom.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-[400px] mt-4 bg-muted">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                minZoom={0.5}
                restrictPosition={false}
              />
            )}
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={(value: number[]) => setZoom(value[0])}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsCropperOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCrop}>Apply Crop</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
