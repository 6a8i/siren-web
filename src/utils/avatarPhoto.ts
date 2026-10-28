/**
 * A profile's own photo as its avatar: the picture is centre-cropped to a square and drawn on the
 * same 256×256 canvas the preset avatars use, so the upload goes through the same endpoint.
 */

import type { ImageUpload } from 'types/family';

import { AVATAR_IMAGE_SIZE, parseDataUrl } from './avatarPreset';

/** Photos compress far better as JPEG than as the PNG the flat preset avatars use. */
export const AVATAR_PHOTO_TYPE = 'image/jpeg';
const AVATAR_PHOTO_QUALITY = 0.9;

export interface CropRect {
    x: number
    y: number
    size: number
}

/** The biggest centred square inside a picture of the given size. */
export function getCenterCrop(width: number, height: number): CropRect {
    const size = Math.max(Math.min(width, height), 0);
    return {
        x: Math.floor((width - size) / 2),
        y: Math.floor((height - size) / 2),
        size
    };
}

export const isImageFile = (file: Pick<File, 'type'>): boolean => file.type.startsWith('image/');

const loadImage = (file: Blob): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
    };
    image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('[avatarPhoto] the file could not be decoded as an image'));
    };
    image.src = url;
});

/** Draws the photo centre-cropped on the avatar square and returns it as a JPEG data URL. */
export async function renderAvatarPhoto(file: Blob, size = AVATAR_IMAGE_SIZE): Promise<string> {
    const image = await loadImage(file);
    const crop = getCenterCrop(image.naturalWidth, image.naturalHeight);
    if (crop.size === 0) {
        throw new Error('[avatarPhoto] the image is empty');
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('[avatarPhoto] the canvas has no 2d context');
    }

    // A white base: a transparent PNG would otherwise turn black in the JPEG.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);
    context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, size, size);

    return canvas.toDataURL(AVATAR_PHOTO_TYPE, AVATAR_PHOTO_QUALITY);
}

/** The photo rendered and split, ready for an upload. */
export const renderAvatarPhotoUpload = async (file: Blob): Promise<ImageUpload> => parseDataUrl(await renderAvatarPhoto(file));
