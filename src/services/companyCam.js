/**
 * CompanyCam API Integration Service
 *
 * This service handles all communication with the CompanyCam API v2
 * for managing construction project photos.
 *
 * API Documentation: https://docs.companycam.com
 */

const API_BASE_URL = 'https://api.companycam.com/v2'

class CompanyCamService {
  constructor() {
    this.apiKey = null
  }

  setApiKey(key) {
    this.apiKey = key
  }

  getHeaders() {
    if (!this.apiKey) {
      throw new Error('CompanyCam API key not configured')
    }
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  async handleResponse(response) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    return response.json()
  }

  // ============ COMPANY ============

  async getCurrentCompany() {
    const response = await fetch(`${API_BASE_URL}/company`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // ============ PROJECTS ============

  async listProjects(options = {}) {
    const { page = 1, perPage = 25, status, modifiedAfter } = options
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    })

    if (status) params.append('status', status)
    if (modifiedAfter) params.append('modified_after', modifiedAfter)

    const response = await fetch(`${API_BASE_URL}/projects?${params}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async getProject(projectId) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async createProject(projectData) {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        project: {
          name: projectData.name,
          address: {
            street_address_1: projectData.address || '',
            city: projectData.city || '',
            state: projectData.state || '',
            postal_code: projectData.postalCode || '',
            country: projectData.country || 'US',
          },
          ...(projectData.coordinates && {
            coordinates: {
              lat: projectData.coordinates.lat,
              lon: projectData.coordinates.lon,
            }
          })
        }
      }),
    })
    return this.handleResponse(response)
  }

  async updateProject(projectId, projectData) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ project: projectData }),
    })
    return this.handleResponse(response)
  }

  async deleteProject(projectId) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.status}`)
    }
    return true
  }

  // ============ PHOTOS ============

  async listProjectPhotos(projectId, options = {}) {
    const { page = 1, perPage = 50 } = options
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    })

    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/photos?${params}`,
      { headers: this.getHeaders() }
    )
    return this.handleResponse(response)
  }

  async getPhoto(photoId) {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async addPhotoToProject(projectId, photoData) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/photos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        photo: {
          uri: photoData.uri,
          captured_at: photoData.capturedAt || Math.floor(Date.now() / 1000),
          ...(photoData.coordinates && {
            coordinates: {
              lat: photoData.coordinates.lat,
              lon: photoData.coordinates.lon,
            }
          }),
          ...(photoData.tags && { tags: photoData.tags }),
          ...(photoData.description && { description: photoData.description }),
          internal: photoData.internal || false,
        }
      }),
    })
    return this.handleResponse(response)
  }

  async updatePhoto(photoId, updates) {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ photo: updates }),
    })
    return this.handleResponse(response)
  }

  async deletePhoto(photoId) {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to delete photo: ${response.status}`)
    }
    return true
  }

  // ============ TAGS ============

  async listTags() {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async createTag(tagData) {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        tag: {
          display_value: tagData.name,
          color: tagData.color || '#3B82F6',
        }
      }),
    })
    return this.handleResponse(response)
  }

  // ============ COMMENTS ============

  async listPhotoComments(photoId) {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}/comments`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  async addPhotoComment(photoId, content) {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        comment: { content }
      }),
    })
    return this.handleResponse(response)
  }

  // ============ USERS ============

  async listUsers() {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // ============ GROUPS ============

  async listGroups() {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // ============ UTILITY METHODS ============

  async testConnection() {
    try {
      const company = await this.getCurrentCompany()
      return { success: true, company }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async syncAllProjects(onProgress) {
    const allProjects = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const projects = await this.listProjects({ page, perPage: 50 })
      allProjects.push(...projects)

      if (onProgress) {
        onProgress({ loaded: allProjects.length, page })
      }

      hasMore = projects.length === 50
      page++
    }

    return allProjects
  }

  async syncProjectPhotos(projectId, onProgress) {
    const allPhotos = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const photos = await this.listProjectPhotos(projectId, { page, perPage: 50 })
      allPhotos.push(...photos)

      if (onProgress) {
        onProgress({ loaded: allPhotos.length, page })
      }

      hasMore = photos.length === 50
      page++
    }

    return allPhotos
  }
}

// Export singleton instance
export const companyCam = new CompanyCamService()

// Export class for testing
export { CompanyCamService }
