import mixpanel from 'mixpanel-browser';

export const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '98b8658bcd19508deab537d5560d63d6';

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token not found, skipping initialization');
    return;
  }

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV !== 'production',
    track_pageview: true,
    persistence: 'localStorage',
    record_sessions_percent: 100, // 100% Session Replay capture
    record_heatmap_data: true,
    autocapture: true,
  });
};

export const track = (name: string, props: Record<string, any> = {}) => {
  if (!MIXPANEL_TOKEN) return;
  mixpanel.track(name, props);
};

export const identify = (id: string) => {
  if (!MIXPANEL_TOKEN) return;
  mixpanel.identify(id);
};

export const reset = () => {
  if (!MIXPANEL_TOKEN) return;
  mixpanel.reset();
};
