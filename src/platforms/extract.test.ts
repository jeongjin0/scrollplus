import { describe, expect, it } from "vitest";
import { extractInstagram, extractTikTok, extractYouTube } from "./extract";

describe("extractors", () => {
  it("reads youtube player counts and ignores ad branches", () => {
    const item = extractYouTube({
      videoDetails: { videoId: "abc", viewCount: "4000", channelId: "UC1" },
      adPlacements: [{ likeCount: 1 }],
      overlay: { likeCount: 20, commentCount: "4" },
    });
    expect(item).toMatchObject({
      id: "abc",
      creatorId: "UC1",
      metrics: { views: 4000, likes: 20, comments: 4, shares: null, saves: null },
    });
  });

  it("reads tiktok stats", () => {
    const items = extractTikTok({
      item: { id: "99", author: { uniqueId: "@kept" }, stats: { playCount: 5000, diggCount: 100, commentCount: 2, shareCount: 1, collectCount: 3 } },
    });
    expect(items[0]).toMatchObject({ id: "99", creatorId: "kept", metrics: { views: 5000, likes: 100, comments: 2, shares: 1, saves: 3 } });
  });

  it("reads instagram reel counts", () => {
    const items = extractInstagram({
      media: { code: "ABC", like_count: 10, comment_count: 1, play_count: 2500, user: { username: "Kept" } },
    });
    expect(items[0]).toMatchObject({ id: "ABC", creatorId: "Kept", metrics: { views: 2500, likes: 10, comments: 1 } });
  });

  it('reads counts from the microformat when video details omit them', () => {
    const item = extractYouTube({
      videoDetails: { videoId: 'abc', channelId: 'UC1' },
      microformat: { playerMicroformatRenderer: { viewCount: '4000', likeCount: '20' } },
    });
    expect(item?.metrics).toMatchObject({ views: 4000, likes: 20 });
  });
});
