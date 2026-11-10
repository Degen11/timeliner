import { describe, it, expect, vi, beforeEach } from 'vitest'

const download = vi.fn()
const createSignedUrl = vi.fn()
const remove = vi.fn(() => Promise.resolve({ error: null }))
vi.mock('../supabase', () => ({
  supabase: { storage: { from: () => ({ download, createSignedUrl, remove }) } },
  getDeviceId: () => 'secret-device-id',
}))

import { getRemotePhotoUrl, clearRemotePhotoUrls, deleteRemotePhoto } from '../photoSync'

let n = 0
beforeEach(() => {
  download.mockReset()
  createSignedUrl.mockReset()
  n = 0
  URL.createObjectURL = vi.fn(() => `blob:http://localhost/${++n}`)
  URL.revokeObjectURL = vi.fn()
  clearRemotePhotoUrls()
})

describe('getRemotePhotoUrl', () => {
  it('downloads through the authenticated client and returns a blob: URL', async () => {
    download.mockResolvedValue({ data: new Blob(['x'], { type: 'image/jpeg' }), error: null })
    const url = await getRemotePhotoUrl('a.jpg')
    expect(url).toMatch(/^blob:/)
    // The device ID only travels in the request path, never in what the page shows
    expect(url).not.toContain('secret-device-id')
    expect(download).toHaveBeenCalledWith('secret-device-id/a.jpg')
    expect(createSignedUrl).not.toHaveBeenCalled()
  })

  it('shares one download between concurrent and repeat calls', async () => {
    download.mockResolvedValue({ data: new Blob(['x']), error: null })
    const [a, b] = await Promise.all([getRemotePhotoUrl('a.jpg'), getRemotePhotoUrl('a.jpg')])
    expect(a).toBe(b)
    expect(await getRemotePhotoUrl('a.jpg')).toBe(a)
    expect(download).toHaveBeenCalledTimes(1)
  })

  it('returns null for a missing photo and retries it next time', async () => {
    download.mockResolvedValueOnce({ data: null, error: { message: 'Object not found' } })
    expect(await getRemotePhotoUrl('gone.jpg')).toBeNull()
    download.mockResolvedValueOnce({ data: new Blob(['x']), error: null })
    expect(await getRemotePhotoUrl('gone.jpg')).toMatch(/^blob:/)
    expect(download).toHaveBeenCalledTimes(2)
  })

  it('revokes object URLs when cleared or when the photo is deleted', async () => {
    download.mockResolvedValue({ data: new Blob(['x']), error: null })
    const a = await getRemotePhotoUrl('a.jpg')
    const b = await getRemotePhotoUrl('b.jpg')
    await deleteRemotePhoto('a.jpg')
    await Promise.resolve()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(a)
    clearRemotePhotoUrls()
    await Promise.resolve()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(b)
    // A fresh call downloads again
    await getRemotePhotoUrl('a.jpg')
    expect(download).toHaveBeenCalledTimes(3)
  })
})
