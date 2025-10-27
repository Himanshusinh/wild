/**
 * Tests for downloadUtils.ts
 */

import { generateDownloadFilename, getExtensionFromUrl, getFileType } from '../downloadUtils';

describe('downloadUtils', () => {
  describe('generateDownloadFilename', () => {
    it('should generate filename with username, date, and time for image', () => {
      const filename = generateDownloadFilename('testuser', 'image', 'jpg');
      
      // Should match pattern: prefix_username_YYYY_MM_DD_HH_MM_SS.extension
      expect(filename).toMatch(/^img_testuser_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.jpg$/);
    });

    it('should generate filename with username, date, and time for video', () => {
      const filename = generateDownloadFilename('testuser', 'video', 'mp4');
      
      expect(filename).toMatch(/^vid_testuser_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.mp4$/);
    });

    it('should generate filename with username, date, and time for audio', () => {
      const filename = generateDownloadFilename('testuser', 'audio', 'mp3');
      
      expect(filename).toMatch(/^music_testuser_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.mp3$/);
    });

    it('should handle undefined username', () => {
      const filename = generateDownloadFilename(undefined, 'image', 'png');
      
      expect(filename).toMatch(/^img_user_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.png$/);
    });

    it('should handle null username', () => {
      const filename = generateDownloadFilename(null, 'image', 'png');
      
      expect(filename).toMatch(/^img_user_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.png$/);
    });

    it('should clean username special characters', () => {
      const filename = generateDownloadFilename('test@user#123', 'image', 'jpg');
      
      expect(filename).toMatch(/^img_test_user_123_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.jpg$/);
    });

    it('should limit username length', () => {
      const longUsername = 'a'.repeat(30);
      const filename = generateDownloadFilename(longUsername, 'image', 'jpg');
      
      expect(filename).toMatch(/^img_a{20}_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.jpg$/);
    });

    it('should use custom prefix', () => {
      const filename = generateDownloadFilename('testuser', 'image', 'jpg', 'custom');
      
      expect(filename).toMatch(/^custom_testuser_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.jpg$/);
    });

    it('should handle extension without dot', () => {
      const filename = generateDownloadFilename('testuser', 'image', 'jpg');
      
      expect(filename).toMatch(/^img_testuser_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.jpg$/);
    });

    it('should handle extension with dot', () => {
      const filename = generateDownloadFilename('testuser', 'image', '.jpg');
      
      expect(filename).toMatch(/^img_testuser_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.jpg$/);
    });
  });

  describe('getExtensionFromUrl', () => {
    it('should extract jpg extension', () => {
      expect(getExtensionFromUrl('https://example.com/image.jpg')).toBe('jpg');
    });

    it('should extract png extension', () => {
      expect(getExtensionFromUrl('https://example.com/image.png')).toBe('png');
    });

    it('should extract mp4 extension', () => {
      expect(getExtensionFromUrl('https://example.com/video.mp4')).toBe('mp4');
    });

    it('should extract mp3 extension', () => {
      expect(getExtensionFromUrl('https://example.com/audio.mp3')).toBe('mp3');
    });

    it('should normalize jpeg to jpg', () => {
      expect(getExtensionFromUrl('https://example.com/image.jpeg')).toBe('jpg');
    });

    it('should return file for unknown extension', () => {
      expect(getExtensionFromUrl('https://example.com/file.xyz')).toBe('file');
    });

    it('should handle URLs without extension', () => {
      expect(getExtensionFromUrl('https://example.com/path')).toBe('file');
    });

    it('should handle invalid URLs', () => {
      expect(getExtensionFromUrl('not-a-url')).toBe('file');
    });
  });

  describe('getFileType', () => {
    it('should identify image files', () => {
      expect(getFileType({}, 'https://example.com/image.jpg')).toBe('image');
      expect(getFileType({}, 'https://example.com/image.png')).toBe('image');
      expect(getFileType({}, 'https://example.com/image.gif')).toBe('image');
    });

    it('should identify video files', () => {
      expect(getFileType({}, 'https://example.com/video.mp4')).toBe('video');
      expect(getFileType({}, 'https://example.com/video.mov')).toBe('video');
      expect(getFileType({}, 'https://example.com/video.webm')).toBe('video');
    });

    it('should identify audio files', () => {
      expect(getFileType({}, 'https://example.com/audio.mp3')).toBe('audio');
      expect(getFileType({}, 'https://example.com/audio.wav')).toBe('audio');
      expect(getFileType({}, 'https://example.com/audio.m4a')).toBe('audio');
    });

    it('should use media type if available', () => {
      expect(getFileType({ type: 'image/jpeg' }, 'https://example.com/file')).toBe('image');
      expect(getFileType({ type: 'video/mp4' }, 'https://example.com/file')).toBe('video');
      expect(getFileType({ type: 'audio/mp3' }, 'https://example.com/file')).toBe('audio');
    });

    it('should default to image for unknown types', () => {
      expect(getFileType({}, 'https://example.com/unknown.xyz')).toBe('image');
    });
  });
});

