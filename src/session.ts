class Session {
  static sessions: { sessionID: string; spotifyUserData: SpotifyUserData }[] =
    [];

  static addSession(spotifyUserData: SpotifyUserData) {
    if (this.getSessionBySpotifyId(spotifyUserData.userId) === undefined) {
      const sessionID = this.createSessionID();
      this.sessions.push({ sessionID, spotifyUserData });
    }
  }

  static createSessionID = () => "";

  static getSessionBySpotifyId = (userId: string) =>
    this.sessions?.find((s) => s.spotifyUserData.userId === userId);
}

export default Session;

type SpotifyUserData = {
  name: string;
  email: string;
  accessToken: string;
  countryCode: string;
  avatar?: string;
  refreshToken: string;
  userId: string;
  expiresAt: Date;
  isPremium: boolean;
};
