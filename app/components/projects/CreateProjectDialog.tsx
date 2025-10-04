import { useState } from 'react'
import { projectService } from '~/lib/services/projects'
import { toast } from 'react-toastify'
import { X, Lock, Globe, Loader2 } from 'lucide-react'

interface CreateProjectDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function CreateProjectDialog({ open, onClose, onCreated }: CreateProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Project name is required')
      return
    }

    setLoading(true)

    try {
      await projectService.createProject({
        name: name.trim(),
        description: description.trim() || null,
        visibility,
      })

      toast.success('Project created successfully')
      setName('')
      setDescription('')
      setVisibility('private')
      onClose()
      onCreated?.()
    } catch (error: any) {
      toast.error(`Failed to create project: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-bolt-elements-background-depth-1 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background"
              placeholder="My Awesome Project"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background"
              placeholder="Brief description of your project"
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Visibility
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={(e) => setVisibility(e.target.value as 'private')}
                  className="mr-2"
                />
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="text-bolt-elements-textPrimary">Private</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={(e) => setVisibility(e.target.value as 'public')}
                  className="mr-2"
                />
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-bolt-elements-textPrimary">Public</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded hover:bg-bolt-elements-button-secondary-backgroundHover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded hover:bg-bolt-elements-button-primary-backgroundHover disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
