import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/appStore'
import { companyCam } from '@/services/companyCam'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Upload,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  RefreshCw,
  Image,
  Tag,
  Calendar,
  MapPin,
  Loader2,
} from 'lucide-react'

export default function Photos() {
  const [searchParams] = useSearchParams()
  const projectFilter = searchParams.get('project')

  const projects = useAppStore((state) => state.projects)
  const settings = useAppStore((state) => state.settings)
  const companyCamProjects = useAppStore((state) => state.companyCamProjects)
  const companyCamPhotos = useAppStore((state) => state.companyCamPhotos)
  const setCompanyCamPhotos = useAppStore((state) => state.setCompanyCamPhotos)
  const addProjectPhotos = useAppStore((state) => state.addProjectPhotos)

  const [selectedProject, setSelectedProject] = useState(projectFilter || 'all')
  const [search, setSearch] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    url: '',
    description: '',
    tags: '',
    projectId: '',
  })

  // Gather all photos
  const getAllPhotos = () => {
    const photos = []

    // Local project photos
    projects.forEach((project) => {
      if (selectedProject !== 'all' && project.id !== selectedProject) return

      (project.photos || []).forEach((photo, index) => {
        photos.push({
          id: `local-${project.id}-${index}`,
          url: photo.url || photo,
          thumbnail: photo.url || photo,
          description: photo.description || '',
          tags: photo.tags || [],
          projectId: project.id,
          projectName: project.name,
          source: 'local',
          createdAt: photo.createdAt || project.createdAt,
        })
      })
    })

    // CompanyCam photos
    projects.forEach((project) => {
      if (selectedProject !== 'all' && project.id !== selectedProject) return
      if (!project.companyCamProjectId) return

      const ccPhotos = companyCamPhotos[project.companyCamProjectId] || []
      ccPhotos.forEach((photo) => {
        photos.push({
          id: `cc-${photo.id}`,
          url: photo.uris?.large || photo.uris?.original || photo.uri,
          thumbnail: photo.uris?.thumbnail || photo.uris?.small || photo.uri,
          description: photo.description || '',
          tags: photo.tags || [],
          projectId: project.id,
          projectName: project.name,
          ccProjectId: project.companyCamProjectId,
          source: 'companycam',
          createdAt: photo.captured_at ? new Date(photo.captured_at * 1000).toISOString() : null,
          coordinates: photo.coordinates,
        })
      })
    })

    // Filter by search
    if (search) {
      return photos.filter((p) =>
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    }

    return photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const allPhotos = getAllPhotos()
  const currentPhoto = allPhotos[currentPhotoIndex]

  const syncCompanyCamPhotos = async () => {
    if (!settings.companyCamApiKey) {
      toast.error('Please configure your CompanyCam API key in Settings')
      return
    }

    setSyncing(true)
    try {
      companyCam.setApiKey(settings.companyCamApiKey)

      const linkedProjects = projects.filter((p) => p.companyCamProjectId)

      for (const project of linkedProjects) {
        const photos = await companyCam.syncProjectPhotos(project.companyCamProjectId)
        setCompanyCamPhotos(project.companyCamProjectId, photos)
      }

      toast.success(`Synced photos from ${linkedProjects.length} projects`)
    } catch (error) {
      toast.error(`Sync failed: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!uploadForm.url || !uploadForm.projectId) {
      toast.error('Please provide a URL and select a project')
      return
    }

    setLoading(true)
    try {
      const project = projects.find((p) => p.id === uploadForm.projectId)

      // If project is linked to CompanyCam, upload there too
      if (project?.companyCamProjectId && settings.companyCamApiKey) {
        companyCam.setApiKey(settings.companyCamApiKey)
        await companyCam.addPhotoToProject(project.companyCamProjectId, {
          uri: uploadForm.url,
          description: uploadForm.description,
          tags: uploadForm.tags ? uploadForm.tags.split(',').map((t) => t.trim()) : [],
        })
      }

      // Add to local store
      addProjectPhotos(uploadForm.projectId, [{
        url: uploadForm.url,
        description: uploadForm.description,
        tags: uploadForm.tags ? uploadForm.tags.split(',').map((t) => t.trim()) : [],
        createdAt: new Date().toISOString(),
      }])

      toast.success('Photo added successfully')
      setUploadDialogOpen(false)
      setUploadForm({ url: '', description: '', tags: '', projectId: '' })
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const openLightbox = (index) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }

  const navigateLightbox = (direction) => {
    const newIndex = currentPhotoIndex + direction
    if (newIndex >= 0 && newIndex < allPhotos.length) {
      setCurrentPhotoIndex(newIndex)
    }
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return
      if (e.key === 'ArrowLeft') navigateLightbox(-1)
      if (e.key === 'ArrowRight') navigateLightbox(1)
      if (e.key === 'Escape') setLightboxOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, currentPhotoIndex])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search photos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={syncCompanyCamPhotos} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Add Photo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{allPhotos.length}</p>
                <p className="text-xs text-muted-foreground">Total Photos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {allPhotos.filter((p) => p.source === 'companycam').length}
                </p>
                <p className="text-xs text-muted-foreground">From CompanyCam</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {allPhotos.filter((p) => p.source === 'local').length}
                </p>
                <p className="text-xs text-muted-foreground">Uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {new Set(allPhotos.flatMap((p) => p.tags)).size}
                </p>
                <p className="text-xs text-muted-foreground">Unique Tags</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photo Grid */}
      {allPhotos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No photos found</h3>
            <p className="text-muted-foreground text-sm text-center">
              {search
                ? 'Try adjusting your search'
                : 'Add photos to your projects or sync from CompanyCam'}
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
              {settings.companyCamApiKey && (
                <Button variant="outline" onClick={syncCompanyCamPhotos}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync from CompanyCam
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {allPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <img
                src={photo.thumbnail}
                alt={photo.description || 'Project photo'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

              {/* Source badge */}
              <Badge
                className={`absolute top-2 right-2 ${
                  photo.source === 'companycam' ? 'bg-green-500' : 'bg-blue-500'
                }`}
              >
                {photo.source === 'companycam' ? 'CC' : 'Local'}
              </Badge>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium truncate">{photo.projectName}</p>
                {photo.description && (
                  <p className="text-white/80 text-xs truncate">{photo.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation */}
            {currentPhotoIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={() => navigateLightbox(-1)}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}
            {currentPhotoIndex < allPhotos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={() => navigateLightbox(1)}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            {currentPhoto && (
              <div className="flex flex-col">
                <div className="flex items-center justify-center min-h-[60vh] max-h-[70vh]">
                  <img
                    src={currentPhoto.url}
                    alt={currentPhoto.description || 'Photo'}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>

                {/* Info panel */}
                <div className="bg-slate-900 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{currentPhoto.projectName}</h3>
                      {currentPhoto.description && (
                        <p className="text-slate-300 mt-1">{currentPhoto.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        {currentPhoto.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDateTime(currentPhoto.createdAt)}
                          </span>
                        )}
                        {currentPhoto.coordinates && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {currentPhoto.coordinates.lat?.toFixed(4)}, {currentPhoto.coordinates.lon?.toFixed(4)}
                          </span>
                        )}
                      </div>
                      {currentPhoto.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {currentPhoto.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white/30 hover:bg-white/10"
                        asChild
                      >
                        <a href={currentPhoto.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white/30 hover:bg-white/10"
                        asChild
                      >
                        <a href={currentPhoto.url} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="text-center text-sm text-slate-400 mt-4">
                    {currentPhotoIndex + 1} of {allPhotos.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpload}>
            <DialogHeader>
              <DialogTitle>Add Photo</DialogTitle>
              <DialogDescription>
                Add a photo URL to a project. If the project is linked to CompanyCam, it will be synced there too.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="projectId">Project *</Label>
                <Select
                  value={uploadForm.projectId}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        {project.companyCamProjectId && ' (linked to CC)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Photo URL *</Label>
                <Input
                  id="url"
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="What's in this photo?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="exterior, progress, electrical"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Photo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
