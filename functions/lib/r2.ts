/**
 * R2 Storage Service for Ross Tax Prep
 * 
 * Handles document upload, download, and management with R2 Object Storage
 */

interface UploadResult {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  etag: string;
}

interface DocumentMetadata {
  userId: string;
  returnId?: string;
  documentType: string;
  originalName: string;
  uploadedBy: string;
  uploadedAt: string;
  encrypted: boolean;
}

/**
 * R2 Storage Service
 */
export class R2Service {
  /**
   * Upload a file to R2
   * @param bucket - R2 bucket binding
   * @param file - File data
   * @param key - Storage key/path
   * @param contentType - MIME type
   * @param metadata - Document metadata
   * @returns Upload result
   */
  static async upload(
    bucket: R2Bucket,
    file: ArrayBuffer,
    key: string,
    contentType: string,
    metadata: DocumentMetadata
  ): Promise<UploadResult> {
    // Generate unique key if not provided
    const storageKey = key || this.generateKey(metadata.originalName);

    // Upload to R2
    const object = await bucket.put(storageKey, file, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        userId: metadata.userId,
        returnId: metadata.returnId || '',
        documentType: metadata.documentType,
        originalName: metadata.originalName,
        uploadedBy: metadata.uploadedBy,
        uploadedAt: metadata.uploadedAt,
        encrypted: metadata.encrypted.toString(),
      },
    });

    return {
      key: storageKey,
      bucket: bucket.constructor.name,
      size: file.byteLength,
      contentType,
      etag: object?.etag || '',
    };
  }

  /**
   * Download a file from R2
   * @param bucket - R2 bucket binding
   * @param key - Storage key
   * @returns File data and metadata
   */
  static async download(
    bucket: R2Bucket,
    key: string
  ): Promise<{ data: ArrayBuffer; metadata: R2Object } | null> {
    const object = await bucket.get(key);

    if (!object) {
      return null;
    }

    const data = await object.arrayBuffer();

    return {
      data,
      metadata: object,
    };
  }

  /**
   * Delete a file from R2
   * @param bucket - R2 bucket binding
   * @param key - Storage key
   */
  static async delete(bucket: R2Bucket, key: string): Promise<void> {
    await bucket.delete(key);
  }

  /**
   * List files in R2 bucket with prefix
   * @param bucket - R2 bucket binding
   * @param prefix - Key prefix (e.g., userId)
   * @param limit - Maximum number of results
   * @returns List of objects
   */
  static async list(
    bucket: R2Bucket,
    prefix: string,
    limit: number = 100
  ): Promise<R2Objects> {
    return await bucket.list({
      prefix,
      limit,
    });
  }

  /**
   * Check if a file exists
   * @param bucket - R2 bucket binding
   * @param key - Storage key
   * @returns True if file exists
   */
  static async exists(bucket: R2Bucket, key: string): Promise<boolean> {
    const object = await bucket.head(key);
    return object !== null;
  }

  /**
   * Get file metadata
   * @param bucket - R2 bucket binding
   * @param key - Storage key
   * @returns File metadata
   */
  static async getMetadata(bucket: R2Bucket, key: string): Promise<R2Object | null> {
    return await bucket.head(key);
  }

  /**
   * Generate a unique storage key
   * @param originalName - Original file name
   * @returns Unique storage key
   */
  static generateKey(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop() || '';
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Generate a storage path for a user's document
   * @param userId - User ID
   * @param returnId - Return ID (optional)
   * @param fileName - File name
   * @returns Storage path
   */
  static generatePath(userId: string, returnId: string | null, fileName: string): string {
    const year = new Date().getFullYear();
    const key = this.generateKey(fileName);

    if (returnId) {
      return `${year}/${userId}/${returnId}/${key}`;
    }

    return `${year}/${userId}/${key}`;
  }

  /**
   * Validate file size
   * @param size - File size in bytes
   * @param maxSize - Maximum allowed size (default: 50MB)
   * @returns True if valid
   */
  static validateFileSize(size: number, maxSize: number = 50 * 1024 * 1024): boolean {
    return size > 0 && size <= maxSize;
  }

  /**
   * Validate file type
   * @param contentType - MIME type
   * @param allowedTypes - Array of allowed MIME types
   * @returns True if valid
   */
  static validateFileType(
    contentType: string,
    allowedTypes: string[] = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
  ): boolean {
    return allowedTypes.includes(contentType);
  }

  /**
   * Generate a signed URL for temporary access (using presigned URLs)
   * Note: R2 doesn't support presigned URLs directly, but we can create
   * a temporary token-based URL through our API
   * @param key - Storage key
   * @param expiresIn - Expiration time in seconds
   * @returns Temporary access token
   */
  static generateAccessToken(key: string, expiresIn: number = 3600): string {
    const expiry = Math.floor(Date.now() / 1000) + expiresIn;
    const payload = {
      key,
      exp: expiry,
    };
    return btoa(JSON.stringify(payload));
  }

  /**
   * Verify access token
   * @param token - Access token
   * @returns Key if valid, null otherwise
   */
  static verifyAccessToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp < now) {
        return null;
      }

      return payload.key;
    } catch {
      return null;
    }
  }
}

/**
 * Document Management Service
 * Integrates R2 storage with D1 database
 */
export class DocumentService {
  /**
   * Upload and register a document
   * @param db - D1 Database
   * @param bucket - R2 bucket
   * @param file - File data
   * @param fileName - File name
   * @param contentType - MIME type
   * @param userId - User ID
   * @param uploadedBy - ID of user uploading
   * @param returnId - Return ID (optional)
   * @param documentType - Document type
   * @param encrypted - Whether file is encrypted
   * @returns Document ID
   */
  static async uploadDocument(
    db: D1Database,
    bucket: R2Bucket,
    file: ArrayBuffer,
    fileName: string,
    contentType: string,
    userId: string,
    uploadedBy: string,
    returnId: string | null,
    documentType: string,
    encrypted: boolean = true
  ): Promise<string> {
    // Validate file
    if (!R2Service.validateFileSize(file.byteLength)) {
      throw new Error('File size exceeds maximum allowed size (50MB)');
    }

    if (!R2Service.validateFileType(contentType)) {
      throw new Error('File type not allowed');
    }

    // Generate storage path
    const key = R2Service.generatePath(userId, returnId, fileName);

    // Upload to R2
    const uploadResult = await R2Service.upload(bucket, file, key, contentType, {
      userId,
      returnId: returnId || undefined,
      documentType,
      originalName: fileName,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      encrypted,
    });

    // Register in database
    const documentId = this.generateId('doc');
    await db
      .prepare(
        `INSERT INTO documents (id, user_id, return_id, file_name, file_type, file_size, r2_key, bucket_name, document_type, encrypted, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        documentId,
        userId,
        returnId,
        fileName,
        contentType,
        uploadResult.size,
        uploadResult.key,
        uploadResult.bucket,
        documentType,
        encrypted ? 1 : 0,
        uploadedBy
      )
      .run();

    return documentId;
  }

  /**
   * Get document by ID
   * @param db - D1 Database
   * @param documentId - Document ID
   * @returns Document record
   */
  static async getDocument(db: D1Database, documentId: string): Promise<any> {
    return await db
      .prepare(`SELECT * FROM documents WHERE id = ?`)
      .bind(documentId)
      .first();
  }

  /**
   * List documents for a user
   * @param db - D1 Database
   * @param userId - User ID
   * @param returnId - Optional return ID filter
   * @returns Array of documents
   */
  static async listDocuments(
    db: D1Database,
    userId: string,
    returnId: string | null = null
  ): Promise<any[]> {
    if (returnId) {
      return await db
        .prepare(`SELECT * FROM documents WHERE user_id = ? AND return_id = ? ORDER BY uploaded_at DESC`)
        .bind(userId, returnId)
        .all()
        .then((result) => result.results || []);
    }

    return await db
      .prepare(`SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC`)
      .bind(userId)
      .all()
      .then((result) => result.results || []);
  }

  /**
   * Delete document
   * @param db - D1 Database
   * @param bucket - R2 bucket
   * @param documentId - Document ID
   */
  static async deleteDocument(
    db: D1Database,
    bucket: R2Bucket,
    documentId: string
  ): Promise<void> {
    // Get document record
    const doc = await this.getDocument(db, documentId);

    if (!doc) {
      throw new Error('Document not found');
    }

    // Delete from R2
    await R2Service.delete(bucket, doc.r2_key);

    // Delete from database
    await db.prepare(`DELETE FROM documents WHERE id = ?`).bind(documentId).run();
  }

  private static generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}${random}`;
  }
}
