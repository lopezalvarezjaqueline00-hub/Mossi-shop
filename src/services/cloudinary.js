export const cloudinaryConfig = {
  cloudName: '',
  uploadPreset: '',
}

export const isCloudinaryConfigured = () =>
  Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset)

export async function uploadImageToCloudinary() {
  throw new Error('Cloudinary upload is not configured yet.')
}
