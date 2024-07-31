import { Category, Video, VideoIndex } from "@/types/video";

interface UdonDanceVideoIndex {
  time: string;
  groups: UdonDanceGroup;
}

interface UdonDanceGroup {
  contents: UdonDanceContent[];
}

interface UdonDanceContent {
  groupName: string,
  songInfos: UdonDanceSongInfo[] | null;
}

interface UdonDanceSongInfo {
  id: number;
  danceid: number;
  name: string;
  artist: string;
  dancer: string;
  playerCount: number;
  volume: number;
  start: number;
  end: number;
  flip: boolean;
}

function convertToAyaIndex(udonIndex: UdonDanceVideoIndex): VideoIndex {
  let categories = udonIndex.groups.contents.map(group => {
    let entries = group.songInfos?.map(song => {
      return {
        id: song.id,
        title: song.name,
        category: 0,
        categoryName: group.groupName,
        titleSpell: song.name,
        volume: song.volume,
        start: song.start,
        end: song.end,
        flip: song.flip,
        originalUrl: [],
        _fromUdon: true,
      } as Video;
    }) || [];
    return {
      title: group.groupName,
      entries: entries,
    } as Category;
  });

  return {
    updated_at: 114514,
    categories: categories
  };
}

export async function fetchUdonVideoIndex(): Promise<VideoIndex> {
  const response = await fetch('https://api.udon.dance/Api/Songs/list', {
    cache: 'no-cache',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }

  let udonIndex = await response.json() as UdonDanceVideoIndex;
  return convertToAyaIndex(udonIndex);
}
