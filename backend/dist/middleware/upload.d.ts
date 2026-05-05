import multer from 'multer';
export declare const upload: multer.Multer;
/** For single image uploads (course thumbnails, avatars) */
export declare const uploadImage: multer.Multer;
/** For lecture attachment uploads (PDFs, ZIPs, DOCX, PPT, etc.) */
export declare const uploadAttachment: multer.Multer;
export declare const getFileExtension: (mimetype: string) => string;
//# sourceMappingURL=upload.d.ts.map