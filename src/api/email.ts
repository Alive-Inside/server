import { Request, Response, Router } from "express";
import { sendSongListEmail } from "../email";

const router = Router();

router.post("/email", async (req: Request, res: Response) => {
  console.log(req.body)
  const { emails, formQuestionsAndAnswers } = req.body;
  console.log(formQuestionsAndAnswers)
  for (const email of emails) {
    await sendSongListEmail(email, formQuestionsAndAnswers);
    console.log('email sent')
  }
  res.status(200);
});

export default router;
