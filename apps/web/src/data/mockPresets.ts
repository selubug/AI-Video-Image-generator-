export interface Preset {
  id: string;
  name: string;
  group: string;
  imageUrl: string;
}

export const mockPresets: Preset[] = [
  // Trending Styles
  {
    id: 'trending-1',
    name: 'Anime Style',
    group: 'Trending Styles',
    imageUrl: 'https://picsum.photos/seed/anime/200/200'
  },
  {
    id: 'trending-2',
    name: 'Cyberpunk',
    group: 'Trending Styles',
    imageUrl: 'https://picsum.photos/seed/cyberpunk/200/200'
  },
  {
    id: 'trending-3',
    name: 'Watercolor',
    group: 'Trending Styles',
    imageUrl: 'https://picsum.photos/seed/watercolor/200/200'
  },
  {
    id: 'trending-4',
    name: 'Minimalist',
    group: 'Trending Styles',
    imageUrl: 'https://picsum.photos/seed/minimalist/200/200'
  },
  {
    id: 'trending-5',
    name: 'Pixel Art',
    group: 'Trending Styles',
    imageUrl: 'https://picsum.photos/seed/pixel/200/200'
  },
  {
    id: 'trending-6',
    name: 'Oil Painting',
    group: 'Trending Styles',
    imageUrl: 'https://picsum.photos/seed/oil/200/200'
  },
  {
    id: 'trending-7',
    name: '3D Render',
    group: 'Trending Styles',
    imageUrl: 'https://picsum.photos/seed/3d/200/200'
  },
  {
    id: 'trending-8',
    name: 'Vintage',
    group: 'Trending Styles',
    imageUrl: 'https://picsum.photos/seed/vintage/200/200'
  },

  // Lighting
  {
    id: 'lighting-1',
    name: 'Golden Hour',
    group: 'Lighting',
    imageUrl: 'https://picsum.photos/seed/golden/200/200'
  },
  {
    id: 'lighting-2',
    name: 'Dramatic',
    group: 'Lighting',
    imageUrl: 'https://picsum.photos/seed/dramatic/200/200'
  },
  {
    id: 'lighting-3',
    name: 'Soft',
    group: 'Lighting',
    imageUrl: 'https://picsum.photos/seed/soft/200/200'
  },
  {
    id: 'lighting-4',
    name: 'Neon',
    group: 'Lighting',
    imageUrl: 'https://picsum.photos/seed/neon/200/200'
  },

  // Composition
  {
    id: 'composition-1',
    name: 'Rule of Thirds',
    group: 'Composition',
    imageUrl: 'https://picsum.photos/seed/thirds/200/200'
  },
  {
    id: 'composition-2',
    name: 'Symmetrical',
    group: 'Composition',
    imageUrl: 'https://picsum.photos/seed/symmetrical/200/200'
  },
  {
    id: 'composition-3',
    name: 'Leading Lines',
    group: 'Composition',
    imageUrl: 'https://picsum.photos/seed/lines/200/200'
  },
  {
    id: 'composition-4',
    name: 'Framing',
    group: 'Composition',
    imageUrl: 'https://picsum.photos/seed/framing/200/200'
  },

  // Color
  {
    id: 'color-1',
    name: 'Vibrant',
    group: 'Color',
    imageUrl: 'https://picsum.photos/seed/vibrant/200/200'
  },
  {
    id: 'color-2',
    name: 'Pastel',
    group: 'Color',
    imageUrl: 'https://picsum.photos/seed/pastel/200/200'
  },
  {
    id: 'color-3',
    name: 'Monochrome',
    group: 'Color',
    imageUrl: 'https://picsum.photos/seed/mono/200/200'
  },
  {
    id: 'color-4',
    name: 'Duotone',
    group: 'Color',
    imageUrl: 'https://picsum.photos/seed/duotone/200/200'
  }
]; 