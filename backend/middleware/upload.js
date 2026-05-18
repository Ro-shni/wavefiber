import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/voice-recordings');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Map MIME types to file extensions (fallback when originalname has no extension)
const mimeToExt = {
  'audio/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/x-m4a': '.m4a',
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Derive extension from originalname first, fall back to MIME type
    let ext = path.extname(file.originalname);
    if (!ext || ext === '.') {
      ext = mimeToExt[file.mimetype] || '.webm';
    }
    cb(null, `recording-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'];
  const allowedExt = ['.webm', '.mp3', '.mp4', '.wav', '.ogg', '.m4a'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  
  if (allowedMimes.includes(mime) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only audio files are allowed. Received: ${mime}`));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

export default upload;
