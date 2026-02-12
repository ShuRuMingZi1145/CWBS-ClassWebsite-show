const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const GALLERY_INDEX = path.join(__dirname, 'gallery.json');
function readGallery() {
  try {
    if (!fs.existsSync(GALLERY_INDEX)) return [];
    const raw = fs.readFileSync(GALLERY_INDEX, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) { return []; }
}
function writeGallery(items) {
  try { fs.writeFileSync(GALLERY_INDEX, JSON.stringify(items, null, 2), 'utf8'); } catch (e) { console.warn('writeGallery failed', e); }
}

// ensure gallery file exists
if (!fs.existsSync(GALLERY_INDEX)) writeGallery([]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'no file' });
  const fileUrl = '/uploads/' + req.file.filename;
  // create gallery item
  const item = {
    id: path.parse(req.file.filename).name,
    name: req.file.originalname,
    type: req.file.mimetype,
    url: fileUrl,
    date: new Date().toISOString().split('T')[0]
  };
  const gallery = readGallery();
  gallery.unshift(item);
  writeGallery(gallery);
  res.json({ success: true, item });
});

// 返回画廊索引
app.get('/api/gallery', (req, res) => {
  const gallery = readGallery();
  res.json({ success: true, items: gallery });
});

// 删除媒体及索引项
app.delete('/api/media/:id', (req, res) => {
  const id = req.params.id;
  const gallery = readGallery();
  const idx = gallery.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'not found' });
  const item = gallery[idx];
  // 删除文件
  try {
    const filePath = path.join(UPLOAD_DIR, path.basename(item.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) { console.warn('delete file failed', e); }
  gallery.splice(idx, 1);
  writeGallery(gallery);
  res.json({ success: true });
});

// 静态提供上传的文件目录
app.use('/uploads', express.static(UPLOAD_DIR));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Upload server running on http://localhost:${PORT}`));
