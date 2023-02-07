import { Request, Response, Router } from "express";
import { sendSongListEmail } from "../email";
import _ from "lodash";

const router = Router();

router.post("/email", async (req: Request, res: Response) => {
  try {
    console.log("Hit email");
    console.log(req.body);
    const { emails, formQuestionsAndAnswers } = req.body;
    console.log(formQuestionsAndAnswers);
    const emailsWithAdmin =
      process.env.NODE_ENV === "production"
        ? _.uniq(["mrb@aliveinside.org", ...emails])
        : emails;
    for (const email of emailsWithAdmin) {
      await sendSongListEmail(email, formQuestionsAndAnswers);
    }
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

export default router;
