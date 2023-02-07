import { Request, Response, Router } from "express";
import { sendSongListEmail } from "../email";
import _ from "lodash";

const router = Router();

router.post("/email", async (req: Request, res: Response) => {
  console.log("Hit email");
  console.log(req.body);
  const { emails, formQuestionsAndAnswers } = req.body;
  console.log(formQuestionsAndAnswers);
  const emailsWithAdmin =
    process.env.NODE_ENV === "production"
      ? _.uniq(["mrb@aliveinside.org", ...emails])
      : emails;
  console.log(emailsWithAdmin);
  for (const email of emailsWithAdmin) {
    console.log("sending email to ", email);
    console.log(JSON.stringify(formQuestionsAndAnswers));
    await sendSongListEmail(email, formQuestionsAndAnswers);
    console.log("email sent");
  }
  res.status(200);
});

export default router;
