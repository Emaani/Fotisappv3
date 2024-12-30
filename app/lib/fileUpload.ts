import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function uploadFile(file: File, directory: string): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', directory);
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return `/${directory}/${filename}`;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
} 