import { Request, Response, Router } from "express";
import { sendSongListEmail } from "../email";
import _ from "lodash";

const router = Router();

router.post("/email", async (req: Request, res: Response) => {
  try {
    const { emails, formQuestionsAndAnswers, tracks, sessionNotes, playlistUrl } = req.body;
    const emailsWithAdmin =
      process.env.NODE_ENV === "production"
        ? _.uniq(["mrb@aliveinside.org", ...emails])
        : emails;
    for (const email of emailsWithAdmin) {
      await sendSongListEmail(email, formQuestionsAndAnswers, tracks, sessionNotes, playlistUrl);
    }
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

export default router;
