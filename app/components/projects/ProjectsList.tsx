import { useState, useEffect } from 'react'
import { projectService } from '~/lib/services/projects'
import type { Database } from '~/lib/supabase/types'
import { toast } from 'react-toastify'
import { Loader2, FolderOpen, Share2, Trash2 } from 'lucide-react'

type Project = Database['public']['Tables']['projects']['Row']

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
      setProjects(data)
    } catch (error: any) {
      toast.error(`Failed to load projects: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      await projectService.deleteProject(id)
      toast.success('Project deleted successfully')
      await loadProjects()
    } catch (error: any) {
      toast.error(`Failed to delete project: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-bolt-elements-textSecondary" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FolderOpen className="w-16 h-16 text-bolt-elements-textTertiary mb-4" />
        <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-2">No projects yet</h3>
        <p className="text-sm text-bolt-elements-textSecondary">Create your first project to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="border border-bolt-elements-borderColor rounded-lg p-4 bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-bolt-elements-textPrimary truncate">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-bolt-elements-textSecondary mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <div
              className={`ml-2 px-2 py-1 rounded text-xs ${
                project.visibility === 'public'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {project.visibility}
            </div>
          </div>

          <div className="text-xs text-bolt-elements-textTertiary mb-3">
            Updated {new Date(project.updated_at || '').toLocaleDateString()}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                // TODO: Implement open project functionality
                toast.info('Open project functionality coming soon')
              }}
              className="flex-1 btn btn-sm bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover"
            >
              <FolderOpen className="w-4 h-4" />
              Open
            </button>
            <button
              onClick={() => {
                // TODO: Implement share functionality
                toast.info('Share functionality coming soon')
              }}
              className="btn btn-sm bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text hover:bg-bolt-elements-button-secondary-backgroundHover"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(project.id, project.name)}
              className="btn btn-sm bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
