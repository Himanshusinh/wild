import { buildImageToVideoBody, buildVideoToVideoBody, getAvailableRatios, isRatioValidForModel, getDefaultRatioForModel } from '../videoGenerationBuilders';

describe('Video Generation Builders', () => {
  describe('buildImageToVideoBody', () => {
    it('should build valid image-to-video body with required fields', () => {
      const state = {
        model: 'gen4_turbo' as const,
        ratio: '1280:720' as const,
        promptImage: 'data:image/jpeg;base64,test',
        duration: 10 as const,
        promptText: 'A beautiful landscape',
        seed: 42,
        contentModeration: { publicFigureThreshold: 'auto' as const }
      };

      const result = buildImageToVideoBody(state);

      expect(result).toEqual({
        promptImage: 'data:image/jpeg;base64,test',
        model: 'gen4_turbo',
        ratio: '1280:720',
        duration: 10,
        promptText: 'A beautiful landscape',
        seed: 42,
        contentModeration: { publicFigureThreshold: 'auto' }
      });
    });

    it('should build body with array of prompt images', () => {
      const state = {
        model: 'gen3a_turbo' as const,
        ratio: '1280:768' as const,
        promptImage: [
          { uri: 'data:image/jpeg;base64,test1', position: 'first' as const },
          { uri: 'data:image/jpeg;base64,test2', position: 'last' as const }
        ],
        duration: 5 as const
      };

      const result = buildImageToVideoBody(state);

      expect(result).toEqual({
        promptImage: [
          { uri: 'data:image/jpeg;base64,test1', position: 'first' },
          { uri: 'data:image/jpeg;base64,test2', position: 'last' }
        ],
        model: 'gen3a_turbo',
        ratio: '1280:768',
        duration: 5
      });
    });

    it('should use default duration when not provided', () => {
      const state = {
        model: 'gen4_turbo' as const,
        ratio: '1280:720' as const,
        promptImage: 'data:image/jpeg;base64,test'
      };

      const result = buildImageToVideoBody(state);

      expect(result.duration).toBe(10);
    });

    it('should throw error when model is missing', () => {
      const state = {
        ratio: '1280:720' as const,
        promptImage: 'data:image/jpeg;base64,test'
      } as any;

      expect(() => buildImageToVideoBody(state)).toThrow('model is required');
    });

    it('should throw error when ratio is missing', () => {
      const state = {
        model: 'gen4_turbo' as const,
        promptImage: 'data:image/jpeg;base64,test'
      } as any;

      expect(() => buildImageToVideoBody(state)).toThrow('ratio is required');
    });

    it('should throw error when promptImage is missing', () => {
      const state = {
        model: 'gen4_turbo' as const,
        ratio: '1280:720' as const
      } as any;

      expect(() => buildImageToVideoBody(state)).toThrow('promptImage is required');
    });

    it('should throw error when "last" position is used with non-gen3a_turbo model', () => {
      const state = {
        model: 'gen4_turbo' as const,
        ratio: '1280:720' as const,
        promptImage: [
          { uri: 'data:image/jpeg;base64,test', position: 'last' as const }
        ]
      };

      expect(() => buildImageToVideoBody(state)).toThrow('"position":"last" is only supported by gen3a_turbo');
    });

    it('should allow "last" position with gen3a_turbo model', () => {
      const state = {
        model: 'gen3a_turbo' as const,
        ratio: '1280:768' as const,
        promptImage: [
          { uri: 'data:image/jpeg;base64,test', position: 'last' as const }
        ]
      };

      expect(() => buildImageToVideoBody(state)).not.toThrow();
    });
  });

  describe('buildVideoToVideoBody', () => {
    it('should build valid video-to-video body with required fields', () => {
      const state = {
        model: 'gen4_aleph' as const,
        ratio: '1280:720' as const,
        promptText: 'Make it cinematic',
        videoUri: 'data:video/mp4;base64,test',
        seed: 123,
        references: [
          { type: 'image' as const, uri: 'data:image/jpeg;base64,ref1' },
          { type: 'image' as const, uri: 'data:image/jpeg;base64,ref2' }
        ],
        contentModeration: { publicFigureThreshold: 'low' as const }
      };

      const result = buildVideoToVideoBody(state);

      expect(result).toEqual({
        videoUri: 'data:video/mp4;base64,test',
        promptText: 'Make it cinematic',
        model: 'gen4_aleph',
        ratio: '1280:720',
        seed: 123,
        references: [
          { type: 'image', uri: 'data:image/jpeg;base64,ref1' },
          { type: 'image', uri: 'data:image/jpeg;base64,ref2' }
        ],
        contentModeration: { publicFigureThreshold: 'low' }
      });
    });

    it('should throw error when model is not gen4_aleph', () => {
      const state = {
        model: 'gen4_turbo' as any,
        ratio: '1280:720' as const,
        promptText: 'Make it cinematic',
        videoUri: 'data:video/mp4;base64,test'
      };

      expect(() => buildVideoToVideoBody(state)).toThrow('video_to_video requires model=gen4_aleph');
    });

    it('should throw error when videoUri is missing', () => {
      const state = {
        model: 'gen4_aleph' as const,
        ratio: '1280:720' as const,
        promptText: 'Make it cinematic'
      } as any;

      expect(() => buildVideoToVideoBody(state)).toThrow('videoUri is required');
    });

    it('should throw error when promptText is missing', () => {
      const state = {
        model: 'gen4_aleph' as const,
        ratio: '1280:720' as const,
        videoUri: 'data:video/mp4;base64,test'
      } as any;

      expect(() => buildVideoToVideoBody(state)).toThrow('promptText is required');
    });

    it('should handle optional fields correctly', () => {
      const state = {
        model: 'gen4_aleph' as const,
        ratio: '1280:720' as const,
        promptText: 'Make it cinematic',
        videoUri: 'data:video/mp4;base64,test'
      };

      const result = buildVideoToVideoBody(state);

      expect(result).toEqual({
        videoUri: 'data:video/mp4;base64,test',
        promptText: 'Make it cinematic',
        model: 'gen4_aleph',
        ratio: '1280:720'
      });
      expect(result.seed).toBeUndefined();
      expect(result.references).toBeUndefined();
      expect(result.contentModeration).toBeUndefined();
    });
  });

  describe('getAvailableRatios', () => {
    it('should return correct ratios for gen4_turbo', () => {
      const ratios = getAvailableRatios('gen4_turbo');
      expect(ratios).toEqual([
        '1280:720', '720:1280', '1104:832', '832:1104', '960:960', '1584:672'
      ]);
    });

    it('should return correct ratios for gen3a_turbo', () => {
      const ratios = getAvailableRatios('gen3a_turbo');
      expect(ratios).toEqual(['1280:768', '768:1280']);
    });

    it('should return correct ratios for gen4_aleph', () => {
      const ratios = getAvailableRatios('gen4_aleph');
      expect(ratios).toEqual([
        '1280:720', '720:1280', '1104:832', '832:1104', '960:960', '1584:672'
      ]);
    });

    it('should return empty array for unknown model', () => {
      const ratios = getAvailableRatios('unknown');
      expect(ratios).toEqual([]);
    });
  });

  describe('isRatioValidForModel', () => {
    it('should return true for valid ratio-model combinations', () => {
      expect(isRatioValidForModel('1280:720', 'gen4_turbo')).toBe(true);
      expect(isRatioValidForModel('1280:768', 'gen3a_turbo')).toBe(true);
      expect(isRatioValidForModel('960:960', 'gen4_aleph')).toBe(true);
    });

    it('should return false for invalid ratio-model combinations', () => {
      expect(isRatioValidForModel('1280:768', 'gen4_turbo')).toBe(false);
      expect(isRatioValidForModel('1280:720', 'gen3a_turbo')).toBe(false);
      expect(isRatioValidForModel('invalid', 'gen4_turbo')).toBe(false);
    });
  });

  describe('getDefaultRatioForModel', () => {
    it('should return first ratio for each model', () => {
      expect(getDefaultRatioForModel('gen4_turbo')).toBe('1280:720');
      expect(getDefaultRatioForModel('gen3a_turbo')).toBe('1280:768');
      expect(getDefaultRatioForModel('gen4_aleph')).toBe('1280:720');
    });

    it('should return fallback for unknown model', () => {
      expect(getDefaultRatioForModel('unknown')).toBe('1280:720');
    });
  });
});
