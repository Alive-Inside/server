import { Request, Response, Router } from "express";
import { sendSongListEmail } from "../email";

const router = Router();

router.post("/email", async (req: Request, res: Response) => {
  const { emails, formQuestionsAndAnswers } = req.body;
  console.log(formQuestionsAndAnswers)
  for (const email of emails) {
    await sendSongListEmail(email, formQuestionsAndAnswers);
  }
  res.status(200);
});

export default router;
