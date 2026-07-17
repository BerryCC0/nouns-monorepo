import type { ExistingPost, PostPublisher } from './types';

import { TwitterApi, type TwitterApiReadWrite } from 'twitter-api-v2';

export interface XCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

export class XPostPublisher implements PostPublisher {
  private readonly client: TwitterApiReadWrite;
  private userId: string | null = null;

  constructor(credentials: XCredentials) {
    this.client = new TwitterApi(credentials).readWrite;
  }

  async createPost(text: string): Promise<ExistingPost> {
    const response = await this.client.v2.tweet(text);
    return { id: response.data.id };
  }

  async findExistingPost(marker: string): Promise<ExistingPost | null> {
    const userId = await this.getUserId();
    const timeline = await this.client.v2.userTimeline(userId, {
      exclude: ['replies', 'retweets'],
      max_results: 100,
    });
    const post = timeline.tweets.find(tweet => tweet.text.startsWith(marker));
    return post === undefined ? null : { id: post.id };
  }

  private async getUserId(): Promise<string> {
    if (this.userId !== null) return this.userId;
    const response = await this.client.v2.me();
    this.userId = response.data.id;
    return this.userId;
  }
}
