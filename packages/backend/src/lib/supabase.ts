import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

/**
 * Supabase Client Configuration
 *
 * Supabase provides:
 * - PostgreSQL database (used by Prisma)
 * - Authentication
 * - Storage for CAD files, thumbnails, etc.
 * - Realtime subscriptions
 */

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not configured. Storage features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Supabase Storage Service
 * Handles file uploads for CAD models, thumbnails, and other assets
 */
export class SupabaseStorageService {
  private buckets = {
    cadFiles: 'cad-files',
    thumbnails: 'thumbnails',
    exports: 'exports',
  };

  /**
   * Initialize storage buckets
   */
  async initializeBuckets() {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }

    // Create missing buckets
    for (const [key, bucketName] of Object.entries(this.buckets)) {
      const exists = buckets.some((b) => b.name === bucketName);

      if (!exists) {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 104857600, // 100MB
        });

        if (createError) {
          console.error(`Error creating bucket ${bucketName}:`, createError);
        } else {
          console.log(`✅ Created storage bucket: ${bucketName}`);
        }
      }
    }
  }

  /**
   * Upload CAD file
   */
  async uploadCADFile(
    projectId: string,
    versionNumber: number,
    file: Buffer,
    filename: string
  ) {
    const path = `${projectId}/v${versionNumber}/${filename}`;

    const { data, error } = await supabase.storage
      .from(this.buckets.cadFiles)
      .upload(path, file, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading CAD file:', error);
      throw error;
    }

    // Get public URL (signed URL for private buckets)
    const { data: urlData } = await supabase.storage
      .from(this.buckets.cadFiles)
      .createSignedUrl(path, 3600 * 24 * 7); // 7 days

    return {
      path: data.path,
      url: urlData?.signedUrl,
    };
  }

  /**
   * Upload thumbnail
   */
  async uploadThumbnail(projectId: string, file: Buffer, filename: string) {
    const path = `${projectId}/${filename}`;

    const { data, error } = await supabase.storage
      .from(this.buckets.thumbnails)
      .upload(path, file, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.buckets.thumbnails)
      .getPublicUrl(path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  }

  /**
   * Download CAD file
   */
  async downloadCADFile(path: string) {
    const { data, error } = await supabase.storage.from(this.buckets.cadFiles).download(path);

    if (error) {
      console.error('Error downloading CAD file:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete CAD file
   */
  async deleteCADFile(path: string) {
    const { error } = await supabase.storage.from(this.buckets.cadFiles).remove([path]);

    if (error) {
      console.error('Error deleting CAD file:', error);
      throw error;
    }
  }

  /**
   * Delete all files for a project
   */
  async deleteProjectFiles(projectId: string) {
    // Delete CAD files
    const { data: cadFiles } = await supabase.storage
      .from(this.buckets.cadFiles)
      .list(projectId);

    if (cadFiles) {
      const paths = cadFiles.map((file) => `${projectId}/${file.name}`);
      await supabase.storage.from(this.buckets.cadFiles).remove(paths);
    }

    // Delete thumbnails
    const { data: thumbnails } = await supabase.storage
      .from(this.buckets.thumbnails)
      .list(projectId);

    if (thumbnails) {
      const paths = thumbnails.map((file) => `${projectId}/${file.name}`);
      await supabase.storage.from(this.buckets.thumbnails).remove(paths);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const bucketStats = await Promise.all(
        Object.values(this.buckets).map(async (bucketName) => {
          const { data: files } = await supabase.storage.from(bucketName).list();

          const totalSize =
            files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;

          return {
            bucket: bucketName,
            fileCount: files?.length || 0,
            totalSize: totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
          };
        })
      );

      return bucketStats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return [];
    }
  }
}

// Export singleton instance
export const storage = new SupabaseStorageService();

/**
 * Supabase Authentication Service (optional)
 * Can be used alongside or instead of custom auth
 */
export class SupabaseAuthService {
  /**
   * Sign up user
   */
  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      console.error('Error signing up user:', error);
      throw error;
    }

    return data;
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in user:', error);
      throw error;
    }

    return data;
  }

  /**
   * Sign out user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out user:', error);
      throw error;
    }
  }

  /**
   * Get user from token
   */
  async getUser(token: string) {
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Error getting user:', error);
      throw error;
    }

    return data.user;
  }

  /**
   * Verify user session
   */
  async verifySession(accessToken: string) {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  }
}

// Export auth service instance
export const auth = new SupabaseAuthService();
