export interface LibraryItem {
  id: string;
  title: string;
  src: string;
  width: number;
  height: number;
  aspectRatio: string;
  category: string;
  slices: number;
}

export const libraryCategories = [
  "All",
  "Ultra-Wide",
  "Panoramas",
  "Wallpapers",
] as const;

export const libraryImages: LibraryItem[] = [
  {
    "id": "preset-1",
    "title": "Spider-Man Skyline 20-Slice",
    "src": "/library/preset_01.jpg",
    "width": 1790,
    "height": 828,
    "aspectRatio": "2.16",
    "category": "Ultra-Wide",
    "slices": 20
  },
  {
    "id": "preset-2",
    "title": "Anime Sunset Horizon",
    "src": "/library/preset_02.png",
    "width": 2048,
    "height": 1152,
    "aspectRatio": "1.78",
    "category": "Panoramas",
    "slices": 10
  },
  {
    "id": "preset-3",
    "title": "Scenic Mountain Vista",
    "src": "/library/preset_03.png",
    "width": 3040,
    "height": 2048,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-4",
    "title": "Cosmic Nebulae Art",
    "src": "/library/preset_04.png",
    "width": 2048,
    "height": 1380,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-5",
    "title": "Misty Forest Road",
    "src": "/library/preset_05.png",
    "width": 2048,
    "height": 1380,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-6",
    "title": "Desert Horizon Sunset",
    "src": "/library/preset_06.png",
    "width": 2048,
    "height": 1380,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-7",
    "title": "Cyberpunk Alleyway",
    "src": "/library/preset_07.png",
    "width": 2048,
    "height": 1380,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-8",
    "title": "Aurora Night Sky",
    "src": "/library/preset_08.png",
    "width": 2048,
    "height": 1380,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-9",
    "title": "Retro Wave Sunset",
    "src": "/library/preset_09.png",
    "width": 736,
    "height": 1307,
    "aspectRatio": "0.56",
    "category": "Vertical",
    "slices": 10
  },
  {
    "id": "preset-10",
    "title": "Metropolis Skyline",
    "src": "/library/preset_10.png",
    "width": 2048,
    "height": 1380,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-11",
    "title": "Fantasy Mountain Peak",
    "src": "/library/preset_11.png",
    "width": 2048,
    "height": 1380,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-12",
    "title": "Abstract Light Wave",
    "src": "/library/preset_12.png",
    "width": 2048,
    "height": 1380,
    "aspectRatio": "1.48",
    "category": "Wallpapers",
    "slices": 10
  },
  {
    "id": "preset-13",
    "title": "Tokyo Night Neon",
    "src": "/library/preset_13.png",
    "width": 2048,
    "height": 1152,
    "aspectRatio": "1.78",
    "category": "Panoramas",
    "slices": 10
  },
  {
    "id": "preset-14",
    "title": "Golden Sunset Drive",
    "src": "/library/preset_14.png",
    "width": 1308,
    "height": 736,
    "aspectRatio": "1.78",
    "category": "Panoramas",
    "slices": 10
  },
  {
    "id": "preset-15",
    "title": "Cyber Neon Cityscape",
    "src": "/library/preset_15.png",
    "width": 1024,
    "height": 576,
    "aspectRatio": "1.78",
    "category": "Panoramas",
    "slices": 10
  }
];
